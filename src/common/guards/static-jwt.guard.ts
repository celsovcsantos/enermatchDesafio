import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { Env } from '../../config/env.schema';

@Injectable()
export class StaticJwtGuard implements CanActivate {
  constructor(private configService: ConfigService<Env>) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Token não fornecido');
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer') {
      throw new UnauthorizedException('Tipo de autenticação inválido');
    }

    const staticToken = this.configService.get<string>('STATIC_JWT_SECRET');

    if (token !== staticToken) {
      throw new UnauthorizedException('Token inválido');
    }

    return true;
  }
}
