import { BaseDatastore } from 'datastore-core/base';
import { Key, type KeyQuery, type Pair, type Query } from 'interface-datastore';
import type { S3 } from '@aws-sdk/client-s3';
import type { AbortOptions } from 'interface-store';
export interface S3DatastoreInit {
    /**
     * An optional path to use within the bucket for all files - this setting can
     * affect S3 performance as it does internal sharding based on 'prefixes' -
     * these can be delimited by '/' so it's often better  to wrap this datastore in
     * a sharding datastore which will generate prefixed datastore keys for you.
     *
     * See - https://docs.aws.amazon.com/AmazonS3/latest/userguide/optimizing-performance.html
     * and https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-prefixes.html
     */
    path?: string;
    /**
     * Whether to try to create the bucket if it is missing when `.open` is called
     */
    createIfMissing?: boolean;
}
/**
 * A datastore backed by AWS S3
 */
export declare class S3Datastore extends BaseDatastore {
    path?: string;
    createIfMissing: boolean;
    private readonly s3;
    private readonly bucket;
    constructor(s3: S3, bucket: string, init?: S3DatastoreInit);
    /**
     * Returns the full key which includes the path to the ipfs store
     */
    _getFullKey(key: Key): string;
    /**
     * Store the given value under the key.
     */
    put(key: Key, val: Uint8Array, options?: AbortOptions): Promise<Key>;
    /**
     * Read from s3
     */
    get(key: Key, options?: AbortOptions): Promise<Uint8Array>;
    /**
     * Check for the existence of the given key
     */
    has(key: Key, options?: AbortOptions): Promise<boolean>;
    /**
     * Delete the record under the given key
     */
    delete(key: Key, options?: AbortOptions): Promise<void>;
    /**
     * Recursively fetches all keys from s3
     */
    _listKeys(params: {
        Prefix?: string;
        StartAfter?: string;
    }, options?: AbortOptions): AsyncIterable<Key>;
    _all(q: Query, options?: AbortOptions): AsyncIterable<Pair>;
    _allKeys(q: KeyQuery, options?: AbortOptions): AsyncIterable<Key>;
    /**
     * This will check the s3 bucket to ensure access and existence
     */
    open(options?: AbortOptions): Promise<void>;
}
//# sourceMappingURL=index.d.ts.map