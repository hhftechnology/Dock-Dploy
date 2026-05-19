import type {
  NetworkConfig,
  ServiceConfig,
  VolumeConfig,
} from "../../types/compose";
import type { VPNConfig } from "../../types/vpn-configs";
import {
  convertToDockerRun,
  convertToSystemd,
  generateEnvFile,
  generateKomodoToml,
} from "../converters";
import { defaultVPNConfig } from "../default-configs";
import { generateYaml } from "../yaml-generator";
import {
  redactSensitiveData,
  validateNetworks,
  validateServices,
  validateVolumes,
} from "../validation";
import { validateVpnConfig } from "./vpn";
import { validateComposeYaml } from "./compose";
import {
  formatValidationIssues,
  issuesToResult,
  validationError,
  type ValidationIssue,
  type ValidationResult,
} from "./issues";

export type ComposeOutputFormat =
  | "compose"
  | "docker-run"
  | "systemd"
  | "env"
  | "redact"
  | "komodo";

export interface ComposeOutputContext {
  services: ServiceConfig[];
  networks: NetworkConfig[];
  volumes: VolumeConfig[];
  vpn?: VPNConfig;
  yaml?: string;
  selectedIdx?: number | null;
}

export interface ValidatedOutput extends ValidationResult {
  output: string;
}

function legacyErrorsToIssues(
  errors: string[],
  source: string,
): ValidationIssue[] {
  return errors.map((message, index) =>
    validationError(source, String(index), message),
  );
}

export function validateComposeProject({
  services,
  networks,
  volumes,
  vpn,
}: ComposeOutputContext): ValidationResult {
  const vpnConfig = vpn ?? defaultVPNConfig();
  return issuesToResult([
    ...legacyErrorsToIssues(validateServices(services), "compose.services"),
    ...legacyErrorsToIssues(validateNetworks(networks), "compose.networks"),
    ...legacyErrorsToIssues(validateVolumes(volumes), "compose.volumes"),
    ...legacyErrorsToIssues(validateVpnConfig(vpnConfig), "compose.vpn"),
  ]);
}

function validateEnvOutput(output: string): ValidationIssue[] {
  if (!output.trim()) return [];
  return output
    .split("\n")
    .flatMap((line, index) =>
      /^[A-Z_][A-Z0-9_]*=$/i.test(line)
        ? []
        : [
            validationError(
              "compose.output",
              `env.${index + 1}`,
              ".env output lines must be KEY= placeholders",
            ),
          ],
    );
}

function validateRedactedOutput(output: string): ValidationIssue[] {
  const leaked = /(password|secret|api[_-]?key|token|auth[_-]?token|access[_-]?key|private[_-]?key)\s*[:=]\s*["']?(?!\*\*\*REDACTED\*\*\*)[^"'\n]+/i.test(
    output,
  );
  return leaked
    ? [
        validationError(
          "compose.output",
          "redact",
          "Redacted output still contains sensitive-looking values",
        ),
      ]
    : [];
}

export function validateComposeOutput(
  format: ComposeOutputFormat,
  output: string,
): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (format === "compose" || format === "redact") {
    const result = validateComposeYaml(output);
    issues.push(
      ...legacyErrorsToIssues(
        result.errors,
        format === "compose" ? "compose.output" : "compose.redactedOutput",
      ),
    );
  }

  if (format === "docker-run" && !/^docker run\b/m.test(output)) {
    issues.push(
      validationError(
        "compose.output",
        "dockerRun",
        "Docker run output must contain a docker run command",
      ),
    );
  }

  if (
    format === "systemd" &&
    (!output.includes("[Unit]") || !output.includes("ExecStart="))
  ) {
    issues.push(
      validationError(
        "compose.output",
        "systemd",
        "systemd output must include a unit and ExecStart",
      ),
    );
  }

  if (format === "env") {
    issues.push(...validateEnvOutput(output));
  }

  if (format === "redact") {
    issues.push(...validateRedactedOutput(output));
  }

  if (format === "komodo" && output.includes("Error parsing configuration")) {
    issues.push(
      validationError(
        "compose.output",
        "komodo",
        "Komodo TOML cannot be generated from invalid Compose YAML",
      ),
    );
  }

  return issuesToResult(issues);
}

export function createValidatedComposeOutput(
  format: ComposeOutputFormat,
  context: ComposeOutputContext,
): ValidatedOutput {
  const project = validateComposeProject(context);
  if (!project.ok) return { ...project, output: "" };

  const services =
    context.selectedIdx !== undefined &&
    context.selectedIdx !== null &&
    context.services[context.selectedIdx]
      ? [context.services[context.selectedIdx]]
      : context.services;

  const yaml =
    context.yaml ??
    generateYaml(
      context.services,
      context.networks,
      context.volumes,
      context.vpn,
    );

  let output = "";
  switch (format) {
    case "compose":
      output = yaml;
      break;
    case "docker-run":
      output = services.map((service) => convertToDockerRun(service)).join("\n\n");
      break;
    case "systemd":
      output = services.map((service) => convertToSystemd(service)).join("\n\n");
      break;
    case "env":
      output = generateEnvFile(context.services, context.vpn);
      break;
    case "redact":
      output = redactSensitiveData(yaml);
      break;
    case "komodo":
      output = generateKomodoToml(yaml);
      break;
  }

  const outputValidation = validateComposeOutput(format, output);
  return { ...outputValidation, output };
}

export function invalidOutputMessage(result: ValidationResult): string {
  return `Validation blocked output: ${formatValidationIssues(result.issues)}`;
}
