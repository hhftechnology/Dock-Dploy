// Validation utilities for Docker Compose configurations.
// All field-level rules live in src/utils/validation/schemas.ts (Zod).
// This module exposes the legacy `validate*` functions and the service-level
// `validateServices` aggregator used by the YAML-validation hook.

import type {
  NetworkConfig,
  ServiceConfig,
  VolumeConfig,
} from "../types/compose";
import { validate } from "./validation/schemas";

// ---------- Legacy single-field validators (kept for existing call sites) ----------

export function validateServiceName(name: string): string | null {
  return validate.serviceName(name);
}

export function validatePort(port: string): string | null {
  return validate.port(port);
}

export function validateEnvVarKey(key: string): string | null {
  return validate.envKey(key);
}

export function validateCpuValue(cpu: string): string | null {
  return validate.cpu(cpu);
}

export function validateMemoryValue(memory: string): string | null {
  return validate.memory(memory);
}

// New single-field validators surfaced for inline form UI.
export const validateImage = validate.image;
export const validateContainerName = validate.containerName;
export const validateHostname = validate.hostname;
export const validateUser = validate.user;
export const validateDuration = validate.duration;
export const validateStopSignal = validate.stopSignal;
export const validateNetworkMode = validate.networkMode;
export const validateNetworkDriver = validate.networkDriver;
export const validateVolumeDriver = validate.volumeDriver;
export const validateNetworkName = validate.networkName;
export const validateVolumeName = validate.volumeName;
export const validateIpAddress = validate.ipAddress;
export const validateIpv4Cidr = validate.ipv4Cidr;
export const validateExtraHost = validate.extraHost;

// ---------- Service-level aggregator ----------

function prefixFor(svc: ServiceConfig, idx: number): string {
  return `Service "${svc.name || idx + 1}"`;
}

function push(errors: string[], prefix: string, err: string | null) {
  if (err) errors.push(`${prefix}: ${err}`);
}

export function validateServices(services: ServiceConfig[]): string[] {
  const errors: string[] = [];
  const seenNames = new Set<string>();

  services.forEach((svc, idx) => {
    const prefix = prefixFor(svc, idx);

    // Name (required + format + uniqueness)
    if (!svc.name) {
      errors.push(`Service ${idx + 1}: Name is required`);
    } else {
      push(errors, prefix, validate.serviceName(svc.name));
      if (seenNames.has(svc.name)) {
        errors.push(`${prefix}: Duplicate service name`);
      }
      seenNames.add(svc.name);
    }

    // Image (required)
    if (!svc.image) {
      errors.push(`${prefix}: Image is required`);
    } else {
      push(errors, prefix, validate.image(svc.image));
    }

    // Container name (optional)
    push(errors, `${prefix} container_name`, validate.containerName(svc.container_name ?? ""));

    // Hostname (optional)
    push(errors, `${prefix} hostname`, validate.hostname(svc.hostname ?? ""));

    // User (optional)
    push(errors, `${prefix} user`, validate.user(svc.user ?? ""));

    // Restart policy (optional)
    push(errors, `${prefix} restart`, validate.restartPolicy(svc.restart ?? ""));

    // Network mode (optional)
    push(errors, `${prefix} network_mode`, validate.networkMode(svc.network_mode ?? ""));

    // Stop signal / stop grace period (optional)
    push(errors, `${prefix} stop_signal`, validate.stopSignal(svc.stop_signal ?? ""));
    push(
      errors,
      `${prefix} stop_grace_period`,
      validate.duration(svc.stop_grace_period ?? "")
    );

    // Ports
    svc.ports.forEach((port, pIdx) => {
      const portPrefix = `${prefix} port ${pIdx + 1}`;
      push(errors, `${portPrefix} host`, validate.port(port.host));
      push(errors, `${portPrefix} container`, validate.port(port.container));
      if (port.protocol) {
        push(errors, `${portPrefix} protocol`, validate.protocol(port.protocol));
      }
    });

    // Expose ports
    svc.expose?.forEach((expose, eIdx) => {
      push(errors, `${prefix} expose ${eIdx + 1}`, validate.port(expose));
    });

    // Volumes
    svc.volumes?.forEach((vol, vIdx) => {
      const vPrefix = `${prefix} volume ${vIdx + 1}`;
      push(errors, `${vPrefix} host`, validate.volumeHostPath(vol.host));
      if (!vol.container) {
        errors.push(`${vPrefix}: Container path is required`);
      }
    });

    // Environment
    svc.environment.forEach((env, eIdx) => {
      if (env.key) {
        push(errors, `${prefix} env var ${eIdx + 1}`, validate.envKey(env.key));
      }
    });

    // DNS entries
    svc.dns?.forEach((ip, dIdx) => {
      push(errors, `${prefix} dns ${dIdx + 1}`, validate.ipAddress(ip));
    });

    // Extra hosts
    svc.extra_hosts?.forEach((eh, hIdx) => {
      push(errors, `${prefix} extra_hosts ${hIdx + 1}`, validate.extraHost(eh));
    });

    // Healthcheck durations
    if (svc.healthcheck) {
      const hc = svc.healthcheck;
      push(errors, `${prefix} healthcheck.interval`, validate.duration(hc.interval ?? ""));
      push(errors, `${prefix} healthcheck.timeout`, validate.duration(hc.timeout ?? ""));
      push(errors, `${prefix} healthcheck.start_period`, validate.duration(hc.start_period ?? ""));
      push(errors, `${prefix} healthcheck.start_interval`, validate.duration(hc.start_interval ?? ""));
      if (hc.retries && !/^\d+$/.test(hc.retries)) {
        errors.push(`${prefix} healthcheck.retries: must be a non-negative integer`);
      }
    }

    // Resources
    push(errors, `${prefix} CPU limit`, validate.cpu(svc.deploy?.resources?.limits?.cpus ?? ""));
    push(
      errors,
      `${prefix} memory limit`,
      validate.memory(svc.deploy?.resources?.limits?.memory ?? "")
    );
    push(
      errors,
      `${prefix} CPU reservation`,
      validate.cpu(svc.deploy?.resources?.reservations?.cpus ?? "")
    );
    push(
      errors,
      `${prefix} memory reservation`,
      validate.memory(svc.deploy?.resources?.reservations?.memory ?? "")
    );
  });

  return errors;
}

