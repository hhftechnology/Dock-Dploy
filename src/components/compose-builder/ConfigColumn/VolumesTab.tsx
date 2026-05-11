import { Plus, Trash2 } from "lucide-react";
import type { VolumeConfig } from "../../../types/compose";

interface VolumesTabProps {
  volumes: VolumeConfig[];
  selectedIdx: number | null;
  selectedType: "service" | "network" | "volume";
  onSelectVolume: (idx: number) => void;
  onAddVolume: () => void;
  onRemoveVolume: (idx: number) => void;
}

export function VolumesTab({
  volumes,
  selectedIdx,
  selectedType,
  onSelectVolume,
  onAddVolume,
  onRemoveVolume,
}: VolumesTabProps) {
  return (
    <div className="tab-content">
      <div className="tab-actions">
        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={onAddVolume}
        >
          <Plus size={14} />
          Add Volume
        </button>
      </div>
      {volumes.length === 0 ? (
        <div className="tab-empty">
          <h3 className="tab-empty-title">No named volumes</h3>
          <p className="tab-empty-sub">
            Named volumes survive container restarts and are shared across
            services.
          </p>
        </div>
      ) : (
        <div className="service-list">
          {volumes.map((v, idx) => {
            const isActive =
              selectedType === "volume" && selectedIdx === idx;
            return (
              <div
                key={idx}
                className={"service-row" + (isActive ? " active" : "")}
                onClick={() => onSelectVolume(idx)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onSelectVolume(idx);
                }}
              >
                <span className="status-dot ok" aria-hidden />
                <span className="service-row-text">
                  <span className="service-row-name">
                    {v.name?.trim() ? v.name : <em>(unnamed volume)</em>}
                  </span>
                  <span className="service-row-meta">
                    {v.driver?.trim() || "local"}
                    {v.external ? " · external" : ""}
                  </span>
                </span>
                <button
                  type="button"
                  className="icon-trash"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveVolume(idx);
                  }}
                  aria-label={`Remove volume ${v.name || idx + 1}`}
                  title="Remove volume"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
