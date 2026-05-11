import { useState } from "react";
import type { NetworkConfig, ServiceConfig, VolumeConfig } from "../../../types/compose";
import type { VPNConfig } from "../../../types/vpn-configs";
import { ServicesTab } from "./ServicesTab";
import { NetworksTab } from "./NetworksTab";
import { VolumesTab } from "./VolumesTab";
import { VpnTab, type VpnTabProps } from "../VpnTab";

type TabId = "services" | "networks" | "volumes" | "vpn";

export interface ConfigColumnProps {
  services: ServiceConfig[];
  networks: NetworkConfig[];
  volumes: VolumeConfig[];
  vpn: VPNConfig;

  selectedIdx: number | null;
  selectedType: "service" | "network" | "volume";

  onSelectService: (idx: number) => void;
  onAddService: () => void;
  onBrowseTemplates: () => void;
  onRemoveService: (idx: number) => void;

  onSelectNetwork: (idx: number) => void;
  onAddNetwork: () => void;
  onRemoveNetwork: (idx: number) => void;

  onSelectVolume: (idx: number) => void;
  onAddVolume: () => void;
  onRemoveVolume: (idx: number) => void;

  vpnApi: Omit<VpnTabProps, "vpn" | "services">;
}

export function ConfigColumn(props: ConfigColumnProps) {
  const [tab, setTab] = useState<TabId>("services");

  const counts: Record<TabId, number> = {
    services: props.services.length,
    networks: props.networks.length,
    volumes: props.volumes.length,
    vpn: props.vpn.enabled && props.vpn.type ? 1 : 0,
  };

  return (
    <section className="config-col">
      <div className="col-head">
        <h2 className="col-head-title">
          <span className="col-bar" aria-hidden />
          Configuration
        </h2>
      </div>

      <div className="config-tabs">
        <TabButton
          id="services"
          label="Services"
          count={counts.services}
          active={tab}
          onClick={setTab}
        />
        <TabButton
          id="networks"
          label="Networks"
          count={counts.networks}
          active={tab}
          onClick={setTab}
        />
        <TabButton
          id="volumes"
          label="Volumes"
          count={counts.volumes}
          active={tab}
          onClick={setTab}
        />
        <TabButton id="vpn" label="VPN" active={tab} onClick={setTab} />
      </div>

      <div className="config-tab-body">
        {tab === "services" && (
          <ServicesTab
            services={props.services}
            selectedIdx={props.selectedIdx}
            selectedType={props.selectedType}
            onSelectService={props.onSelectService}
            onAddService={props.onAddService}
            onBrowseTemplates={props.onBrowseTemplates}
            onRemoveService={props.onRemoveService}
          />
        )}
        {tab === "networks" && (
          <NetworksTab
            networks={props.networks}
            selectedIdx={props.selectedIdx}
            selectedType={props.selectedType}
            onSelectNetwork={props.onSelectNetwork}
            onAddNetwork={props.onAddNetwork}
            onRemoveNetwork={props.onRemoveNetwork}
          />
        )}
        {tab === "volumes" && (
          <VolumesTab
            volumes={props.volumes}
            selectedIdx={props.selectedIdx}
            selectedType={props.selectedType}
            onSelectVolume={props.onSelectVolume}
            onAddVolume={props.onAddVolume}
            onRemoveVolume={props.onRemoveVolume}
          />
        )}
        {tab === "vpn" && (
          <VpnTab vpn={props.vpn} services={props.services} {...props.vpnApi} />
        )}
      </div>
    </section>
  );
}

function TabButton({
  id,
  label,
  count,
  active,
  onClick,
}: {
  id: TabId;
  label: string;
  count?: number;
  active: TabId;
  onClick: (next: TabId) => void;
}) {
  return (
    <button
      type="button"
      className={"config-tab" + (active === id ? " active" : "")}
      onClick={() => onClick(id)}
    >
      {label}
      {typeof count === "number" && count > 0 && (
        <span className="tab-count">{count}</span>
      )}
    </button>
  );
}
