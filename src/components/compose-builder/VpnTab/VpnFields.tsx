import type { VPNConfig } from "../../../types/vpn-configs";
import { Field } from "../ServiceForm/Field";

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
        <Field
          label="Config path"
          hint="Path inside the container to the wg conf file"
        >
          <input
            className="input"
            value={cfg.configPath}
            onChange={(e) => updateWireguard({ configPath: e.target.value })}
            placeholder="/etc/wireguard/wg0.conf"
          />
        </Field>
        <Field label="Interface">
          <input
            className="input"
            value={cfg.interfaceName}
            onChange={(e) => updateWireguard({ interfaceName: e.target.value })}
            placeholder="wg0"
          />
        </Field>
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
      <Field
        label="Auth key"
        hint="Use ${TS_AUTHKEY} to read from .env. Treated as a secret."
      >
        <input
          className="input input-secret"
          value={cfg.authKey}
          onChange={(e) => updateTailscale({ authKey: e.target.value })}
          placeholder="tskey-..."
        />
      </Field>
      <div className="vpn-field-row">
        <Field label="Hostname">
          <input
            className="input"
            value={cfg.hostname}
            onChange={(e) => updateTailscale({ hostname: e.target.value })}
            placeholder="edge"
          />
        </Field>
        <Field label="Exit node">
          <input
            className="input"
            value={cfg.exitNode}
            onChange={(e) => updateTailscale({ exitNode: e.target.value })}
            placeholder="100.x.y.z"
          />
        </Field>
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
      <Field label="Tunnel token" hint="From Cloudflare Zero Trust dashboard">
        <input
          className="input input-secret"
          value={cfg.tunnelToken}
          onChange={(e) => updateCloudflared({ tunnelToken: e.target.value })}
          placeholder="${TUNNEL_TOKEN}"
        />
      </Field>
    </div>
  );
}

function NewtFields({ vpn, updateNewt }: CommonProps) {
  const cfg = vpn.newt;
  if (!cfg) return null;
  return (
    <div className="vpn-fields">
      <div className="vpn-section-label">Connection</div>
      <Field label="Endpoint">
        <input
          className="input"
          value={cfg.endpoint}
          onChange={(e) => updateNewt({ endpoint: e.target.value })}
          placeholder="https://app.pangolin.net"
        />
      </Field>
      <div className="vpn-field-row">
        <Field label="Newt ID">
          <input
            className="input input-secret"
            value={cfg.newtId}
            onChange={(e) => updateNewt({ newtId: e.target.value })}
            placeholder="${NEWT_ID}"
          />
        </Field>
        <Field label="Newt secret">
          <input
            className="input input-secret"
            value={cfg.newtSecret}
            onChange={(e) => updateNewt({ newtSecret: e.target.value })}
            placeholder="${NEWT_SECRET}"
          />
        </Field>
      </div>
      <Field label="Network name">
        <input
          className="input"
          value={cfg.networkName}
          onChange={(e) => updateNewt({ networkName: e.target.value })}
          placeholder="newt"
        />
      </Field>
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
        />
      </Field>
      <Field label="Identity path">
        <input
          className="input"
          value={cfg.identityPath}
          onChange={(e) => updateZerotier({ identityPath: e.target.value })}
          placeholder="/var/lib/zerotier-one"
        />
      </Field>
    </div>
  );
}

function NetbirdFields({ vpn, updateNetbird }: CommonProps) {
  const cfg = vpn.netbird;
  if (!cfg) return null;
  return (
    <div className="vpn-fields">
      <div className="vpn-section-label">Connection</div>
      <Field label="Setup key">
        <input
          className="input input-secret"
          value={cfg.setupKey}
          onChange={(e) => updateNetbird({ setupKey: e.target.value })}
          placeholder="${NB_SETUP_KEY}"
        />
      </Field>
      <Field label="Management URL">
        <input
          className="input"
          value={cfg.managementUrl}
          onChange={(e) => updateNetbird({ managementUrl: e.target.value })}
          placeholder="https://api.netbird.io"
        />
      </Field>
    </div>
  );
}
