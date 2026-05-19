// Validation for the fosrl/blueprints-compatible Blueprint structure.

import type {
  Blueprint,
  BlueprintHealthcheck,
  BlueprintPrivateResource,
  BlueprintResource,
  BlueprintSite,
  BlueprintTarget,
} from "../../types/blueprint";
import {
  validateHostname,
  validateIpv4Cidr,
  validateLabelKey,
  validatePort,
} from "../validation";

const BLUEPRINT_NAME_RE = /^[a-z0-9][a-z0-9-]*$/;
const SUBDOMAIN_RE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i;
const FQDN_RE =
  /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/i;
const NETWORK_NAME_RE = /^[a-z0-9][a-z0-9_-]*$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const IP_RE = /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;
const HEADER_NAME_RE = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;
const PROTOCOLS = new Set(["http", "tcp", "udp"]);
const TARGET_METHODS = new Set(["http", "https", "h2c"]);
const PATH_MATCHES = new Set(["exact", "prefix", "regex"]);
const REWRITE_MATCHES = new Set(["exact", "prefix", "regex", "stripPrefix"]);
const RULE_ACTIONS = new Set(["allow", "deny", "pass"]);
const RULE_MATCHES = new Set(["cidr", "path", "ip", "country", "asn", "region"]);
const PRIVATE_MODES = new Set(["host", "cidr", "http"]);
const PRIVATE_SCHEMES = new Set(["http", "https"]);

function push(errors: string[], prefix: string, err: string | null) {
  if (err) errors.push(`${prefix}: ${err}`);
}

function fullDomainFor(bp: Blueprint, r: BlueprintResource): string {
  return bp.baseDomain ? `${r.subdomain}.${bp.baseDomain}` : r.subdomain;
}

function isValidHostOrIp(value: string): boolean {
  return IP_RE.test(value) || validateHostname(value) === null || FQDN_RE.test(value);
}

function hasAuth(r: BlueprintResource): boolean {
  const auth = r.auth;
  return Boolean(
    auth.pincode ||
      auth.password ||
      auth.basicUser ||
      auth.basicPassword ||
      auth.ssoEnabled ||
      auth.ssoRoles.length > 0 ||
      auth.ssoUsers.length > 0 ||
      auth.whitelistUsers.length > 0,
  );
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
  if (!v) return null;
  if (!FQDN_RE.test(v)) return "Base domain must be a valid FQDN";
  return null;
}

export function validateFullDomain(v: string): string | null {
  if (!v) return "Full domain is required";
  if (!FQDN_RE.test(v)) return "Full domain must be a valid FQDN";
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
  if (!PROTOCOLS.has(v)) return "Protocol must be http, tcp, or udp";
  return null;
}

export function validateTargetMethod(v: string): string | null {
  if (!TARGET_METHODS.has(v)) return "Target method must be http, https, or h2c";
  return null;
}

export function validateEmail(v: string): string | null {
  if (!v) return "Email is required";
  if (!EMAIL_RE.test(v)) return "Must be a valid email address";
  return null;
}

function validateHeaderList(
  headers: Array<{ name: string; value: string }>,
  prefix: string,
): string[] {
  const errors: string[] = [];
  headers.forEach((h, i) => {
    if (!h.name && !h.value) return;
    if (!h.name || !HEADER_NAME_RE.test(h.name)) {
      errors.push(`${prefix}[${i}].name: Header name must be a valid HTTP token`);
    }
    if (!h.value) errors.push(`${prefix}[${i}].value: Header value is required`);
  });
  return errors;
}

function validateHealthcheck(
  hc: BlueprintHealthcheck | undefined,
  prefix: string,
): string[] {
  const errors: string[] = [];
  if (!hc) return errors;
  if (hc.hostname && !isValidHostOrIp(hc.hostname)) {
    errors.push(`${prefix}.hostname: Must be a valid hostname or IP address`);
  }
  if (hc.port !== undefined) push(errors, `${prefix}.port`, validatePort(String(hc.port)));
  if (hc.path && !hc.path.startsWith("/")) {
    errors.push(`${prefix}.path: Path must start with /`);
  }
  if (hc.scheme && !PRIVATE_SCHEMES.has(hc.scheme)) {
    errors.push(`${prefix}.scheme: Scheme must be http or https`);
  }
  [
    ["interval", hc.interval],
    ["unhealthy-interval", hc.unhealthyInterval],
    ["timeout", hc.timeout],
  ].forEach(([name, value]) => {
    if (value !== undefined && (!Number.isInteger(value) || Number(value) < 1)) {
      errors.push(`${prefix}.${name}: Must be a positive integer`);
    }
  });
  if (hc.status !== undefined && (!Number.isInteger(hc.status) || hc.status < 100 || hc.status > 599)) {
    errors.push(`${prefix}.status: Status must be an HTTP status code`);
  }
  errors.push(...validateHeaderList(hc.headers, `${prefix}.headers`));
  return errors;
}

