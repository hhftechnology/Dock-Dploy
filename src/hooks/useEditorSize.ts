import { useLayoutEffect, useRef, useState } from "react";

export interface EditorSize {
  width: number;
  height: number;
}

/**
 * Hook to manage code editor size with ResizeObserver
 * @returns Object containing codeFileRef and editorSize
 */
export function useEditorSize() {
  const codeFileRef = useRef<HTMLDivElement>(null);
  const [editorSize, setEditorSize] = useState<EditorSize>({ width: 0, height: 0 });

  useLayoutEffect(() => {
    if (!codeFileRef.current) return;

    const handleResize = () => {
      const rect = codeFileRef.current?.getBoundingClientRect();
      if (rect) {
        // Ensure minimum dimensions for small screens
        setEditorSize({
          width: Math.max(rect.width, 300),
          height: Math.max(rect.height, 200),
        });
      }
    };

    handleResize();
    const ro = new ResizeObserver(handleResize);
    ro.observe(codeFileRef.current);

    // Also listen to window resize for better responsiveness
    window.addEventListener("resize", handleResize);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return {
    codeFileRef,
    editorSize,
  };
}
