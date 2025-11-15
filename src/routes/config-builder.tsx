import { useState, useEffect, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CodeEditor } from "../components/CodeEditor";
import { SidebarUI } from "../components/SidebarUI";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
  SidebarTrigger,
} from "../components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../components/ui/dropdown-menu";
import { Textarea } from "../components/ui/textarea";
import { Download, Copy, Settings } from "lucide-react";
import yaml from "js-yaml";

export const Route = createFileRoute("/config-builder")({
  component: App,
});

interface ConfigItem {
  name: string;
  description: string;
  icon: string;
  url: string;
  category?: string;
  tags?: string[];
}

interface HomepageConfig {
  items: ConfigItem[];
}

function App() {
  const [configType, setConfigType] = useState<"homepage" | "custom">(
    "homepage"
  );
  const [config, setConfig] = useState<HomepageConfig>({ items: [] });
  const [output, setOutput] = useState("");
  const [currentItem, setCurrentItem] = useState<ConfigItem>({
    name: "",
    description: "",
    icon: "",
    url: "",
    category: "",
    tags: [],
  });

  const generateHomepageConfig = useCallback((items: ConfigItem[]): string => {
    const config: any = {
      services: items.map((item) => ({
        Name: item.name,
        Description: item.description,
        Icon: item.icon,
        URL: item.url,
        ...(item.category && { Category: item.category }),
        ...(item.tags && item.tags.length > 0 && { Tags: item.tags }),
      })),
    };
    return yaml.dump(config, { indent: 2 });
  }, []);

  const updateOutput = useCallback(() => {
    if (configType === "homepage") {
      setOutput(generateHomepageConfig(config.items));
    }
  }, [configType, config.items, generateHomepageConfig]);

  const addItem = useCallback(() => {
    if (!currentItem.name || !currentItem.url) return;
    setConfig({
      items: [...config.items, { ...currentItem }],
    });
    setCurrentItem({
      name: "",
      description: "",
      icon: "",
      url: "",
      category: "",
      tags: [],
    });
  }, [currentItem, config.items]);

  const removeItem = useCallback((index: number) => {
    const newItems = config.items.filter((_, i) => i !== index);
    setConfig({ items: newItems });
  }, [config.items]);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  }, []);

  const downloadFile = useCallback((content: string, filename: string, mimeType: string) => {
    try {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download file:", error);
    }
  }, []);

  useEffect(() => {
    updateOutput();
  }, [updateOutput]);

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarUI />
      </Sidebar>
      <SidebarInset>
        <div className="flex items-center gap-2 p-2 border-b">
          <SidebarTrigger />
          <h1 className="text-xl font-bold">Config Builder</h1>
        </div>
        <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="mb-4">
              <Label className="mb-2 block">Config Type</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full">
                    {configType === "homepage"
                      ? "Homepage (gethomepage.dev)"
                      : "Custom"}
                    <Settings className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setConfigType("homepage")}>
                    Homepage (gethomepage.dev)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setConfigType("custom")}>
                    Custom
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {configType === "homepage" && (
              <>
                <Separator className="my-4" />
                <div className="space-y-4">
                  <div>
                    <Label className="mb-1 block">Name</Label>
                    <Input
                      value={currentItem.name}
                      onChange={(e) =>
                        setCurrentItem({ ...currentItem, name: e.target.value })
                      }
                      placeholder="Service name"
                    />
                  </div>
                  <div>
                    <Label className="mb-1 block">Description</Label>
                    <Input
                      value={currentItem.description}
                      onChange={(e) =>
                        setCurrentItem({
                          ...currentItem,
                          description: e.target.value,
                        })
                      }
                      placeholder="Service description"
                    />
                  </div>
                  <div>
                    <Label className="mb-1 block">Icon</Label>
                    <Input
                      value={currentItem.icon}
                      onChange={(e) =>
                        setCurrentItem({ ...currentItem, icon: e.target.value })
                      }
                      placeholder="Icon URL or name"
                    />
                  </div>
                  <div>
                    <Label className="mb-1 block">URL</Label>
                    <Input
                      value={currentItem.url}
                      onChange={(e) =>
                        setCurrentItem({ ...currentItem, url: e.target.value })
                      }
                      placeholder="https://example.com"
                    />
                  </div>
                  <div>
                    <Label className="mb-1 block">Category (optional)</Label>
                    <Input
                      value={currentItem.category || ""}
                      onChange={(e) =>
                        setCurrentItem({
                          ...currentItem,
                          category: e.target.value,
                        })
                      }
                      placeholder="Category name"
                    />
                  </div>
                  <div>
                    <Label className="mb-1 block">Tags (comma-separated)</Label>
                    <Input
                      value={currentItem.tags?.join(", ") || ""}
                      onChange={(e) =>
                        setCurrentItem({
                          ...currentItem,
                          tags: e.target.value.split(",").map((t) => t.trim()),
                        })
                      }
                      placeholder="tag1, tag2, tag3"
                    />
                  </div>
                  <Button onClick={addItem} className="w-full">
                    Add Item
                  </Button>
                </div>

                <Separator className="my-4" />

                <div>
                  <Label className="mb-2 block">
                    Items ({config.items.length})
                  </Label>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {config.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <div>
                          <div className="font-semibold">{item.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.url}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeItem(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {configType === "custom" && (
              <div className="mt-4">
                <Label className="mb-2 block">Custom Configuration</Label>
                <Textarea
                  value={output}
                  onChange={(e) => setOutput(e.target.value)}
                  className="font-mono min-h-[400px]"
                  placeholder="Enter your custom configuration..."
                />
              </div>
            )}
          </Card>

          <Card className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <Label className="text-lg font-bold">
                Generated Configuration
              </Label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(output)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    downloadFile(output, "config.yml", "text/yaml")
                  }
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
            <CodeEditor
              content={output}
              onContentChange={(content) => {
                setOutput(content);
                if (configType === "homepage") {
                  updateOutput();
                }
              }}
              width={600}
              height={600}
            />
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
