import React, { useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { hyperLink } from '@uiw/codemirror-extensions-hyper-link';
import {yaml} from "@codemirror/lang-yaml";
import { Button } from "./ui/button";
import { monokaiDimmed } from '@uiw/codemirror-theme-monokai-dimmed';
import { useTheme } from "./ThemeProvider";

interface CodeEditorProps {
    content: string;
    onContentChange: (value: string) => void;
    width?: number;
    height?: number;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
    content,
    onContentChange,
    width,
    height,
}) => {
    const [copied, setCopied] = useState(false);
    const { theme } = useTheme();

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
        } catch (e) {
            setCopied(false);
        }
    };

    // Determine which theme to use
    const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    
    // For light mode, we'll use a custom style approach
    const editorTheme = monokaiDimmed;

    return (
        <div
            style={{
                width: width ? width : '100%',
                height: height ? height : '100%',
                margin: 0,
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                background: 'var(--background, #18181b)',
                borderRadius: 8,
                overflow: 'hidden',
                position: 'relative',
            }}
        >
            {/* Copy button in top right */}
            <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                className="absolute top-2 right-2 z-10 border-2 border-primary shadow-lg bg-background hover:bg-primary/20 active:bg-primary/30 transition-colors"
                title={copied ? "Copied!" : "Copy to clipboard"}
                aria-label="Copy code"
                type="button"
            >
                {/* Clipboard SVG icon */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15V5a2 2 0 0 1 2-2h10"></path></svg>
            </Button>
            <div className={isDark ? "" : "cm-light-theme"}>
                <CodeMirror
                    value={content}
                    height={height ? `${height}px` : `100%`}
                    width={width ? `${width}px` : `100%`}
                    theme={editorTheme}
                    editable={false}
                    extensions={[
                        yaml(),
                        hyperLink,
                    ]}
                    onChange={(value: string) => onContentChange(value)}
                    basicSetup={{ lineNumbers: true }}
                    style={{
                        flex: 1,
                        minHeight: 0,
                        minWidth: 0,
                        fontSize: 16,
                }}
                />
            </div>
        </div>
    );
};