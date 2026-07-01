import * as jwt from 'jsonwebtoken';
import {
  SERVICE_TOKEN_ALG,
  SERVICE_TOKEN_HEADER,
  SERVICE_TOKEN_TTL_SECONDS,
} from './constants';

/** Claims carried by a service token. */
export interface ServiceTokenClaims {
  /** Caller slug (e.g. "hub" or a product slug). */
  iss: string;
  /** Intended recipient slug. */
  aud: string;
  /** Issued-at (epoch seconds). */
  iat: number;
  /** Expiry (epoch seconds). */
  exp: number;
}

export interface SignServiceTokenOptions {
  /** Shared HUB_SERVICE_SECRET. */
  secret: string;
  /** Caller slug. */
  issuer: string;
  /** Recipient slug. */
  audience: string;
  /** Override the default TTL (seconds). */
  ttlSeconds?: number;
}

/** Mint a short-lived HS256 service token. */
export function signServiceToken(options: SignServiceTokenOptions): string {
  const { secret, issuer, audience, ttlSeconds = SERVICE_TOKEN_TTL_SECONDS } = options;
  if (!secret) {
    throw new Error('signServiceToken: missing secret');
  }
  return jwt.sign({}, secret, {
    algorithm: SERVICE_TOKEN_ALG,
    issuer,
    audience,
    expiresIn: ttlSeconds,
  });
}

/** Build the request headers carrying a freshly-signed service token. */
export function buildServiceAuthHeaders(
  options: SignServiceTokenOptions,
): Record<string, string> {
  return { [SERVICE_TOKEN_HEADER]: signServiceToken(options) };
}

export interface VerifyServiceTokenOptions {
  /** Shared HUB_SERVICE_SECRET. */
  secret: string;
  /** The raw token string. */
  token: string;
  /** This service's own slug; the token's `aud` must match. */
  audience: string;
  /** If provided, the token's `iss` must be one of these. */
  allowedIssuers?: string[];
}

/** Verify a service token; returns the claims or throws. */
export function verifyServiceToken(
  options: VerifyServiceTokenOptions,
): ServiceTokenClaims {
  const { secret, token, audience, allowedIssuers } = options;
  if (!secret) {
    throw new Error('verifyServiceToken: missing secret');
  }
  const decoded = jwt.verify(token, secret, {
    algorithms: [SERVICE_TOKEN_ALG],
    audience,
  }) as ServiceTokenClaims;

  if (
    allowedIssuers &&
    allowedIssuers.length > 0 &&
    !allowedIssuers.includes(decoded.iss)
  ) {
    throw new Error(`verifyServiceToken: issuer "${decoded.iss}" not allowed`);
  }
  return decoded;
}

/** Pull the service token out of a request's headers, or null if absent. */
export function extractServiceToken(
  headers: Record<string, unknown> | undefined,
): string | null {
  const raw = headers?.[SERVICE_TOKEN_HEADER];
  return typeof raw === 'string' && raw.length > 0 ? raw : null;
}
