import { Plus, Trash2 } from "lucide-react";
import type { NetworkConfig } from "../../../types/compose";

interface NetworksTabProps {
  networks: NetworkConfig[];
  selectedIdx: number | null;
  selectedType: "service" | "network" | "volume";
  onSelectNetwork: (idx: number) => void;
  onAddNetwork: () => void;
  onRemoveNetwork: (idx: number) => void;
}

export function NetworksTab({
  networks,
  selectedIdx,
  selectedType,
  onSelectNetwork,
  onAddNetwork,
  onRemoveNetwork,
}: NetworksTabProps) {
  return (
    <div className="tab-content">
      <div className="tab-actions">
        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={onAddNetwork}
        >
          <Plus size={14} />
          Add Network
        </button>
      </div>
      {networks.length === 0 ? (
        <div className="tab-empty">
          <h3 className="tab-empty-title">No networks</h3>
          <p className="tab-empty-sub">
            Top-level networks let multiple services share a bridge. Defaults are
            usually fine.
          </p>
        </div>
      ) : (
        <div className="service-list">
          {networks.map((n, idx) => {
            const isActive =
              selectedType === "network" && selectedIdx === idx;
            return (
              <div
                key={idx}
                className={"service-row" + (isActive ? " active" : "")}
                onClick={() => onSelectNetwork(idx)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onSelectNetwork(idx);
                }}
              >
                <span className="status-dot ok" aria-hidden />
                <span className="service-row-text">
                  <span className="service-row-name">
                    {n.name?.trim() ? n.name : <em>(unnamed network)</em>}
                  </span>
                  <span className="service-row-meta">
                    {n.driver?.trim() || "default driver"}
                    {n.external ? " · external" : ""}
                    {n.internal ? " · internal" : ""}
                  </span>
                </span>
                <button
                  type="button"
                  className="icon-trash"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveNetwork(idx);
                  }}
                  aria-label={`Remove network ${n.name || idx + 1}`}
                  title="Remove network"
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
