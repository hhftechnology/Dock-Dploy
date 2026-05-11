// Heavy CodeMirror runtime — split into its own chunk so the landing bundle
// and other read-only surfaces don't pull this in. Loaded via React.lazy from
// CodeEditor.tsx.

import CodeMirror from "@uiw/react-codemirror";
import { hyperLink } from "@uiw/codemirror-extensions-hyper-link";
import { yaml } from "@codemirror/lang-yaml";
import { monokaiDimmed } from "@uiw/codemirror-theme-monokai-dimmed";

interface CodeMirrorRuntimeProps {
  content: string;
  onContentChange: (value: string) => void;
  editable?: boolean;
}

export default function CodeMirrorRuntime({
  content,
  onContentChange,
  editable = false,
}: CodeMirrorRuntimeProps) {
  return (
    <CodeMirror
      value={content}
      height="100%"
      width="100%"
      theme={monokaiDimmed}
      editable={editable}
      extensions={[yaml(), hyperLink]}
      onChange={(value: string) => onContentChange(value)}
      basicSetup={{
        lineNumbers: true,
        highlightActiveLineGutter: editable,
        highlightActiveLine: editable,
        foldGutter: true,
      }}
      // eslint-disable-next-line no-restricted-syntax
      style={{ fontSize: 14, fontFamily: "var(--mono)" }} // check-no-magic-css-allow
    />
  );
}
