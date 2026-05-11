import { useState } from "react";
import type { NewtLogLevel, VPNConfig } from "../../../types/vpn-configs";
import type { ServiceConfig } from "../../../types/compose";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Field, ValidatedInput } from "../ServiceForm/Field";
import {
  validateAbsoluteUnixPath,
  validateDuration,
  validateHostname,
  validateIpAddress,
  validateNetworkName,
  validatePort,
  validateSecret,
  validateTailscaleAuthKey,
  validateUrl,
  validateZerotierId,
} from "../../../utils/validation";

interface CommonProps {
  vpn: VPNConfig;
  services: ServiceConfig[];
  updateTailscale: (p: Partial<NonNullable<VPNConfig["tailscale"]>>) => void;
  updateNewt: (p: Partial<NonNullable<VPNConfig["newt"]>>) => void;
  updateCloudflared: (p: Partial<NonNullable<VPNConfig["cloudflared"]>>) => void;
  updateWireguard: (p: Partial<NonNullable<VPNConfig["wireguard"]>>) => void;
  updateZerotier: (p: Partial<NonNullable<VPNConfig["zerotier"]>>) => void;
  updateNetbird: (p: Partial<NonNullable<VPNConfig["netbird"]>>) => void;
}

export function VpnFields(p: CommonProps) {
  const { vpn } = p;
  if (!vpn.enabled || !vpn.type) return null;
  switch (vpn.type) {
    case "wireguard":
      return <WireguardFields {...p} />;
    case "tailscale":
      return <TailscaleFields {...p} />;
    case "cloudflared":
      return <CloudflaredFields {...p} />;
    case "newt":
      return <NewtFields {...p} />;
    case "zerotier":
      return <ZerotierFields {...p} />;
    case "netbird":
      return <NetbirdFields {...p} />;
    default:
      return null;
  }
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  // The toggle field anchors the switch to the bottom of the cell so labels
  // that wrap to a second line don't push the switch out of grid alignment.
  return (
    <div className="svc-field svc-field--toggle">
      <span className="field-label">{label}</span>
      <label className="switch">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-label={label}
        />
        <span className="switch-track">
          <span className="switch-thumb" />
        </span>
      </label>
    </div>
  );
}

function WireguardFields({ vpn, updateWireguard }: CommonProps) {
  const cfg = vpn.wireguard;
  if (!cfg) return null;
  return (
    <div className="vpn-fields">
      <div className="vpn-section-label">Connection</div>
      <div className="vpn-field-row">
        <ValidatedInput
          label="Config path"
          hint="Path inside the container to the wg conf file"
          value={cfg.configPath}
          onChange={(v) => updateWireguard({ configPath: v })}
          validate={validateAbsoluteUnixPath}
          placeholder="/etc/wireguard/wg0.conf"
        />
        <ValidatedInput
          label="Interface"
          value={cfg.interfaceName}
          onChange={(v) => updateWireguard({ interfaceName: v })}
          validate={validateNetworkName}
          placeholder="wg0"
        />
      </div>
      <div className="upload-card">
        <span className="upload-icon">⬆</span>
        <div className="upload-text">
          Drop a <code>.conf</code> file into the mounted volume — it will be
          read by the sidecar at startup.
        </div>
      </div>
    </div>
  );
}

