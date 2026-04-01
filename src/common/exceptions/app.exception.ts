import { HttpException, HttpStatus } from '@nestjs/common';

export class AppException extends HttpException {
  constructor(
    message: string,
    status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    public readonly code?: string,
  ) {
    super(
      {
        message,
        code: code || 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      },
      status,
    );
  }
}

export class EiaIntegrationException extends AppException {
  constructor(message: string) {
    super(message, HttpStatus.BAD_GATEWAY, 'EIA_INTEGRATION_ERROR');
  }
}

export class SyncException extends AppException {
  constructor(message: string) {
    super(message, HttpStatus.UNPROCESSABLE_ENTITY, 'SYNC_ERROR');
  }
}

export class ResourceNotFoundException extends AppException {
  constructor(resource: string) {
    super(`${resource} não encontrado`, HttpStatus.NOT_FOUND, 'NOT_FOUND');
  }
}
