import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Separator } from "../ui/separator";
import type { ServiceConfig } from "../../types/compose";
import type { UseTemplateStoreReturn } from "../../hooks/useTemplateStore";
import { TemplateStoreModal } from "../templates/TemplateStoreModal";

interface ServiceListSidebarProps {
  services: ServiceConfig[];
  selectedIdx: number | null;
  selectedType: "service" | "network" | "volume";
  onSelectService: (idx: number) => void;
  onAddService: () => void;
  onRemoveService: (idx: number) => void;
  templateStore: UseTemplateStoreReturn;
}

export function ServiceListSidebar({
  services,
  selectedIdx,
  selectedType,
  onSelectService,
  onAddService,
  onRemoveService,
  templateStore,
}: ServiceListSidebarProps) {
  return (
    <aside className="h-full flex flex-col bg-card p-4 gap-4 overflow-y-auto">
      {/* Header Section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-base text-foreground/90">Services</h2>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {services.filter(s => s.name && s.name.trim()).length}
          </span>
        </div>
        <Button
          size="sm"
          onClick={onAddService}
          className="w-full shadow-sm hover:shadow-md transition-all"
        >
          + Add Service
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => templateStore.setTemplateStoreOpen(true)}
          className="w-full shadow-sm hover:shadow-md transition-all"
        >
          Browse Templates
        </Button>
      </div>

      <Separator />
      {/* Services List */}
      <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
        {services.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="text-muted-foreground text-sm">
              No services yet
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Add a service or browse templates
            </div>
          </div>
        ) : (
          services.map((svc, idx) => (
            <Card
              key={`${svc.name}-${idx}`}
              className={`group relative p-3 cursor-pointer transition-all duration-200 hover:shadow-md ${
                selectedType === "service" && selectedIdx === idx
                  ? "border-primary border-2 bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/50 hover:bg-accent/50"
              }`}
              onClick={() => {
                onSelectService(idx);
              }}
            >
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full flex-shrink-0 ${
                    svc.name && svc.image ? "bg-green-500" : "bg-amber-500"
                  }`} />
                  <div className="font-medium text-sm truncate flex-1">
                    {svc.name || (
                      <span className="text-muted-foreground italic">(unnamed service)</span>
                    )}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground truncate pl-4">
                  {svc.image || <span className="italic">no image specified</span>}
                </div>
                {svc.ports && svc.ports.length > 0 && (
                  <div className="flex items-center gap-1 pl-4 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {svc.ports.length} port{svc.ports.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onRemoveService(idx);
                }}
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-destructive/20 hover:text-destructive transition-all"
                type="button"
                aria-label={`Remove service ${svc.name || "unnamed"}`}
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
            </Card>
          ))
        )}
      </div>

      <TemplateStoreModal
        open={templateStore.templateStoreOpen}
        onOpenChange={templateStore.setTemplateStoreOpen}
        templates={templateStore.templates}
        loading={templateStore.templateLoading}
        error={templateStore.templateError}
        cacheTimestamp={templateStore.templateCacheTimestamp}
        onRefresh={templateStore.refreshTemplateStore}
        onTemplateSelect={async (template) => {
          try {
            const details = await templateStore.fetchTemplateDetails(template.id);
            templateStore.setSelectedTemplate(details);
            templateStore.setTemplateDetailOpen(true);
          } catch (error: any) {
            templateStore.setTemplateError(
              `Failed to load template: ${error.message}`
            );
          }
        }}
      />
    </aside>
  );
}

