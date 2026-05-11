import { describe, expect, it } from "vitest";
import {
  redactSensitiveData,
  validateContainerName,
  validateCpuValue,
  validateDuration,
  validateEnvVarKey,
  validateExtraHost,
  validateHostname,
  validateImage,
  validateIpAddress,
  validateIpv4Cidr,
  validateMemoryValue,
  validateNetworkDriver,
  validateNetworkMode,
  validateNetworks,
  validatePort,
  validateServiceName,
  validateServices,
  validateStopSignal,
  validateUser,
  validateVolumes,
} from "../validation";
import {
  defaultNetwork,
  defaultService,
  defaultVolume,
} from "../default-configs";

describe("validateServiceName", () => {
  it("rejects empty", () => {
    expect(validateServiceName("")).toBeTruthy();
  });
  it("accepts alphanumeric / hyphen / underscore / dot", () => {
    expect(validateServiceName("web-app_01")).toBeNull();
    expect(validateServiceName("web.app")).toBeNull();
  });
  it("rejects special characters", () => {
    expect(validateServiceName("web@app")).toBeTruthy();
    expect(validateServiceName("web app")).toBeTruthy();
  });
  it("rejects names starting with non-alphanumeric", () => {
    expect(validateServiceName("-web")).toBeTruthy();
    expect(validateServiceName(".web")).toBeTruthy();
  });
});

describe("validatePort", () => {
  it("accepts empty (port optional)", () => {
    expect(validatePort("")).toBeNull();
  });
  it("accepts valid port", () => {
    expect(validatePort("8080")).toBeNull();
    expect(validatePort("1")).toBeNull();
    expect(validatePort("65535")).toBeNull();
  });
  it("rejects out-of-range", () => {
    expect(validatePort("0")).toBeTruthy();
    expect(validatePort("65536")).toBeTruthy();
    expect(validatePort("-1")).toBeTruthy();
  });
});

describe("validateEnvVarKey", () => {
  it("accepts well-formed names", () => {
    expect(validateEnvVarKey("NODE_ENV")).toBeNull();
    expect(validateEnvVarKey("_PRIVATE")).toBeNull();
    expect(validateEnvVarKey("DATABASE_URL_2")).toBeNull();
  });
  it("rejects names starting with digit", () => {
    expect(validateEnvVarKey("2NODE")).toBeTruthy();
  });
  it("rejects hyphens/spaces", () => {
    expect(validateEnvVarKey("NODE-ENV")).toBeTruthy();
    expect(validateEnvVarKey("NODE ENV")).toBeTruthy();
  });
});

describe("validateCpuValue", () => {
  it("accepts decimals", () => {
    expect(validateCpuValue("0.5")).toBeNull();
    expect(validateCpuValue("1")).toBeNull();
    expect(validateCpuValue("2.25")).toBeNull();
  });
  it("rejects non-numeric", () => {
    expect(validateCpuValue("half")).toBeTruthy();
  });
});

describe("validateMemoryValue", () => {
  it("accepts unit suffixes", () => {
    expect(validateMemoryValue("512m")).toBeNull();
    expect(validateMemoryValue("2g")).toBeNull();
    expect(validateMemoryValue("1024")).toBeNull();
    expect(validateMemoryValue("256M")).toBeNull();
    expect(validateMemoryValue("100kb")).toBeNull();
  });
  it("rejects bogus units", () => {
    expect(validateMemoryValue("512xx")).toBeTruthy();
  });
});

