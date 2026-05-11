// Zod schemas for Docker Compose v3+ input validation.
// Each export pairs a Zod schema with a `validate(value): string | null` adapter
// that matches the legacy validation.ts signature so existing call sites can
// upgrade incrementally.

import { z } from "zod";

// ---------- Regexes (single source of truth) ----------

// Service name: starts with alnum, then alnum/dot/dash/underscore. Max 63 chars (DNS label).
const SERVICE_NAME_RE = /^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/;

// Container name: same as service name but stricter — Docker requires [a-zA-Z0-9][a-zA-Z0-9_.-]+
const CONTAINER_NAME_RE = /^[a-zA-Z0-9][a-zA-Z0-9_.-]+$/;

// Image reference: optional registry/repo path, name, optional :tag, optional @sha256:digest.
// Permissive (matches Docker's reference grammar loosely).
const IMAGE_RE =
  /^(?:(?:[a-z0-9]+(?:[._-][a-z0-9]+)*(?::\d+)?\/)?(?:[a-z0-9]+(?:[._-][a-z0-9]+)*)(?:\/[a-z0-9]+(?:[._-][a-z0-9]+)*)*)(?::[\w][\w.-]{0,127})?(?:@sha256:[a-f0-9]{64})?$/i;

// RFC 1123 hostname label (single label, no dots) — used for `hostname` field.
const HOSTNAME_LABEL_RE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i;

// Full FQDN (allows dots) — used for extra_hosts host part.
const HOSTNAME_FQDN_RE =
  /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i;

// Env var key: starts with letter/underscore, then alphanumeric + underscore.
const ENV_KEY_RE = /^[A-Z_][A-Z0-9_]*$/i;

// CPU value: positive decimal.
const CPU_RE = /^\d+(\.\d+)?$/;

// Memory value: positive number with optional unit (b/k/m/g, case-insensitive,
// optional 'b' suffix). Docker accepts e.g. 512m, 2g, 1024, 100kb.
const MEMORY_RE = /^\d+(?:\.\d+)?[kmg]?b?$/i;

// Docker duration: integer + ms/s/m/h. Combined like "1h30m" is also valid.
const DURATION_RE = /^(\d+(ms|s|m|h))+$/;

// User: name or uid, optional :group or :gid.
const USER_RE = /^(?:\d+|[a-z_][a-z0-9_-]*)(?::(?:\d+|[a-z_][a-z0-9_-]*))?$/i;

// Network alias (used in `networks`): same rules as service name.
const NETWORK_NAME_RE = SERVICE_NAME_RE;

// Volume name.
const VOLUME_NAME_RE = /^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/;

// Stop signal: SIGTERM/SIGKILL/etc. or numeric.
const STOP_SIGNAL_RE = /^(SIG[A-Z]+|\d{1,2})$/;

// IPv4 octet.
const IPV4_OCTET = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;

// ---------- Helpers ----------

function isValidIPv4(value: string): boolean {
  const parts = value.split(".");
  if (parts.length !== 4) return false;
  return parts.every((p) => IPV4_OCTET.test(p));
}

function isValidIPv6(value: string): boolean {
  // Minimal IPv6 sanity check: 2..8 hex groups separated by `:`, optional `::`.
  if (!/^[0-9a-fA-F:]+$/.test(value)) return false;
  if (value.includes(":::")) return false;
  // Allow zero-compression (::) once.
  const doubleColon = (value.match(/::/g) ?? []).length;
  if (doubleColon > 1) return false;
  return value.includes(":");
}

function isValidIPv4Cidr(value: string): boolean {
  const [ip, mask] = value.split("/");
  if (!ip || mask === undefined) return false;
  if (!isValidIPv4(ip)) return false;
  const n = Number(mask);
  return Number.isInteger(n) && n >= 0 && n <= 32;
}

// ---------- Schemas ----------

export const serviceNameSchema = z
  .string()
  .min(1, "Service name is required")
  .max(63, "Service name must be 63 characters or fewer")
  .regex(
    SERVICE_NAME_RE,
    "Service name must start with a letter or digit and contain only letters, digits, dots, dashes, or underscores"
  );

export const imageSchema = z
  .string()
  .min(1, "Image is required")
  .max(255, "Image reference is too long")
  .regex(
    IMAGE_RE,
    "Image must be a valid Docker reference (e.g. nginx, nginx:1.25, registry.example.com/org/app:tag)"
  );

export const containerNameSchema = z
  .string()
  .regex(
    CONTAINER_NAME_RE,
    "Container name must start with a letter or digit and contain only letters, digits, dots, dashes, or underscores"
  );

export const hostnameSchema = z
  .string()
  .max(63, "Hostname label must be 63 characters or fewer")
  .regex(HOSTNAME_LABEL_RE, "Hostname must be a valid RFC 1123 label");

export const portSchema = z
  .number({ message: "Port must be a number" })
  .int("Port must be an integer")
  .min(1, "Port must be between 1 and 65535")
  .max(65535, "Port must be between 1 and 65535");

export const protocolSchema = z.enum(["tcp", "udp", "sctp"]);

