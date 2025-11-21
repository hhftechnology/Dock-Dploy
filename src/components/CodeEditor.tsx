import React, { useState, useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { hyperLink } from '@uiw/codemirror-extensions-hyper-link';
import {yaml} from "@codemirror/lang-yaml";
import { Button } from "./ui/button";
import { monokaiDimmed } from '@uiw/codemirror-theme-monokai-dimmed';
import { useTheme } from "./ThemeProvider";
import { Check, Copy } from "lucide-react";

interface CodeEditorProps {
    content: string;
    onContentChange: (value: string) => void;
    width?: number | string;
    height?: number | string;
    editable?: boolean;
    showCopyButton?: boolean;
    minHeight?: number;
    maxHeight?: number;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
    content,
    onContentChange,
    width,
    height,
    editable = false,
    showCopyButton = true,
    minHeight = 200,
    maxHeight,
}) => {
    const [copied, setCopied] = useState(false);
    const { theme } = useTheme();

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (e) {
            setCopied(false);
        }
    };

    // Determine which theme to use
    const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    // For light mode, we'll use a custom style approach
    const editorTheme = monokaiDimmed;

    // Calculate responsive height based on content
    const calculatedHeight = useMemo(() => {
        if (height !== undefined) {
            return typeof height === 'number' ? `${height}px` : height;
        }

        // Auto-calculate based on line count
        const lines = content.split('\n').length;
        const lineHeight = 24; // approximate line height in pixels
        const calculatedPx = Math.max(minHeight, Math.min(lines * lineHeight + 40, maxHeight || 800));

        return `${calculatedPx}px`;
    }, [content, height, minHeight, maxHeight]);

    const calculatedWidth = useMemo(() => {
        if (width !== undefined) {
            return typeof width === 'number' ? `${width}px` : width;
        }
        return '100%';
    }, [width]);

    return (
        <div
            className="relative flex flex-col overflow-hidden rounded-lg border bg-sidebar"
            style={{
                width: calculatedWidth,
                height: calculatedHeight,
                minHeight: `${minHeight}px`,
                maxHeight: maxHeight ? `${maxHeight}px` : undefined,
            }}
        >
            {/* Copy button in top right */}
            {showCopyButton && (
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleCopy}
                    className="absolute top-2 right-2 z-10 h-8 px-3 shadow-md"
                    title={copied ? "Copied!" : "Copy to clipboard"}
                    aria-label="Copy code"
                    type="button"
                >
                    {copied ? (
                        <>
                            <Check className="h-3.5 w-3.5 mr-1.5" />
                            Copied
                        </>
                    ) : (
                        <>
                            <Copy className="h-3.5 w-3.5 mr-1.5" />
                            Copy
                        </>
                    )}
                </Button>
            )}
            <div className={`flex-1 overflow-auto ${isDark ? "" : "cm-light-theme"}`}>
                <CodeMirror
                    value={content}
                    height="100%"
                    width="100%"
                    theme={editorTheme}
                    editable={editable}
                    extensions={[
                        yaml(),
                        hyperLink,
                    ]}
                    onChange={(value: string) => onContentChange(value)}
                    basicSetup={{
                        lineNumbers: true,
                        highlightActiveLineGutter: editable,
                        highlightActiveLine: editable,
                        foldGutter: true,
                    }}
                    style={{
                        fontSize: 14,
                        fontFamily: 'monospace',
                    }}
                />
            </div>
        </div>
    );
};