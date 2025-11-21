import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { CodeEditor } from "../CodeEditor";
import { Copy, Download, ExternalLink, Github, Globe, BookOpen } from "lucide-react";
import { copyToClipboard, downloadFile } from "../../utils/clipboard";
import { useToast } from "../ui/toast";

export interface TemplateDetails {
  id: string;
  name: string;
  description?: string;
  version?: string;
  logoUrl?: string;
  tags?: string[];
  links?: {
    github?: string;
    website?: string;
    docs?: string;
  };
  composeContent?: string;
}

export interface TemplateDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: TemplateDetails | null;
  onImport: (template: TemplateDetails) => Promise<void>;
  loading?: boolean;
}

export function TemplateDetailModal({
  open,
  onOpenChange,
  template,
  onImport,
  loading = false,
}: TemplateDetailModalProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [importing, setImporting] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    if (!template?.composeContent) return;

    try {
      await copyToClipboard(template.composeContent);
      toast({
        title: "Copied to clipboard",
        description: "Docker Compose content has been copied",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "error",
      });
    }
  };

  const handleDownload = () => {
    if (!template?.composeContent) return;

    try {
      downloadFile(
        template.composeContent,
        `${template.name.toLowerCase().replace(/\s+/g, "-")}-compose.yml`,
        "text/yaml"
      );
      toast({
        title: "Download started",
        description: "Docker Compose file is downloading",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Could not download file",
        variant: "error",
      });
    }
  };

  const handleImport = async () => {
    if (!template) return;

    setImporting(true);
    try {
      await onImport(template);
      toast({
        title: "Template imported",
        description: `${template.name} has been imported successfully`,
        variant: "success",
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Import failed",
        description: error.message || "Could not import template",
        variant: "error",
      });
    } finally {
      setImporting(false);
    }
  };

  if (!template) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) {
          setActiveTab("overview");
        }
      }}
    >
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-start gap-4">
            {template.logoUrl && (
              <img
                src={template.logoUrl}
                alt={template.name}
                className="w-16 h-16 object-contain rounded flex-shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-2xl font-bold">
                {template.name}
              </DialogTitle>
              {template.version && (
                <p className="text-sm text-muted-foreground mt-1">
                  Version {template.version}
                </p>
              )}
              {template.description && (
                <p className="text-sm text-muted-foreground mt-2">
                  {template.description}
                </p>
              )}
            </div>
          </div>

          {/* Tags and Links */}
          <div className="flex flex-wrap items-center gap-3 mt-4">
            {template.tags && template.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {template.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-md border border-primary/20"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {template.links && (
              <div className="flex gap-2 ml-auto">
                {template.links.github && (
                  <Button
                    size="sm"
                    variant="outline"
                    asChild
                  >
                    <a
                      href={template.links.github}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Github className="h-3.5 w-3.5 mr-1.5" />
                      GitHub
                    </a>
                  </Button>
                )}
                {template.links.website && (
                  <Button
                    size="sm"
                    variant="outline"
                    asChild
                  >
                    <a
                      href={template.links.website}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Globe className="h-3.5 w-3.5 mr-1.5" />
                      Website
                    </a>
                  </Button>
                )}
                {template.links.docs && (
                  <Button
                    size="sm"
                    variant="outline"
                    asChild
                  >
                    <a
                      href={template.links.docs}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                      Docs
                    </a>
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogHeader>

        {/* Tabs */}
        <div className="px-6 pt-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="compose">Docker Compose</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="overview" className="space-y-4 py-4">
              {/* Overview content can be expanded here */}
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <h3 className="text-lg font-semibold">About this template</h3>
                <p className="text-muted-foreground">
                  {template.description ||
                    "This template provides a pre-configured Docker Compose setup."}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="compose" className="py-4">
              {template.composeContent ? (
                <div className="space-y-4">
                  <div className="border rounded-lg overflow-hidden">
                    <div className="min-h-[500px] max-h-[60vh]">
                      <CodeEditor
                        content={template.composeContent}
                        onContentChange={() => {}}
                        height={undefined}
                        width={undefined}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={handleCopy}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownload}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-12 text-center">
                  <div className="space-y-2">
                    <p className="text-muted-foreground">
                      Docker Compose content not available
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t bg-muted/30">
          <div className="flex gap-3 justify-end w-full">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={importing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={importing || loading}
            >
              {importing ? "Importing..." : "Import Template"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
