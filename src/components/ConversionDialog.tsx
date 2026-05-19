import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Copy, Download, AlertCircle } from "lucide-react";
import { copyToClipboard, downloadFile } from "../utils/clipboard";
import type { ConversionType } from "../hooks/useConversionDialog";

export interface ConversionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversionType: ConversionType | string;
  conversionOutput: string;
  conversionValid?: boolean;
  clearEnvAfterDownload?: boolean;
  onClearEnvChange?: (checked: boolean) => void;
  onToast?: (message: { title: string; description?: string; variant?: "default" | "success" | "error" }) => void;
}

const CONVERSION_TITLES: Record<string, string> = {
  "docker-run": "Docker Run Commands",
  systemd: "Systemd Service Files",
  env: ".env File",
  redact: "Redacted Compose File",
  komodo: "Komodo TOML Configuration",
};

const CONVERSION_FILENAMES: Record<string, string> = {
  "docker-run": "docker-run.sh",
  systemd: "docker-compose.service",
  env: ".env",
  redact: "docker-compose-redacted.yml",
  komodo: "komodo.toml",
};

const CONVERSION_MIME_TYPES: Record<string, string> = {
  "docker-run": "text/x-shellscript",
  systemd: "text/plain",
  env: "text/plain",
  redact: "text/yaml",
  komodo: "text/toml",
};

export function ConversionDialog({
  open,
  onOpenChange,
  conversionType,
  conversionOutput,
  conversionValid = true,
  clearEnvAfterDownload = false,
  onClearEnvChange,
  onToast,
}: ConversionDialogProps) {
  const title = CONVERSION_TITLES[conversionType] || "Conversion Output";
  const filename = CONVERSION_FILENAMES[conversionType] || "output.txt";
  const mimeType = CONVERSION_MIME_TYPES[conversionType] || "text/plain";

  const handleCopy = async () => {
    if (!conversionValid) return;
    try {
      await copyToClipboard(conversionOutput);
      onToast?.({
        title: "Copied to clipboard",
        description: `${title} has been copied to your clipboard.`,
        variant: "success",
      });
    } catch {
      onToast?.({
        title: "Failed to copy",
        description: "Could not copy to clipboard. Please try again.",
        variant: "error",
      });
    }
  };

  const handleDownload = () => {
    if (!conversionValid) return;
    try {
      downloadFile(conversionOutput, filename, mimeType);
      onToast?.({
        title: "Download started",
        description: `Downloading ${filename}`,
        variant: "success",
      });
    } catch {
      onToast?.({
        title: "Download failed",
        description: "Could not download file. Please try again.",
        variant: "error",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl dialog-h-medium flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {!conversionValid && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            Output is blocked until validation errors are fixed.
          </div>
        )}

        <div className="flex-1 overflow-auto">
          <pre className="p-4 bg-muted rounded-md text-sm font-mono whitespace-pre-wrap break-all">
            {conversionOutput}
          </pre>
        </div>

        {conversionType === "env" && onClearEnvChange && (
          <div className="flex items-center space-x-2 py-2">
            <Checkbox
              id="clearEnv"
              checked={clearEnvAfterDownload}
              onCheckedChange={onClearEnvChange}
            />
            <Label htmlFor="clearEnv" className="text-sm cursor-pointer">
              Clear environment variables from compose file after download
            </Label>
          </div>
        )}

        <DialogFooter className="flex-row justify-end gap-2">
          <Button variant="outline" onClick={handleCopy} disabled={!conversionValid}>
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
          <Button onClick={handleDownload} disabled={!conversionValid}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
