import { describe, expect, it } from "vitest";
import { defaultService, defaultVPNConfig } from "../../default-configs";
import {
  createValidatedComposeOutput,
  invalidOutputMessage,
  validateComposeOutput,
} from "../outputs";

describe("validated compose outputs", () => {
  it("blocks conversion output when project validation fails", () => {
    const result = createValidatedComposeOutput("docker-run", {
      services: [{ ...defaultService(), name: "web", image: "" }],
      networks: [],
      volumes: [],
      vpn: defaultVPNConfig(),
    });

    expect(result.ok).toBe(false);
    expect(result.output).toBe("");
    expect(invalidOutputMessage(result)).toMatch(/Validation blocked output/);
  });

  it("allows docker-run output for valid services", () => {
    const result = createValidatedComposeOutput("docker-run", {
      services: [{ ...defaultService(), name: "web", image: "nginx:latest" }],
      networks: [],
      volumes: [],
      vpn: defaultVPNConfig(),
    });

    expect(result.ok).toBe(true);
    expect(result.output).toContain("docker run");
    expect(result.output).toContain("nginx:latest");
  });

  it("rejects redacted output that still leaks sensitive-looking values", () => {
    const result = validateComposeOutput(
      "redact",
      `services:
  web:
    image: nginx
    environment:
      API_TOKEN: abc123
`,
    );

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.path === "redact")).toBe(true);
  });

  it("validates .env placeholder output", () => {
    expect(validateComposeOutput("env", "DATABASE_URL=\nTOKEN=").ok).toBe(true);
    expect(validateComposeOutput("env", "DATABASE_URL=value").ok).toBe(false);
  });
});
