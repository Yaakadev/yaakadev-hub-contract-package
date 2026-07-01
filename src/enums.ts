/**
 * Enums shared across the platform. These mirror the hub's own enums so the hub
 * and every product agree on the exact string values. Do not redefine locally.
 */

/** How a product is provisioned for a client. */
export enum DeploymentType {
  /** Create a tenant + accounts inside an existing shared application. */
  MultiTenant = 'multi_tenant',
  /** Provision a dedicated Clever Cloud instance. */
  DedicatedInstance = 'dedicated_instance',
}

/** Lifecycle of a deployment (client x product). */
export enum DeploymentStatus {
  Pending = 'pending',
  Provisioning = 'provisioning',
  Active = 'active',
  Failed = 'failed',
  Stopped = 'stopped',
}

/** Commercial status of a client. */
export enum ClientStatus {
  Active = 'active',
  Inactive = 'inactive',
  Prospect = 'prospect',
}
