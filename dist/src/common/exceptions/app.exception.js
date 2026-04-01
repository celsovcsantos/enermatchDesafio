"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceNotFoundException = exports.SyncException = exports.EiaIntegrationException = exports.AppException = void 0;
const common_1 = require("@nestjs/common");
class AppException extends common_1.HttpException {
    code;
    constructor(message, status = common_1.HttpStatus.INTERNAL_SERVER_ERROR, code) {
        super({
            message,
            code: code || 'INTERNAL_ERROR',
            timestamp: new Date().toISOString(),
        }, status);
        this.code = code;
    }
}
exports.AppException = AppException;
class EiaIntegrationException extends AppException {
    constructor(message) {
        super(message, common_1.HttpStatus.BAD_GATEWAY, 'EIA_INTEGRATION_ERROR');
    }
}
exports.EiaIntegrationException = EiaIntegrationException;
class SyncException extends AppException {
    constructor(message) {
        super(message, common_1.HttpStatus.UNPROCESSABLE_ENTITY, 'SYNC_ERROR');
    }
}
exports.SyncException = SyncException;
class ResourceNotFoundException extends AppException {
    constructor(resource) {
        super(`${resource} não encontrado`, common_1.HttpStatus.NOT_FOUND, 'NOT_FOUND');
    }
}
exports.ResourceNotFoundException = ResourceNotFoundException;
//# sourceMappingURL=app.exception.js.map