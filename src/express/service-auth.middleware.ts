import type { NextFunction, Request, Response } from 'express';
import { extractServiceToken, verifyServiceToken } from '../service-token';

export interface ServiceAuthMiddlewareOptions {
  /** Shared HUB_SERVICE_SECRET. */
  secret: string;
  /** This service's own slug (token `aud` must match). */
  audience: string;
  /** Optional whitelist of accepted caller slugs. */
  allowedIssuers?: string[];
}

/**
 * Express middleware enforcing a valid service token. On success attaches the
 * claims to `req.service`; otherwise responds 401. For legacy apps (Formatik).
 */
export function serviceAuth(options: ServiceAuthMiddlewareOptions) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const token = extractServiceToken(req.headers as Record<string, unknown>);
    if (!token) {
      res.status(401).json({ error: 'missing service token' });
      return;
    }
    try {
      (req as unknown as { service: unknown }).service = verifyServiceToken({
        secret: options.secret,
        token,
        audience: options.audience,
        allowedIssuers: options.allowedIssuers,
      });
      next();
    } catch {
      res.status(401).json({ error: 'invalid service token' });
    }
  };
}
