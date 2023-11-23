import { PutObjectCommand, CreateBucketCommand, GetObjectCommand, HeadObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { BaseDatastore } from 'datastore-core/base';
import * as Errors from 'datastore-core/errors';
import { Key } from 'interface-datastore';
import filter from 'it-filter';
import toBuffer from 'it-to-buffer';
import { fromString as unint8arrayFromString } from 'uint8arrays';
/**
 * A datastore backed by AWS S3
 */
export class S3Datastore extends BaseDatastore {
    path;
    createIfMissing;
    s3;
    bucket;
    constructor(s3, bucket, init) {
        super();
        if (s3 == null) {
            throw new Error('An S3 instance must be supplied. See the datastore-s3 README for examples.');
        }
        if (bucket == null) {
            throw new Error('An bucket must be supplied. See the datastore-s3 README for examples.');
        }
        this.path = init?.path;
        this.s3 = s3;
        this.bucket = bucket;
        this.createIfMissing = init?.createIfMissing ?? false;
    }
    /**
     * Returns the full key which includes the path to the ipfs store
     */
    _getFullKey(key) {
        // Avoid absolute paths with s3
        return [this.path, key.toString()].filter(Boolean).join('/').replace(/\/\/+/g, '/');
    }
    /**
     * Store the given value under the key.
     */
    async put(key, val, options) {
        try {
            await this.s3.send(new PutObjectCommand({
                Bucket: this.bucket,
                Key: this._getFullKey(key),
                Body: val
            }), {
                abortSignal: options?.signal
            });
            return key;
        }
        catch (err) {
            throw Errors.dbWriteFailedError(err);
        }
    }
    /**
     * Read from s3
     */
    async get(key, options) {
        try {
            const data = await this.s3.send(new GetObjectCommand({
                Bucket: this.bucket,
                Key: this._getFullKey(key)
                // @ts-expect-error the AWS AbortSignal types are different to the @types/node version
            }, {
                abortSignal: options?.signal
            }));
            if (data.Body == null) {
                throw new Error('Response had no body');
            }
            // If a body was returned, ensure it's a Uint8Array
            if (data.Body instanceof Uint8Array) {
                return data.Body;
            }
            if (typeof data.Body === 'string') {
                return unint8arrayFromString(data.Body);
            }
            if (data.Body instanceof Blob) {
                const buf = await data.Body.arrayBuffer();
                return new Uint8Array(buf, 0, buf.byteLength);
            }
            // @ts-expect-error s3 types define their own Blob as an empty interface
            return await toBuffer(data.Body);
        }
        catch (err) {
            if (err.statusCode === 404) {
                throw Errors.notFoundError(err);
            }
            throw err;
        }
    }
    /**
     * Check for the existence of the given key
     */
    async has(key, options) {
        try {
            await this.s3.send(new HeadObjectCommand({
                Bucket: this.bucket,
                Key: this._getFullKey(key)
            }), {
                abortSignal: options?.signal
            });
            return true;
        }
        catch (err) {
            // doesn't exist and permission policy includes s3:ListBucket
            if (err.$metadata?.httpStatusCode === 404) {
                return false;
            }
            // doesn't exist, permission policy does not include s3:ListBucket
            if (err.$metadata?.httpStatusCode === 403) {
                return false;
            }
            throw err;
        }
    }
    /**
     * Delete the record under the given key
     */
    async delete(key, options) {
        try {
            await this.s3.send(new DeleteObjectCommand({
                Bucket: this.bucket,
                Key: this._getFullKey(key)
            }), {
                abortSignal: options?.signal
            });
        }
        catch (err) {
            throw Errors.dbDeleteFailedError(err);
        }
    }
    /**
     * Recursively fetches all keys from s3
     */
    async *_listKeys(params, options) {
        try {
            const data = await this.s3.send(new ListObjectsV2Command({
                Bucket: this.bucket,
                ...params
            }), {
                abortSignal: options?.signal
            });
            if (options?.signal?.aborted === true) {
                return;
            }
            if (data == null || data.Contents == null) {
                throw new Error('Not found');
            }
            for (const d of data.Contents) {
                if (d.Key == null) {
                    throw new Error('Not found');
                }
                // Remove the path from the key
                yield new Key(d.Key.slice((this.path ?? '').length), false);
            }
            // If we didn't get all records, recursively query
            if (data.IsTruncated === true) {
                // If NextMarker is absent, use the key from the last result
                params.StartAfter = data.Contents[data.Contents.length - 1].Key;
                // recursively fetch keys
                yield* this._listKeys(params);
            }
        }
        catch (err) {
            throw new Error(err.code);
        }
    }
    async *_all(q, options) {
        for await (const key of this._allKeys({ prefix: q.prefix }, options)) {
            try {
                const res = {
                    key,
                    value: await this.get(key, options)
                };
                yield res;
            }
            catch (err) {
                // key was deleted while we are iterating over the results
                if (err.statusCode !== 404) {
                    throw err;
                }
            }
        }
    }
    async *_allKeys(q, options) {
        const prefix = [this.path, q.prefix ?? ''].filter(Boolean).join('/').replace(/\/\/+/g, '/');
        // Get all the keys via list object, recursively as needed
        let it = this._listKeys({
            Prefix: prefix
        }, options);
        if (q.prefix != null) {
            it = filter(it, k => k.toString().startsWith(`${q.prefix ?? ''}`));
        }
        yield* it;
    }
    /**
     * This will check the s3 bucket to ensure access and existence
     */
    async open(options) {
        try {
            await this.s3.send(new HeadObjectCommand({
                Bucket: this.bucket,
                Key: this.path ?? ''
            }), {
                abortSignal: options?.signal
            });
        }
        catch (err) {
            if (err.statusCode !== 404) {
                if (this.createIfMissing) {
                    await this.s3.send(new CreateBucketCommand({
                        Bucket: this.bucket
                    }), {
                        abortSignal: options?.signal
                    });
                    return;
                }
                throw Errors.dbOpenFailedError(err);
            }
        }
    }
}
//# sourceMappingURL=index.js.map