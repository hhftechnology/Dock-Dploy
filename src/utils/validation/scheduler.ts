import yaml from "js-yaml";
import { z } from "zod";
import {
  issuesToResult,
  validateWithSchema,
  validationError,
  type ValidationResult,
} from "./issues";

export const scheduleTypeSchema = z.enum([
  "cron",
  "github-actions",
  "systemd-timer",
]);

const CRON_RANGES = [
  [0, 59],
  [0, 23],
  [1, 31],
  [1, 12],
  [0, 7],
] as const;

const USER_RE = /^(?:\d+|[a-z_][a-z0-9_-]*)(?::(?:\d+|[a-z_][a-z0-9_-]*))?$/i;
const ABS_UNIX_PATH_RE = /^\/[^\0\n\r]*$/;

function isCronAtom(atom: string, min: number, max: number): boolean {
  if (atom === "*") return true;
  const stepped = atom.split("/");
  if (stepped.length > 2) return false;
  if (stepped[1] !== undefined) {
    const step = Number(stepped[1]);
    if (!Number.isInteger(step) || step < 1 || step > max) return false;
  }
  const range = stepped[0];
  if (!range) return false;
  if (range === "*") return true;
  if (range.includes("-")) {
    const [start, end] = range.split("-").map(Number);
    return (
      Number.isInteger(start) &&
      Number.isInteger(end) &&
      start >= min &&
      end <= max &&
      start <= end
    );
  }
  const value = Number(range);
  return Number.isInteger(value) && value >= min && value <= max;
}

function isCronField(field: string, min: number, max: number): boolean {
  return field.split(",").every((atom) => isCronAtom(atom, min, max));
}

export function isValidCronExpression(value: string): boolean {
  const parts = value.trim().split(/\s+/);
  if (parts.length !== 5) return false;
  return parts.every((part, index) => {
    const [min, max] = CRON_RANGES[index];
    return isCronField(part, min, max);
  });
}

export const scheduleConfigSchema = z
  .object({
    type: scheduleTypeSchema,
    name: z
      .string()
      .trim()
      .min(1, "Name is required")
      .max(80, "Name must be 80 characters or fewer")
      .regex(
        /^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/,
        "Name must start with a letter or digit and contain only letters, digits, dots, dashes, or underscores",
      ),
    schedule: z
      .string()
      .trim()
      .min(1, "Schedule is required")
      .refine(isValidCronExpression, {
        message: "Schedule must be a valid five-field cron expression",
      }),
    command: z
      .string()
      .trim()
      .min(1, "Command is required")
      .max(1000, "Command must be 1000 characters or fewer")
      .refine((value) => !/[\0\r\n]/.test(value), {
        message: "Command must be a single line without control characters",
      }),
    description: z
      .string()
      .trim()
      .max(160, "Description must be 160 characters or fewer")
      .optional()
      .or(z.literal("")),
    enabled: z.boolean().optional(),
    user: z
      .string()
      .trim()
      .regex(USER_RE, "User must be uid[:gid] or username[:group]")
      .optional()
      .or(z.literal("")),
    workingDir: z
      .string()
      .trim()
      .regex(ABS_UNIX_PATH_RE, "Working directory must be an absolute Unix path")
      .optional()
      .or(z.literal("")),
  })
  .superRefine((cfg, ctx) => {
    if (cfg.type === "github-actions" && cfg.user) {
      ctx.addIssue({
        code: "custom",
        path: ["user"],
        message: "GitHub Actions schedules do not support a cron user field",
      });
    }
    if (cfg.type === "github-actions" && cfg.workingDir) {
      ctx.addIssue({
        code: "custom",
        path: ["workingDir"],
        message:
          "GitHub Actions output does not support this working directory field",
      });
    }
  });

export type ScheduleType = z.output<typeof scheduleTypeSchema>;
export type ScheduleConfig = z.output<typeof scheduleConfigSchema>;
export type ScheduleConfigInput = z.input<typeof scheduleConfigSchema>;

export function validateScheduleConfig(config: unknown): ValidationResult & {
  data?: ScheduleConfig;
} {
  return validateWithSchema(scheduleConfigSchema, config, "scheduler.config");
}

export function validateSchedulerOutput(
  type: ScheduleType,
  output: string,
): ValidationResult {
  const issues = [];
  if (!output.trim()) {
    issues.push(
      validationError("scheduler.output", "output", "Output is empty"),
    );
  }

  if (type === "cron" && output.trim().split(/\s+/).length < 7) {
    issues.push(
      validationError(
        "scheduler.output",
        "cron",
        "Cron output must include schedule, user, and command",
      ),
    );
  }

  if (type === "github-actions") {
    try {
      const parsed = yaml.load(output) as Record<string, unknown>;
      if (!parsed || typeof parsed !== "object" || !("on" in parsed)) {
        issues.push(
          validationError(
            "scheduler.output",
            "githubActions",
            "GitHub Actions output must include an on.schedule trigger",
          ),
        );
      }
    } catch (error: unknown) {
      issues.push(
        validationError(
          "scheduler.output",
          "githubActions",
          error instanceof Error ? error.message : "Generated workflow YAML is invalid",
          "invalid_yaml",
        ),
      );
    }
  }

  if (
    type === "systemd-timer" &&
    (!output.includes("[Timer]") || !output.includes("[Service]"))
  ) {
    issues.push(
      validationError(
        "scheduler.output",
        "systemd",
        "systemd output must include timer and service units",
      ),
    );
  }

  return issuesToResult(issues);
}
