import { describe, expect, it } from "vitest";
import {
  defaultCloudflaredConfig,
  defaultNetbirdConfig,
  defaultNewtConfig,
  defaultTailscaleConfig,
  defaultVPNConfig,
  defaultWireguardConfig,
  defaultZerotierConfig,
} from "../../default-configs";
import { validateVpnConfig, vpnConfigWarning } from "../vpn";

function base() {
  return { ...defaultVPNConfig(), enabled: true };
}

describe("validateVpnConfig", () => {
  it("returns no errors when VPN is disabled", () => {
    expect(validateVpnConfig(defaultVPNConfig())).toEqual([]);
  });

  it("flags tailscale missing auth key", () => {
    const vpn = {
      ...base(),
      type: "tailscale" as const,
      tailscale: defaultTailscaleConfig(),
      servicesUsingVpn: ["web"],
    };
    expect(
      validateVpnConfig(vpn).some((e) => /auth key is required/i.test(e)),
    ).toBe(true);
  });

  it("accepts a tskey-prefixed auth key", () => {
    const ts = defaultTailscaleConfig();
    ts.authKey = "tskey-abc123";
    const vpn = {
      ...base(),
      type: "tailscale" as const,
      tailscale: ts,
      servicesUsingVpn: ["web"],
    };
    expect(validateVpnConfig(vpn)).toEqual([]);
  });

  it("requires a serve target service when serve is enabled", () => {
    const ts = defaultTailscaleConfig();
    ts.authKey = "tskey-abc123";
    ts.enableServe = true;
    const vpn = {
      ...base(),
      type: "tailscale" as const,
      tailscale: ts,
      servicesUsingVpn: ["web"],
    };
    expect(
      validateVpnConfig(vpn).some((e) => /target service/i.test(e)),
    ).toBe(true);
  });

  it("flags missing newt id/secret", () => {
    const vpn = {
      ...base(),
      type: "newt" as const,
      newt: defaultNewtConfig(),
      servicesUsingVpn: ["web"],
    };
    const errs = validateVpnConfig(vpn);
    expect(errs.some((e) => /Newt ID is required/i.test(e))).toBe(true);
    expect(errs.some((e) => /Newt secret is required/i.test(e))).toBe(true);
  });

  it("validates optional newt extras when set", () => {
    const newt = defaultNewtConfig();
    newt.newtId = "${NEWT_ID}";
    newt.newtSecret = "${NEWT_SECRET}";
    newt.port = "70000"; // invalid
    newt.mtu = "200"; // below 576
    newt.dns = "not-an-ip";
    newt.pingInterval = "5"; // missing unit
    newt.healthFile = "relative/path";
    newt.preferEndpoint = "not a url";
    const vpn = {
      ...base(),
      type: "newt" as const,
      newt,
      servicesUsingVpn: ["web"],
    };
    const errs = validateVpnConfig(vpn);
    expect(errs.some((e) => /port/i.test(e))).toBe(true);
    expect(errs.some((e) => /MTU/i.test(e))).toBe(true);
    expect(errs.some((e) => /DNS/i.test(e))).toBe(true);
    expect(errs.some((e) => /ping interval/i.test(e))).toBe(true);
    expect(errs.some((e) => /health file/i.test(e))).toBe(true);
    expect(errs.some((e) => /prefer endpoint/i.test(e))).toBe(true);
  });

  it("accepts a populated newt config with all extras valid", () => {
    const newt = defaultNewtConfig();
    newt.newtId = "${NEWT_ID}";
    newt.newtSecret = "${NEWT_SECRET}";
    newt.port = "34534";
    newt.mtu = "1280";
    newt.dns = "9.9.9.9";
    newt.pingInterval = "3s";
    newt.pingTimeout = "5s";
    newt.healthFile = "/tmp/healthy";
    newt.preferEndpoint = "https://preferred.example.com";
    const vpn = {
      ...base(),
      type: "newt" as const,
      newt,
      servicesUsingVpn: ["web"],
    };
    expect(validateVpnConfig(vpn)).toEqual([]);
  });

  it("flags missing cloudflared tunnel token", () => {
    const vpn = {
      ...base(),
      type: "cloudflared" as const,
      cloudflared: defaultCloudflaredConfig(),
      servicesUsingVpn: ["web"],
    };
    expect(
      validateVpnConfig(vpn).some((e) => /tunnel token/i.test(e)),
    ).toBe(true);
  });

  it("flags missing wireguard config path", () => {
    const wg = defaultWireguardConfig();
    wg.configPath = "";
    const vpn = {
      ...base(),
      type: "wireguard" as const,
      wireguard: wg,
      servicesUsingVpn: ["web"],
    };
    expect(
      validateVpnConfig(vpn).some((e) => /config path is required/i.test(e)),
    ).toBe(true);
  });

  it("flags malformed zerotier network ID", () => {
    const zt = defaultZerotierConfig();
    zt.networkId = "not-hex";
    const vpn = {
      ...base(),
      type: "zerotier" as const,
      zerotier: zt,
      servicesUsingVpn: ["web"],
    };
    expect(
      validateVpnConfig(vpn).some((e) => /ZeroTier network ID/i.test(e)),
    ).toBe(true);
  });

  it("accepts env-ref for zerotier network ID and netbird key", () => {
    const zt = defaultZerotierConfig();
    zt.networkId = "${ZT_NETWORK_ID}";
    const nb = defaultNetbirdConfig();
    nb.setupKey = "${NB_SETUP_KEY}";
    expect(
      validateVpnConfig({
        ...base(),
        type: "zerotier",
        zerotier: zt,
        servicesUsingVpn: ["web"],
      }),
    ).toEqual([]);
    expect(
      validateVpnConfig({
        ...base(),
        type: "netbird",
        netbird: nb,
        servicesUsingVpn: ["web"],
      }),
    ).toEqual([]);
  });

  it("requires at least one routed service", () => {
    const ts = defaultTailscaleConfig();
    ts.authKey = "tskey-abc123";
    const vpn = {
      ...base(),
      type: "tailscale" as const,
      tailscale: ts,
      servicesUsingVpn: [],
    };
    expect(
      validateVpnConfig(vpn).some((e) =>
        /at least one service must be routed/i.test(e),
      ),
    ).toBe(true);
  });

  it("vpnConfigWarning returns first issue or null", () => {
    expect(vpnConfigWarning(defaultVPNConfig())).toBeNull();
    const vpn = {
      ...base(),
      type: "cloudflared" as const,
      cloudflared: defaultCloudflaredConfig(),
      servicesUsingVpn: [],
    };
    expect(vpnConfigWarning(vpn)).toMatch(/tunnel token/i);
  });
});
