/**
 * Shared constants for hub <-> product service-to-service communication.
 * These are the single source of truth: every app imports them, never hardcodes.
 */

/** HTTP header carrying the signed service JWT (kept separate from user `Authorization`). */
export const SERVICE_TOKEN_HEADER = 'x-service-token';

/** Route prefix for hub<->product service endpoints (guarded by service auth only). */
export const SERVICE_ROUTE_PREFIX = 'service';

/** JWT signing algorithm for service tokens. */
export const SERVICE_TOKEN_ALG = 'HS256' as const;

/** Max lifetime (seconds) of a service token — minted per request, never stored. */
export const SERVICE_TOKEN_TTL_SECONDS = 120;

/** Canonical slug of the hub itself (used as `iss` / `aud`). */
export const HUB_SLUG = 'hub';

/** Env var names the guards/middleware read by default. */
export const ENV = {
  /** Shared HMAC secret, identical in the hub and every product. */
  SECRET: 'HUB_SERVICE_SECRET',
  /** This service's own slug (its `aud`), e.g. "hub", "pass", "oribam". */
  SLUG: 'SERVICE_SLUG',
} as const;
