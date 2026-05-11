import type { VPNConfig } from "../../../types/vpn-configs";
import type { ServiceConfig } from "../../../types/compose";
import { VpnProviderTiles } from "./VpnProviderTiles";
import { VpnFields } from "./VpnFields";

export interface VpnTabProps {
  vpn: VPNConfig;
  services: ServiceConfig[];
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
}

export function VpnTab(props: VpnTabProps) {
  const {
    vpn,
    services,
    updateVpnType,
    updateTailscaleConfig,
    updateNewtConfig,
    updateCloudflaredConfig,
    updateWireguardConfig,
    updateZerotierConfig,
    updateNetbirdConfig,
    updateServicesUsingVpn,
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
        updateTailscale={updateTailscaleConfig}
        updateNewt={updateNewtConfig}
        updateCloudflared={updateCloudflaredConfig}
        updateWireguard={updateWireguardConfig}
        updateZerotier={updateZerotierConfig}
        updateNetbird={updateNetbirdConfig}
      />

      {vpn.enabled && vpn.type && services.length > 0 && (
        <>
          <div className="vpn-section-label">Routing</div>
          <div className="vpn-routing">
            {services.map((svc) =>
              svc.name?.trim() ? (
                <label className="check-row" key={svc.name}>
                  <input
                    type="checkbox"
                    checked={vpn.servicesUsingVpn.includes(svc.name)}
                    onChange={() => toggleService(svc.name)}
                  />
                  <span>
                    <span className="check-title">Route {svc.name} through VPN</span>
                    <span className="check-sub">
                      Adds <code>network_mode: service:{vpn.type}</code> or attaches
                      the VPN network.
                    </span>
                  </span>
                </label>
              ) : null,
            )}
          </div>
        </>
      )}
    </div>
  );
}
