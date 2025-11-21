// Validation utilities for Docker Compose configurations

import type { ServiceConfig } from "../types/compose";

export function validateServiceName(name: string): string | null {
  if (!name) return "Service name is required";
  if (!/^[a-z0-9_-]+$/i.test(name)) {
    return "Service name must contain only alphanumeric characters, hyphens, and underscores";
  }
  return null;
}

export function validatePort(port: string): string | null {
  if (!port) return null;
  const num = parseInt(port, 10);
  if (isNaN(num) || num < 1 || num > 65535) {
    return "Port must be between 1 and 65535";
  }
  return null;
}

export function validateEnvVarKey(key: string): string | null {
  if (!key) return null;
  if (!/^[A-Z_][A-Z0-9_]*$/i.test(key)) {
    return "Environment variable key should start with a letter or underscore and contain only alphanumeric characters and underscores";
  }
  return null;
}

export function validateCpuValue(cpu: string): string | null {
  if (!cpu) return null;
  if (!/^\d+(\.\d+)?$/.test(cpu)) {
    return "CPU value must be a number (e.g., 0.5, 1, 2)";
  }
  const num = parseFloat(cpu);
  if (num < 0) {
    return "CPU value must be positive";
  }
  return null;
}

export function validateMemoryValue(memory: string): string | null {
  if (!memory) return null;
  if (!/^\d+[kmgKMG]?[bB]?$/.test(memory) && !/^\d+$/.test(memory)) {
    return "Memory value must be a number with optional unit (e.g., 512m, 2g, 1024)";
  }
  return null;
}

export function validateServices(services: ServiceConfig[]): string[] {
  const errors: string[] = [];

  services.forEach((svc, idx) => {
    if (!svc.name) {
      errors.push(`Service ${idx + 1}: Name is required`);
    } else {
      const nameError = validateServiceName(svc.name);
      if (nameError) errors.push(`Service "${svc.name}": ${nameError}`);
    }

    if (!svc.image) {
      errors.push(`Service "${svc.name || idx + 1}": Image is required`);
    }

    svc.ports.forEach((port, pIdx) => {
      if (port.host) {
        const portError = validatePort(port.host);
        if (portError)
          errors.push(
            `Service "${svc.name || idx + 1}" port ${pIdx + 1} host: ${portError}`
          );
      }
      if (port.container) {
        const portError = validatePort(port.container);
        if (portError)
          errors.push(
            `Service "${svc.name || idx + 1}" port ${pIdx + 1} container: ${portError}`
          );
      }
    });

    svc.environment.forEach((env, eIdx) => {
      if (env.key) {
        const keyError = validateEnvVarKey(env.key);
        if (keyError)
          errors.push(
            `Service "${svc.name || idx + 1}" env var ${eIdx + 1}: ${keyError}`
          );
      }
    });

    if (svc.deploy?.resources?.limits?.cpus) {
      const cpuError = validateCpuValue(svc.deploy.resources.limits.cpus);
      if (cpuError)
        errors.push(`Service "${svc.name || idx + 1}" CPU limit: ${cpuError}`);
    }
    if (svc.deploy?.resources?.limits?.memory) {
      const memError = validateMemoryValue(
        svc.deploy.resources.limits.memory
      );
      if (memError)
        errors.push(
          `Service "${svc.name || idx + 1}" memory limit: ${memError}`
        );
    }
    if (svc.deploy?.resources?.reservations?.cpus) {
      const cpuError = validateCpuValue(
        svc.deploy.resources.reservations.cpus
      );
      if (cpuError)
        errors.push(
          `Service "${svc.name || idx + 1}" CPU reservation: ${cpuError}`
        );
    }
    if (svc.deploy?.resources?.reservations?.memory) {
      const memError = validateMemoryValue(
        svc.deploy.resources.reservations.memory
      );
      if (memError)
        errors.push(
          `Service "${svc.name || idx + 1}" memory reservation: ${memError}`
        );
    }
  });

  return errors;
}

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