function validateTarget(
  t: BlueprintTarget,
  idx: number,
  protocol: BlueprintResource["protocol"],
  prefix: string,
): string[] {
  const errors: string[] = [];
  if (protocol === "http") {
    if (!t.method) errors.push(`${prefix} targets[${idx}].method: Target method is required`);
    else push(errors, `${prefix} targets[${idx}].method`, validateTargetMethod(t.method));
  } else if (t.method) {
    errors.push(`${prefix} targets[${idx}].method: TCP/UDP resources must not define target method`);
  }
  if (t.hostname && !isValidHostOrIp(t.hostname)) {
    errors.push(`${prefix} targets[${idx}].hostname: Must be a valid hostname or IP address`);
  }
  if (t.port !== undefined) push(errors, `${prefix} targets[${idx}].port`, validatePort(String(t.port)));
  if (t.internalPort !== undefined) {
    push(errors, `${prefix} targets[${idx}].internal-port`, validatePort(String(t.internalPort)));
  }
  if (t.path && !t.path.startsWith("/")) {
    errors.push(`${prefix} targets[${idx}].path: Path must start with /`);
  }
  if (t.pathMatch && !PATH_MATCHES.has(t.pathMatch)) {
    errors.push(`${prefix} targets[${idx}].path-match: Must be exact, prefix, or regex`);
  }
  if (t.rewritePath && !t.rewritePath.startsWith("/")) {
    errors.push(`${prefix} targets[${idx}].rewrite-path: Rewrite path must start with /`);
  }
  if (t.rewriteMatch && !REWRITE_MATCHES.has(t.rewriteMatch)) {
    errors.push(`${prefix} targets[${idx}].rewrite-match: Must be exact, prefix, regex, or stripPrefix`);
  }
  if (t.priority !== undefined && (!Number.isInteger(t.priority) || t.priority < 0)) {
    errors.push(`${prefix} targets[${idx}].priority: Priority must be a non-negative integer`);
  }
  errors.push(...validateHealthcheck(t.healthcheck, `${prefix} targets[${idx}].healthcheck`));
  return errors;
}

function validateResource(
  bp: Blueprint,
  r: BlueprintResource,
  idx: number,
  composeServiceKeys: Set<string>,
): string[] {
  const errors: string[] = [];
  const prefix = `Resource "${r.serviceContainerName || idx + 1}"`;

  push(errors, `${prefix} blueprintName`, validateBlueprintName(r.blueprintName));
  push(errors, `${prefix} resourceName`, validateResourceName(r.resourceName));
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

  if (r.protocol === "http") {
    push(errors, `${prefix} subdomain`, validateSubdomain(r.subdomain));
    push(errors, `${prefix} full-domain`, validateFullDomain(fullDomainFor(bp, r)));
    errors.push(...validateTarget(
      {
        site: r.targetSite,
        method: r.targetMethod,
        hostname: r.targetHostname,
        port: r.targetPort,
        enabled: r.targetEnabled,
        internalPort: r.targetInternalPort,
        path: r.targetPath,
        pathMatch: r.targetPathMatch,
        rewritePath: r.targetRewritePath,
        rewriteMatch: r.targetRewriteMatch,
        priority: r.targetPriority,
        healthcheck: r.targetHealthcheck,
      },
      0,
      r.protocol,
      prefix,
    ));
    r.extraTargets.forEach((t, i) => {
      errors.push(...validateTarget(t, i + 1, r.protocol, prefix));
    });
    errors.push(...validateHeaderList(r.headers, `${prefix} headers`));
    r.rules.forEach((rule, i) => {
      if (!RULE_ACTIONS.has(rule.action)) errors.push(`${prefix} rules[${i}].action: Invalid rule action`);
      if (!RULE_MATCHES.has(rule.match)) errors.push(`${prefix} rules[${i}].match: Invalid rule match`);
      if (!rule.value) errors.push(`${prefix} rules[${i}].value: Rule value is required`);
      if (rule.priority !== undefined && (!Number.isInteger(rule.priority) || rule.priority < 0)) {
        errors.push(`${prefix} rules[${i}].priority: Priority must be a non-negative integer`);
      }
    });
    r.auth.ssoRoles.filter(Boolean).forEach((role, i) => {
      if (role === "Admin") errors.push(`${prefix} auth.sso-roles[${i}]: Admin role is reserved`);
      push(errors, `${prefix} auth.sso-roles[${i}]`, validateLabelKey(role));
    });
    r.auth.ssoUsers.filter(Boolean).forEach((user, i) => {
      push(errors, `${prefix} auth.sso-users[${i}]`, validateEmail(user));
    });
    r.auth.whitelistUsers.filter(Boolean).forEach((user, i) => {
      push(errors, `${prefix} auth.whitelist-users[${i}]`, validateEmail(user));
    });
  } else {
    if (r.proxyPort === undefined) errors.push(`${prefix} proxy-port: TCP/UDP resources require proxy-port`);
    else push(errors, `${prefix} proxy-port`, validatePort(String(r.proxyPort)));
    if (hasAuth(r)) errors.push(`${prefix}: TCP/UDP resources must not define auth labels`);
    r.extraTargets.forEach((t, i) => {
      if (t.method) errors.push(`${prefix} targets[${i + 1}].method: TCP/UDP resources must not define target method`);
    });
  }

  return errors;
}

