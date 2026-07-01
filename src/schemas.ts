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
  /** hub Client `slug` — becomes the tenant login code on the product (PASS: code société). */
  slug: z.string().min(1),
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

/** First-admin onboarding info a product may return after creating a tenant. */
export const OnboardingCredentialsSchema = z.object({
  /** Tenant login code (PASS: code société). */
  tenantCode: z.string().optional(),
  /** First admin's login id (PASS: matricule). */
  adminMatricule: z.string().optional(),
  /** Generated first-admin password, to relay to the customer once. */
  adminPassword: z.string().optional(),
});
export type OnboardingCredentials = z.infer<typeof OnboardingCredentialsSchema>;

/** product -> hub: result of a provisioning call. */
export const ProvisionDeploymentResponseSchema = z.object({
  /** Product-side tenant id created for this deployment. */
  tenantId: z.string().min(1),
  /** URL where the tenant is reachable. */
  url: z.string().url(),
  status: z.nativeEnum(DeploymentStatus),
  /** Present only right after creation (never re-returned on idempotent replays). */
  credentials: OnboardingCredentialsSchema.optional(),
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
