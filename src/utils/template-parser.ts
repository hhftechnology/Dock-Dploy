// Template TOML parser utility for Dokploy templates

import * as TOML from "@iarna/toml";
import type { TemplateFormat, TemplateVariable, TemplateDomain, TemplateMount } from "../types/template";

export interface ParsedTemplateToml {
  variables?: Record<string, string>;
  domains?: TemplateDomain[];
  env?: { key: string; value: string }[];
  mounts?: TemplateMount[];
}

/**
 * Parse template.toml content into structured format
 */
export function parseTemplateToml(tomlContent: string): ParsedTemplateToml {
  try {
    const parsed = TOML.parse(tomlContent) as any;
    const result: ParsedTemplateToml = {};

    // Extract variables section
    if (parsed.variables) {
      result.variables = parsed.variables;
    }

    // Extract config.domains array
    if (parsed.config?.domains && Array.isArray(parsed.config.domains)) {
      result.domains = parsed.config.domains.map((domain: any) => ({
        serviceName: domain.serviceName || "",
        port: domain.port || 0,
        host: domain.host || "",
        path: domain.path,
        env: domain.env || [],
      }));
    }

    // Extract config.env (can be array or object)
    if (parsed.config?.env) {
      if (Array.isArray(parsed.config.env)) {
        // Array format: ["KEY=value", "KEY2=value2"]
        result.env = parsed.config.env.map((envStr: string) => {
          const [key, ...valueParts] = envStr.split("=");
          return {
            key: key.trim(),
            value: valueParts.join("=").trim(),
          };
        });
      } else if (typeof parsed.config.env === "object") {
        // Object format: { KEY: "value", KEY2: "value2" }
        result.env = Object.entries(parsed.config.env).map(([key, value]) => ({
          key,
          value: String(value),
        }));
      }
    }

    // Extract config.mounts array
    if (parsed.config?.mounts && Array.isArray(parsed.config.mounts)) {
      result.mounts = parsed.config.mounts.map((mount: any) => ({
        filePath: mount.filePath || "",
        content: mount.content || "",
        description: mount.description,
      }));
    }

    return result;
  } catch (error) {
    console.error("Error parsing template.toml:", error);
    throw new Error(`Failed to parse template.toml: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Convert parsed template to TemplateFormat interface
 */
export function toTemplateFormat(parsed: ParsedTemplateToml): TemplateFormat {
  const variables: TemplateVariable[] = parsed.variables
    ? Object.entries(parsed.variables).map(([name, value]) => ({
        name,
        value: String(value),
      }))
    : [];

  return {
    variables,
    config: {
      domains: parsed.domains || [],
      env: parsed.env || [],
      mounts: parsed.mounts || [],
    },
  };
}

