import { z } from 'zod';

/* SQL Server uniqueidentifier/NEWSEQUENTIALID values are GUID-shaped, but may not have an RFC UUID version nibble. */
export const propertyIdSchema = z.guid();

export const propertyType = z.enum(['PRIMARY', 'LONG_TERM_RENTAL', 'SHORT_TERM_RENTAL']);

export const createPropertySchema = z.object({
  name: z.string().trim().min(2).max(120),
  type: propertyType,
  addressLine1: z.string().trim().min(3).max(200),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(50),
  postalCode: z.string().trim().min(3).max(20),
  acquisitionDate: z.iso.date().nullable().optional(),
  purchasePrice: z.number().finite().nonnegative().max(999999999999999).nullable().optional(),
}).strict();

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