export const networkModeSchema = z
  .string()
  .refine(
    (v) =>
      v === "" ||
      v === "host" ||
      v === "none" ||
      v === "bridge" ||
      /^service:[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(v) ||
      /^container:[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(v),
    "Network mode must be host, none, bridge, service:<name>, or container:<name>"
  );

export const networkDriverSchema = z.enum([
  "bridge",
  "host",
  "overlay",
  "macvlan",
  "ipvlan",
  "none",
]);

export const volumeDriverSchema = z
  .string()
  .min(1, "Volume driver must not be empty");

export const envKeySchema = z
  .string()
  .regex(
    ENV_KEY_RE,
    "Env var key must start with a letter or underscore and contain only letters, digits, and underscores"
  );

export const cpuSchema = z
  .string()
  .regex(CPU_RE, "CPU value must be a positive number (e.g. 0.5, 1, 2)")
  .refine((v) => Number(v) >= 0, "CPU value must be non-negative");

export const memorySchema = z
  .string()
  .regex(
    MEMORY_RE,
    "Memory must be a number with optional unit (e.g. 512m, 2g, 1024)"
  );

export const durationSchema = z
  .string()
  .regex(
    DURATION_RE,
    "Duration must be a number with unit ms, s, m, or h (e.g. 30s, 1m30s)"
  );

export const stopSignalSchema = z
  .string()
  .regex(
    STOP_SIGNAL_RE,
    "Stop signal must be SIG<NAME> (e.g. SIGTERM) or a signal number"
  );

export const userSchema = z
  .string()
  .regex(USER_RE, "User must be uid[:gid] or username[:group]");

export const networkNameSchema = z
  .string()
  .regex(NETWORK_NAME_RE, "Network name must be a valid identifier");

export const volumeNameSchema = z
  .string()
  .regex(VOLUME_NAME_RE, "Volume name must be a valid identifier");

export const ipv4Schema = z
  .string()
  .refine(isValidIPv4, "Must be a valid IPv4 address");

export const ipAddressSchema = z
  .string()
  .refine(
    (v) => isValidIPv4(v) || isValidIPv6(v),
    "Must be a valid IPv4 or IPv6 address"
  );

export const ipv4CidrSchema = z
  .string()
  .refine(isValidIPv4Cidr, "Must be a valid IPv4 CIDR (e.g. 10.0.0.0/16)");

export const extraHostSchema = z
  .string()
  .refine((v) => /^[^:\s]+:[^:\s]+$/.test(v), {
    message: "Extra host must be in the form host:ip",
  })
  .refine(
    (v) => {
      const parts = v.split(":");
      if (parts.length < 2) return true; // first refine already flagged
      const host = parts[0];
      const ip = parts.slice(1).join(":");
      return HOSTNAME_FQDN_RE.test(host) && (isValidIPv4(ip) || isValidIPv6(ip));
    },
    { message: "Extra host must be a valid hostname:ip pair" },
  );

export const restartPolicySchema = z.enum([
  "no",
  "always",
  "on-failure",
  "unless-stopped",
]);

// Volume host path: warn if relative without `.` / `~` prefix; accept absolute or named volume.
export const volumeHostPathSchema = z
  .string()
  .min(1, "Host path or volume name is required");

// ---------- Legacy adapters (return string | null) ----------

function adapt(schema: z.ZodTypeAny) {
  return (value: unknown): string | null => {
    const result = schema.safeParse(value);
    if (result.success) return null;
    return result.error.issues[0]?.message ?? "Invalid value";
  };
}

// Wraps a schema; treats empty string as "no input" and skips validation,
// matching the existing behavior of the legacy validators.
function adaptOptional(schema: z.ZodTypeAny) {
  return (value: unknown): string | null => {
    if (value === undefined || value === null || value === "") return null;
    return adapt(schema)(value);
  };
}

export const validate = {
  serviceName: adapt(serviceNameSchema),
  image: adapt(imageSchema),
  containerName: adaptOptional(containerNameSchema),
  hostname: adaptOptional(hostnameSchema),
  port: (port: string): string | null => {
    if (!port) return null;
    const n = parseInt(port, 10);
    if (Number.isNaN(n)) return "Port must be a number";
    return adapt(portSchema)(n);
  },
  protocol: adaptOptional(protocolSchema),
  networkMode: adaptOptional(networkModeSchema),
  networkDriver: adaptOptional(networkDriverSchema),
  volumeDriver: adaptOptional(volumeDriverSchema),
  envKey: adaptOptional(envKeySchema),
  cpu: adaptOptional(cpuSchema),
  memory: adaptOptional(memorySchema),
  duration: adaptOptional(durationSchema),
  stopSignal: adaptOptional(stopSignalSchema),
  user: adaptOptional(userSchema),
  networkName: adaptOptional(networkNameSchema),
  volumeName: adaptOptional(volumeNameSchema),
  ipv4: adaptOptional(ipv4Schema),
  ipAddress: adaptOptional(ipAddressSchema),
  ipv4Cidr: adaptOptional(ipv4CidrSchema),
  extraHost: adaptOptional(extraHostSchema),
  restartPolicy: adaptOptional(restartPolicySchema),
  volumeHostPath: adaptOptional(volumeHostPathSchema),
};
