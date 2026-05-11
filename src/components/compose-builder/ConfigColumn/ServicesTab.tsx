import { ChevronRight, Plus, Trash2 } from "lucide-react";
import type { ServiceConfig } from "../../../types/compose";

interface ServicesTabProps {
  services: ServiceConfig[];
  selectedIdx: number | null;
  selectedType: "service" | "network" | "volume";
  onSelectService: (idx: number) => void;
  onAddService: () => void;
  onBrowseTemplates: () => void;
  onRemoveService: (idx: number) => void;
}

export function ServicesTab({
  services,
  selectedIdx,
  selectedType,
  onSelectService,
  onAddService,
  onBrowseTemplates,
  onRemoveService,
}: ServicesTabProps) {
  return (
    <div className="tab-content">
      <div className="tab-actions">
        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={onAddService}
        >
          <Plus size={14} />
          Add Service
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-block"
          onClick={onBrowseTemplates}
        >
          Browse Templates
        </button>
      </div>

      {services.length === 0 ? (
        <div className="tab-empty">
          <h3 className="tab-empty-title">No services yet</h3>
          <p className="tab-empty-sub">
            Click "Add Service" to start, or import from a template.
          </p>
        </div>
      ) : (
        <div className="service-list">
          {services.map((svc, idx) => {
            const isActive =
              selectedType === "service" && selectedIdx === idx;
            const displayName = svc.name?.trim() || "";
            const imageName = svc.image?.trim() || "";
            const meta = imageName || "no image specified";
            // Unnamed-and-imageless rows are the placeholder slot; the user
            // can't usefully delete it (we'd just regenerate one). Hide the
            // trash icon to keep that affordance honest.
            const showTrash = Boolean(displayName || imageName);
            return (
              <div
                key={idx}
                className={"service-row" + (isActive ? " active" : "")}
                onClick={() => onSelectService(idx)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onSelectService(idx);
                }}
              >
                <span
                  className={
                    "status-dot " +
                    (svc.name && svc.image ? "ok" : "warn")
                  }
                  aria-hidden
                />
                <span className="service-row-text">
                  <span className="service-row-name">
                    {displayName ? (
                      displayName
                    ) : (
                      <em>(unnamed service)</em>
                    )}
                  </span>
                  <span className="service-row-meta">{meta}</span>
                </span>
                <div className="flex items-center gap-2">
                  {showTrash && (
                    <button
                      type="button"
                      className="icon-trash"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveService(idx);
                      }}
                      aria-label={`Remove service ${displayName || idx + 1}`}
                      title="Remove service"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  <ChevronRight size={16} className="service-row-chev" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
