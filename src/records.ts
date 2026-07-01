import { z } from 'zod';

/**
 * Business-data exchange, brokered by the hub (sync-first, pull model). A
 * producer product pushes canonical records to the hub; the hub validates them
 * against the data type's effective schema and stores them; consumer products
 * pull them. Routing (who produces / consumes what, per client) is decided by
 * the hub's ClientDataFlow — never product-to-product directly.
 */

/** One record exchanged through the hub, keyed by the producer's stable id. */
export const ExchangeRecordSchema = z.object({
  /** Producer's stable id for this record (e.g. a PASS user id or matricule). */
  externalId: z.string().min(1),
  /**
   * Field values. The hub validates this against the effective schema of the
   * data type for the client (base fields + that client's custom fields).
   */
  data: z.record(z.unknown()),
  /** Soft-delete marker: `true` tells consumers the record was removed. */
  deleted: z.boolean().optional(),
});
export type ExchangeRecord = z.infer<typeof ExchangeRecordSchema>;

/** producer -> hub: push a batch of records for one client + data type. */
export const PushRecordsRequestSchema = z.object({
  /** Data type slug (e.g. "user"). */
  dataType: z.string().min(1),
  /** hub Client id these records belong to. */
  clientId: z.string().min(1),
  records: z.array(ExchangeRecordSchema).min(1),
});
export type PushRecordsRequest = z.infer<typeof PushRecordsRequestSchema>;

/** hub -> producer: why a single record was rejected. */
export const RecordRejectionSchema = z.object({
  externalId: z.string(),
  errors: z.array(z.string()),
});
export type RecordRejection = z.infer<typeof RecordRejectionSchema>;

/** hub -> producer: per-batch ingest outcome (valid records are still stored). */
export const PushRecordsResponseSchema = z.object({
  accepted: z.number().int().nonnegative(),
  rejected: z.array(RecordRejectionSchema),
});
export type PushRecordsResponse = z.infer<typeof PushRecordsResponseSchema>;

/** A canonical record as stored by the hub and returned to a consumer on pull. */
export const StoredRecordSchema = z.object({
  dataType: z.string(),
  clientId: z.string(),
  externalId: z.string(),
  /** Slug of the product that produced the record. */
  producerSlug: z.string(),
  data: z.record(z.unknown()),
  deleted: z.boolean().optional(),
  /** ISO-8601 timestamp of the record's last change (for incremental pulls). */
  updatedAt: z.string(),
});
export type StoredRecord = z.infer<typeof StoredRecordSchema>;

/** hub -> consumer: the records for a client + data type. */
export const PullRecordsResponseSchema = z.object({
  records: z.array(StoredRecordSchema),
});
export type PullRecordsResponse = z.infer<typeof PullRecordsResponseSchema>;
