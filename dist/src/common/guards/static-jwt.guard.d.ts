import { CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from '../../config/env.schema';
export declare class StaticJwtGuard implements CanActivate {
    private configService;
    constructor(configService: ConfigService<Env>);
    canActivate(context: ExecutionContext): boolean;
}
