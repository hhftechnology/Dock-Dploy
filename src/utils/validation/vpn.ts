// VPN configuration validation.
//
// `vpnConfigWarning(vpn)` returns a single warning string suitable for the
// inline alert in the VPN tab — null if the configuration is complete enough
// to render valid compose output. `validateVpnConfig(vpn)` returns the full
// list for the YAML-validation pipeline.

import type { VPNConfig } from "../../types/vpn-configs";
import { validate } from "./schemas";

function nonEmpty(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function isEnvRef(value: string): boolean {
  return /^\$\{[A-Z_][A-Z0-9_]*\}$/.test(value);
}

function validateTailscale(vpn: VPNConfig, errors: string[]) {
  const cfg = vpn.tailscale;
  if (!cfg) return;
  if (!nonEmpty(cfg.authKey)) {
    errors.push("Tailscale auth key is required");
  } else {
    const err = validate.tailscaleAuthKey(cfg.authKey);
    if (err) errors.push(`Tailscale auth key: ${err}`);
  }
  if (nonEmpty(cfg.hostname)) {
    const err = validate.hostname(cfg.hostname);
    if (err) errors.push(`Tailscale hostname: ${err}`);
  }
  if (nonEmpty(cfg.exitNode)) {
    const err = validate.ipAddress(cfg.exitNode);
    if (err) errors.push(`Tailscale exit node: ${err}`);
  }
  if (cfg.enableServe) {
    if (!nonEmpty(cfg.serveTargetService)) {
      errors.push("Tailscale serve: target service is required");
    }
    if (nonEmpty(cfg.serveExternalPort)) {
      const err = validate.port(cfg.serveExternalPort);
      if (err) errors.push(`Tailscale serve external port: ${err}`);
    }
    if (nonEmpty(cfg.serveInternalPort)) {
      const err = validate.port(cfg.serveInternalPort);
      if (err) errors.push(`Tailscale serve internal port: ${err}`);
    }
  }
}

function validateNewt(vpn: VPNConfig, errors: string[]) {
  const cfg = vpn.newt;
  if (!cfg) return;
  if (!nonEmpty(cfg.newtId)) errors.push("Newt ID is required");
  if (!nonEmpty(cfg.newtSecret)) errors.push("Newt secret is required");
  if (nonEmpty(cfg.endpoint) && !isEnvRef(cfg.endpoint)) {
    const err = validate.url(cfg.endpoint);
    if (err) errors.push(`Newt endpoint: ${err}`);
  }
  // Optional networking fields — only validate when set.
  if (nonEmpty(cfg.port)) {
    const err = validate.port(cfg.port);
    if (err) errors.push(`Newt port: ${err}`);
  }
  if (nonEmpty(cfg.mtu) && (!/^\d+$/.test(cfg.mtu) || Number(cfg.mtu) < 576 || Number(cfg.mtu) > 9000)) {
    errors.push("Newt MTU must be an integer in 576–9000");
  }
  if (nonEmpty(cfg.dns)) {
    const err = validate.ipAddress(cfg.dns);
    if (err) errors.push(`Newt DNS: ${err}`);
  }
  if (nonEmpty(cfg.interfaceName)) {
    const err = validate.networkName(cfg.interfaceName);
    if (err) errors.push(`Newt interface: ${err}`);
  }
  if (nonEmpty(cfg.pingInterval)) {
    const err = validate.duration(cfg.pingInterval);
    if (err) errors.push(`Newt ping interval: ${err}`);
  }
  if (nonEmpty(cfg.pingTimeout)) {
    const err = validate.duration(cfg.pingTimeout);
    if (err) errors.push(`Newt ping timeout: ${err}`);
  }
  if (nonEmpty(cfg.healthFile)) {
    const err = validate.absoluteUnixPath(cfg.healthFile);
    if (err) errors.push(`Newt health file: ${err}`);
  }
  if (nonEmpty(cfg.preferEndpoint) && !isEnvRef(cfg.preferEndpoint)) {
    const err = validate.url(cfg.preferEndpoint);
    if (err) errors.push(`Newt prefer endpoint: ${err}`);
  }
  const validLevels = new Set(["DEBUG", "INFO", "WARN", "ERROR", "FATAL"]);
  if (cfg.logLevel && !validLevels.has(cfg.logLevel)) {
    errors.push("Newt log level must be DEBUG, INFO, WARN, ERROR, or FATAL");
  }
}

function validateCloudflared(vpn: VPNConfig, errors: string[]) {
  const cfg = vpn.cloudflared;
  if (!cfg) return;
  if (!nonEmpty(cfg.tunnelToken)) {
    errors.push("Cloudflared tunnel token is required");
  }
}

function validateWireguard(vpn: VPNConfig, errors: string[]) {
  const cfg = vpn.wireguard;
  if (!cfg) return;
  if (!nonEmpty(cfg.configPath)) {
    errors.push("WireGuard config path is required");
  } else {
    const err = validate.absoluteUnixPath(cfg.configPath);
    if (err) errors.push(`WireGuard config path: ${err}`);
  }
  if (nonEmpty(cfg.interfaceName)) {
    const err = validate.networkName(cfg.interfaceName);
    if (err) errors.push(`WireGuard interface: ${err}`);
  }
}

function validateZerotier(vpn: VPNConfig, errors: string[]) {
  const cfg = vpn.zerotier;
  if (!cfg) return;
  if (!nonEmpty(cfg.networkId)) {
    errors.push("ZeroTier network ID is required");
  } else if (!isEnvRef(cfg.networkId)) {
    const err = validate.zerotierId(cfg.networkId);
    if (err) errors.push(`ZeroTier network ID: ${err}`);
  }
  if (nonEmpty(cfg.identityPath)) {
    const err = validate.absoluteUnixPath(cfg.identityPath);
    if (err) errors.push(`ZeroTier identity path: ${err}`);
  }
}

function validateNetbird(vpn: VPNConfig, errors: string[]) {
  const cfg = vpn.netbird;
  if (!cfg) return;
  if (!nonEmpty(cfg.setupKey)) errors.push("NetBird setup key is required");
  if (nonEmpty(cfg.managementUrl) && !isEnvRef(cfg.managementUrl)) {
    const err = validate.url(cfg.managementUrl);
    if (err) errors.push(`NetBird management URL: ${err}`);
  }
}

export function validateVpnConfig(vpn: VPNConfig): string[] {
  if (!vpn.enabled || !vpn.type) return [];
  const errors: string[] = [];
  switch (vpn.type) {
    case "tailscale":
      validateTailscale(vpn, errors);
      break;
    case "newt":
      validateNewt(vpn, errors);
      break;
    case "cloudflared":
      validateCloudflared(vpn, errors);
      break;
    case "wireguard":
      validateWireguard(vpn, errors);
      break;
    case "zerotier":
      validateZerotier(vpn, errors);
      break;
    case "netbird":
      validateNetbird(vpn, errors);
      break;
  }
  if (vpn.servicesUsingVpn.length === 0) {
    errors.push("At least one service must be routed through the VPN");
  }
  return errors;
}

/** Compact first-error summary for the inline VPN tab warning. */
export function vpnConfigWarning(vpn: VPNConfig): string | null {
  const errors = validateVpnConfig(vpn);
  return errors.length === 0 ? null : errors[0];
}
