import React, { useState, useEffect, useRef } from "react";
import TopBar from "./components/TopBar";
import Sidebar from "./components/Sidebar";
import Editor from "./components/Editor";
import Terminal from "./components/Terminal";
import ShortcutModal from "./components/ShortcutModal";
import CommandPalette from "./components/CommandPalette";
import Hosting from "./components/Hosting";
import { ProjectFile, CollaborationRoom, ChatMessage, PluginExtension, IDETheme, LintProblem, EditorCursor } from "./types";
import { Sparkles, Shield, Mail, ArrowRight, X, FolderOpen, Code2 } from "lucide-react";

// Predefined gorgeous premium themes
const IDE_THEMES: IDETheme[] = [
  {
    id: "high-density",
    name: "Nexus High Density (Slate)",
    bgPrimary: "bg-[#0D1117]",
    bgSecondary: "bg-[#010409]",
    bgActive: "bg-[#161B22]",
    textPrimary: "#C9D1D9",
    textMuted: "#8B949E",
    accent: "#58A6FF",
    accentHover: "#1F6FEB",
    border: "#30363D",
    editorBg: "#0D1117",
    editorGutter: "#010409",
    editorLineNumber: "#8B949E"
  },
  {
    id: "midnight",
    name: "Nexus Midnight",
    bgPrimary: "bg-zinc-950",
    bgSecondary: "bg-zinc-900/60",
    bgActive: "bg-zinc-800",
    textPrimary: "#f4f4f5",
    textMuted: "#71717a",
    accent: "#6366f1",
    accentHover: "#4f46e5",
    border: "#27272a",
    editorBg: "#09090b",
    editorGutter: "#121214",
    editorLineNumber: "#52525b"
  },
  {
    id: "dracula",
    name: "Dracula Dracula (Vampire)",
    bgPrimary: "bg-zinc-950",
    bgSecondary: "bg-purple-950/20",
    bgActive: "bg-purple-900/40",
    textPrimary: "#f8f8f2",
    textMuted: "#6272a4",
    accent: "#ff79c6",
    accentHover: "#bd93f9",
    border: "#44475a",
    editorBg: "#1e1f29",
    editorGutter: "#282a36",
    editorLineNumber: "#6272a4"
  },
  {
    id: "monokai",
    name: "Monokai Pro (Warm Carbon)",
    bgPrimary: "bg-neutral-950",
    bgSecondary: "bg-neutral-900",
    bgActive: "bg-neutral-800",
    textPrimary: "#f7f1ff",
    textMuted: "#72697a",
    accent: "#ffd866",
    accentHover: "#fc9867",
    border: "#2d2a2e",
    editorBg: "#19181a",
    editorGutter: "#221f22",
    editorLineNumber: "#72697a"
  },
  {
    id: "nord",
    name: "Nord Frost (Arctic Slate)",
    bgPrimary: "bg-slate-950",
    bgSecondary: "bg-slate-900/50",
    bgActive: "bg-slate-800",
    textPrimary: "#d8dee9",
    textMuted: "#4c566a",
    accent: "#88c0d0",
    accentHover: "#81a1c1",
    border: "#3b4252",
    editorBg: "#2e3440",
    editorGutter: "#242933",
    editorLineNumber: "#4c566a"
  }
];

// Predefined core plugins
const DEFAULT_PLUGINS: PluginExtension[] = [
  {
    id: "ai-linter",
    name: "Gemini Real-time Linter",
    description: "Invokes background compiler logic and parses syntax errors into matching red squigglies.",
    enabled: true,
    version: "1.2.0",
    author: "Nexus Labs",
    category: "intelligence"
  },
  {
    id: "e2e-encryption",
    name: "End-to-End Encryption Sync",
    description: "Secures all file edits and room chat messages via full 256-bit symmetric session layers.",
    enabled: true,
    version: "1.0.4",
    author: "Security Team",
    category: "utility"
  },
  {
    id: "prettier",
    name: "Prettier Auto-Formatter",
    description: "Cleans syntax spacing, corrects tab margins, and lines brackets on file save.",
    enabled: false,
    version: "3.1.0",
    author: "Community",
    category: "utility"
  }
];

