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

/**
 * Erro genérico de integração com a API EIA.
 * Retorna 502 Bad Gateway para o cliente.
 */
export class EiaIntegrationException extends AppException {
  constructor(message: string) {
    super(message, HttpStatus.BAD_GATEWAY, 'EIA_INTEGRATION_ERROR');
  }
}

/**
 * Serviço da EIA temporariamente indisponível (5xx ou fora do ar).
 * Erro retentável — indica problema transitório na EIA.
 * Retorna 503 Service Unavailable para o cliente.
 */
export class EiaServiceUnavailableException extends AppException {
  constructor(message = 'Serviço da EIA temporariamente indisponível') {
    super(message, HttpStatus.SERVICE_UNAVAILABLE, 'EIA_SERVICE_UNAVAILABLE');
  }
}

/**
 * Timeout na requisição à EIA.
 * Erro retentável — a EIA pode estar lenta mas funcional.
 * Retorna 504 Gateway Timeout para o cliente.
 */
export class EiaTimeoutException extends AppException {
  constructor(timeoutMs: number) {
    super(`Tempo limite de ${timeoutMs}ms esgotado ao contatar a API EIA`, HttpStatus.GATEWAY_TIMEOUT, 'EIA_TIMEOUT');
  }
}

/**
 * Limite de requisições da EIA atingido (429 Too Many Requests).
 * Erro retentável após o período de espera indicado pela EIA.
 * Retorna 429 Too Many Requests para o cliente.
 */
export class EiaRateLimitException extends AppException {
  constructor(retryAfterMs?: number) {
    const detail = retryAfterMs ? ` Tente novamente em ${retryAfterMs}ms.` : '';
    super(`Limite de requisições da API EIA atingido.${detail}`, HttpStatus.TOO_MANY_REQUESTS, 'EIA_RATE_LIMIT');
  }
}

/**
 * Credenciais inválidas ou não autorizadas junto à EIA (401/403).
 * Erro NÃO retentável — requer correção de configuração (EIA_API_KEY).
 * Retorna 502 Bad Gateway para o cliente (não expõe detalhe interno).
 */
export class EiaAuthException extends AppException {
  constructor() {
    super('Credenciais inválidas para a API EIA. Verifique EIA_API_KEY.', HttpStatus.BAD_GATEWAY, 'EIA_AUTH_ERROR');
  }
}

/**
 * Resposta da EIA com formato inesperado / dados corrompidos.
 * Erro NÃO retentável — o mesmo retry retornaria o mesmo payload.
 * Retorna 502 Bad Gateway para o cliente.
 */
export class EiaInvalidResponseException extends AppException {
  constructor(detail?: string) {
    const msg = detail ? `Resposta inválida da API EIA: ${detail}` : 'Resposta inválida da API EIA';
    super(msg, HttpStatus.BAD_GATEWAY, 'EIA_INVALID_RESPONSE');
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
