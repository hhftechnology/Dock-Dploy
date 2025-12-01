import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Toggle } from "../../components/ui/toggle";
import type { VolumeConfig } from "../../types/compose";

interface VolumeFormProps {
  volume: VolumeConfig;
  onUpdate: (field: keyof VolumeConfig, value: any) => void;
}

export function VolumeForm({ volume, onUpdate }: VolumeFormProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 border-b border-border/50">
        <div className="h-8 w-1 bg-primary rounded-full"></div>
        <h2 className="font-bold text-lg text-foreground">Volume Configuration</h2>
      </div>

      {/* Basic Settings */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Volume Name</Label>
          <Input
            value={volume.name || ""}
            onChange={(e) => onUpdate("name", e.target.value)}
            placeholder="e.g. app-data"
            className="shadow-sm"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Driver</Label>
          <Input
            value={volume.driver || ""}
            onChange={(e) => onUpdate("driver", e.target.value)}
            placeholder="e.g. local"
            className="shadow-sm"
          />
          <p className="text-xs text-muted-foreground">Default: local</p>
        </div>
      </div>

      {/* Driver Options */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground/90 flex items-center gap-2">
          <div className="h-4 w-0.5 bg-primary/50 rounded-full"></div>
          Driver Options
        </h3>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-sm">Type</Label>
            <Input
              value={volume.driver_opts_type || ""}
              onChange={(e) => onUpdate("driver_opts_type", e.target.value)}
              placeholder="e.g. none, nfs"
              className="shadow-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Device</Label>
            <Input
              value={volume.driver_opts_device || ""}
              onChange={(e) => onUpdate("driver_opts_device", e.target.value)}
              placeholder="e.g. /path/to/device or nfs-server:/path"
              className="shadow-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Mount Options</Label>
            <Input
              value={volume.driver_opts_o || ""}
              onChange={(e) => onUpdate("driver_opts_o", e.target.value)}
              placeholder="e.g. bind, ro"
              className="shadow-sm"
            />
          </div>
        </div>
      </div>
      {/* Labels */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground/90 flex items-center gap-2">
            <div className="h-4 w-0.5 bg-primary/50 rounded-full"></div>
            Labels
          </h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              onUpdate("labels", [
                ...(volume.labels || []),
                { key: "", value: "" },
              ])
            }
            className="h-7 text-xs"
          >
            + Add
          </Button>
        </div>
        <div className="space-y-2">
          {volume.labels && volume.labels.length > 0 ? (
            volume.labels.map((label, idx) => (
              <div key={idx} className="flex gap-2 items-center p-2 bg-muted/30 rounded-md">
                <Input
                  value={label.key}
                  onChange={(e) => {
                    const newLabels = [...(volume.labels || [])];
                    newLabels[idx] = {
                      ...newLabels[idx],
                      key: e.target.value,
                    };
                    onUpdate("labels", newLabels);
                  }}
                  placeholder="Key"
                  className="flex-1 shadow-sm"
                />
                <Input
                  value={label.value}
                  onChange={(e) => {
                    const newLabels = [...(volume.labels || [])];
                    newLabels[idx] = {
                      ...newLabels[idx],
                      value: e.target.value,
                    };
                    onUpdate("labels", newLabels);
                  }}
                  placeholder="Value"
                  className="flex-1 shadow-sm"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    const newLabels = [...(volume.labels || [])];
                    newLabels.splice(idx, 1);
                    onUpdate("labels", newLabels);
                  }}
                  className="h-8 w-8 hover:bg-destructive/20 hover:text-destructive"
                >
                  <svg
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </Button>
              </div>
            ))
          ) : (
            <div className="text-xs text-muted-foreground text-center py-4">
              No labels added
            </div>
          )}
        </div>
      </div>

      {/* External Volume */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground/90 flex items-center gap-2">
          <div className="h-4 w-0.5 bg-primary/50 rounded-full"></div>
          External Volume
        </h3>
        <Toggle
          pressed={!!volume.external}
          onPressedChange={(v) => onUpdate("external", v)}
          aria-label="External"
          className="border rounded-md px-3 py-2 h-auto w-full justify-center data-[state=on]:bg-primary/10 data-[state=on]:border-primary transition-all"
        >
          <span className="select-none text-sm">Use External Volume</span>
        </Toggle>
        {volume.external && (
          <div className="space-y-2 pl-4 border-l-2 border-primary/30">
            <Label className="text-sm font-medium">External Volume Name</Label>
            <Input
              value={volume.name_external || ""}
              onChange={(e) => onUpdate("name_external", e.target.value)}
              placeholder="Existing volume name"
              className="shadow-sm"
            />
            <p className="text-xs text-muted-foreground">Reference an existing volume</p>
          </div>
        )}
      </div>
    </div>
  );
}