export default function App() {
  // Main states
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
  const [unsavedFiles, setUnsavedFiles] = useState<Set<string>>(new Set());
  
  // AI assist states
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>([
    {
      id: "ai-init-1",
      sender: "ai",
      text: "👋 Hello! I am NEXUS AI, your embedded compiler assistant. Ask me questions, request optimizations, or let me generate code templates for you!",
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isLinting, setIsLinting] = useState(false);
  const [problems, setProblems] = useState<LintProblem[]>([]);

  // Terminal state
  const [terminalOutput, setTerminalOutput] = useState<string>("");
  const [isCompiling, setIsCompiling] = useState(false);
  const [stdinInput, setStdinInput] = useState("");

  // Collaboration and Rooms
  const [roomId, setRoomId] = useState("");
  const [activeRoom, setActiveRoom] = useState<CollaborationRoom | null>(null);
  const [userId] = useState(() => "user-" + Math.floor(Math.random() * 1000000));
  const [username, setUsername] = useState(() => "Dev-" + Math.floor(Math.random() * 1000));
  const [userCursorPos, setUserCursorPos] = useState({ row: 1, col: 1 });
  const [isSyncing, setIsSyncing] = useState(false);
  const [mobileActiveView, setMobileActiveView] = useState<"sidebar" | "editor">("editor");
  const [activeScreen, setActiveScreen] = useState<"editor" | "hosting">("editor");

  // Authentication & Modals
  const [user, setUser] = useState<{ email: string; name: string } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showTerminal, setShowTerminal] = useState(true);
  
  // Customization Themes and extensions
  const [themes] = useState<IDETheme[]>(IDE_THEMES);
  const [activeTheme, setActiveTheme] = useState<IDETheme>(IDE_THEMES[0]);
  const [plugins, setPlugins] = useState<PluginExtension[]>(DEFAULT_PLUGINS);

  // Debouncing automatic linter trigger on change
  const lintTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save toggle preferences
  const [autoSave, setAutoSave] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("nexus_auto_save");
      return saved === "true";
    } catch {
      return false;
    }
  });

  const handleToggleAutoSave = () => {
    setAutoSave((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("nexus_auto_save", String(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  // References for avoiding stale closures in timeouts
  const filesRef = useRef(files);
  const currentFilePathRef = useRef(currentFilePath);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  useEffect(() => {
    currentFilePathRef.current = currentFilePath;
  }, [currentFilePath]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (lintTimeoutRef.current) clearTimeout(lintTimeoutRef.current);
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    };
  }, []);

  // Load files on initialization
  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/files");
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setFiles(data);
        setCurrentFilePath(data[0].path);
      }
    } catch (err) {
      console.error("Failed to load files from server", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const getActiveFile = (): ProjectFile | null => {
    if (!currentFilePath) return null;
    return files.find((f) => f.path === currentFilePath) || null;
  };

  // Sync / saving code changes to server
  const handleCodeChange = (newContent: string) => {
    if (!currentFilePath) return;
    
    // Update active memory
    setFiles((prev) =>
      prev.map((f) => (f.path === currentFilePath ? { ...f, content: newContent } : f))
    );

    // Track unsaved modification states
    setUnsavedFiles((prev) => {
      const next = new Set(prev);
      next.add(currentFilePath);
      return next;
    });

    // Handle real-time linter triggers if the AI-linter extension is enabled!
    const linterEnabled = plugins.find((p) => p.id === "ai-linter")?.enabled;
    if (linterEnabled) {
      if (lintTimeoutRef.current) clearTimeout(lintTimeoutRef.current);
      lintTimeoutRef.current = setTimeout(() => {
        triggerAiLinter(newContent, getActiveFile()?.language || "javascript");
      }, 2500); // 2.5s debounce typing break
    }

    // Auto-save toggle logic whenever the user stops typing
    if (autoSave) {
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = setTimeout(() => {
        const latestPath = currentFilePathRef.current;
        const latestFiles = filesRef.current;
        if (latestPath) {
          const activeFile = latestFiles.find(f => f.path === latestPath);
          if (activeFile) {
            saveFileByPath(activeFile.path, activeFile.content, activeFile.name, activeFile.language);
          }
        }
      }, 1000); // 1s debounce typing break for auto-save
    }
  };

  const triggerAiLinter = async (code: string, language: string) => {
    setIsLinting(true);
    try {
      const res = await fetch("/api/gemini/lint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language })
      });
      const data = await res.json();
      if (data && Array.isArray(data.problems)) {
        setProblems(data.problems);
      }
    } catch (err) {
      console.error("AI linter failed", err);
    } finally {
      setIsLinting(false);
    }
  };

  const saveFileByPath = async (path: string, content: string, name: string, language: string) => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/files/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path,
          name,
          content,
          language
        })
      });
      const data = await res.json();
      if (data.success) {
        setUnsavedFiles((prev) => {
          const next = new Set(prev);
          next.delete(path);
          return next;
        });
        
        // Auto formatted on save simulation if Prettier extension active
        const prettierActive = plugins.find((p) => p.id === "prettier")?.enabled;
        if (prettierActive) {
          triggerPrettierFormat({ path, content, name, language });
        }
      }
    } catch (err) {
      console.error("Failed to save file changes", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveActiveFile = async () => {
    const active = getActiveFile();
    if (!active) return;
    await saveFileByPath(active.path, active.content, active.name, active.language);
  };

  const handleFormatActiveFile = async () => {
    const active = getActiveFile();
    if (!active) return;
    triggerPrettierFormat(active);
    
    // Auto save the newly formatted code
    setTimeout(async () => {
      const updatedActive = getActiveFile();
      if (updatedActive) {
        await saveFileByPath(updatedActive.path, updatedActive.content, updatedActive.name, updatedActive.language);
      }
    }, 100);
  };

  const handleClearCache = () => {
    if (confirm("Are you sure you want to flush all workspace session data, stored credentials, and compiled variables? This will reload Nexus IDE.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const triggerPrettierFormat = (file: ProjectFile) => {
    const spacer = "  "; // 2 space formats
    const formatted = file.content
      .split("\n")
      .map((line) => {
        // Simple trim adjustments for presentation
        if (line.trim().length === 0) return "";
        return line;
      })
      .join("\n");

    handleCodeChange(formatted);
  };

  const handleCreateFile = async (path: string, lang: string, isFolder?: boolean) => {
    const name = path.split("/").pop() || path;
    let initialContent = `// ${name}\n`;
    
    if (lang === "cpp") {
      initialContent = `// ${name}\n#include <iostream>\nusing namespace std;\nint main() {\n    cout << "Hello World C++!" << endl;\n    return 0;\n}`;
    } else if (lang === "python") {
      initialContent = `# ${name}\nprint("Hello World Python!")\n`;
    } else if (lang === "java") {
      const className = name.replace(/\.[^/.]+$/, "");
      initialContent = `// ${name}\npublic class ${className} {\n    public static void main(String[] args) {\n        System.out.println("Hello World Java!");\n    }\n}`;
    } else if (lang === "go") {
      initialContent = `package main\nimport "fmt"\nfunc main() {\n    fmt.Println("Hello World Go!")\n}`;
    } else if (lang === "rust") {
      initialContent = `fn main() {\n    println!("Hello World Rust!");\n}`;
    } else if (lang === "csharp") {
      initialContent = `using System;\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello World C#!");\n    }\n}`;
    } else if (lang === "c") {
      initialContent = `#include <stdio.h>\nint main() {\n    printf("Hello World C!\\n");\n    return 0;\n}`;
    } else if (lang === "sql") {
      initialContent = `-- SQLite query sandbox\nCREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT);\nINSERT INTO users (name) VALUES ('Alice'), ('Bob');\nSELECT * FROM users;\n`;
    } else if (lang === "php") {
      initialContent = `<?php\necho "Hello World PHP!\\n";\n`;
    } else if (lang === "ruby") {
      initialContent = `puts "Hello World Ruby!"\n`;
    } else if (lang === "swift") {
      initialContent = `print("Hello World Swift!")\n`;
    } else if (lang === "kotlin") {
      initialContent = `fun main() {\n    println("Hello World Kotlin!")\n}`;
    } else if (lang === "dart") {
      initialContent = `void main() {\n    print("Hello World Dart!");\n}`;
    } else if (lang === "r") {
      initialContent = `cat("Hello World R!\\n")\n`;
    } else if (lang === "matlab") {
      initialContent = `disp('Hello World MATLAB!')\n`;
    } else if (lang === "html") {
      initialContent = `<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="utf-8">\n  <title>${name}</title>\n</head>\n<body>\n  <h1>Hello World HTML!</h1>\n</body>\n</html>`;
    } else if (lang === "css") {
      initialContent = `body {\n  background-color: #0d1117;\n  color: #c9d1d9;\n  font-family: sans-serif;\n}`;
    } else if (lang === "assembly") {
      initialContent = `; x86_64 NASM Assembly Hello World\nsection .data\n  msg db "Hello World Assembly!", 10\n  len equ $ - msg\nsection .text\n  global _start\n_start:\n  mov rax, 1\n  mov rdi, 1\n  mov rsi, msg\n  mov rdx, len\n  syscall\n  mov rax, 60\n  mov rdi, 0\n  syscall\n`;
    } else if (lang === "bash") {
      initialContent = `#!/bin/bash\necho "Hello World Bash!"\n`;
    }

    if (isFolder) {
      initialContent = "";
    }

    setIsSyncing(true);
    try {
      const res = await fetch("/api/files/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path,
          name,
          content: initialContent,
          language: lang,
          isFolder: !!isFolder
        })
      });
      const data = await res.json();
      if (data.success) {
        setFiles((prev) => [...prev.filter(f => f.path !== path), data.file]);
        if (!isFolder) {
          setCurrentFilePath(path);
        }
      }
    } catch (e) {
      console.error("Failed to create file", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteFile = async (filePath: string) => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/files/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: filePath })
      });
      if (res.ok) {
        // If it's a folder, we need to filter out files that are within that folder path prefix
        setFiles((prev) => prev.filter((f) => f.path !== filePath && !f.path.startsWith(filePath + "/")));
        setUnsavedFiles((prev) => {
          const next = new Set(prev);
          next.delete(filePath);
          prev.forEach(p => {
            if (p.startsWith(filePath + "/")) {
              next.delete(p);
            }
          });
          return next;
        });
        if (currentFilePath === filePath || (currentFilePath && currentFilePath.startsWith(filePath + "/"))) {
          const remaining = files.filter((f) => f.path !== filePath && !f.path.startsWith(filePath + "/"));
          setCurrentFilePath(remaining.length > 0 ? remaining[0].path : null);
        }
      }
    } catch (e) {
      console.error("Delete file failed", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleImportGitHubFile = async (name: string, path: string, content: string, language: string) => {
    setIsSyncing(true);
    let finalPath = path;
    if (!finalPath.startsWith("src/")) {
      finalPath = `src/${finalPath}`;
    }
    try {
      const res = await fetch("/api/files/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: finalPath,
          name,
          content,
          language
        })
      });
      const data = await res.json();
      if (data.success) {
        setFiles((prev) => [...prev.filter(f => f.path !== finalPath), data.file]);
        setCurrentFilePath(finalPath);
        setUnsavedFiles((prev) => {
          const next = new Set(prev);
          next.delete(finalPath);
          return next;
        });
      }
    } catch (e) {
      console.error("Failed to import GitHub file", e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Active code compile / run trigger
  const handleRunCodeInTerminal = async () => {
    const active = getActiveFile();
    if (!active) return;

    setIsCompiling(true);
    setTerminalOutput("");
    try {
      const res = await fetch("/api/terminal/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: active.content,
          language: active.language,
          stdinInput
        })
      });
      const data = await res.json();
      setTerminalOutput(data.output || "Execution finished with code 0.");
    } catch (err) {
      setTerminalOutput("❌ Compiler error: Failed to fetch build execution output.");
    } finally {
      setIsCompiling(false);
    }
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K to toggle Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
      // F5 to run code
      if (e.key === "F5") {
        e.preventDefault();
        handleRunCodeInTerminal();
      }
      // Ctrl+S to save code
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSaveActiveFile();
      }
      // Esc to clear shortcuts modal
      if (e.key === "Escape") {
        setShowShortcuts(false);
        setShowAuthModal(false);
        setShowCommandPalette(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [files, currentFilePath]);

  // Collaborative Room synchronizer polling loop
  useEffect(() => {
    if (!activeRoom) return;

    const interval = setInterval(async () => {
      // Aggregate any local files updates that are unsaved to sync to peers in the room
      const filesUpdate: Record<string, string> = {};
      unsavedFiles.forEach((fPath) => {
        const fileObj = files.find((f) => f.path === fPath);
        if (fileObj) {
          filesUpdate[fPath] = fileObj.content;
        }
      });

      try {
        const res = await fetch("/api/collab/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomId: activeRoom.id,
            userId,
            filesUpdate: Object.keys(filesUpdate).length > 0 ? filesUpdate : undefined,
            cursorUpdate: {
              path: currentFilePath || "",
              row: userCursorPos.row,
              col: userCursorPos.col,
              username
            }
          })
        });
        const data = await res.json();
        if (data.success) {
          // Clear unsaved list for files that synced
          if (Object.keys(filesUpdate).length > 0) {
            setUnsavedFiles((prev) => {
              const next = new Set(prev);
              Object.keys(filesUpdate).forEach((k) => next.delete(k));
              return next;
            });
          }

          // Merge updated peer contents back to files list
          setFiles((prevFiles) =>
            prevFiles.map((file) => {
              if (data.files[file.path] !== undefined && data.files[file.path] !== file.content) {
                return { ...file, content: data.files[file.path] };
              }
              return file;
            })
          );

          // Update active cursors and chat
          setActiveRoom((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              files: data.files,
              cursors: data.cursors,
              chat: data.chat
            };
          });
        }
      } catch (err) {
        console.error("Collab sync polling issue", err);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [activeRoom, files, currentFilePath, userCursorPos, unsavedFiles, username]);

  const handleJoinRoom = async () => {
    if (!roomId.trim()) return;
    setIsSyncing(true);
    try {
      const res = await fetch("/api/collab/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: roomId.trim(),
          username,
          userId
        })
      });
      const data = await res.json();
      if (data.success) {
        setActiveRoom(data.room);
        // Refresh local files list to match room content
        fetchFiles();
      }
    } catch (e) {
      console.error("Join room failed", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSendCollabChat = async (text: string) => {
    if (!activeRoom || !text.trim()) return;
    try {
      const res = await fetch("/api/collab/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: activeRoom.id,
          userId,
          username,
          text: text.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setActiveRoom((prev) => prev ? { ...prev, chat: data.chat } : null);
      }
    } catch (err) {
      console.error("Collab chat post error", err);
    }
  };

  // AI Chat Assistant message submit
  const handleSendAiMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: "usr-" + Date.now(),
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setAiMessages((prev) => [...prev, userMsg]);
    setIsAiThinking(true);

    const active = getActiveFile();
    try {
      const res = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...aiMessages, userMsg],
          currentFileContent: active?.content || "",
          currentFilePath: active?.path || ""
        })
      });
      const data = await res.json();
      setAiMessages((prev) => [
        ...prev,
        {
          id: "ai-" + Date.now(),
          sender: "ai",
          text: data.text || "Sorry, I ran into an error generating that feedback.",
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } catch (err) {
      setAiMessages((prev) => [
        ...prev,
        {
          id: "ai-err-" + Date.now(),
          sender: "ai",
          text: "⚠️ Offline. Please ensure server environment is up and running.",
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      setIsAiThinking(false);
    }
  };

  // Custom Themes selection
  const handleSelectTheme = (id: string) => {
    const match = themes.find((t) => t.id === id);
    if (match) setActiveTheme(match);
  };

  // Plugins extensions toggling
  const handleTogglePlugin = (id: string) => {
    setPlugins((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    );
  };

  // Mock User sign-in simulation
  const [authEmail, setAuthEmail] = useState("");
  const [authPass, setAuthPass] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail) return;
    
    // Simulate Firebase Authentication profile update
    const mockUser = {
      email: authEmail,
      name: authEmail.split("@")[0].toUpperCase() + " DEV"
    };
    setUser(mockUser);
    setUsername(mockUser.name);
    setShowAuthModal(false);
    setAuthEmail("");
    setAuthPass("");
  };

  const handleSignOut = () => {
    setUser(null);
    setUsername("GuestDev-" + Math.floor(Math.random() * 1000));
  };

  // Clicking a problem in the table focuses/moves cursor
  const handleProblemClick = (line: number) => {
    setUserCursorPos({ row: line, col: 1 });
  };

  return (
    <div className={`flex h-screen w-screen flex-col overflow-hidden text-white ${activeTheme.bgPrimary}`}>
      
      {/* Top action controls bar */}
      <TopBar
        currentFile={currentFilePath}
        unsavedFiles={unsavedFiles}
        onSave={handleSaveActiveFile}
        onRunCode={handleRunCodeInTerminal}
        onShowShortcuts={() => setShowShortcuts(true)}
        user={user}
        onSignInToggle={() => {
          if (user) {
            handleSignOut();
          } else {
            setShowAuthModal(true);
          }
        }}
        roomId={roomId}
        setRoomId={setRoomId}
        onJoinRoom={handleJoinRoom}
        isSyncing={isSyncing}
        peersCount={activeRoom ? Object.keys(activeRoom.cursors).length - 1 : 0}
        activeTheme={activeTheme}
      />

      {/* Main Workspace Frame */}
      <div className="flex flex-1 w-full overflow-hidden relative">
        {activeScreen === "hosting" ? (
          <Hosting
            files={files}
            activeTheme={activeTheme}
            onBackToIde={() => setActiveScreen("editor")}
          />
        ) : (
          <>
            {/* Sidebar panels */}
            <div className={`h-full shrink-0 ${mobileActiveView === "sidebar" ? "flex w-full" : "hidden"} md:flex`}>
              <Sidebar
                files={files}
                currentFile={currentFilePath}
                onSelectFile={(path) => {
                  setCurrentFilePath(path);
                  setMobileActiveView("editor"); // Auto-switch to editor when selecting a file on mobile
                }}
                onCreateFile={(name, lang) => {
                  handleCreateFile(name, lang);
                  setMobileActiveView("editor"); // Auto-switch to editor when a file is created
                }}
                onDeleteFile={handleDeleteFile}
                aiMessages={aiMessages}
                onSendAiMessage={handleSendAiMessage}
                isAiThinking={isAiThinking}
                collabRoom={activeRoom}
                onSendCollabChat={handleSendCollabChat}
                peersCount={activeRoom ? Object.keys(activeRoom.cursors).length : 0}
                themes={themes}
                activeTheme={activeTheme}
                onSelectTheme={handleSelectTheme}
                plugins={plugins}
                onTogglePlugin={handleTogglePlugin}
                onNavigateToHosting={() => setActiveScreen("hosting")}
                onImportGitHubFile={handleImportGitHubFile}
                autoSave={autoSave}
                onToggleAutoSave={handleToggleAutoSave}
              />
            </div>

            {/* Editing Center and Terminal Output */}
            <div className={`flex-1 flex flex-col h-full overflow-hidden ${mobileActiveView === "editor" ? "flex" : "hidden"} md:flex`}>
              {/* Main coding panel */}
              <Editor
                activeFile={getActiveFile()}
                onCodeChange={handleCodeChange}
                peerCursors={activeRoom ? (Object.values(activeRoom.cursors) as EditorCursor[]).filter((c: EditorCursor) => c.userId !== userId) : []}
                activeUserId={userId}
                problems={problems}
                theme={activeTheme}
                isLinting={isLinting}
                onCursorPositionChange={(row, col) => setUserCursorPos({ row, col })}
              />

              {/* Console / Interactive Terminal */}
              {showTerminal && (
                <Terminal
                  output={terminalOutput}
                  onClearOutput={() => setTerminalOutput("")}
                  problems={problems}
                  currentFileName={currentFilePath?.split("/").pop() || "file"}
                  stdinInput={stdinInput}
                  onStdinChange={setStdinInput}
                  onRunCode={handleRunCodeInTerminal}
                  isCompiling={isCompiling}
                  onProblemClick={handleProblemClick}
                  theme={activeTheme}
                />
              )}
            </div>
          </>
        )}
      </div>

      {/* Floating mobile view toggle switcher pill */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-zinc-900/90 border border-zinc-800 shadow-2xl rounded-full p-1 flex gap-1 items-center backdrop-blur-md">
        <button
          onClick={() => setMobileActiveView("sidebar")}
          className="px-4 py-2 rounded-full text-xs font-mono font-bold transition flex items-center gap-1.5"
          style={{
            backgroundColor: mobileActiveView === "sidebar" ? activeTheme.accent : "transparent",
            color: mobileActiveView === "sidebar" ? "#010409" : "#8B949E"
          }}
        >
          <FolderOpen className="h-3.5 w-3.5" />
          <span>Files & Tools</span>
        </button>
        <button
          onClick={() => setMobileActiveView("editor")}
          className="px-4 py-2 rounded-full text-xs font-mono font-bold transition flex items-center gap-1.5"
          style={{
            backgroundColor: mobileActiveView === "editor" ? activeTheme.accent : "transparent",
            color: mobileActiveView === "editor" ? "#010409" : "#8B949E"
          }}
        >
          <Code2 className="h-3.5 w-3.5" />
          <span>Code Editor</span>
        </button>
      </div>

      {/* MODAL 1: MOCK FIREBASE OAUTH SIGN-IN */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl flex flex-col text-white">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-900 bg-zinc-900/40">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-indigo-400" />
                <h3 className="font-sans text-base font-semibold">Firebase Authentication</h3>
              </div>
              <button
                onClick={() => setShowAuthModal(false)}
                className="p-1 text-zinc-500 hover:text-zinc-200 rounded transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSignInSubmit} className="p-6 flex flex-col gap-4">
              <div className="text-center mb-1">
                <h4 className="text-sm font-semibold text-zinc-200">
                  {isSignUp ? "Create your Developer Account" : "Access Cloud Synchronization Workspace"}
                </h4>
                <p className="text-[11px] text-zinc-500 leading-normal mt-1">
                  Authenticate securely to backup your repositories, sync cursors, and unlock unlimited Gemini models.
                </p>
              </div>

              {/* Google Sign-in simulation button */}
              <button
                type="button"
                onClick={() => {
                  setUser({ email: "vipin.kumar3031988@gmail.com", name: "VIPIN KUMAR" });
                  setUsername("VIPIN KUMAR");
                  setShowAuthModal(false);
                }}
                className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 rounded-lg py-2 text-xs font-semibold flex items-center justify-center gap-2 transition"
              >
                {/* SVG for Google mono */}
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Continue with Google Sign-in</span>
              </button>

              <div className="flex items-center gap-2">
                <div className="h-px bg-zinc-900 flex-1" />
                <span className="text-[10px] text-zinc-600 font-mono">OR</span>
                <div className="h-px bg-zinc-900 flex-1" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-zinc-500 uppercase">Email Address</label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3 h-4 w-4 text-zinc-600" />
                  <input
                    type="email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="dev@nexus.io"
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-zinc-500 uppercase">Password</label>
                <input
                  type="password"
                  value={authPass}
                  onChange={(e) => setAuthPass(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg py-2.5 text-xs font-semibold flex items-center justify-center gap-1 transition"
              >
                <span>{isSignUp ? "Register Account" : "Sign In with Email"}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>

              <div className="text-center mt-1">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-[10px] text-zinc-500 hover:text-indigo-400 font-mono underline"
                >
                  {isSignUp ? "Already registered? Sign In instead" : "Create new account"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL 2: KEYBOARD SHORTCUT COMMANDS */}
      {showShortcuts && (
        <ShortcutModal onClose={() => setShowShortcuts(false)} />
      )}

      {/* MODAL 3: GLOBAL COMMAND PALETTE */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onFormatActiveFile={handleFormatActiveFile}
        onToggleTerminal={() => setShowTerminal((prev) => !prev)}
        onClearCache={handleClearCache}
        onSelectTheme={(theme) => handleSelectTheme(theme.id)}
        themes={themes}
        activeTheme={activeTheme}
        autoSave={autoSave}
        onToggleAutoSave={handleToggleAutoSave}
        onShowShortcuts={() => setShowShortcuts(true)}
        onRunCode={handleRunCodeInTerminal}
      />

    </div>
  );
}
