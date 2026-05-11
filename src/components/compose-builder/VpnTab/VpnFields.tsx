import type { VPNConfig } from "../../../types/vpn-configs";
import { Field, ValidatedInput } from "../ServiceForm/Field";
import {
  validateAbsoluteUnixPath,
  validateHostname,
  validateIpAddress,
  validateNetworkName,
  validateSecret,
  validateTailscaleAuthKey,
  validateUrl,
  validateZerotierId,
} from "../../../utils/validation";

interface CommonProps {
  vpn: VPNConfig;
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

function TailscaleFields({ vpn, updateTailscale }: CommonProps) {
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
    </div>
  );
}

function NewtFields({ vpn, updateNewt }: CommonProps) {
  const cfg = vpn.newt;
  if (!cfg) return null;
  return (
    <div className="vpn-fields">
      <div className="vpn-section-label">Connection</div>
      <ValidatedInput
        label="Endpoint"
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
        value={cfg.networkName}
        onChange={(v) => updateNewt({ networkName: v })}
        validate={validateNetworkName}
        placeholder="newt"
      />
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
