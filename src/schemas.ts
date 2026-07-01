import { z } from 'zod';
import { ClientStatus, DeploymentStatus } from './enums';

/**
 * Runtime schemas for every payload that crosses an app boundary. TypeScript
 * types are inferred from these, so schema + type can never drift apart.
 */

/** Canonical customer reference passed hub -> product. */
export const ClientRefSchema = z.object({
  /** hub Client `_id` — the cross-app correlation key. */
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  status: z.nativeEnum(ClientStatus).optional(),
});
export type ClientRef = z.infer<typeof ClientRefSchema>;

/** First admin account to create for the tenant. */
export const AdminAccountSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
});
export type AdminAccount = z.infer<typeof AdminAccountSchema>;

/** hub -> product: provision a tenant + first admin. Idempotent on `deploymentId`. */
export const ProvisionDeploymentRequestSchema = z.object({
  /** hub Deployment `_id` — the idempotency key. */
  deploymentId: z.string().min(1),
  /** Product slug (stable catalog id). */
  productSlug: z.string().min(1),
  client: ClientRefSchema,
  admin: AdminAccountSchema,
});
export type ProvisionDeploymentRequest = z.infer<
  typeof ProvisionDeploymentRequestSchema
>;

/** product -> hub: result of a provisioning call. */
export const ProvisionDeploymentResponseSchema = z.object({
  /** Product-side tenant id created for this deployment. */
  tenantId: z.string().min(1),
  /** URL where the tenant is reachable. */
  url: z.string().url(),
  status: z.nativeEnum(DeploymentStatus),
});
export type ProvisionDeploymentResponse = z.infer<
  typeof ProvisionDeploymentResponseSchema
>;

/** product -> hub: async status / health report for a deployment. */
export const DeploymentStatusUpdateSchema = z.object({
  status: z.nativeEnum(DeploymentStatus),
  url: z.string().url().optional(),
  error: z.string().optional(),
});
export type DeploymentStatusUpdate = z.infer<
  typeof DeploymentStatusUpdateSchema
>;
