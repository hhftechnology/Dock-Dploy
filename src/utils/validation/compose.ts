// Pre-import validation for a raw Docker Compose YAML string.
// Parses the file with js-yaml, lifts services/networks/volumes into our
// internal types using template-import helpers, then runs the same
// validateServices/Networks/Volumes pipeline used by the YAML output panel.
//
// Returns a list of human-readable error strings (empty = clean).

import jsyaml from "js-yaml";
import type { ServiceConfig } from "../../types/compose";
import {
  parseComposeService,
  parseComposeTemplate,
} from "../template-import";
import {
  validateNetworks,
  validateServices,
  validateVolumes,
} from "../validation";

export interface ComposeValidationResult {
  ok: boolean;
  errors: string[];
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function validateComposeYaml(yaml: string): ComposeValidationResult {
  if (!yaml || !yaml.trim()) {
    return { ok: false, errors: ["Compose file is empty"] };
  }

  let parsed: unknown;
  try {
    parsed = jsyaml.load(yaml);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, errors: [`Invalid YAML: ${msg}`] };
  }

  if (!isPlainObject(parsed)) {
    return { ok: false, errors: ["Compose file must be a YAML mapping"] };
  }

  const errors: string[] = [];

  if (!isPlainObject(parsed.services) || Object.keys(parsed.services).length === 0) {
    errors.push("Compose file must declare at least one service under `services:`");
  }

  // Reuse the template-import parser to lift the raw structure into our
  // internal types; this gives us free coverage of all the format quirks
  // (string vs object ports, dict vs array env, etc.).
  const services: ServiceConfig[] = [];
  let networksParsed: ReturnType<typeof parseComposeService>["networks"] = [];
  let volumesParsed: ReturnType<typeof parseComposeService>["volumes"] = [];

  try {
    const result = parseComposeTemplate(yaml);
    const allNetworks = isPlainObject((parsed as Record<string, unknown>).networks)
      ? ((parsed as Record<string, unknown>).networks as Record<string, unknown>)
      : {};
    const allVolumes = isPlainObject((parsed as Record<string, unknown>).volumes)
      ? ((parsed as Record<string, unknown>).volumes as Record<string, unknown>)
      : {};
    for (const svc of result.services) {
      const lifted = parseComposeService(svc, allNetworks, allVolumes);
      services.push(lifted.service);
      networksParsed = networksParsed.concat(lifted.networks);
      volumesParsed = volumesParsed.concat(lifted.volumes);
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    errors.push(`Failed to parse compose structure: ${msg}`);
  }

  errors.push(...validateServices(services));

  // De-duplicate networks/volumes by name so we don't double-report.
  const dedupBy = <T extends { name: string }>(list: T[]): T[] => {
    const seen = new Set<string>();
    const out: T[] = [];
    for (const item of list) {
      if (seen.has(item.name)) continue;
      seen.add(item.name);
      out.push(item);
    }
    return out;
  };

  errors.push(...validateNetworks(dedupBy(networksParsed)));
  errors.push(...validateVolumes(dedupBy(volumesParsed)));

  return { ok: errors.length === 0, errors };
}