function validatePrivateResource(
  r: BlueprintPrivateResource,
  idx: number,
  composeServiceKeys: Set<string>,
): string[] {
  const errors: string[] = [];
  const prefix = `Private resource "${r.key || idx + 1}"`;
  push(errors, `${prefix} key`, validateBlueprintName(r.key));
  push(errors, `${prefix} name`, validateResourceName(r.name));
  if (!PRIVATE_MODES.has(r.mode)) errors.push(`${prefix} mode: Must be host, cidr, or http`);
  if (!r.serviceContainerName) errors.push(`${prefix}: serviceContainerName is required`);
  else if (composeServiceKeys.size > 0 && !composeServiceKeys.has(r.serviceContainerName)) {
    errors.push(`${prefix}: service "${r.serviceContainerName}" not found in the imported compose document`);
  }

  if (r.mode === "cidr") {
    push(errors, `${prefix} destination`, validateIpv4Cidr(r.destination));
  } else if (!r.destination || !isValidHostOrIp(r.destination)) {
    errors.push(`${prefix} destination: Must be a valid hostname, FQDN, or IP address`);
  }

  if (r.mode === "host" || r.mode === "http") {
    if (r.destinationPort === undefined) errors.push(`${prefix} destination-port: Port is required`);
    else push(errors, `${prefix} destination-port`, validatePort(String(r.destinationPort)));
  }
  if (r.mode === "http") {
    push(errors, `${prefix} full-domain`, validateFullDomain(r.fullDomain));
    if (!PRIVATE_SCHEMES.has(r.scheme)) errors.push(`${prefix} scheme: Scheme must be http or https`);
  }
  if (!r.alias) errors.push(`${prefix} alias: Alias is required`);
  else push(errors, `${prefix} alias`, validateLabelKey(r.alias));
  r.roles.filter(Boolean).forEach((role, i) => {
    if (role === "Admin") errors.push(`${prefix} roles[${i}]: Admin role is reserved`);
    push(errors, `${prefix} roles[${i}]`, validateLabelKey(role));
  });
  r.users.filter(Boolean).forEach((user, i) => push(errors, `${prefix} users[${i}]`, validateEmail(user)));
  r.machines.filter(Boolean).forEach((machine, i) => push(errors, `${prefix} machines[${i}]`, validateLabelKey(machine)));
  return errors;
}

function validateSite(
  site: BlueprintSite,
  idx: number,
  composeServiceKeys: Set<string>,
): string[] {
  const errors: string[] = [];
  const prefix = `Site "${site.key || idx + 1}"`;
  push(errors, `${prefix} key`, validateBlueprintName(site.key));
  push(errors, `${prefix} name`, validateResourceName(site.name));
  if (!site.serviceContainerName) errors.push(`${prefix}: serviceContainerName is required`);
  else if (composeServiceKeys.size > 0 && !composeServiceKeys.has(site.serviceContainerName)) {
    errors.push(`${prefix}: service "${site.serviceContainerName}" not found in the imported compose document`);
  }
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

  const seenNames = new Set<string>();
  const seenDomains = new Set<string>();
  const seenProxyPorts = new Set<string>();
  bp.resources.forEach((r, i) => {
    errors.push(...validateResource(bp, r, i, composeServiceKeys));
    if (r.blueprintName && seenNames.has(r.blueprintName)) {
      errors.push(`Duplicate blueprintName: "${r.blueprintName}"`);
    }
    seenNames.add(r.blueprintName);

    if (r.protocol === "http") {
      const fullDomain = fullDomainFor(bp, r);
      if (fullDomain && seenDomains.has(fullDomain)) {
        errors.push(`Duplicate full-domain: "${fullDomain}"`);
      }
      seenDomains.add(fullDomain);
    } else if (r.proxyPort !== undefined) {
      const key = `${r.protocol}:${r.proxyPort}`;
      if (seenProxyPorts.has(key)) errors.push(`Duplicate ${r.protocol} proxy-port: "${r.proxyPort}"`);
      seenProxyPorts.add(key);
    }
  });

  const seenPrivateAliases = new Set<string>();
  const seenPrivateKeys = new Set<string>();
  (bp.privateResources ?? []).forEach((privateResource, i) => {
    errors.push(...validatePrivateResource(privateResource, i, composeServiceKeys));
    if (privateResource.key && seenPrivateKeys.has(privateResource.key)) {
      errors.push(`Duplicate private resource key: "${privateResource.key}"`);
    }
    seenPrivateKeys.add(privateResource.key);
    if (privateResource.alias && seenPrivateAliases.has(privateResource.alias)) {
      errors.push(`Duplicate private resource alias: "${privateResource.alias}"`);
    }
    seenPrivateAliases.add(privateResource.alias);
  });

  const seenSiteKeys = new Set<string>();
  (bp.sites ?? []).forEach((site, i) => {
    errors.push(...validateSite(site, i, composeServiceKeys));
    if (site.key && seenSiteKeys.has(site.key)) {
      errors.push(`Duplicate site key: "${site.key}"`);
    }
    seenSiteKeys.add(site.key);
  });

  return errors;
}
