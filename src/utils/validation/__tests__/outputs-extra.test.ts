import { describe, expect, it } from "vitest";
import { validateComposeOutput } from "../outputs";
import {
  validateCustomYaml,
  validateHomepageOutput,
} from "../config";
import { validateSchedulerOutput } from "../scheduler";

describe("validated output edge cases", () => {
  it("accepts valid compose output and rejects malformed compose output", () => {
    expect(
      validateComposeOutput(
        "compose",
        `services:
  web:
    image: nginx
`,
      ).ok,
    ).toBe(true);

    expect(validateComposeOutput("compose", "services: [").ok).toBe(false);
  });

  it("rejects malformed docker-run, systemd, and komodo output", () => {
    expect(validateComposeOutput("docker-run", "podman run nginx").ok).toBe(
      false,
    );
    expect(validateComposeOutput("systemd", "[Service]\nExecStop=/bin/true").ok)
      .toBe(false);
    expect(
      validateComposeOutput(
        "komodo",
        "# Note: Error parsing configuration: bad yaml",
      ).ok,
    ).toBe(false);
  });

  it("validates successful GitHub Actions scheduler output", () => {
    expect(
      validateSchedulerOutput(
        "github-actions",
        `name: Nightly
on:
  schedule:
    - cron: '0 0 * * *'
jobs:
  scheduled:
    runs-on: ubuntu-latest
    steps:
      - run: echo ok
`,
      ).ok,
    ).toBe(true);
  });

  it("rejects invalid generated config outputs", () => {
    expect(validateCustomYaml("valid: true").ok).toBe(true);
    expect(validateHomepageOutput("services:\n  - Name: Bad\n").ok).toBe(false);
  });
});
