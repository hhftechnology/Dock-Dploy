import { z } from "zod";

export type ValidationSeverity = "error" | "warning";

export interface ValidationIssue {
  path: string;
  code: string;
  message: string;
  severity: ValidationSeverity;
  source: string;
  suggestedFix?: string;
}

export interface ValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
}

export function validationOk(): ValidationResult {
  return { ok: true, issues: [] };
}

export function validationError(
  source: string,
  path: string,
  message: string,
  code = "invalid_value",
  suggestedFix?: string,
): ValidationIssue {
  return {
    source,
    path,
    message,
    code,
    severity: "error",
    ...(suggestedFix ? { suggestedFix } : {}),
  };
}

export function issuesToResult(issues: ValidationIssue[]): ValidationResult {
  return { ok: issues.length === 0, issues };
}

export function formatValidationIssues(issues: ValidationIssue[]): string {
  return issues
    .map((issue) => {
      const label = issue.path ? `${issue.path}: ` : "";
      return `${label}${issue.message}`;
    })
    .join("; ");
}

export function zodIssuesToValidationIssues(
  error: z.ZodError,
  source: string,
): ValidationIssue[] {
  return error.issues.map((issue) =>
    validationError(
      source,
      issue.path.map(String).join("."),
      issue.message,
      issue.code,
    ),
  );
}

export function validateWithSchema<T>(
  schema: z.ZodType<T>,
  value: unknown,
  source: string,
): ValidationResult & { data?: T } {
  const result = schema.safeParse(value);
  if (result.success) return { ...validationOk(), data: result.data };
  return {
    ok: false,
    issues: zodIssuesToValidationIssues(result.error, source),
  };
}
