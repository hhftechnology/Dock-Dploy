import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { Toggle } from "../../components/ui/toggle";
import type { NetworkConfig } from "../../types/compose";

interface NetworkFormProps {
  network: NetworkConfig;
  onUpdate: (field: keyof NetworkConfig, value: any) => void;
}

export function NetworkForm({ network, onUpdate }: NetworkFormProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 border-b border-border/50">
        <div className="h-8 w-1 bg-primary rounded-full"></div>
        <h2 className="font-bold text-lg text-foreground">Network Configuration</h2>
      </div>

      {/* Basic Settings */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Network Name</Label>
          <Input
            value={network.name || ""}
            onChange={(e) => onUpdate("name", e.target.value)}
            placeholder="e.g. frontend-network"
            className="shadow-sm"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Driver</Label>
          <Input
            value={network.driver || ""}
            onChange={(e) => onUpdate("driver", e.target.value)}
            placeholder="e.g. bridge, overlay"
            className="shadow-sm"
          />
          <p className="text-xs text-muted-foreground">Common: bridge (default), overlay, host, none</p>
        </div>
      </div>

      {/* Advanced Options */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground/90 flex items-center gap-2">
          <div className="h-4 w-0.5 bg-primary/50 rounded-full"></div>
          Options
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <Toggle
            pressed={!!network.attachable}
            onPressedChange={(v) => onUpdate("attachable", v)}
            aria-label="Attachable"
            className="border rounded-md px-3 py-2 h-auto justify-center data-[state=on]:bg-primary/10 data-[state=on]:border-primary transition-all"
          >
            <span className="select-none text-sm">Attachable</span>
          </Toggle>

          <Toggle
            pressed={!!network.internal}
            onPressedChange={(v) => onUpdate("internal", v)}
            aria-label="Internal"
            className="border rounded-md px-3 py-2 h-auto justify-center data-[state=on]:bg-primary/10 data-[state=on]:border-primary transition-all"
          >
            <span className="select-none text-sm">Internal</span>
          </Toggle>

          <Toggle
            pressed={!!network.enable_ipv6}
            onPressedChange={(v) => onUpdate("enable_ipv6", v)}
            aria-label="Enable IPv6"
            className="border rounded-md px-3 py-2 h-auto justify-center data-[state=on]:bg-primary/10 data-[state=on]:border-primary transition-all"
          >
            <span className="select-none text-sm">IPv6</span>
          </Toggle>

          <Toggle
            pressed={!!network.external}
            onPressedChange={(v) => onUpdate("external", v)}
            aria-label="External"
            className="border rounded-md px-3 py-2 h-auto justify-center data-[state=on]:bg-primary/10 data-[state=on]:border-primary transition-all"
          >
            <span className="select-none text-sm">External</span>
          </Toggle>
        </div>

        {network.external && (
          <div className="space-y-2 pl-4 border-l-2 border-primary/30">
            <Label className="text-sm font-medium">External Network Name</Label>
            <Input
              value={network.name_external || ""}
              onChange={(e) => onUpdate("name_external", e.target.value)}
              placeholder="Existing network name"
              className="shadow-sm"
            />
            <p className="text-xs text-muted-foreground">Reference an existing network</p>
          </div>
        )}
      </div>

      {/* IPAM Configuration */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground/90 flex items-center gap-2">
          <div className="h-4 w-0.5 bg-primary/50 rounded-full"></div>
          IPAM (IP Address Management)
        </h3>

        <div className="space-y-2">
          <Label className="text-sm font-medium">IPAM Driver</Label>
          <Input
            value={network.ipam?.driver || ""}
            onChange={(e) => {
              const updated = { ...network.ipam, driver: e.target.value };
              onUpdate("ipam", updated);
            }}
            placeholder="default (leave empty for default)"
            className="shadow-sm"
          />
          <p className="text-xs text-muted-foreground">
            Usually leave empty for default driver
          </p>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium">IP Configurations</Label>
          {network.ipam?.config?.map((cfg, idx) => (
            <div key={idx} className="flex gap-2 items-start p-3 border rounded-md bg-card/50">
              <div className="flex-1 space-y-2">
                <Input
                  value={cfg.subnet || ""}
                  onChange={(e) => {
                    const newConfig = [...(network.ipam?.config || [])];
                    newConfig[idx] = { ...newConfig[idx], subnet: e.target.value };
                    onUpdate("ipam", { ...network.ipam, config: newConfig });
                  }}
                  placeholder="Subnet (e.g. 192.168.1.0/24)"
                  className="shadow-sm text-sm"
                />
                <Input
                  value={cfg.gateway || ""}
                  onChange={(e) => {
                    const newConfig = [...(network.ipam?.config || [])];
                    newConfig[idx] = { ...newConfig[idx], gateway: e.target.value };
                    onUpdate("ipam", { ...network.ipam, config: newConfig });
                  }}
                  placeholder="Gateway (e.g. 192.168.1.1)"
                  className="shadow-sm text-sm"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const newConfig = network.ipam?.config?.filter((_, i) => i !== idx) || [];
                  onUpdate("ipam", { ...network.ipam, config: newConfig });
                }}
                className="text-destructive hover:text-destructive/80 p-1.5 rounded hover:bg-destructive/10 transition-colors"
                title="Remove IP config"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              const newConfig = [...(network.ipam?.config || []), { subnet: "", gateway: "" }];
              onUpdate("ipam", { ...network.ipam, config: newConfig });
            }}
            className="w-full py-2 px-3 border border-dashed rounded-md text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
          >
            + Add IP Configuration
          </button>
          <p className="text-xs text-muted-foreground">
            For ipvlan networks, define the subnet and gateway for IP allocation
          </p>
        </div>
      </div>
    </div>
  );
}

