import yaml from "js-yaml";
import { z } from "zod";
import {
  issuesToResult,
  validateWithSchema,
  validationError,
  type ValidationResult,
} from "./issues";

const optionalTrimmed = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or fewer`)
    .optional()
    .or(z.literal(""));

export const configItemSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(80, "Name must be 80 characters or fewer"),
  description: optionalTrimmed(240, "Description"),
  icon: optionalTrimmed(160, "Icon"),
  url: z
    .string()
    .trim()
    .min(1, "URL is required")
    .url("URL must be absolute, for example https://app.local")
    .refine((value) => /^https?:\/\//i.test(value), {
      message: "URL must start with http:// or https://",
    }),
  category: optionalTrimmed(80, "Category"),
  tags: z
    .array(
      z
        .string()
        .trim()
        .min(1, "Tag cannot be empty")
        .max(40, "Tag must be 40 characters or fewer"),
    )
    .max(20, "Use 20 tags or fewer")
    .default([]),
});

export const homepageConfigSchema = z.object({
  items: z.array(configItemSchema).max(200, "Use 200 homepage items or fewer"),
});

export const homepageOutputSchema = z.object({
  services: z
    .array(
      z.object({
        Name: z.string().min(1),
        Description: z.string().optional(),
        Icon: z.string().optional(),
        URL: z.string().url(),
        Category: z.string().optional(),
        Tags: z.array(z.string().min(1)).optional(),
      }),
    )
    .max(200),
});

export type ConfigItemInput = z.input<typeof configItemSchema>;
export type ConfigItem = z.output<typeof configItemSchema>;
export type HomepageConfig = z.output<typeof homepageConfigSchema>;

export function validateConfigItem(item: unknown): ValidationResult & {
  data?: ConfigItem;
} {
  return validateWithSchema(configItemSchema, item, "config.item");
}

export function validateHomepageConfig(config: unknown): ValidationResult & {
  data?: HomepageConfig;
} {
  return validateWithSchema(homepageConfigSchema, config, "config.homepage");
}

export function validateCustomYaml(text: string): ValidationResult {
  if (!text.trim()) return { ok: true, issues: [] };
  try {
    yaml.load(text);
    return { ok: true, issues: [] };
  } catch (error: unknown) {
    return issuesToResult([
      validationError(
        "config.customYaml",
        "customOutput",
        error instanceof Error ? error.message : "Custom YAML is invalid",
        "invalid_yaml",
        "Fix the YAML syntax before copying or exporting it.",
      ),
    ]);
  }
}

export function validateHomepageOutput(output: string): ValidationResult {
  try {
    const parsed = yaml.load(output);
    return validateWithSchema(
      homepageOutputSchema,
      parsed,
      "config.homepageOutput",
    );
  } catch (error: unknown) {
    return issuesToResult([
      validationError(
        "config.homepageOutput",
        "output",
        error instanceof Error ? error.message : "Generated YAML is invalid",
        "invalid_yaml",
      ),
    ]);
  }
}
