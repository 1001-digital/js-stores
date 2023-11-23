import { BaseBlockstore } from 'blockstore-core/base';
import { type ShardingStrategy } from './sharding.js';
import type { S3 } from '@aws-sdk/client-s3';
import type { Pair } from 'interface-blockstore';
import type { AbortOptions } from 'interface-store';
import type { CID } from 'multiformats/cid';
export interface S3BlockstoreInit {
    /**
     * Whether to try to create the bucket if it is missing when `.open` is called
     */
    createIfMissing?: boolean;
    /**
     * Control how CIDs map to paths and back
     */
    shardingStrategy?: ShardingStrategy;
}
/**
 * A blockstore backed by AWS S3
 */
export declare class S3Blockstore extends BaseBlockstore {
    createIfMissing: boolean;
    private readonly s3;
    private readonly bucket;
    private readonly shardingStrategy;
    constructor(s3: S3, bucket: string, init?: S3BlockstoreInit);
    /**
     * Store the given value under the key.
     */
    put(key: CID, val: Uint8Array, options?: AbortOptions): Promise<CID>;
    /**
     * Read from s3
     */
    get(key: CID, options?: AbortOptions): Promise<Uint8Array>;
    /**
     * Check for the existence of the given key
     */
    has(key: CID, options?: AbortOptions): Promise<boolean>;
    /**
     * Delete the record under the given key
     */
    delete(key: CID, options?: AbortOptions): Promise<void>;
    getAll(options?: AbortOptions): AsyncIterable<Pair>;
    /**
     * This will check the s3 bucket to ensure access and existence
     */
    open(options?: AbortOptions): Promise<void>;
}
//# sourceMappingURL=index.d.ts.map