export function validateNetworks(networks: NetworkConfig[]): string[] {
  const errors: string[] = [];
  networks.forEach((net, idx) => {
    const prefix = `Network "${net.name || idx + 1}"`;
    if (!net.name) {
      errors.push(`Network ${idx + 1}: Name is required`);
    } else {
      push(errors, prefix, validate.networkName(net.name));
    }
    if (net.driver) {
      push(errors, `${prefix} driver`, validate.networkDriver(net.driver));
    }
    net.ipam?.config?.forEach((cfg, cIdx) => {
      const c = `${prefix} ipam.config[${cIdx}]`;
      if (cfg.subnet) push(errors, `${c} subnet`, validate.ipv4Cidr(cfg.subnet));
      if (cfg.gateway) push(errors, `${c} gateway`, validate.ipv4(cfg.gateway));
    });
  });
  return errors;
}

export function validateVolumes(volumes: VolumeConfig[]): string[] {
  const errors: string[] = [];
  volumes.forEach((vol, idx) => {
    const prefix = `Volume "${vol.name || idx + 1}"`;
    if (!vol.name) {
      errors.push(`Volume ${idx + 1}: Name is required`);
    } else {
      push(errors, prefix, validate.volumeName(vol.name));
    }
    if (vol.driver) {
      push(errors, `${prefix} driver`, validate.volumeDriver(vol.driver));
    }
  });
  return errors;
}

// ---------- Redact (unchanged) ----------

export function redactSensitiveData(yamlText: string): string {
  const sensitivePatterns = [
    /password\s*[:=]\s*["']?([^"'\n]+)["']?/gi,
    /secret\s*[:=]\s*["']?([^"'\n]+)["']?/gi,
    /api[_-]?key\s*[:=]\s*["']?([^"'\n]+)["']?/gi,
    /token\s*[:=]\s*["']?([^"'\n]+)["']?/gi,
    /auth[_-]?token\s*[:=]\s*["']?([^"'\n]+)["']?/gi,
    /access[_-]?key\s*[:=]\s*["']?([^"'\n]+)["']?/gi,
    /private[_-]?key\s*[:=]\s*["']?([^"'\n]+)["']?/gi,
  ];

  let redacted = yamlText;
  sensitivePatterns.forEach((pattern) => {
    redacted = redacted.replace(pattern, (match, value) => {
      return match.replace(value, "***REDACTED***");
    });
  });

  return redacted;
}