function TailscaleFields({ vpn, services, updateTailscale }: CommonProps) {
  const cfg = vpn.tailscale;
  if (!cfg) return null;
  return (
    <div className="vpn-fields">
      <div className="vpn-section-label">Connection</div>
      <ValidatedInput
        label="Auth key"
        hint="Use ${TS_AUTHKEY} to read from .env. Treated as a secret."
        className="input input-secret"
        value={cfg.authKey}
        onChange={(v) => updateTailscale({ authKey: v })}
        validate={validateTailscaleAuthKey}
        placeholder="tskey-..."
      />
      <div className="vpn-field-row">
        <ValidatedInput
          label="Hostname"
          value={cfg.hostname}
          onChange={(v) => updateTailscale({ hostname: v })}
          validate={validateHostname}
          placeholder="edge"
        />
        <ValidatedInput
          label="Exit node"
          value={cfg.exitNode}
          onChange={(v) => updateTailscale({ exitNode: v })}
          validate={validateIpAddress}
          placeholder="100.x.y.z"
        />
      </div>

      <div className="vpn-section-label">Behaviour</div>
      <div className="svc-grid-3">
        <Toggle
          label="Accept DNS"
          checked={cfg.acceptDns}
          onChange={(v) => updateTailscale({ acceptDns: v })}
        />
        <Toggle
          label="Auth once"
          checked={cfg.authOnce}
          onChange={(v) => updateTailscale({ authOnce: v })}
        />
        <Toggle
          label="Userspace networking"
          checked={cfg.userspace}
          onChange={(v) => updateTailscale({ userspace: v })}
        />
      </div>
      {cfg.exitNode && (
        <Toggle
          label="Exit node — allow LAN access"
          checked={cfg.exitNodeAllowLan}
          onChange={(v) => updateTailscale({ exitNodeAllowLan: v })}
        />
      )}

      <div className="vpn-section-label">Serve (HTTPS / TCP)</div>
      <Toggle
        label="Enable serve"
        checked={cfg.enableServe}
        onChange={(v) => updateTailscale({ enableServe: v })}
      />
      {cfg.enableServe && (
        <div className="vpn-serve-grid">
          <Field label="Target service">
            <div className="select">
              <select
                value={cfg.serveTargetService}
                onChange={(e) =>
                  updateTailscale({ serveTargetService: e.target.value })
                }
              >
                <option value="">Select service…</option>
                {services.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
              <span className="select-chev" aria-hidden>
                ▾
              </span>
            </div>
          </Field>
          <div className="svc-grid-2">
            <ValidatedInput
              label="External port"
              value={cfg.serveExternalPort}
              onChange={(v) => updateTailscale({ serveExternalPort: v })}
              validate={(v) => (v ? validatePort(v) : null)}
              placeholder="443"
            />
            <ValidatedInput
              label="Internal port"
              value={cfg.serveInternalPort}
              onChange={(v) => updateTailscale({ serveInternalPort: v })}
              validate={(v) => (v ? validatePort(v) : null)}
              placeholder="8080"
            />
          </div>
          <ValidatedInput
            label="Path"
            value={cfg.servePath}
            onChange={(v) => updateTailscale({ servePath: v })}
            placeholder="/"
          />
          <div className="svc-grid-2">
            <Field label="Protocol">
              <div className="select">
                <select
                  value={cfg.serveProtocol}
                  onChange={(e) =>
                    updateTailscale({
                      serveProtocol: e.target.value as "HTTP" | "HTTPS",
                    })
                  }
                >
                  <option value="HTTPS">HTTPS</option>
                  <option value="HTTP">HTTP</option>
                </select>
                <span className="select-chev" aria-hidden>
                  ▾
                </span>
              </div>
            </Field>
            <Field label="Inside protocol">
              <div className="select">
                <select
                  value={cfg.serveInsideProtocol}
                  onChange={(e) =>
                    updateTailscale({
                      serveInsideProtocol: e.target.value as
                        | "http"
                        | "https"
                        | "https+insecure",
                    })
                  }
                >
                  <option value="http">HTTP</option>
                  <option value="https">HTTPS</option>
                  <option value="https+insecure">HTTPS (insecure)</option>
                </select>
                <span className="select-chev" aria-hidden>
                  ▾
                </span>
              </div>
            </Field>
          </div>
          <ValidatedInput
            label="Cert domain"
            hint="Optional — leave empty to use the Tailscale-issued certificate"
            value={cfg.certDomain}
            onChange={(v) => updateTailscale({ certDomain: v })}
            placeholder="${TS_CERT_DOMAIN}"
          />
        </div>
      )}
    </div>
  );
}

function CloudflaredFields({ vpn, updateCloudflared }: CommonProps) {
  const cfg = vpn.cloudflared;
  if (!cfg) return null;
  return (
    <div className="vpn-fields">
      <div className="vpn-section-label">Connection</div>
      <ValidatedInput
        label="Tunnel token"
        hint="From Cloudflare Zero Trust dashboard"
        className="input input-secret"
        value={cfg.tunnelToken}
        onChange={(v) => updateCloudflared({ tunnelToken: v })}
        validate={validateSecret}
        placeholder="${TUNNEL_TOKEN}"
      />
      <Toggle
        label="No auto-update"
        checked={cfg.noAutoupdate}
        onChange={(v) => updateCloudflared({ noAutoupdate: v })}
      />
    </div>
  );
}

function NewtFields({ vpn, updateNewt }: CommonProps) {
  const cfg = vpn.newt;
  const [advancedOpen, setAdvancedOpen] = useState(false);
  if (!cfg) return null;
  const optionalPort = (v: string) => (v ? validatePort(v) : null);
  const optionalDuration = (v: string) => (v ? validateDuration(v) : null);
  const optionalAbsPath = (v: string) =>
    v ? validateAbsoluteUnixPath(v) : null;
  return (
    <div className="vpn-fields">
      <div className="vpn-section-label">Connection</div>
      <ValidatedInput
        label="Endpoint"
        hint="Pangolin server websocket endpoint"
        value={cfg.endpoint}
        onChange={(v) => updateNewt({ endpoint: v })}
        validate={validateUrl}
        placeholder="https://app.pangolin.net"
      />
      <div className="vpn-field-row">
        <ValidatedInput
          label="Newt ID"
          className="input input-secret"
          value={cfg.newtId}
          onChange={(v) => updateNewt({ newtId: v })}
          validate={validateSecret}
          placeholder="${NEWT_ID}"
        />
        <ValidatedInput
          label="Newt secret"
          className="input input-secret"
          value={cfg.newtSecret}
          onChange={(v) => updateNewt({ newtSecret: v })}
          validate={validateSecret}
          placeholder="${NEWT_SECRET}"
        />
      </div>
      <ValidatedInput
        label="Network name"
        hint="Top-level Docker network the sidecar attaches to"
        value={cfg.networkName}
        onChange={(v) => updateNewt({ networkName: v })}
        validate={validateNetworkName}
        placeholder="newt"
      />

      <div className="vpn-section-label">Site</div>
      <div className="vpn-field-row">
        <ValidatedInput
          label="Site name"
          hint="Optional — Pangolin assigns one if blank. Supports {{env.VAR}}."
          value={cfg.name}
          onChange={(v) => updateNewt({ name: v })}
          placeholder="my-edge-site"
        />
        <ValidatedInput
          label="Region"
          hint="Resource attribute for telemetry"
          value={cfg.region}
          onChange={(v) => updateNewt({ region: v })}
          placeholder="us-west-2"
        />
      </div>
      <ValidatedInput
        label="Provisioning key"
        hint="One-time exchange for site credentials. Persists into the config file."
        className="input input-secret"
        value={cfg.provisioningKey}
        onChange={(v) => updateNewt({ provisioningKey: v })}
        placeholder="${NEWT_PROVISIONING_KEY}"
      />

      <div className="vpn-section-label">Networking</div>
      <div className="svc-grid-3">
        <ValidatedInput
          label="Port"
          hint="Static peer port (default: random)"
          value={cfg.port}
          onChange={(v) => updateNewt({ port: v })}
          validate={optionalPort}
          placeholder="34534"
        />
        <ValidatedInput
          label="MTU"
          hint="Default 1280"
          value={cfg.mtu}
          onChange={(v) => updateNewt({ mtu: v })}
          validate={(v) =>
            !v ? null : /^\d+$/.test(v) && Number(v) >= 576 && Number(v) <= 9000
              ? null
              : "MTU must be 576–9000"
          }
          placeholder="1280"
        />
        <ValidatedInput
          label="DNS"
          hint="Endpoint resolver (default 9.9.9.9)"
          value={cfg.dns}
          onChange={(v) => updateNewt({ dns: v })}
          validate={(v) => (v ? validateIpAddress(v) : null)}
          placeholder="9.9.9.9"
        />
      </div>
      <div className="vpn-field-row">
        <ValidatedInput
          label="Interface name"
          hint="Default newt"
          value={cfg.interfaceName}
          onChange={(v) => updateNewt({ interfaceName: v })}
          validate={(v) => (v ? validateNetworkName(v) : null)}
          placeholder="newt"
        />
        <ValidatedInput
          label="Prefer endpoint"
          hint="Override the server-provided endpoint"
          value={cfg.preferEndpoint}
          onChange={(v) => updateNewt({ preferEndpoint: v })}
          validate={(v) => (v ? validateUrl(v) : null)}
          placeholder="https://preferred.example.com"
        />
      </div>

      <div className="vpn-section-label">Health & telemetry</div>
      <div className="svc-grid-2">
        <ValidatedInput
          label="Ping interval"
          hint="Default 3s"
          value={cfg.pingInterval}
          onChange={(v) => updateNewt({ pingInterval: v })}
          validate={optionalDuration}
          placeholder="3s"
        />
        <ValidatedInput
          label="Ping timeout"
          hint="Default 5s"
          value={cfg.pingTimeout}
          onChange={(v) => updateNewt({ pingTimeout: v })}
          validate={optionalDuration}
          placeholder="5s"
        />
      </div>
      <div className="vpn-field-row">
        <ValidatedInput
          label="Health file"
          hint="Created when connection ok; removed otherwise"
          value={cfg.healthFile}
          onChange={(v) => updateNewt({ healthFile: v })}
          validate={optionalAbsPath}
          placeholder="/tmp/healthy"
        />
        <Field label="Log level">
          <div className="select">
            <select
              value={cfg.logLevel}
              onChange={(e) =>
                updateNewt({ logLevel: e.target.value as NewtLogLevel })
              }
            >
              {(["DEBUG", "INFO", "WARN", "ERROR", "FATAL"] as const).map(
                (l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ),
              )}
            </select>
            <span className="select-chev" aria-hidden>
              ▾
            </span>
          </div>
        </Field>
      </div>
      <div className="svc-grid-3">
        <Toggle
          label="Metrics"
          checked={cfg.metrics}
          onChange={(v) => updateNewt({ metrics: v })}
        />
        <Toggle
          label="OTLP exporter"
          checked={cfg.otlp}
          onChange={(v) => updateNewt({ otlp: v })}
        />
        <Toggle
          label="Enforce HC cert"
          checked={cfg.enforceHcCert}
          onChange={(v) => updateNewt({ enforceHcCert: v })}
        />
      </div>
      <ValidatedInput
        label="Metrics admin address"
        hint="Default 127.0.0.1:2112"
        value={cfg.metricsAdminAddr}
        onChange={(v) => updateNewt({ metricsAdminAddr: v })}
        placeholder="127.0.0.1:2112"
      />

      <button
        type="button"
        className="vpn-advanced-toggle"
        onClick={() => setAdvancedOpen((v) => !v)}
      >
        {advancedOpen ? (
          <ChevronDown size={14} />
        ) : (
          <ChevronRight size={14} />
        )}
        Advanced (provisioning, blueprints, mTLS, Docker integration)
      </button>
      {advancedOpen && (
        <div className="vpn-advanced">
          <div className="vpn-field-row">
            <ValidatedInput
              label="Config file"
              value={cfg.configFile}
              onChange={(v) => updateNewt({ configFile: v })}
              placeholder="/var/newt.json"
            />
            <ValidatedInput
              label="Blueprint file"
              hint="Declarative — keeps reapplying"
              value={cfg.blueprintFile}
              onChange={(v) => updateNewt({ blueprintFile: v })}
              placeholder="/path/to/blueprint.yaml"
            />
          </div>
          <ValidatedInput
            label="Provisioning blueprint file"
            hint="One-time imperative bootstrap"
            value={cfg.provisioningBlueprintFile}
            onChange={(v) => updateNewt({ provisioningBlueprintFile: v })}
            placeholder="/path/to/bootstrap.yaml"
          />
          <div className="vpn-field-row">
            <ValidatedInput
              label="Docker socket"
              value={cfg.dockerSocket}
              onChange={(v) => updateNewt({ dockerSocket: v })}
              placeholder="/var/run/docker.sock"
            />
            <ValidatedInput
              label="Updown script"
              value={cfg.updown}
              onChange={(v) => updateNewt({ updown: v })}
              placeholder="/path/to/updown.sh"
            />
          </div>
          <div className="svc-grid-3">
            <Toggle
              label="Docker network validation"
              checked={cfg.dockerEnforceNetworkValidation}
              onChange={(v) =>
                updateNewt({ dockerEnforceNetworkValidation: v })
              }
            />
            <Toggle
              label="No cloud failover"
              checked={cfg.noCloud}
              onChange={(v) => updateNewt({ noCloud: v })}
            />
            <Toggle
              label="Disable clients"
              checked={cfg.disableClients}
              onChange={(v) => updateNewt({ disableClients: v })}
            />
          </div>
          <div className="vpn-field-row">
            <ValidatedInput
              label="mTLS client cert"
              value={cfg.tlsClientCertFile}
              onChange={(v) => updateNewt({ tlsClientCertFile: v })}
              placeholder="/path/to/client.crt"
            />
            <ValidatedInput
              label="mTLS client key"
              value={cfg.tlsClientKey}
              onChange={(v) => updateNewt({ tlsClientKey: v })}
              placeholder="/path/to/client.key"
            />
          </div>
          <ValidatedInput
            label="mTLS CA"
            value={cfg.tlsClientCa}
            onChange={(v) => updateNewt({ tlsClientCa: v })}
            placeholder="/path/to/ca.crt"
          />
        </div>
      )}
    </div>
  );
}

function ZerotierFields({ vpn, updateZerotier }: CommonProps) {
  const cfg = vpn.zerotier;
  if (!cfg) return null;
  return (
    <div className="vpn-fields">
      <div className="vpn-section-label">Connection</div>
      <Field label="Network ID">
        <input
          className="input input-secret"
          value={cfg.networkId}
          onChange={(e) => updateZerotier({ networkId: e.target.value })}
          placeholder="${ZT_NETWORK_ID}"
          aria-invalid={
            cfg.networkId && validateZerotierId(cfg.networkId)
              ? true
              : undefined
          }
          title={validateZerotierId(cfg.networkId) ?? undefined}
        />
      </Field>
      <ValidatedInput
        label="Identity path"
        value={cfg.identityPath}
        onChange={(v) => updateZerotier({ identityPath: v })}
        validate={validateAbsoluteUnixPath}
        placeholder="/var/lib/zerotier-one"
      />
    </div>
  );
}

function NetbirdFields({ vpn, updateNetbird }: CommonProps) {
  const cfg = vpn.netbird;
  if (!cfg) return null;
  return (
    <div className="vpn-fields">
      <div className="vpn-section-label">Connection</div>
      <ValidatedInput
        label="Setup key"
        className="input input-secret"
        value={cfg.setupKey}
        onChange={(v) => updateNetbird({ setupKey: v })}
        validate={validateSecret}
        placeholder="${NB_SETUP_KEY}"
      />
      <ValidatedInput
        label="Management URL"
        value={cfg.managementUrl}
        onChange={(v) => updateNetbird({ managementUrl: v })}
        validate={validateUrl}
        placeholder="https://api.netbird.io"
      />
    </div>
  );
}
