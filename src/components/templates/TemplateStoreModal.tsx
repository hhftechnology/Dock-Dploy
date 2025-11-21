import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { EmptyState } from "../ui/empty-state";
import { Skeleton } from "../ui/skeleton";
import { RefreshCw, Package, AlertCircle } from "lucide-react";
import { TemplateCard } from "./TemplateCard";

export interface Template {
  id: string;
  name: string;
  description?: string;
  version?: string;
  logo?: string;
  tags?: string[];
}

export interface TemplateStoreModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: Template[];
  loading?: boolean;
  error?: string | null;
  cacheTimestamp?: number | null;
  onRefresh: () => void;
  onTemplateSelect: (template: Template) => void;
}

export function TemplateStoreModal({
  open,
  onOpenChange,
  templates,
  loading = false,
  error = null,
  cacheTimestamp,
  onRefresh,
  onTemplateSelect,
}: TemplateStoreModalProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTemplates = templates.filter(
    (template) =>
      template.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags?.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 space-y-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold">
                Template Marketplace
              </DialogTitle>
              <DialogDescription className="text-base mt-1.5">
                Browse and import pre-configured Docker Compose templates.
              </DialogDescription>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <span>
                  Templates from{" "}
                  <a
                    href="https://github.com/Dokploy/templates"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Dokploy/templates
                  </a>
                </span>
                {cacheTimestamp && (
                  <>
                    <span>•</span>
                    <span>
                      Cached{" "}
                      {Math.round((Date.now() - cacheTimestamp) / 60000)}m ago
                    </span>
                  </>
                )}
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={onRefresh}
              disabled={loading}
              className="flex-shrink-0"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>

          {/* Search Bar */}
          <div className="pt-2">
            <Input
              placeholder="Search templates by name, description, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10"
            />
          </div>
        </DialogHeader>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {loading ? (
            <TemplateGridSkeleton />
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <EmptyState
                icon={AlertCircle}
                title="Failed to load templates"
                description={error}
                action={{
                  label: "Try Again",
                  onClick: onRefresh,
                }}
              />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <EmptyState
                icon={Package}
                title={
                  searchQuery
                    ? "No templates found"
                    : "No templates available"
                }
                description={
                  searchQuery
                    ? `No templates match "${searchQuery}". Try a different search term.`
                    : "Templates will appear here once loaded."
                }
                action={
                  searchQuery
                    ? {
                        label: "Clear Search",
                        onClick: () => setSearchQuery(""),
                      }
                    : {
                        label: "Refresh",
                        onClick: onRefresh,
                      }
                }
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 py-4">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  {...template}
                  logo={
                    template.logo
                      ? `https://raw.githubusercontent.com/Dokploy/templates/main/blueprints/${template.id}/${template.logo}`
                      : undefined
                  }
                  onClick={() => onTemplateSelect(template)}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TemplateGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 py-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="border rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-3">
            <Skeleton className="w-12 h-12 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <Skeleton className="h-10 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