describe("validateImage", () => {
  it("accepts common image references", () => {
    expect(validateImage("nginx")).toBeNull();
    expect(validateImage("nginx:latest")).toBeNull();
    expect(validateImage("nginx:1.25.3-alpine")).toBeNull();
    expect(validateImage("library/redis:7")).toBeNull();
    expect(validateImage("ghcr.io/user/app:v1.2.3")).toBeNull();
    expect(validateImage("registry.example.com:5000/team/app:tag")).toBeNull();
    expect(
      validateImage(
        "nginx@sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      ),
    ).toBeNull();
  });
  it("rejects whitespace / uppercase", () => {
    expect(validateImage("Foo Bar:latest")).toBeTruthy();
    expect(validateImage("")).toBeTruthy();
  });
});

describe("validateContainerName", () => {
  it("accepts empty (optional)", () => {
    expect(validateContainerName("")).toBeNull();
  });
  it("rejects names with spaces", () => {
    expect(validateContainerName("my container")).toBeTruthy();
  });
  it("accepts dot/dash/underscore", () => {
    expect(validateContainerName("my-app_01")).toBeNull();
    expect(validateContainerName("my.app")).toBeNull();
  });
});

describe("validateHostname", () => {
  it("accepts RFC 1123 labels", () => {
    expect(validateHostname("my-host")).toBeNull();
    expect(validateHostname("h0st1")).toBeNull();
  });
  it("rejects bad starts / underscores", () => {
    expect(validateHostname("-bad")).toBeTruthy();
    expect(validateHostname("my_host")).toBeTruthy();
  });
});

describe("validateUser", () => {
  it("accepts uid, uid:gid, name, name:group", () => {
    expect(validateUser("")).toBeNull();
    expect(validateUser("1000")).toBeNull();
    expect(validateUser("1000:1000")).toBeNull();
    expect(validateUser("appuser")).toBeNull();
    expect(validateUser("appuser:appgroup")).toBeNull();
  });
  it("rejects spaces / @", () => {
    expect(validateUser("foo@bar")).toBeTruthy();
    expect(validateUser("1 2")).toBeTruthy();
  });
});

describe("validateDuration", () => {
  it("accepts compose-spec durations", () => {
    expect(validateDuration("30s")).toBeNull();
    expect(validateDuration("500ms")).toBeNull();
    expect(validateDuration("1h30m")).toBeNull();
    expect(validateDuration("2m")).toBeNull();
  });
  it("rejects bare numbers / wrong units", () => {
    expect(validateDuration("30")).toBeTruthy();
    expect(validateDuration("30sec")).toBeTruthy();
  });
});

describe("validateStopSignal", () => {
  it("accepts SIGFOO or numbers", () => {
    expect(validateStopSignal("SIGTERM")).toBeNull();
    expect(validateStopSignal("SIGKILL")).toBeNull();
    expect(validateStopSignal("9")).toBeNull();
  });
  it("rejects garbage", () => {
    expect(validateStopSignal("term")).toBeTruthy();
  });
});

describe("validateNetworkMode", () => {
  it("accepts known modes", () => {
    expect(validateNetworkMode("")).toBeNull();
    expect(validateNetworkMode("host")).toBeNull();
    expect(validateNetworkMode("none")).toBeNull();
    expect(validateNetworkMode("bridge")).toBeNull();
    expect(validateNetworkMode("service:db")).toBeNull();
    expect(validateNetworkMode("container:other")).toBeNull();
  });
  it("rejects unknown modes", () => {
    expect(validateNetworkMode("hostly")).toBeTruthy();
  });
});

describe("validateNetworkDriver", () => {
  it("accepts known drivers", () => {
    expect(validateNetworkDriver("bridge")).toBeNull();
    expect(validateNetworkDriver("overlay")).toBeNull();
  });
  it("rejects unknown drivers", () => {
    expect(validateNetworkDriver("flannel")).toBeTruthy();
  });
});

describe("validateIpAddress / validateIpv4Cidr", () => {
  it("validates IPv4", () => {
    expect(validateIpAddress("1.1.1.1")).toBeNull();
    expect(validateIpAddress("256.0.0.1")).toBeTruthy();
  });
  it("validates IPv6 (loosely)", () => {
    expect(validateIpAddress("2001:db8::1")).toBeNull();
  });
  it("validates IPv4 CIDR", () => {
    expect(validateIpv4Cidr("10.0.0.0/16")).toBeNull();
    expect(validateIpv4Cidr("10.0.0.0/33")).toBeTruthy();
    expect(validateIpv4Cidr("10.0.0.0")).toBeTruthy();
  });
});

describe("validateExtraHost", () => {
  it("accepts host:ip pairs", () => {
    expect(validateExtraHost("api.local:192.168.1.10")).toBeNull();
  });
  it("rejects missing IP", () => {
    expect(validateExtraHost("api.local")).toBeTruthy();
  });
});

describe("validateServices", () => {
  it("returns errors for an empty service", () => {
    const errors = validateServices([defaultService()]);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("returns no errors for a valid service", () => {
    const svc = { ...defaultService(), name: "web", image: "nginx:latest" };
    const errors = validateServices([svc]);
    expect(errors).toEqual([]);
  });

  it("flags invalid image format", () => {
    const svc = {
      ...defaultService(),
      name: "web",
      image: "Foo Bar:latest",
    };
    const errors = validateServices([svc]);
    expect(errors.some((e) => /Image/i.test(e) || /reference/i.test(e))).toBe(
      true,
    );
  });

  it("flags out-of-range ports", () => {
    const svc = {
      ...defaultService(),
      name: "web",
      image: "nginx",
      ports: [{ host: "999999", container: "80", protocol: "tcp" }],
    };
    const errors = validateServices([svc]);
    expect(errors.some((e) => /port/i.test(e))).toBe(true);
  });

  it("flags duplicate service names", () => {
    const a = { ...defaultService(), name: "web", image: "nginx" };
    const b = { ...defaultService(), name: "web", image: "nginx" };
    const errors = validateServices([a, b]);
    expect(errors.some((e) => /Duplicate/i.test(e))).toBe(true);
  });

  it("flags invalid healthcheck duration", () => {
    const svc = {
      ...defaultService(),
      name: "web",
      image: "nginx",
      healthcheck: {
        test: "curl -f http://localhost/",
        interval: "30sec",
        timeout: "",
        retries: "",
        start_period: "",
        start_interval: "",
      },
    };
    const errors = validateServices([svc]);
    expect(errors.some((e) => /healthcheck.interval/i.test(e))).toBe(true);
  });
});

describe("validateNetworks", () => {
  it("flags invalid CIDR and unknown driver", () => {
    const net = {
      ...defaultNetwork(),
      name: "frontend",
      driver: "flannel",
      ipam: {
        ...defaultNetwork().ipam,
        config: [{ subnet: "not-a-cidr", gateway: "1.1.1.1" }],
      },
    };
    const errors = validateNetworks([net]);
    expect(errors.some((e) => /driver/i.test(e))).toBe(true);
    expect(errors.some((e) => /subnet|CIDR/i.test(e))).toBe(true);
  });
});

describe("validateVolumes", () => {
  it("flags empty name", () => {
    const errors = validateVolumes([defaultVolume()]);
    expect(errors.some((e) => /Name is required/i.test(e))).toBe(true);
  });
});

describe("redactSensitiveData", () => {
  it("redacts values for sensitive-looking keys", () => {
    const yaml = `
services:
  web:
    environment:
      - DATABASE_PASSWORD=hunter2
      - API_TOKEN=abc123
      - PUBLIC_URL=https://example.com
`;
    const out = redactSensitiveData(yaml);
    expect(out).not.toContain("hunter2");
    expect(out).not.toContain("abc123");
    // Non-sensitive values pass through
    expect(out).toContain("PUBLIC_URL");
  });
});
