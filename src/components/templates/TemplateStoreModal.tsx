import { useState, useMemo, useEffect } from "react";
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { RefreshCw, Package, AlertCircle, X, ChevronDown } from "lucide-react";
import { TemplateCard } from "./TemplateCard";
import { useSearchParams } from "../../hooks/use-search-params";

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
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>(templates);

  // Get all unique tags, sorted with selected ones first
  const uniqueTags = useMemo(() => {
    if (!templates || templates.length === 0) return [];
    
    const allTags = Array.from(
      new Set(templates.flatMap((template) => template.tags || []))
    ).sort();

    if (selectedTags.length === 0) return allTags;

    const selected = allTags.filter(tag => selectedTags.includes(tag));
    const unselected = allTags.filter(tag => !selectedTags.includes(tag));
    
    return [...selected, ...unselected];
  }, [templates, selectedTags]);

  // Initialize search query from URL params
  useEffect(() => {
    const queryFromUrl = searchParams.get("q") || "";
    if (queryFromUrl !== searchQuery) {
      setSearchQuery(queryFromUrl);
    }
  }, [searchParams]);

  // Apply filters
  useEffect(() => {
    if (templates) {
      const filtered = templates.filter((template) => {
        const searchTerm = searchQuery.toLowerCase();
        const matchesSearch =
          template.name?.toLowerCase().includes(searchTerm) ||
          template.description?.toLowerCase().includes(searchTerm);

        const matchesTags =
          selectedTags.length === 0 ||
          selectedTags.every((tag) => template.tags?.includes(tag));

        return matchesSearch && matchesTags;
      });
      setFilteredTemplates(filtered);
    }
  }, [templates, searchQuery, selectedTags]);

  // Update URL params when search query changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setSearchQuery(newQuery);
    if (newQuery) {
      setSearchParams({ q: newQuery });
    } else {
      searchParams.delete("q");
      setSearchParams(searchParams);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-7xl w-[95vw] max-h-[90vh] flex flex-col gap-0 p-0 bg-background/95 backdrop-blur-xl border-border/50">
        <DialogHeader className="px-6 pt-6 pb-4 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-bold tracking-tight">
                Template Marketplace
              </DialogTitle>
              <DialogDescription className="text-base text-muted-foreground">
                Browse and import templates with pre-configured Docker Compose files.
                {cacheTimestamp && (
                  <span className="ml-2 text-xs text-muted-foreground/60">
                    (Cached {Math.round((Date.now() - cacheTimestamp) / 60000)}m ago)
                  </span>
                )}
              </DialogDescription>
              <div className="text-sm text-muted-foreground">
                Templates from{" "}
                <a
                  href="https://github.com/hhftechnology/Marketplace"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-400 hover:underline"
                >
                  hhftechnology/Marketplace
                </a>{" "}
                repository.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onRefresh}
                disabled={loading}
                className="flex-shrink-0 gap-2"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="h-9 w-9"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex flex-col gap-4 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Available Templates
              </span>
              <span className="text-sm font-bold">
                {filteredTemplates.length}
              </span>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="flex-1 h-10 bg-muted/50 border-border/50"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 h-10">
                    Tags
                    {selectedTags.length > 0 && (
                      <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px]">
                        {selectedTags.length}
                      </span>
                    )}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px] max-h-[300px] overflow-y-auto">
                  <DropdownMenuLabel>Filter by Tags</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {uniqueTags.map((tag) => (
                    <DropdownMenuCheckboxItem
                      key={tag}
                      checked={selectedTags.includes(tag)}
                      onCheckedChange={() => toggleTag(tag)}
                    >
                      {tag}
                    </DropdownMenuCheckboxItem>
                  ))}
                  {uniqueTags.length === 0 && (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No tags available
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </DialogHeader>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 min-h-0">
          {loading ? (
            <TemplateGridSkeleton />
          ) : error ? (
            <div className="flex items-center justify-center py-12 h-full">
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
            <div className="flex items-center justify-center py-12 h-full">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  {...template}
                  logo={
                    template.logo
                      ? `https://raw.githubusercontent.com/hhftechnology/Marketplace/main/compose-files/${template.id}/${template.logo}`
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
    <div className="grid gap-4 py-4 auto-rows-fr template-grid">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="border rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-3">
            <Skeleton className="w-12 h-12 rounded flex-shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <Skeleton className="h-10 w-full" />
          <div className="flex gap-2 flex-wrap">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
