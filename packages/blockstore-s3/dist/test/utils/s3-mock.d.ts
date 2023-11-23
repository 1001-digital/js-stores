import type { S3 } from '@aws-sdk/client-s3';
export declare class S3Error extends Error {
    code: string;
    statusCode?: number;
    $metadata?: {
        httpStatusCode: number;
    };
    constructor(message: string, code?: number);
}
export declare const s3Resolve: (res?: any) => any;
export declare const s3Reject: <T>(err: T) => any;
/**
 * Mocks out the s3 calls made by datastore-s3
 */
export declare function s3Mock(s3: S3): S3;
//# sourceMappingURL=s3-mock.d.ts.map