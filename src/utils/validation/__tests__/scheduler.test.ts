import { describe, expect, it } from "vitest";
import {
  isValidCronExpression,
  validateScheduleConfig,
  validateSchedulerOutput,
} from "../scheduler";

describe("scheduler validation", () => {
  it("accepts common five-field cron syntax", () => {
    expect(isValidCronExpression("0 0 * * *")).toBe(true);
    expect(isValidCronExpression("*/15 1-5 * * 1,3,5")).toBe(true);
  });

  it("rejects malformed or out-of-range cron syntax", () => {
    expect(isValidCronExpression("0 24 * * *")).toBe(false);
    expect(isValidCronExpression("0 0 * *")).toBe(false);
    expect(isValidCronExpression("nope")).toBe(false);
  });

  it("rejects invalid schedule fields and unsafe multiline commands", () => {
    const result = validateScheduleConfig({
      type: "cron",
      name: "nightly",
      schedule: "0 0 * * *",
      command: "echo ok\nrm -rf /",
      user: "root",
      workingDir: "/srv/app",
    });

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.path === "command")).toBe(true);
  });

  it("rejects GitHub Actions-only incompatible fields", () => {
    const result = validateScheduleConfig({
      type: "github-actions",
      name: "nightly",
      schedule: "0 0 * * *",
      command: "pnpm test",
      user: "root",
      workingDir: "/srv/app",
    });

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.path === "user")).toBe(true);
    expect(result.issues.some((issue) => issue.path === "workingDir")).toBe(
      true,
    );
  });

  it("validates generated output by target format", () => {
    expect(
      validateSchedulerOutput(
        "systemd-timer",
        "[Timer]\nOnCalendar=*-*-* 00:00:00\n[Service]\nExecStart=/bin/true",
      ).ok,
    ).toBe(true);

    expect(validateSchedulerOutput("systemd-timer", "ExecStart=/bin/true").ok)
      .toBe(false);
  });
});
