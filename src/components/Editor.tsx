import React, { useRef, useEffect, useState } from "react";
import { ProjectFile, EditorCursor, LintProblem, IDETheme } from "../types";
import { tokenizeLine } from "../utils/tokenizer";
import { AlertCircle, FileCode, CheckCircle, RefreshCw } from "lucide-react";

interface EditorProps {
  activeFile: ProjectFile | null;
  onCodeChange: (content: string) => void;
  peerCursors: EditorCursor[];
  activeUserId: string;
  problems: LintProblem[];
  theme: IDETheme;
  isLinting: boolean;
  onCursorPositionChange?: (row: number, col: number) => void;
}

export default function Editor({
  activeFile,
  onCodeChange,
  peerCursors,
  activeUserId,
  problems,
  theme,
  isLinting,
  onCursorPositionChange
}: EditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const [cursorLine, setCursorLine] = useState(1);
  const [cursorCol, setCursorCol] = useState(1);

  useEffect(() => {
    // Scroll editor to top when file changes
    if (textareaRef.current) {
      textareaRef.current.scrollTop = 0;
      textareaRef.current.scrollLeft = 0;
    }
  }, [activeFile?.path]);

  // Handle scroll syncing
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    if (highlightRef.current) {
      highlightRef.current.scrollTop = target.scrollTop;
      highlightRef.current.scrollLeft = target.scrollLeft;
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = target.scrollTop;
    }
  };

  // Track cursor position
  const handleSelectionAndCursorChange = () => {
    if (!textareaRef.current) return;
    const selectionStart = textareaRef.current.selectionStart;
    const textUpToCursor = textareaRef.current.value.substring(0, selectionStart);
    const lines = textUpToCursor.split("\n");
    const row = lines.length;
    const col = lines[lines.length - 1].length + 1;
    
    setCursorLine(row);
    setCursorCol(col);

    if (onCursorPositionChange) {
      onCursorPositionChange(row, col);
    }
  };

  if (!activeFile) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-zinc-950 text-zinc-500 font-sans p-8 select-none text-center">
        <FileCode className="h-14 w-14 text-zinc-700 animate-pulse mb-3" />
        <h3 className="text-zinc-300 font-semibold tracking-wide text-sm">No Open File</h3>
        <p className="text-xs text-zinc-500 mt-1 max-w-sm leading-relaxed">
          Select an active repository file from the sidebar explorer, or create a new language file to begin developing in Nexus.
        </p>
      </div>
    );
  }

  const lines = activeFile.content.split("\n");
  const linesCount = Math.max(lines.length, 1);

  // Group problems by 1-indexed line number
  const problemsByLine: Record<number, LintProblem[]> = {};
  problems.forEach((p) => {
    if (!problemsByLine[p.line]) {
      problemsByLine[p.line] = [];
    }
    problemsByLine[p.line].push(p);
  });

  const isHighDensity = theme.id === "high-density";

  return (
    <div className="flex flex-1 flex-col overflow-hidden h-full relative" style={{ backgroundColor: theme.editorBg }}>
      {/* Tab bar detail */}
      <div 
        className="flex items-center justify-between h-[35px] border-b text-zinc-400 shrink-0 select-none transition-colors duration-200"
        style={{ 
          backgroundColor: theme.id === "high-density" ? "#010409" : "rgba(9, 9, 11, 0.95)",
          borderColor: theme.border
        }}
      >
        <div className="flex h-full items-end">
          {/* Active Tab */}
          <div 
            className="px-4 h-full flex items-center gap-2 text-xs font-mono font-medium border-r select-none transition-all duration-200"
            style={{
              backgroundColor: theme.id === "high-density" ? "#0D1117" : "transparent",
              borderBottom: `2px solid ${theme.id === "high-density" ? "#F78166" : theme.accent}`,
              borderColor: theme.border,
              color: theme.id === "high-density" ? "#FFFFFF" : theme.accent
            }}
          >
            <span>{activeFile.path.split("/").pop()}</span>
            <span className="text-[10px] opacity-60 hover:opacity-100 cursor-pointer">×</span>
          </div>

          {/* Simulated Tab 1 (high density detail) */}
          {theme.id === "high-density" && (
            <>
              <div className="px-4 h-full flex items-center gap-2 text-xs font-mono text-zinc-500 border-r" style={{ borderColor: theme.border }}>
                <span>main.cpp</span>
              </div>
              <div className="px-4 h-full flex items-center gap-2 text-xs font-mono text-zinc-500 border-r" style={{ borderColor: theme.border }}>
                <span>config.json</span>
              </div>
            </>
          )}
        </div>

        {/* Right side status / Linting info */}
        <div className="flex items-center gap-3 px-3">
          {isLinting ? (
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono">
              <RefreshCw className="h-3 w-3 animate-spin" style={{ color: theme.accent }} />
              <span>AI compiler parsing...</span>
            </div>
          ) : problems.length > 0 ? (
            <div 
              className="flex items-center gap-1 text-[10px] font-mono border px-2 py-0.5 rounded"
              style={{
                backgroundColor: "rgba(248, 81, 73, 0.15)",
                borderColor: "rgba(248, 81, 73, 0.3)",
                color: "#FF7B72"
              }}
            >
              <AlertCircle className="h-3 w-3" />
              <span>{problems.length} compilation issues</span>
            </div>
          ) : (
            <div 
              className="flex items-center gap-1 text-[10px] font-mono border px-2 py-0.5 rounded"
              style={{
                backgroundColor: "rgba(35, 134, 54, 0.15)",
                borderColor: "rgba(35, 134, 54, 0.3)",
                color: "#3FB950"
              }}
            >
              <CheckCircle className="h-3 w-3" />
              <span>Perfect Syntax</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Line Gutter numbers */}
        <div 
          ref={gutterRef}
          className="w-12 select-none overflow-hidden text-right pr-2.5 py-4 border-r font-mono text-xs select-none pointer-events-none"
          style={{ 
            backgroundColor: theme.editorGutter, 
            borderColor: theme.border,
            color: theme.editorLineNumber
          }}
        >
          {Array.from({ length: linesCount }).map((_, i) => {
            const lineNum = i + 1;
            const hasError = !!problemsByLine[lineNum]?.some(p => p.severity === "error");
            const hasWarning = !!problemsByLine[lineNum]?.some(p => p.severity === "warning");
            const isCurrent = lineNum === cursorLine;

            return (
              <div 
                key={i} 
                className={`h-6 flex items-center justify-end pr-1 transition-colors ${
                  hasError ? "text-red-500 font-semibold bg-red-950/20" :
                  hasWarning ? "text-amber-500 font-semibold bg-amber-950/20" :
                  isCurrent ? "text-zinc-200 font-semibold bg-zinc-900/50" : ""
                }`}
              >
                {lineNum}
              </div>
            );
          })}
        </div>

        {/* Highlight Layer and Textarea Wrapper */}
        <div className="flex-1 h-full relative overflow-hidden">
          {/* Syntax Highlight Overlay */}
          <pre
            ref={highlightRef}
            className="absolute inset-0 w-full h-full p-4 font-mono text-xs leading-6 overflow-hidden pointer-events-none whitespace-pre whitespace-pre-wrap select-none"
            style={{ color: theme.textPrimary }}
          >
            <code>
              {lines.map((line, i) => {
                const lineNum = i + 1;
                const tokens = tokenizeLine(line, activeFile.language);
                const hasError = !!problemsByLine[lineNum]?.some(p => p.severity === "error");
                const hasWarning = !!problemsByLine[lineNum]?.some(p => p.severity === "warning");

                return (
                  <div 
                    key={i} 
                    className={`h-6 flex items-center whitespace-pre relative ${
                      hasError ? "squiggly-error" : 
                      hasWarning ? "squiggly-warning" : ""
                    }`}
                  >
                    {/* Render peer cursors on this line */}
                    {peerCursors
                      .filter((c) => c.path === activeFile.path && c.row === lineNum)
                      .map((c) => {
                        // Calculate offset char position roughly
                        const leftOffset = Math.min(c.col - 1, line.length) * 7.2; // approx font-width
                        return (
                          <div
                            key={c.userId}
                            className="absolute top-0 h-5 w-0.5 animate-pulse z-10"
                            style={{ 
                              left: `${leftOffset + 16}px`, 
                              backgroundColor: c.color 
                            }}
                          >
                            {/* Floating peer username tooltip */}
                            <span 
                              className="absolute bottom-5 left-0 px-1 py-0.5 rounded text-[8px] font-sans font-semibold text-white whitespace-nowrap opacity-80 z-20 transition"
                              style={{ backgroundColor: c.color }}
                            >
                              {c.username}
                            </span>
                          </div>
                        );
                      })}

                    {/* Tokens */}
                    {tokens.map((token, j) => {
                      if (isHighDensity) {
                        let styleObj: React.CSSProperties = { color: "#C9D1D9" };
                        if (token.type === "keyword") styleObj = { color: "#FF7B72", fontWeight: "bold" };
                        else if (token.type === "type") styleObj = { color: "#D2A8FF", fontWeight: "500" };
                        else if (token.type === "string") styleObj = { color: "#A5D6FF" };
                        else if (token.type === "comment") styleObj = { color: "#8B949E", fontStyle: "italic" };
                        else if (token.type === "number") styleObj = { color: "#79C0FF" };
                        else if (token.type === "operator") styleObj = { color: "#C9D1D9" };
                        else if (token.type === "preprocessor") styleObj = { color: "#FF7B72", fontWeight: "bold" };
                        else if (token.type === "builtin") styleObj = { color: "#D2A8FF", fontWeight: "500" };

                        return (
                          <span key={j} style={styleObj}>
                            {token.text}
                          </span>
                        );
                      } else {
                        let color = "";
                        if (token.type === "keyword") color = "text-pink-500 font-semibold";
                        else if (token.type === "type") color = "text-indigo-400 font-medium";
                        else if (token.type === "string") color = "text-emerald-400";
                        else if (token.type === "comment") color = "text-zinc-500 italic";
                        else if (token.type === "number") color = "text-amber-400";
                        else if (token.type === "operator") color = "text-zinc-400";
                        else if (token.type === "preprocessor") color = "text-purple-400 font-semibold";
                        else if (token.type === "builtin") color = "text-cyan-400 font-medium";
                        else color = "text-zinc-300";

                        return (
                          <span key={j} className={color}>
                            {token.text}
                          </span>
                        );
                      }
                    })}
                  </div>
                );
              })}
            </code>
          </pre>

          {/* Actual Editable Textarea */}
          <textarea
            ref={textareaRef}
            value={activeFile.content}
            onChange={(e) => onCodeChange(e.target.value)}
            onScroll={handleScroll}
            onSelect={handleSelectionAndCursorChange}
            onKeyUp={handleSelectionAndCursorChange}
            onKeyDown={(e) => {
              // Custom tab support
              if (e.key === "Tab") {
                e.preventDefault();
                const start = e.currentTarget.selectionStart;
                const end = e.currentTarget.selectionEnd;
                const value = e.currentTarget.value;
                const updated = value.substring(0, start) + "  " + value.substring(end);
                onCodeChange(updated);
                // Reset cursor position
                setTimeout(() => {
                  if (textareaRef.current) {
                    textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
                  }
                }, 0);
              }
              handleSelectionAndCursorChange();
            }}
            className="absolute inset-0 w-full h-full p-4 font-mono text-xs leading-6 resize-none outline-none overflow-auto whitespace-pre whitespace-pre-wrap select-text caret-indigo-400 bg-transparent text-transparent"
            spellCheck="false"
            autoComplete="off"
            autoFocus
          />
        </div>
      </div>

      {/* Editor Line Col Footer Indicator */}
      <footer className="h-6 w-full px-4 border-t border-zinc-900 bg-zinc-950 flex items-center justify-between text-[10px] text-zinc-500 font-mono shrink-0 select-none">
        <div className="flex items-center gap-3">
          <span>Row {cursorLine}, Col {cursorCol}</span>
          <span className="text-zinc-800">|</span>
          <span>Tab Spaces: 2</span>
          <span className="text-zinc-800">|</span>
          <span>UTF-8</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Compiler Online</span>
        </div>
      </footer>
    </div>
  );
}
