import { z } from "zod";

const optionalUrl = z.preprocess((value) => {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const result = z.string().url().safeParse(value);
  return result.success ? result.data : undefined;
}, z.string().url().optional());
import {
  validateWithSchema,
  type ValidationResult,
} from "./issues";

export const templateMetaSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1, "Template id is required")
    .max(120, "Template id is too long")
    .regex(
      /^[a-zA-Z0-9_.-]+$/,
      "Template id may only contain letters, digits, dots, dashes, and underscores",
    ),
  name: z.string().trim().min(1, "Template name is required").max(120),
  description: z.string().trim().max(500).optional(),
  version: z.string().trim().max(80).optional(),
  logo: z.string().trim().max(240).optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  links: z
    .object({
      github: optionalUrl,
      website: optionalUrl,
      docs: optionalUrl,
    })
    .partial()
    .transform((links) => {
      const cleaned = Object.fromEntries(
        Object.entries(links).filter(([, value]) => value !== undefined),
      );
      return Object.keys(cleaned).length > 0 ? cleaned : undefined;
    })
    .optional(),
});

export const templateMetaListSchema = z
  .array(templateMetaSchema)
  .max(1000, "Template list is too large");

export const templateDetailsSchema = templateMetaSchema.extend({
  composeContent: z.string().min(1, "Template compose content is required"),
  composeVersionRemoved: z.boolean().optional(),
  logoUrl: z.string().url().optional(),
});

export type TemplateMeta = z.output<typeof templateMetaSchema>;
export type TemplateDetails = z.output<typeof templateDetailsSchema>;

export function validateTemplateMetaList(value: unknown): ValidationResult & {
  data?: TemplateMeta[];
} {
  return validateWithSchema(
    templateMetaListSchema,
    value,
    "templates.meta",
  );
}

export function validateTemplateDetails(value: unknown): ValidationResult & {
  data?: TemplateDetails;
} {
  return validateWithSchema(
    templateDetailsSchema,
    value,
    "templates.details",
  );
}
