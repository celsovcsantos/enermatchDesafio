import { HttpException, HttpStatus } from '@nestjs/common';
export declare class AppException extends HttpException {
    readonly code?: string | undefined;
    constructor(message: string, status?: HttpStatus, code?: string | undefined);
}
export declare class EiaIntegrationException extends AppException {
    constructor(message: string);
}
export declare class SyncException extends AppException {
    constructor(message: string);
}
export declare class ResourceNotFoundException extends AppException {
    constructor(resource: string);
}
