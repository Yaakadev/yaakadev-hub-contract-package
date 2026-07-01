import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ENV } from '../constants';
import {
  extractServiceToken,
  ServiceTokenClaims,
  verifyServiceToken,
} from '../service-token';

export interface ServiceAuthGuardConfig {
  /** Shared HUB_SERVICE_SECRET. */
  secret: string;
  /** This service's own slug (token `aud` must match). */
  audience: string;
  /** Optional whitelist of accepted caller slugs. */
  allowedIssuers?: string[];
}

/**
 * Base guard: verifies the `x-service-token` header and attaches the claims to
 * `req.service`. Subclass and override `getConfig()` to source the secret/slug
 * from your ConfigService.
 */
export abstract class BaseServiceAuthGuard implements CanActivate {
  protected abstract getConfig(): ServiceAuthGuardConfig;

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const token = extractServiceToken(req.headers);
    if (!token) {
      throw new UnauthorizedException('missing service token');
    }
    const { secret, audience, allowedIssuers } = this.getConfig();
    try {
      const claims: ServiceTokenClaims = verifyServiceToken({
        secret,
        token,
        audience,
        allowedIssuers,
      });
      req.service = claims;
      return true;
    } catch {
      throw new UnauthorizedException('invalid service token');
    }
  }
}

/**
 * Ready-to-use guard that reads `HUB_SERVICE_SECRET` and `SERVICE_SLUG` from
 * `process.env`. Use this unless you need custom config wiring.
 */
@Injectable()
export class ServiceAuthGuard extends BaseServiceAuthGuard {
  protected getConfig(): ServiceAuthGuardConfig {
    const secret = process.env[ENV.SECRET];
    const audience = process.env[ENV.SLUG];
    if (!secret) {
      throw new Error(`ServiceAuthGuard: ${ENV.SECRET} is not set`);
    }
    if (!audience) {
      throw new Error(`ServiceAuthGuard: ${ENV.SLUG} is not set`);
    }
    return { secret, audience };
  }
}
