import { z } from 'zod';

/**
 * Data-dictionary primitives. The hub defines canonical data types (user,
 * materiel...) as lists of fields; each client may add extra fields. Products
 * fetch the effective field list and validate exchanged records against it.
 */

/** Supported field kinds. */
export enum FieldType {
  Text = 'text',
  Number = 'number',
  Boolean = 'boolean',
  Date = 'date',
  /** Single value picked from `options`. */
  Select = 'select',
  /** Id of a record of another data type (`ref` = target type slug). */
  Reference = 'reference',
}

/** One field of a data type. */
export const FieldDefinitionSchema = z.object({
  /** Machine key, unique within the type (e.g. `firstName`). */
  key: z.string().min(1),
  label: z.string().min(1),
  type: z.nativeEnum(FieldType),
  required: z.boolean().default(false),
  /** Allowed values — for `select`. */
  options: z.array(z.string()).optional(),
  /** Referenced data type slug — for `reference`. */
  ref: z.string().optional(),
});
export type FieldDefinition = z.infer<typeof FieldDefinitionSchema>;

/** A canonical data type and its (base) fields. */
export const DataTypeDefinitionSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  fields: z.array(FieldDefinitionSchema),
});
export type DataTypeDefinition = z.infer<typeof DataTypeDefinitionSchema>;

/**
 * Turn a field list (the effective schema = base + a client's custom fields)
 * into a Zod schema, so the hub and every product validate records identically.
 */
export function buildRecordSchema(
  fields: FieldDefinition[],
): z.ZodObject<z.ZodRawShape> {
  const shape: z.ZodRawShape = {};
  for (const field of fields) {
    let schema: z.ZodTypeAny;
    switch (field.type) {
      case FieldType.Number:
        schema = z.number();
        break;
      case FieldType.Boolean:
        schema = z.boolean();
        break;
      case FieldType.Date:
        schema = z.coerce.date();
        break;
      case FieldType.Select:
        schema =
          field.options && field.options.length > 0
            ? z.enum(field.options as [string, ...string[]])
            : z.string();
        break;
      case FieldType.Text:
      case FieldType.Reference:
      default:
        schema = z.string();
        break;
    }
    shape[field.key] = field.required ? schema : schema.optional();
  }
  return z.object(shape);
}
