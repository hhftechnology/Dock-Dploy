// Validation for the fosrl/blueprints-compatible Blueprint structure.

import type { Blueprint, BlueprintResource } from "../../types/blueprint";
import {
  validateHostname,
  validatePort,
  validateLabelKey,
} from "../validation";

const BLUEPRINT_NAME_RE = /^[a-z0-9][a-z0-9-]*$/;
const SUBDOMAIN_RE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i;
const FQDN_RE =
  /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/i;
const NETWORK_NAME_RE = /^[a-z0-9][a-z0-9_-]*$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PROTOCOLS = new Set(["http", "https", "tcp", "udp"]);

function push(errors: string[], prefix: string, err: string | null) {
  if (err) errors.push(`${prefix}: ${err}`);
}

export function validateBlueprintName(v: string): string | null {
  if (!v) return "Blueprint name is required";
  if (!BLUEPRINT_NAME_RE.test(v))
    return "Blueprint name must be lowercase letters, digits, and dashes (kebab-case)";
  return null;
}

export function validateResourceName(v: string): string | null {
  if (!v.trim()) return "Resource name is required";
  return null;
}

export function validateSubdomain(v: string): string | null {
  if (!v) return "Subdomain is required";
  if (!SUBDOMAIN_RE.test(v)) return "Subdomain must be a valid RFC 1123 label";
  return null;
}

export function validateBaseDomain(v: string): string | null {
  if (!v) return null; // optional — labels emit subdomain bare when missing
  if (!FQDN_RE.test(v)) return "Base domain must be a valid FQDN";
  return null;
}

export function validateServicePort(port: number | string): string | null {
  return validatePort(String(port));
}

export function validatePangolinNetwork(v: string): string | null {
  if (!v) return "Pangolin network name is required";
  if (!NETWORK_NAME_RE.test(v))
    return "Pangolin network must be a valid Docker network name";
  return null;
}

export function validateProtocol(v: string): string | null {
  if (!PROTOCOLS.has(v))
    return "Protocol must be http, https, tcp, or udp";
  return null;
}

export function validateEmail(v: string): string | null {
  if (!v) return "Email is required";
  if (!EMAIL_RE.test(v)) return "Must be a valid email address";
  return null;
}

function validateResource(
  r: BlueprintResource,
  idx: number,
  composeServiceKeys: Set<string>,
): string[] {
  const errors: string[] = [];
  const prefix = `Resource "${r.serviceContainerName || idx + 1}"`;

  push(errors, `${prefix} blueprintName`, validateBlueprintName(r.blueprintName));
  push(errors, `${prefix} resourceName`, validateResourceName(r.resourceName));
  push(errors, `${prefix} subdomain`, validateSubdomain(r.subdomain));
  push(errors, `${prefix} servicePort`, validateServicePort(r.servicePort));
  push(errors, `${prefix} protocol`, validateProtocol(r.protocol));

  if (!r.serviceContainerName) {
    errors.push(`${prefix}: serviceContainerName is required`);
  } else if (
    composeServiceKeys.size > 0 &&
    !composeServiceKeys.has(r.serviceContainerName)
  ) {
    errors.push(
      `${prefix}: service "${r.serviceContainerName}" not found in the imported compose document`,
    );
  }

  if (r.targetHostname !== undefined && r.targetHostname !== "") {
    push(errors, `${prefix} targets[0].hostname`, validateHostname(r.targetHostname));
  }
  if (r.targetPort !== undefined) {
    push(errors, `${prefix} targets[0].port`, validatePort(String(r.targetPort)));
  }

  r.extraTargets.forEach((t, i) => {
    const tp = `${prefix} targets[${i + 1}]`;
    push(errors, `${tp} method`, validateProtocol(t.method));
    if (t.hostname) push(errors, `${tp} hostname`, validateHostname(t.hostname));
    if (t.port !== undefined)
      push(errors, `${tp} port`, validatePort(String(t.port)));
  });

  // SSO list entries: each non-empty role/user is a free-form label slug.
  r.auth.ssoRoles
    .filter(Boolean)
    .forEach((role, i) =>
      push(errors, `${prefix} auth.sso-roles[${i}]`, validateLabelKey(role)),
    );

  return errors;
}

export function validateBlueprint(bp: Blueprint): string[] {
  const errors: string[] = [];

  push(errors, "baseDomain", validateBaseDomain(bp.baseDomain));
  push(errors, "pangolinNetwork", validatePangolinNetwork(bp.pangolinNetwork));

  const composeServices = bp.composeDocument
    ? (bp.composeDocument as Record<string, unknown>).services
    : null;
  const composeServiceKeys = new Set<string>(
    composeServices && typeof composeServices === "object"
      ? Object.keys(composeServices as Record<string, unknown>)
      : [],
  );

  if (bp.resources.length === 0) {
    // Empty blueprint is valid — user may still be filling things out — but
    // hint at the next step.
    return errors;
  }

  const seenNames = new Set<string>();
  bp.resources.forEach((r, i) => {
    errors.push(...validateResource(r, i, composeServiceKeys));
    if (r.blueprintName && seenNames.has(r.blueprintName)) {
      errors.push(`Duplicate blueprintName: "${r.blueprintName}"`);
    }
    seenNames.add(r.blueprintName);
  });

  return errors;
}
