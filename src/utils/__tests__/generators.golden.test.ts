// Golden tests freeze the byte-for-byte output of every public generator.
// These run BEFORE any decomposition of yaml-generator.ts / converters.ts
// and remain green AFTER decomposition — proving parity.
//
// To regenerate (only when behavior intentionally changes):
//   pnpm test -- -u

import { describe, expect, it } from "vitest";
import { load as parseYaml } from "js-yaml";

import { generateYaml } from "../yaml-generator";
import {
  convertToDockerRun,
  convertToSystemd,
  generateKomodoToml,
  generateEnvFile,
} from "../converters";
import { SCENARIOS } from "../../__tests__/fixtures";

describe("golden / generateYaml", () => {
  for (const sc of SCENARIOS) {
    it(`compose YAML — ${sc.name}`, () => {
      const yaml = generateYaml(sc.services, sc.networks, sc.volumes, sc.vpn);
      expect(yaml).toMatchSnapshot();
      // Sanity: must be parseable YAML
      expect(() => parseYaml(yaml)).not.toThrow();
    });
  }
});

describe("golden / convertToDockerRun", () => {
  for (const sc of SCENARIOS) {
    if (sc.services.length === 0) continue;
    it(`docker run — ${sc.name}`, () => {
      // convertToDockerRun is per-service; snapshot every service
      const out = sc.services.map((s) => `# ${s.name}\n${convertToDockerRun(s)}`).join("\n\n");
      expect(out).toMatchSnapshot();
    });
  }
});

describe("golden / convertToSystemd", () => {
  for (const sc of SCENARIOS) {
    if (sc.services.length === 0) continue;
    it(`systemd — ${sc.name}`, () => {
      const out = sc.services.map((s) => `### ${s.name}.service\n${convertToSystemd(s)}`).join("\n\n");
      expect(out).toMatchSnapshot();
    });
  }
});

describe("golden / generateKomodoToml", () => {
  for (const sc of SCENARIOS) {
    it(`komodo TOML — ${sc.name}`, () => {
      const yaml = generateYaml(sc.services, sc.networks, sc.volumes, sc.vpn);
      const toml = generateKomodoToml(yaml);
      expect(toml).toMatchSnapshot();
    });
  }
});

describe("golden / generateEnvFile", () => {
  for (const sc of SCENARIOS) {
    it(`.env — ${sc.name}`, () => {
      const env = generateEnvFile(sc.services, sc.vpn);
      expect(env).toMatchSnapshot();
    });
  }
});
