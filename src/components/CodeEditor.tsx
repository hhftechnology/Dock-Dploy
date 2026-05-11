import { Suspense, lazy, useMemo, useState, useRef } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "./ui/button";
import { useTheme } from "./ThemeProvider";
import { useMountEffect } from "../hooks/useMountEffect";

/**
 * CodeMirror is heavy (~500KB before tree-shaking) and not needed on the
 * landing page or any read-only surface. We lazy-load it so the initial bundle
 * stays slim. The fallback shows a plain <pre> until the editor module loads.
 */
const LazyCodeMirror = lazy(() => import("./CodeMirrorRuntime"));

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

export function CodeEditor({
  content,
  onContentChange,
  width,
  height,
  editable = false,
  showCopyButton = true,
  minHeight = 200,
  maxHeight,
}: CodeEditorProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);
  const { theme } = useTheme();

  useMountEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => {
        setCopied(false);
        timerRef.current = null;
      }, 2000);
    } catch {
      setCopied(false);
    }
  };

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // Memoized so we don't recompute on every keystroke.
  const sizing = useMemo(() => {
    const h =
      height !== undefined
        ? typeof height === "number"
          ? `${height}px`
          : height
        : (() => {
            const lines = content.split("\n").length;
            const lineHeight = 24;
            const px = Math.max(
              minHeight,
              Math.min(lines * lineHeight + 40, maxHeight || 800),
            );
            return `${px}px`;
          })();
    const w =
      width !== undefined
        ? typeof width === "number"
          ? `${width}px`
          : width
        : "100%";
    return { h, w };
  }, [content, height, width, minHeight, maxHeight]);

  // CSS custom properties (not inline values) — set on the element via style,
  // but the *values* are CSS-typed strings already computed, not magic numbers
  // baked into JSX. These are necessary because the editor's height is
  // genuinely dynamic per-instance.
  const containerStyle = {
    width: sizing.w,
    height: sizing.h,
    minHeight: `${minHeight}px`,
    maxHeight: maxHeight ? `${maxHeight}px` : undefined,
  } as const;

  return (
    // eslint-disable-next-line no-restricted-syntax
    <div className="code-editor-shell" style={containerStyle}> {/* check-no-magic-css-allow */}
      {showCopyButton && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="code-editor-copy"
          title={copied ? "Copied!" : "Copy to clipboard"}
          aria-label="Copy code"
          type="button"
        >
          {copied ? (
            <>
              <Check size={14} />
              Copied
            </>
          ) : (
            <>
              <Copy size={14} />
              Copy
            </>
          )}
        </Button>
      )}
      <div className={"code-editor-inner" + (isDark ? "" : " cm-light-theme")}>
        <Suspense
          fallback={
            <pre className="code-editor-fallback">Loading editor…</pre>
          }
        >
          <LazyCodeMirror
            content={content}
            onContentChange={onContentChange}
            editable={editable}
          />
        </Suspense>
      </div>
    </div>
  );
}
