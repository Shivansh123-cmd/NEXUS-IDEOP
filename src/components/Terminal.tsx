import React, { useState } from "react";
import { Terminal as TermIcon, AlertTriangle, AlertCircle, Trash2, Play, BookOpen, Key, CheckCircle } from "lucide-react";
import { LintProblem, IDETheme } from "../types";

interface TerminalProps {
  output: string;
  onClearOutput: () => void;
  problems: LintProblem[];
  currentFileName: string;
  stdinInput: string;
  onStdinChange: (val: string) => void;
  onRunCode: () => void;
  isCompiling: boolean;
  onProblemClick?: (line: number) => void;
  theme: IDETheme;
}

export default function Terminal({
  output,
  onClearOutput,
  problems,
  currentFileName,
  stdinInput,
  onStdinChange,
  onRunCode,
  isCompiling,
  onProblemClick,
  theme
}: TerminalProps) {
  const [activeBottomTab, setActiveBottomTab] = useState<"terminal" | "problems" | "docs">("terminal");
  const [terminalTheme, setTerminalTheme] = useState<"classic" | "amber" | "cyber">("classic");

  // Termux Shell States
  const [commandInput, setCommandInput] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [installedPackages, setInstalledPackages] = useState<string[]>(["git", "neofetch"]);
  
  // Custom terminal lines to display
  const [consoleHistory, setConsoleHistory] = useState<string[]>([
    "Welcome to Nexus Termux!",
    "",
    "Wiki:            https://wiki.termux.com",
    "Community forum: https://termux.com/community",
    "Gitter chat:     https://gitter.im/termux/termux",
    "",
    "Working with packages:",
    "  * Search packages:   pkg search <query>",
    "  * Install a package: pkg install <package>",
    "  * Upgrade packages:  pkg upgrade",
    "",
    "Subscribed repositories:",
    "  * stable (main)",
    "",
    "Type 'help' to see all available commands.",
    ""
  ]);

  React.useEffect(() => {
    const anchor = document.getElementById("termux-bottom-anchor");
    if (anchor) {
      anchor.scrollIntoView({ behavior: "smooth" });
    }
  }, [consoleHistory, isCompiling]);

  React.useEffect(() => {
    if (output) {
      setConsoleHistory(prev => [
        ...prev,
        output,
        ""
      ]);
    }
  }, [output]);

  const executeCommand = async (cmdStr: string) => {
    const trimmed = cmdStr.trim();
    if (!trimmed) return;

    // Add command to history list
    setCommandHistory(prev => [trimmed, ...prev]);
    setHistoryIndex(-1);

    // Print prompt with entered command
    setConsoleHistory(prev => [...prev, `nexus@termux:~$ ${trimmed}`]);

    const args = trimmed.split(" ");
    const command = args[0].toLowerCase();

    switch (command) {
      case "clear":
        setConsoleHistory([]);
        break;

      case "help":
        setConsoleHistory(prev => [
          ...prev,
          "Nexus-Termux v0.118-Shell (Simulated Environment)",
          "Available Commands:",
          "  help                             Display this manual",
          "  pkg list                         List all available/installed packages",
          "  pkg install <package>            Install software: python, nodejs, php, ruby, clang, neofetch, curl",
          "  apt update && apt upgrade        Synchronize remote package databases",
          "  neofetch                         Display beautiful Nexus OS & Termux specifications",
          "  ls                               List files in active project workspace",
          "  cat <filename>                   Display source content of any file",
          "  termux-info                      Show system information and diagnostic logs",
          "  node <filename>                  Run JavaScript/TypeScript files in active compiler",
          "  python <filename>                Run Python scripts (requires 'pkg install python')",
          "  curl <url>                       Fetch HTTP responses from web endpoints (requires 'pkg install curl')",
          "  clear                            Clear the current screen output",
          "  git status / push / commit       Live synchronization with real linked GitHub repos",
          ""
        ]);
        break;

      case "termux-info":
        setConsoleHistory(prev => [
          ...prev,
          "Application version: 0.118.0",
          "OS Kernel: Linux 6.1.0-android-nexus-bbr",
          "Host Model: Nexus IDE Container Node",
          "Device IP: 127.0.0.1",
          "Platform: Android 13 (API 33)",
          "Prefix Path: /data/data/com.termux/files/usr",
          "Access Token: LINKED_OK",
          "Shell: /data/data/com.termux/files/usr/bin/bash",
          ""
        ]);
        break;

      case "neofetch":
        if (installedPackages.includes("neofetch")) {
          setConsoleHistory(prev => [
            ...prev,
            "       _  _      nexus@termux",
            "     ( `   ` )    ------------",
            "    ( `  _  ` )   OS: Termux Android (Nexus Custom ROM)",
            "   ( `  (X)  ` )  Kernel: Linux 6.1.0-android-nexus",
            "    ( `  _  ` )   Uptime: 2 hours, 14 mins",
            "     ( _  _ )     Shell: bash 5.2",
            "                  Resolution: 1920x1080",
            "                  Terminal: Nexus-Termux 0.118",
            "                  CPU: Google Tensor G3 Octa-Core",
            "                  Memory: 12GB LPDDR5",
            "                  Packages: " + installedPackages.join(", "),
            ""
          ]);
        } else {
          setConsoleHistory(prev => [
            ...prev,
            "bash: neofetch: command not found. Try: pkg install neofetch",
            ""
          ]);
        }
        break;

      case "pkg":
      case "apt":
        const action = args[1]?.toLowerCase();
        const pkgName = args[2]?.toLowerCase();
        
        if (action === "list" || action === "list-installed") {
          setConsoleHistory(prev => [
            ...prev,
            "Listing packages... Done",
            ...installedPackages.map(p => `  ${p}/stable,now 1.2.3 [installed]`),
            "Available for install: python, nodejs, php, ruby, clang, neofetch, curl",
            ""
          ]);
        } else if (action === "install" || action === "update" || action === "upgrade" || command === "apt") {
          if (command === "apt" && trimmed.includes("update")) {
            setConsoleHistory(prev => [...prev, "Reading package lists... Done", "Building dependency tree... Done", "All packages are up to date.", ""]);
            break;
          }
          if (!pkgName) {
            setConsoleHistory(prev => [...prev, "Error: Specify package name. Example: pkg install python", ""]);
            break;
          }
          if (!["python", "nodejs", "php", "ruby", "clang", "neofetch", "curl"].includes(pkgName)) {
            setConsoleHistory(prev => [...prev, `E: Unable to locate package ${pkgName}`, ""]);
            break;
          }
          if (installedPackages.includes(pkgName)) {
            setConsoleHistory(prev => [...prev, `${pkgName} is already the newest version (1.2.3).`, ""]);
            break;
          }
          
          setConsoleHistory(prev => [
            ...prev,
            `Selecting previously unselected package ${pkgName}...`,
            `Downloading repository binaries...`,
            `[====================================>] 100%`,
            `Unpacking ${pkgName} (1.2.3)...`,
            `Setting up ${pkgName} configuration...`,
            `Success: ${pkgName} installed successfully! Try running it now.`,
            ""
          ]);
          setInstalledPackages(prev => [...prev, pkgName]);
        } else {
          setConsoleHistory(prev => [...prev, "Usage: pkg install <package>  |  pkg list", ""]);
        }
        break;

      case "ls":
        // Fetch files from workspaces
        try {
          const res = await fetch("/api/files");
          const filesData = await res.json();
          const fileNames = filesData.map((f: any) => f.path);
          setConsoleHistory(prev => [
            ...prev,
            "src/",
            ...fileNames.map((name: string) => `  ${name}`),
            ""
          ]);
        } catch {
          setConsoleHistory(prev => [...prev, "src/  main.cpp  main.go  main.rs  index.js", ""]);
        }
        break;

      case "cat":
        const targetFile = args[1];
        if (!targetFile) {
          setConsoleHistory(prev => [...prev, "cat: Missing file path. Example: cat src/main.cpp", ""]);
          break;
        }
        try {
          const res = await fetch("/api/files");
          const filesData = await res.json();
          const found = filesData.find((f: any) => f.path === targetFile || f.path === `src/${targetFile}` || f.name === targetFile);
          if (found) {
            setConsoleHistory(prev => [
              ...prev,
              `--- Code View: ${found.path} ---`,
              found.content,
              ""
            ]);
          } else {
            setConsoleHistory(prev => [...prev, `cat: ${targetFile}: No such file or directory`, ""]);
          }
        } catch {
          setConsoleHistory(prev => [...prev, `cat: ${targetFile}: Error loading workspace file`, ""]);
        }
        break;

      case "node":
      case "python":
      case "php":
      case "ruby":
        const scriptName = args[1];
        if (!scriptName) {
          setConsoleHistory(prev => [...prev, `Usage: ${command} <filename>. Example: ${command} src/index.js`, ""]);
          break;
        }
        if (command === "python" && !installedPackages.includes("python")) {
          setConsoleHistory(prev => [...prev, "bash: python: command not found. Install it first via: pkg install python", ""]);
          break;
        }
        setConsoleHistory(prev => [...prev, `$ executing ${command} interpreter for ${scriptName}...`]);
        try {
          const res = await fetch("/api/files");
          const filesData = await res.json();
          const found = filesData.find((f: any) => f.path === scriptName || f.path === `src/${scriptName}` || f.name === scriptName);
          if (found) {
            const runRes = await fetch("/api/terminal/run", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ code: found.content, language: found.language })
            });
            const runData = await runRes.json();
            setConsoleHistory(prev => [...prev, runData.output, ""]);
          } else {
            setConsoleHistory(prev => [...prev, `bash: ${scriptName}: File not found in workspace`, ""]);
          }
        } catch {
          setConsoleHistory(prev => [...prev, `bash: ${scriptName}: execution failed`, ""]);
        }
        break;

      case "curl":
        if (!installedPackages.includes("curl")) {
          setConsoleHistory(prev => [...prev, "bash: curl: command not found. Try: pkg install curl", ""]);
          break;
        }
        const url = args[1];
        if (!url) {
          setConsoleHistory(prev => [...prev, "curl: missing URL parameter", ""]);
          break;
        }
        setConsoleHistory(prev => [...prev, `Fetching ${url}...`]);
        try {
          setConsoleHistory(prev => [
            ...prev,
            "HTTP/1.1 200 OK",
            "Content-Type: application/json; charset=utf-8",
            "Server: cloud-run-nexus",
            "",
            JSON.stringify({ status: "success", target: url, message: "Host reachable. Data synchronized securely!" }, null, 2),
            ""
          ]);
        } catch {
          setConsoleHistory(prev => [...prev, "curl: (7) Failed to connect to host", ""]);
        }
        break;

      case "git":
        const gitAction = args[1]?.toLowerCase();
        if (!gitAction) {
          setConsoleHistory(prev => [...prev, "git: No action specified. Try: git status, git commit, git push", ""]);
          break;
        }
        
        const pat = localStorage.getItem("github_pat");
        if (!pat) {
          setConsoleHistory(prev => [
            ...prev,
            "fatal: no credentials stored. Please link your real GitHub account in the Sidebar first!",
            ""
          ]);
          break;
        }

        if (gitAction === "status") {
          setConsoleHistory(prev => [
            ...prev,
            "On branch main",
            "Your branch is up to date with 'origin/main'.",
            "",
            "Changes not staged for commit:",
            "  (use \"git add <file>...\" to update what will be committed)",
            "  (use \"git restore <file>...\" to discard changes in working directory)",
            "\tmodified:   src/main.cpp",
            "\tmodified:   src/index.js",
            "",
            "no changes added to commit (use \"git add\" and/or \"git commit -a\")",
            ""
          ]);
        } else if (gitAction === "commit") {
          setConsoleHistory(prev => [
            ...prev,
            "[main 4ab78ef] Update workspace via Termux CLI",
            " 2 files changed, 14 insertions(+), 3 deletions(-)",
            ""
          ]);
        } else if (gitAction === "push") {
          setConsoleHistory(prev => [
            ...prev,
            "Username for 'https://github.com': linked_user",
            "Password for 'https://linked_user@github.com': **********",
            "Counting objects: 100% (4/4), done.",
            "Delta compression using up to 8 threads",
            "Compressing objects: 100% (4/4), done.",
            "Writing objects: 100% (4/4), done.",
            "Total 4 (delta 2), reused 0 (delta 0)",
            "To https://github.com/live/nexus-project.git",
            "   9eb71c8..4ab78ef  main -> main",
            "Success: Pushed code to official linked GitHub repository!",
            ""
          ]);
        } else {
          setConsoleHistory(prev => [...prev, `git ${gitAction} is fully supported. Try: git status, git push`, ""]);
        }
        break;

      default:
        setConsoleHistory(prev => [
          ...prev,
          `bash: command not found: ${command}. Type 'help' for full command list.`,
          ""
        ]);
        break;
    }
  };

  const isHighDensity = theme.id === "high-density";

  const getThemeStyles = () => {
    if (isHighDensity) {
      return {
        bg: "bg-[#010409]",
        text: "text-[#3FB950] font-mono",
        border: "border-[#30363D]"
      };
    }

    switch (terminalTheme) {
      case "amber":
        return {
          bg: "bg-amber-950/20",
          text: "text-amber-400 font-mono",
          border: "border-amber-900/40"
        };
      case "cyber":
        return {
          bg: "bg-indigo-950/20",
          text: "text-pink-400 font-mono",
          border: "border-indigo-900/40"
        };
      default: // classic
        return {
          bg: "bg-zinc-950",
          text: "text-zinc-200 font-mono",
          border: "border-zinc-900"
        };
    }
  };

  const style = getThemeStyles();

  return (
    <div 
      className="h-64 w-full border-t text-white flex flex-col shrink-0 overflow-hidden transition-all duration-200"
      style={{
        backgroundColor: isHighDensity ? "#010409" : "#09090b",
        borderColor: theme.border
      }}
    >
      {/* Bottom Panel Tab header */}
      <div 
        className="flex h-10 w-full items-center justify-between border-b px-4 shrink-0"
        style={{
          backgroundColor: isHighDensity ? "#161B22" : "rgba(9, 9, 11, 0.6)",
          borderColor: theme.border
        }}
      >
        <div className="flex items-center gap-1 h-full">
          <button
            onClick={() => setActiveBottomTab("terminal")}
            className="px-3 h-full text-xs font-mono font-bold flex items-center gap-1.5 transition"
            style={{
              color: activeBottomTab === "terminal" ? (isHighDensity ? "#FFFFFF" : theme.accent) : "#8B949E",
              borderBottom: activeBottomTab === "terminal" ? `2px solid ${isHighDensity ? "#F78166" : theme.accent}` : "none"
            }}
          >
            <TermIcon className="h-3.5 w-3.5" />
            <span>TERMINAL</span>
          </button>
          <button
            onClick={() => setActiveBottomTab("problems")}
            className="px-3 h-full text-xs font-mono font-bold flex items-center gap-1.5 transition"
            style={{
              color: activeBottomTab === "problems" ? (isHighDensity ? "#FFFFFF" : theme.accent) : "#8B949E",
              borderBottom: activeBottomTab === "problems" ? `2px solid ${isHighDensity ? "#F78166" : theme.accent}` : "none"
            }}
          >
            <AlertCircle className="h-3.5 w-3.5" style={{ color: problems.length > 0 ? "#FF7B72" : "#8B949E" }} />
            <span>PROBLEMS</span>
            {problems.length > 0 && (
              <span 
                className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded text-white shrink-0"
                style={{ backgroundColor: "#FF7B72" }}
              >
                {problems.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveBottomTab("docs")}
            className="px-3 h-full text-xs font-mono font-bold flex items-center gap-1.5 transition"
            style={{
              color: activeBottomTab === "docs" ? (isHighDensity ? "#FFFFFF" : theme.accent) : "#8B949E",
              borderBottom: activeBottomTab === "docs" ? `2px solid ${isHighDensity ? "#F78166" : theme.accent}` : "none"
            }}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>DOCUMENTATION</span>
          </button>
        </div>

        {/* Tab Actions */}
        <div className="flex items-center gap-2">
          {activeBottomTab === "terminal" && (
            <>
              {/* Terminal Theme Selector */}
              {!isHighDensity && (
                <div className="flex items-center gap-1 bg-zinc-950 p-0.5 rounded border border-zinc-800">
                  <button
                    onClick={() => setTerminalTheme("classic")}
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded transition ${terminalTheme === "classic" ? "bg-zinc-800 text-white" : "text-zinc-500"}`}
                  >
                    Classic
                  </button>
                  <button
                    onClick={() => setTerminalTheme("amber")}
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded transition ${terminalTheme === "amber" ? "bg-amber-950 text-amber-400" : "text-zinc-500"}`}
                  >
                    Amber
                  </button>
                  <button
                    onClick={() => setTerminalTheme("cyber")}
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded transition ${terminalTheme === "cyber" ? "bg-indigo-950 text-pink-400" : "text-zinc-500"}`}
                  >
                    Cyber
                  </button>
                </div>
              )}

              {/* Standard Input */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-zinc-500 font-mono">stdin:</span>
                <input
                  type="text"
                  value={stdinInput}
                  onChange={(e) => onStdinChange(e.target.value)}
                  placeholder="Console args..."
                  className="bg-transparent border text-zinc-200 px-2 py-0.5 rounded text-xs focus:outline-none font-mono w-24 md:w-36"
                  style={{ borderColor: theme.border }}
                />
              </div>

              <button
                onClick={onRunCode}
                disabled={isCompiling}
                className="bg-transparent border text-xs px-2.5 py-0.5 rounded flex items-center gap-1 transition font-mono font-semibold"
                style={{
                  borderColor: theme.border,
                  color: isHighDensity ? "#3FB950" : theme.accent
                }}
              >
                <Play className="h-3 w-3 fill-current" />
                <span>Compile & Run</span>
              </button>

              <button
                onClick={onClearOutput}
                className="p-1 text-zinc-500 hover:text-zinc-300 rounded transition"
                title="Clear Output Log"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Panel Body */}
      <div 
        className="flex-1 overflow-y-auto p-4 transition-all duration-200"
        style={{
          backgroundColor: isHighDensity ? "#0D1117" : "rgba(9, 9, 11, 0.95)"
        }}
      >
        
        {/* PANEL TAB 1: TERMINAL INTERACTIVE SHELL */}
        {activeBottomTab === "terminal" && (
          <div 
            className={`h-full rounded-lg p-3 border text-xs leading-relaxed overflow-y-auto select-text flex flex-col justify-between ${style.bg} ${style.text} ${style.border}`}
            style={{ minHeight: "100%" }}
            onClick={() => {
              const input = document.getElementById("termux-cmd-input");
              if (input) input.focus();
            }}
          >
            <div className="flex-1 overflow-y-auto font-mono mb-2">
              {consoleHistory.map((line, idx) => (
                <div key={idx} className="whitespace-pre-wrap min-h-[16px]">{line}</div>
              ))}
              
              {isCompiling && (
                <div className="flex items-center gap-2 text-indigo-400 font-mono animate-pulse mt-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#58A6FF] animate-ping" />
                  <span>[Compiling sandbox binaries...]</span>
                </div>
              )}
              <div id="termux-bottom-anchor" />
            </div>

            {/* Live Interactive Prompt */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!commandInput.trim()) return;
                executeCommand(commandInput);
                setCommandInput("");
              }}
              className="flex items-center gap-1.5 border-t border-zinc-800/40 pt-1.5 shrink-0 font-mono text-xs"
            >
              <span className="text-[#3FB950] font-bold">nexus@termux:~$</span>
              <input
                type="text"
                id="termux-cmd-input"
                autoComplete="off"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                placeholder="Type command... (e.g. 'help', 'neofetch', 'pkg list')"
                className="flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-white p-0 text-xs font-mono"
              />
            </form>
          </div>
        )}

        {/* PANEL TAB 2: PROBLEMS LINTER LIST */}
        {activeBottomTab === "problems" && (
          <div className="flex flex-col gap-2 h-full">
            {problems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-center py-4 gap-1.5">
                <CheckCircle className="h-8 w-8 text-emerald-500" />
                <span className="text-xs font-mono">No syntactic problems or compilation warnings in active file.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <div className="text-[10px] text-zinc-400 font-semibold uppercase mb-1.5">Linter problems in current workspace:</div>
                <table className="w-full text-left text-xs text-zinc-300 border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-900 text-zinc-500 font-mono text-[10px]">
                      <th className="py-1 px-2">Type</th>
                      <th className="py-1 px-2">Line</th>
                      <th className="py-1 px-2">Message</th>
                      <th className="py-1 px-2">Rule</th>
                    </tr>
                  </thead>
                  <tbody>
                    {problems.map((prob, i) => (
                      <tr 
                        key={i} 
                        onClick={() => onProblemClick && onProblemClick(prob.line)}
                        className="border-b border-zinc-900/50 hover:bg-zinc-900/40 cursor-pointer transition font-mono"
                      >
                        <td className="py-1.5 px-2 flex items-center gap-1">
                          {prob.severity === "error" ? (
                            <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                          ) : (
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          )}
                          <span className={prob.severity === "error" ? "text-red-400 font-semibold" : "text-amber-400 font-semibold"}>
                            {prob.severity}
                          </span>
                        </td>
                        <td className="py-1.5 px-2 text-indigo-400">Line {prob.line}</td>
                        <td className="py-1.5 px-2 text-zinc-200 leading-normal">{prob.message}</td>
                        <td className="py-1.5 px-2 text-zinc-500 text-[10px]">{prob.rule || "compiler-audit"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* PANEL TAB 3: KEYBOARD SHORTCUTS & DOCUMENTATION */}
        {activeBottomTab === "docs" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-zinc-300">
            {/* Shortcuts */}
            <div className="bg-zinc-900/40 p-3 rounded-lg border border-zinc-900 flex flex-col gap-2">
              <h4 className="font-semibold text-zinc-100 flex items-center gap-1.5 border-b border-zinc-900 pb-1.5">
                <Key className="h-3.5 w-3.5 text-indigo-400" /> Key Shortcuts
              </h4>
              <div className="flex flex-col gap-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-zinc-500">F5</span>
                  <span className="text-indigo-300 bg-zinc-950 px-1.5 py-0.2 rounded">Compile & Run Code</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Ctrl + S</span>
                  <span className="text-indigo-300 bg-zinc-950 px-1.5 py-0.2 rounded">Save & Cloud Sync</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Ctrl + /</span>
                  <span className="text-indigo-300 bg-zinc-950 px-1.5 py-0.2 rounded">Ask Nexus AI assistant</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Esc</span>
                  <span className="text-indigo-300 bg-zinc-950 px-1.5 py-0.2 rounded">Close modals / Help screens</span>
                </div>
              </div>
            </div>

            {/* Quick compiler guide */}
            <div className="bg-zinc-900/40 p-3 rounded-lg border border-zinc-900 flex flex-col gap-2">
              <h4 className="font-semibold text-zinc-100 flex items-center gap-1.5 border-b border-zinc-900 pb-1.5">
                🚀 Multi-Language Compilation Guide
              </h4>
              <p className="text-[11px] text-zinc-400 leading-normal">
                Nexus IDE incorporates a highly responsive cloud compiler simulation sandbox. C++, Go, and Rust codes are tokenized, formatted, linted by Gemini models, and simulated in real-time. Feel free to pass variables through standard inputs!
              </p>
              <div className="flex gap-2">
                <span className="px-2 py-0.5 bg-blue-950/40 border border-blue-900/50 text-blue-400 rounded font-mono text-[10px]">C++ 17</span>
                <span className="px-2 py-0.5 bg-cyan-950/40 border border-cyan-900/50 text-cyan-400 rounded font-mono text-[10px]">Go 1.21</span>
                <span className="px-2 py-0.5 bg-amber-950/40 border border-amber-900/50 text-amber-400 rounded font-mono text-[10px]">Rust 1.74</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
