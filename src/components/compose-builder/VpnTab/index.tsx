import type { VPNConfig } from "../../../types/vpn-configs";
import type { NetworkConfig, ServiceConfig } from "../../../types/compose";
import { AlertCircle } from "lucide-react";
import { VpnProviderTiles } from "./VpnProviderTiles";
import { VpnFields } from "./VpnFields";
import { vpnConfigWarning } from "../../../utils/validation/vpn";

export interface VpnTabProps {
  vpn: VPNConfig;
  services: ServiceConfig[];
  networks: NetworkConfig[];
  updateVpnType: (next: VPNConfig["type"] | "none") => void;
  updateTailscaleConfig: (
    p: Partial<NonNullable<VPNConfig["tailscale"]>>,
  ) => void;
  updateNewtConfig: (p: Partial<NonNullable<VPNConfig["newt"]>>) => void;
  updateCloudflaredConfig: (
    p: Partial<NonNullable<VPNConfig["cloudflared"]>>,
  ) => void;
  updateWireguardConfig: (
    p: Partial<NonNullable<VPNConfig["wireguard"]>>,
  ) => void;
  updateZerotierConfig: (
    p: Partial<NonNullable<VPNConfig["zerotier"]>>,
  ) => void;
  updateNetbirdConfig: (
    p: Partial<NonNullable<VPNConfig["netbird"]>>,
  ) => void;
  updateServicesUsingVpn: (services: string[]) => void;
  updateVpnNetworks: (networks: string[]) => void;
}

export function VpnTab(props: VpnTabProps) {
  const {
    vpn,
    services,
    networks,
    updateVpnType,
    updateTailscaleConfig,
    updateNewtConfig,
    updateCloudflaredConfig,
    updateWireguardConfig,
    updateZerotierConfig,
    updateNetbirdConfig,
    updateServicesUsingVpn,
    updateVpnNetworks,
  } = props;

  const statusLabel = vpn.enabled && vpn.type ? "Connected" : "Disabled";
  const statusSub =
    vpn.enabled && vpn.type
      ? `Sidecar: ${vpn.type}`
      : "Pick a provider to add a VPN sidecar to the stack.";

  const toggleService = (name: string) => {
    const current = new Set(vpn.servicesUsingVpn);
    if (current.has(name)) current.delete(name);
    else current.add(name);
    updateServicesUsingVpn(Array.from(current));
  };

  const toggleNetwork = (name: string) => {
    const current = new Set(vpn.networks ?? []);
    if (current.has(name)) current.delete(name);
    else current.add(name);
    updateVpnNetworks(Array.from(current));
  };

  const namedServices = services.filter((s) => s.name?.trim());
  const namedNetworks = networks.filter((n) => n.name?.trim());
  const warning = vpn.enabled && vpn.type ? vpnConfigWarning(vpn) : null;

  return (
    <div className="tab-content vpn-tab">
      {/* Status card */}
      <div className="vpn-status">
        <div className="vpn-status-row">
          <span
            className={
              "status-dot " + (vpn.enabled && vpn.type ? "ok" : "muted")
            }
            aria-hidden
          />
          <div>
            <div className="vpn-status-label">{statusLabel}</div>
            <div className="vpn-status-sub">{statusSub}</div>
          </div>
          <label className="switch" title="Enable / disable VPN sidecar">
            <input
              type="checkbox"
              checked={!!(vpn.enabled && vpn.type)}
              onChange={(e) => {
                if (!e.target.checked) updateVpnType("none");
                else if (!vpn.type) updateVpnType("wireguard");
              }}
            />
            <span className="switch-track">
              <span className="switch-thumb" />
            </span>
          </label>
        </div>
      </div>

      <div className="vpn-section-label">Provider</div>
      <VpnProviderTiles value={vpn.type} onChange={updateVpnType} />

      <VpnFields
        vpn={vpn}
        services={namedServices}
        updateTailscale={updateTailscaleConfig}
        updateNewt={updateNewtConfig}
        updateCloudflared={updateCloudflaredConfig}
        updateWireguard={updateWireguardConfig}
        updateZerotier={updateZerotierConfig}
        updateNetbird={updateNetbirdConfig}
      />

      {warning && (
        <div className="vpn-warning" role="alert">
          <AlertCircle size={14} />
          <div>
            <strong>Configuration warning</strong>
            <p>{warning}</p>
          </div>
        </div>
      )}

      {vpn.enabled && vpn.type && (
        <>
          <div className="vpn-section-label">Services using VPN</div>
          <div className="vpn-routing">
            {namedServices.length === 0 ? (
              <p className="vpn-hint">Add services first.</p>
            ) : (
              namedServices.map((svc) => (
                <label className="check-row" key={svc.name}>
                  <input
                    type="checkbox"
                    checked={vpn.servicesUsingVpn.includes(svc.name)}
                    onChange={() => toggleService(svc.name)}
                  />
                  <span>
                    <span className="check-title">Route {svc.name} through VPN</span>
                    <span className="check-sub">
                      {vpn.type === "tailscale" || vpn.type === "cloudflared" ? (
                        <>
                          Adds <code>network_mode: service:{vpn.type}</code>
                        </>
                      ) : (
                        <>Attaches the VPN network to this service</>
                      )}
                    </span>
                  </span>
                </label>
              ))
            )}
          </div>

          <div className="vpn-section-label">Attach to networks</div>
          <div className="vpn-routing">
            {namedNetworks.length === 0 ? (
              <p className="vpn-hint">Add top-level networks first.</p>
            ) : (
              namedNetworks.map((net) => (
                <label className="check-row" key={net.name}>
                  <input
                    type="checkbox"
                    checked={(vpn.networks ?? []).includes(net.name)}
                    onChange={() => toggleNetwork(net.name)}
                  />
                  <span>
                    <span className="check-title">{net.name}</span>
                    <span className="check-sub">
                      The VPN sidecar joins this user-defined network.
                    </span>
                  </span>
                </label>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
