import React, { useState } from "react";
import { 
  FolderOpen, Bot, Users, Settings, Sparkles, Plus, Trash2, 
  MessageSquare, Send, CheckCircle, HelpCircle, Laptop, Cpu, BookOpen,
  Github, GitBranch, GitFork, GitCommit, Key, ExternalLink, RefreshCw, LogOut, Lock, Globe,
  ChevronRight, ChevronDown, Folder, FolderPlus, Save
} from "lucide-react";
import { ProjectFile, CollaborationRoom, ChatMessage, PluginExtension, IDETheme } from "../types";

interface SidebarProps {
  files: ProjectFile[];
  currentFile: string | null;
  onSelectFile: (path: string) => void;
  onCreateFile: (path: string, lang: string, isFolder?: boolean) => void;
  onDeleteFile: (path: string) => void;
  
  // AI assistant states
  aiMessages: ChatMessage[];
  onSendAiMessage: (text: string) => void;
  isAiThinking: boolean;
  
  // Collab state
  collabRoom: CollaborationRoom | null;
  onSendCollabChat: (text: string) => void;
  peersCount: number;
  
  // Custom Themes & Extensions
  themes: IDETheme[];
  activeTheme: IDETheme;
  onSelectTheme: (id: string) => void;
  plugins: PluginExtension[];
  onTogglePlugin: (id: string) => void;

  // New navigation and imports
  onNavigateToHosting: () => void;
  onImportGitHubFile: (name: string, path: string, content: string, language: string) => void;

  // Auto save
  autoSave?: boolean;
  onToggleAutoSave?: () => void;
}

export default function Sidebar({
  files,
  currentFile,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
  
  aiMessages,
  onSendAiMessage,
  isAiThinking,
  
  collabRoom,
  onSendCollabChat,
  peersCount,
  
  themes,
  activeTheme,
  onSelectTheme,
  plugins,
  onTogglePlugin,

  onNavigateToHosting,
  onImportGitHubFile,

  autoSave = false,
  onToggleAutoSave
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<"explorer" | "ai" | "collab" | "github" | "plugins" | "settings">("explorer");

  // GitHub Integration States
  const [gitPat, setGitPat] = useState(() => localStorage.getItem("github_pat") || "");
  const [gitUser, setGitUser] = useState<any>(null);
  const [gitRepos, setGitRepos] = useState<any[]>([]);
  const [gitSelectedRepo, setGitSelectedRepo] = useState<any>(null);
  const [gitSearch, setGitSearch] = useState("");
  const [gitLoading, setGitLoading] = useState(false);
  const [gitError, setGitError] = useState("");
  
  // Create Repo States
  const [newRepoName, setNewRepoName] = useState("");
  const [newRepoDesc, setNewRepoDesc] = useState("");
  const [newRepoPrivate, setNewRepoPrivate] = useState(false);
  const [repoCreating, setRepoCreating] = useState(false);
  
  // Fork Repo States
  const [forkTarget, setForkTarget] = useState("");
  const [forking, setForking] = useState(false);
  
  // Push Files States
  const [pushSelectedFiles, setPushSelectedFiles] = useState<string[]>([]);
  const [pushCommitMsg, setPushCommitMsg] = useState("Update files via Nexus IDE");
  const [pushing, setPushing] = useState(false);
  const [pushStatus, setPushStatus] = useState(""); // progress status
  const [pushSuccessUrl, setPushSuccessUrl] = useState("");

  // GitHub repo files states for direct edits
  const [gitRepoFiles, setGitRepoFiles] = useState<any[]>([]);
  const [gitFilesLoading, setGitFilesLoading] = useState(false);
  const [gitCurrentPath, setGitCurrentPath] = useState("");

  const fetchGitRepoFiles = async (path: string = "") => {
    if (!gitSelectedRepo || !gitPat) return;
    setGitFilesLoading(true);
    try {
      const owner = gitSelectedRepo.owner.login;
      const repo = gitSelectedRepo.name;
      const branch = gitSelectedRepo.default_branch || "main";
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`, {
        headers: {
          "Authorization": `token ${gitPat}`,
          "Accept": "application/vnd.github.v3+json"
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setGitRepoFiles(data);
          setGitCurrentPath(path);
        } else {
          setGitRepoFiles([]);
        }
      } else {
        setGitRepoFiles([]);
      }
    } catch (err) {
      console.error("Error fetching repo contents:", err);
      setGitRepoFiles([]);
    } finally {
      setGitFilesLoading(false);
    }
  };

  React.useEffect(() => {
    if (gitSelectedRepo && gitPat) {
      fetchGitRepoFiles("");
    } else {
      setGitRepoFiles([]);
      setGitCurrentPath("");
    }
  }, [gitSelectedRepo, gitPat]);

  const handleLoadGitFileToWorkspace = async (fileItem: any) => {
    if (!gitPat) return;
    setPushStatus(`Loading ${fileItem.name} into editor...`);
    try {
      const res = await fetch(fileItem.url, {
        headers: {
          "Authorization": `token ${gitPat}`,
          "Accept": "application/vnd.github.v3+json"
        }
      });
      if (res.ok) {
        const fileData = await res.json();
        if (fileData.content) {
          // Decode Base64 content
          const decoded = decodeURIComponent(
            atob(fileData.content.replace(/\s/g, ""))
              .split("")
              .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
              .join("")
          );
          // Get language based on extension
          const ext = fileItem.name.split(".").pop() || "txt";
          let lang = "javascript";
          if (["cpp", "h", "hpp"].includes(ext)) lang = "cpp";
          else if (ext === "go") lang = "go";
          else if (ext === "rs") lang = "rust";
          else if (ext === "html") lang = "html";
          else if (ext === "css") lang = "css";
          
          // Call parent callback
          onImportGitHubFile(fileItem.name, fileItem.path, decoded, lang);
          setPushStatus(`Loaded ${fileItem.name} successfully! Click Save and use the Run code button to compile.`);
        }
      }
    } catch (err: any) {
      setGitError(`Failed to load file content: ${err.message}`);
    }
  };

  const fetchGitHubDetails = async (patValue: string) => {
    if (!patValue) return;
    setGitLoading(true);
    setGitError("");
    try {
      // 1. Fetch User
      const userRes = await fetch("https://api.github.com/user", {
        headers: {
          "Authorization": `token ${patValue}`,
          "Accept": "application/vnd.github.v3+json"
        }
      });
      if (!userRes.ok) {
        throw new Error(`Authentication failed (${userRes.status}). Check your token.`);
      }
      const userData = await userRes.json();
      setGitUser(userData);

      // 2. Fetch Repositories
      const reposRes = await fetch("https://api.github.com/user/repos?sort=updated&per_page=50", {
        headers: {
          "Authorization": `token ${patValue}`,
          "Accept": "application/vnd.github.v3+json"
        }
      });
      if (reposRes.ok) {
        const reposData = await reposRes.json();
        setGitRepos(reposData);
        if (reposData.length > 0) {
          setGitSelectedRepo(reposData[0]);
        }
      }
    } catch (err: any) {
      setGitError(err.message || "Failed to fetch GitHub data.");
      setGitUser(null);
    } finally {
      setGitLoading(false);
    }
  };

  React.useEffect(() => {
    if (gitPat) {
      fetchGitHubDetails(gitPat);
    } else {
      setGitUser(null);
      setGitRepos([]);
      setGitSelectedRepo(null);
    }
  }, [gitPat]);

  React.useEffect(() => {
    if (files.length > 0) {
      setPushSelectedFiles(files.map(f => f.path));
    }
  }, [files]);

  const handleCreateRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRepoName.trim()) return;
    setRepoCreating(true);
    setGitError("");
    setPushStatus("");
    try {
      const res = await fetch("https://api.github.com/user/repos", {
        method: "POST",
        headers: {
          "Authorization": `token ${gitPat}`,
          "Accept": "application/vnd.github.v3+json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: newRepoName.trim(),
          description: newRepoDesc.trim(),
          private: newRepoPrivate,
          auto_init: true
        })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to create repository.");
      }
      const data = await res.json();
      setGitRepos(prev => [data, ...prev]);
      setGitSelectedRepo(data);
      setNewRepoName("");
      setNewRepoDesc("");
      setPushStatus("Repository created successfully with main branch!");
    } catch (err: any) {
      setGitError(err.message || "Failed to create repo.");
    } finally {
      setRepoCreating(false);
    }
  };

  const handleForkRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forkTarget.trim() || !forkTarget.includes("/")) {
      setGitError("Please specify repo in owner/repo format.");
      return;
    }
    setForking(true);
    setGitError("");
    setPushStatus("");
    try {
      const [owner, name] = forkTarget.split("/");
      const res = await fetch(`https://api.github.com/repos/${owner.trim()}/${name.trim()}/forks`, {
        method: "POST",
        headers: {
          "Authorization": `token ${gitPat}`,
          "Accept": "application/vnd.github.v3+json",
          "Content-Type": "application/json"
        }
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to fork repository.");
      }
      const data = await res.json();
      setGitRepos(prev => [data, ...prev]);
      setGitSelectedRepo(data);
      setForkTarget("");
      setPushStatus("Forking started successfully! Fetching status in background...");
    } catch (err: any) {
      setGitError(err.message || "Failed to fork repo.");
    } finally {
      setForking(false);
    }
  };

  const handlePushFiles = async () => {
    if (!gitSelectedRepo || pushSelectedFiles.length === 0) {
      setGitError("Please select a repository and at least one file.");
      return;
    }
    setPushing(true);
    setPushStatus("Starting commit push sequence...");
    setPushSuccessUrl("");
    setGitError("");

    try {
      const owner = gitSelectedRepo.owner.login;
      const repo = gitSelectedRepo.name;
      const branch = gitSelectedRepo.default_branch || "main";

      for (let i = 0; i < pushSelectedFiles.length; i++) {
        const filePath = pushSelectedFiles[i];
        const fileObj = files.find(f => f.path === filePath);
        if (!fileObj) continue;

        setPushStatus(`Processing ${fileObj.name} (${i + 1}/${pushSelectedFiles.length})...`);

        const bytes = new TextEncoder().encode(fileObj.content);
        const binString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
        const base64Content = btoa(binString);

        let sha = "";
        try {
          const checkRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`, {
            headers: {
              "Authorization": `token ${gitPat}`,
              "Accept": "application/vnd.github.v3+json"
            }
          });
          if (checkRes.ok) {
            const checkData = await checkRes.json();
            sha = checkData.sha;
          }
        } catch (e) {
          // File does not exist yet in target repo
        }

        setPushStatus(`Committing ${fileObj.name} to GitHub...`);
        const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
          method: "PUT",
          headers: {
            "Authorization": `token ${gitPat}`,
            "Accept": "application/vnd.github.v3+json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            message: `${pushCommitMsg}\n\nCommitted from Nexus IDE`,
            content: base64Content,
            sha: sha || undefined,
            branch
          })
        });

        if (!commitRes.ok) {
          const errData = await commitRes.json();
          throw new Error(`Failed to commit ${fileObj.name}: ${errData.message}`);
        }
      }

      setPushStatus("All selected files successfully committed and pushed!");
      setPushSuccessUrl(`https://github.com/${owner}/${repo}/tree/${branch}`);
    } catch (err: any) {
      setGitError(err.message || "Failed to commit & push files.");
    } finally {
      setPushing(false);
    }
  };
  
  // Explorer helper variables
  const [newFileName, setNewFileName] = useState("");
  const [newFileLang, setNewFileLang] = useState("python");
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [createParentPath, setCreateParentPath] = useState("");
  const [expandedPaths, setExpandedPaths] = useState<Record<string, boolean>>({ "src": true });
  
  // AI query helper
  const [aiInput, setAiInput] = useState("");
  
  // Collaboration room chat helper
  const [roomInput, setRoomInput] = useState("");

  const handleCreateFileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    
    // Auto appending extension if missing
    let finalName = newFileName.trim();
    let detectedLang = newFileLang;
    const ext = finalName.split(".").pop()?.toLowerCase();

    if (!isCreatingFolder) {
      if (ext && ext !== finalName.toLowerCase()) {
        switch (ext) {
          case "py": detectedLang = "python"; break;
          case "js": detectedLang = "javascript"; break;
          case "ts": detectedLang = "typescript"; break;
          case "tsx": detectedLang = "typescript"; break;
          case "jsx": detectedLang = "javascript"; break;
          case "java": detectedLang = "java"; break;
          case "cs": detectedLang = "csharp"; break;
          case "cpp": detectedLang = "cpp"; break;
          case "cc": detectedLang = "cpp"; break;
          case "h": detectedLang = "cpp"; break;
          case "c": detectedLang = "c"; break;
          case "go": detectedLang = "go"; break;
          case "rs": detectedLang = "rust"; break;
          case "sql": detectedLang = "sql"; break;
          case "php": detectedLang = "php"; break;
          case "rb": detectedLang = "ruby"; break;
          case "swift": detectedLang = "swift"; break;
          case "kt": detectedLang = "kotlin"; break;
          case "kts": detectedLang = "kotlin"; break;
          case "dart": detectedLang = "dart"; break;
          case "r": detectedLang = "r"; break;
          case "m": detectedLang = "matlab"; break;
          case "html": detectedLang = "html"; break;
          case "css": detectedLang = "css"; break;
          case "asm": detectedLang = "assembly"; break;
          case "s": detectedLang = "assembly"; break;
          case "sh": detectedLang = "bash"; break;
          case "bash": detectedLang = "bash"; break;
          default: detectedLang = "text"; break;
        }
      } else {
        // Append appropriate fallback extensions based on selected drop-down language
        switch (newFileLang) {
          case "python": finalName += ".py"; break;
          case "javascript": finalName += ".js"; break;
          case "java": finalName += ".java"; break;
          case "typescript": finalName += ".ts"; break;
          case "csharp": finalName += ".cs"; break;
          case "cpp": finalName += ".cpp"; break;
          case "c": finalName += ".c"; break;
          case "go": finalName += ".go"; break;
          case "rust": finalName += ".rs"; break;
          case "sql": finalName += ".sql"; break;
          case "php": finalName += ".php"; break;
          case "ruby": finalName += ".rb"; break;
          case "swift": finalName += ".swift"; break;
          case "kotlin": finalName += ".kt"; break;
          case "dart": finalName += ".dart"; break;
          case "r": finalName += ".r"; break;
          case "matlab": finalName += ".m"; break;
          case "html": finalName += ".html"; break;
          case "css": finalName += ".css"; break;
          case "assembly": finalName += ".asm"; break;
          case "bash": finalName += ".sh"; break;
        }
      }
    }

    // Determine target full path
    let path = "";
    if (createParentPath) {
      path = `${createParentPath}/${finalName}`;
    } else {
      // If no parent path is active and they typed a folder-nested name directly, respect it.
      // Else, default to "src/finalName" to keep their project neat.
      if (finalName.includes("/")) {
        path = finalName;
      } else {
        path = `src/${finalName}`;
      }
    }
    
    onCreateFile(path, isCreatingFolder ? "folder" : detectedLang, isCreatingFolder);
    
    // Automatically expand the parent path if creating inside a folder
    if (createParentPath) {
      setExpandedPaths(prev => ({ ...prev, [createParentPath]: true }));
    }
    
    setNewFileName("");
    setIsCreating(false);
    setCreateParentPath("");
    setIsCreatingFolder(false);
  };

  const triggerAiAction = (promptText: string) => {
    onSendAiMessage(promptText);
  };

  // Get language file extensions or colors (extended to support all 20 languages)
  const getLangBadge = (lang: string) => {
    switch (lang) {
      case "python": return { text: "PY", bg: "bg-emerald-950 text-emerald-400 border-emerald-900" };
      case "javascript": return { text: "JS", bg: "bg-yellow-950 text-yellow-400 border-yellow-900" };
      case "typescript": return { text: "TS", bg: "bg-sky-950 text-sky-400 border-sky-900" };
      case "java": return { text: "JAVA", bg: "bg-orange-950 text-orange-400 border-orange-900" };
      case "csharp": return { text: "C#", bg: "bg-purple-950 text-purple-400 border-purple-900" };
      case "cpp": return { text: "C++", bg: "bg-blue-950 text-blue-400 border-blue-900" };
      case "c": return { text: "C", bg: "bg-indigo-950 text-indigo-400 border-indigo-900" };
      case "go": return { text: "GO", bg: "bg-cyan-950 text-cyan-400 border-cyan-900" };
      case "rust": return { text: "RUST", bg: "bg-amber-950 text-amber-400 border-amber-900" };
      case "sql": return { text: "SQL", bg: "bg-teal-950 text-teal-400 border-teal-900" };
      case "php": return { text: "PHP", bg: "bg-rose-950 text-rose-400 border-rose-900" };
      case "ruby": return { text: "RUBY", bg: "bg-red-950 text-red-400 border-red-900" };
      case "swift": return { text: "SWIFT", bg: "bg-orange-900 text-orange-200 border-orange-850" };
      case "kotlin": return { text: "KOTLIN", bg: "bg-violet-950 text-violet-400 border-violet-900" };
      case "dart": return { text: "DART", bg: "bg-cyan-900 text-cyan-200 border-cyan-850" };
      case "r": return { text: "R", bg: "bg-blue-900 text-blue-200 border-blue-850" };
      case "matlab": return { text: "MATLAB", bg: "bg-yellow-900 text-yellow-250 border-yellow-850" };
      case "html": return { text: "HTML", bg: "bg-orange-950 text-orange-400 border-orange-900" };
      case "css": return { text: "CSS", bg: "bg-pink-950 text-pink-400 border-pink-900" };
      case "assembly": return { text: "ASM", bg: "bg-zinc-800 text-zinc-300 border-zinc-700" };
      case "bash": return { text: "BASH", bg: "bg-lime-950 text-lime-400 border-lime-900" };
      case "folder": return { text: "DIR", bg: "bg-zinc-950 text-indigo-400 border-indigo-950" };
      default: return { text: "TXT", bg: "bg-zinc-900 text-zinc-400 border-zinc-800" };
    }
  };

  const isHighDensity = activeTheme.id === "high-density";

  return (
    <aside 
      className="flex h-full shrink-0 flex-col border-r text-white select-none transition-all duration-200"
      style={{
        width: isHighDensity ? "220px" : "320px",
        backgroundColor: isHighDensity ? "#010409" : "#09090b",
        borderColor: activeTheme.border,
      }}
    >
      {/* Sidebar Icon Navigation Rail */}
      <div 
        className="flex w-full h-11 items-center border-b px-1 gap-0.5"
        style={{
          borderColor: activeTheme.border,
          backgroundColor: isHighDensity ? "#161B22" : "rgba(9, 9, 11, 0.4)",
        }}
      >
        <button
          onClick={() => setActiveTab("explorer")}
          className="flex-1 py-1.5 rounded flex flex-col items-center justify-center text-[10px] font-medium transition gap-1"
          style={{
            backgroundColor: activeTab === "explorer" ? (isHighDensity ? "#0D1117" : "#18181b") : "transparent",
            color: activeTab === "explorer" ? activeTheme.accent : "#8B949E",
            borderBottom: isHighDensity && activeTab === "explorer" ? `2px solid #F78166` : "none",
          }}
        >
          <FolderOpen className="h-3.5 w-3.5" />
          <span className={isHighDensity ? "text-[9px]" : "text-[10px]"}>Files</span>
        </button>
        <button
          onClick={() => setActiveTab("ai")}
          className="flex-1 py-1.5 rounded flex flex-col items-center justify-center text-[10px] font-medium transition gap-1 relative"
          style={{
            backgroundColor: activeTab === "ai" ? (isHighDensity ? "#0D1117" : "#18181b") : "transparent",
            color: activeTab === "ai" ? activeTheme.accent : "#8B949E",
            borderBottom: isHighDensity && activeTab === "ai" ? `2px solid #F78166` : "none",
          }}
        >
          <Bot className="h-3.5 w-3.5" />
          <span className={isHighDensity ? "text-[9px]" : "text-[10px]"}>AI</span>
          <span className="absolute top-1.5 right-3 h-1 w-1 rounded-full bg-[#58A6FF]" />
        </button>
        <button
          onClick={() => setActiveTab("collab")}
          className="flex-1 py-1.5 rounded flex flex-col items-center justify-center text-[10px] font-medium transition gap-1"
          style={{
            backgroundColor: activeTab === "collab" ? (isHighDensity ? "#0D1117" : "#18181b") : "transparent",
            color: activeTab === "collab" ? activeTheme.accent : "#8B949E",
            borderBottom: isHighDensity && activeTab === "collab" ? `2px solid #F78166` : "none",
          }}
        >
          <Users className="h-3.5 w-3.5" />
          <span className={isHighDensity ? "text-[9px]" : "text-[10px]"}>Sync</span>
        </button>
        <button
          onClick={() => setActiveTab("github")}
          className="flex-1 py-1.5 rounded flex flex-col items-center justify-center text-[10px] font-medium transition gap-1"
          style={{
            backgroundColor: activeTab === "github" ? (isHighDensity ? "#0D1117" : "#18181b") : "transparent",
            color: activeTab === "github" ? activeTheme.accent : "#8B949E",
            borderBottom: isHighDensity && activeTab === "github" ? `2px solid #F78166` : "none",
          }}
        >
          <Github className="h-3.5 w-3.5" />
          <span className={isHighDensity ? "text-[9px]" : "text-[10px]"}>GitHub</span>
        </button>
        <button
          onClick={() => setActiveTab("plugins")}
          className="flex-1 py-1.5 rounded flex flex-col items-center justify-center text-[10px] font-medium transition gap-1"
          style={{
            backgroundColor: activeTab === "plugins" ? (isHighDensity ? "#0D1117" : "#18181b") : "transparent",
            color: activeTab === "plugins" ? activeTheme.accent : "#8B949E",
            borderBottom: isHighDensity && activeTab === "plugins" ? `2px solid #F78166` : "none",
          }}
        >
          <Cpu className="h-3.5 w-3.5" />
          <span className={isHighDensity ? "text-[9px]" : "text-[10px]"}>Plugins</span>
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className="flex-1 py-1.5 rounded flex flex-col items-center justify-center text-[10px] font-medium transition gap-1"
          style={{
            backgroundColor: activeTab === "settings" ? (isHighDensity ? "#0D1117" : "#18181b") : "transparent",
            color: activeTab === "settings" ? activeTheme.accent : "#8B949E",
            borderBottom: isHighDensity && activeTab === "settings" ? `2px solid #F78166` : "none",
          }}
        >
          <Settings className="h-3.5 w-3.5" />
          <span className={isHighDensity ? "text-[9px]" : "text-[10px]"}>Themes</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col h-full">
        
        {/* TAB 1: WORKSPACE FILES EXPLORER */}
        {activeTab === "explorer" && (
          <div className="flex flex-col h-full justify-between flex-1">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">Workspace Files</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setCreateParentPath("");
                      setIsCreatingFolder(false);
                      setIsCreating(!isCreating || isCreatingFolder);
                    }}
                    className="p-1 rounded bg-zinc-900 hover:bg-zinc-850 text-zinc-350 hover:text-indigo-400 border border-zinc-800 transition"
                    title="Create New File at Root"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setCreateParentPath("");
                      setIsCreatingFolder(true);
                      setIsCreating(!isCreating || !isCreatingFolder);
                    }}
                    className="p-1 rounded bg-zinc-900 hover:bg-zinc-850 text-zinc-350 hover:text-indigo-400 border border-zinc-800 transition"
                    title="Create New Folder at Root"
                  >
                    <FolderPlus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Create file/folder inline form */}
              {isCreating && (
                <form onSubmit={handleCreateFileSubmit} className="p-3 bg-zinc-900/80 rounded-lg border border-zinc-800 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[10px] text-indigo-400 font-bold uppercase font-mono tracking-wider">
                    <span>{isCreatingFolder ? "📁 Create Folder" : "📄 Create File"}</span>
                    {createParentPath && (
                      <span className="text-zinc-500 lowercase font-medium">in {createParentPath}/</span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    placeholder={isCreatingFolder ? "e.g. components" : "e.g. hello.py"}
                    required
                    autoFocus
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500 font-mono text-zinc-100"
                  />
                  <div className="flex gap-2 items-center">
                    {!isCreatingFolder && (
                      <select
                        value={newFileLang}
                        onChange={(e) => setNewFileLang(e.target.value)}
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500 font-mono text-zinc-300"
                      >
                        <option value="python">Python</option>
                        <option value="javascript">JavaScript</option>
                        <option value="typescript">TypeScript</option>
                        <option value="java">Java</option>
                        <option value="csharp">C#</option>
                        <option value="cpp">C++</option>
                        <option value="c">C</option>
                        <option value="go">Go</option>
                        <option value="rust">Rust</option>
                        <option value="sql">SQL</option>
                        <option value="php">PHP</option>
                        <option value="ruby">Ruby</option>
                        <option value="swift">Swift</option>
                        <option value="kotlin">Kotlin</option>
                        <option value="dart">Dart</option>
                        <option value="r">R</option>
                        <option value="matlab">MATLAB</option>
                        <option value="html">HTML</option>
                        <option value="css">CSS</option>
                        <option value="assembly">Assembly</option>
                        <option value="bash">Bash / Shell</option>
                      </select>
                    )}
                    <div className="flex gap-1.5 ml-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreating(false);
                          setCreateParentPath("");
                          setIsCreatingFolder(false);
                        }}
                        className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs px-2.5 py-1 rounded transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-3 py-1 rounded transition shrink-0 shadow-sm"
                      >
                        Create
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Files & Folders tree list */}
              <div className="flex flex-col gap-1 select-none">
                {(() => {
                  // Build nested directory structure
                  const rootNodes: Record<string, any> = {};

                  files.forEach(file => {
                    const parts = file.path.split("/");
                    let current = rootNodes;
                    let currentPath = "";

                    parts.forEach((part, index) => {
                      currentPath = currentPath ? `${currentPath}/${part}` : part;
                      const isLast = index === parts.length - 1;

                      if (!current[part]) {
                        current[part] = {
                          name: part,
                          path: currentPath,
                          isFolder: !isLast || file.isFolder,
                          language: isLast ? file.language : "folder",
                          children: {}
                        };
                      }
                      if (isLast) {
                        current[part].isFolder = !!file.isFolder;
                        current[part].language = file.language;
                      }
                      current = current[part].children;
                    });
                  });

                  // Recursive tree node renderer
                  const renderTreeNodes = (nodes: Record<string, any>, depth = 0) => {
                    const sortedKeys = Object.keys(nodes).sort((a, b) => {
                      const nodeA = nodes[a];
                      const nodeB = nodes[b];
                      if (nodeA.isFolder && !nodeB.isFolder) return -1;
                      if (!nodeA.isFolder && nodeB.isFolder) return 1;
                      return a.localeCompare(b);
                    });

                    return sortedKeys.map(key => {
                      const node = nodes[key];
                      const isExpanded = !!expandedPaths[node.path];
                      const isCurrent = currentFile === node.path;
                      const badge = getLangBadge(node.language);

                      if (node.isFolder) {
                        return (
                          <div key={node.path} className="flex flex-col">
                            {/* Folder row layout */}
                            <div
                              className={`group flex items-center justify-between px-2 py-1 rounded-md cursor-pointer transition border border-transparent text-zinc-300 hover:bg-zinc-900/40`}
                              style={{ paddingLeft: `${depth * 10 + 6}px` }}
                              onClick={() => {
                                setExpandedPaths(prev => ({
                                  ...prev,
                                  [node.path]: !prev[node.path]
                                }));
                              }}
                            >
                              <div className="flex items-center gap-1.5 overflow-hidden">
                                <span className="text-zinc-500 shrink-0">
                                  {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                                </span>
                                <span className="text-yellow-550 shrink-0 text-amber-400">
                                  <Folder className="h-3.5 w-3.5 fill-amber-400/20" />
                                </span>
                                <span className="text-xs font-mono font-medium truncate text-zinc-200">
                                  {node.name}
                                </span>
                              </div>

                              {/* Folder specific actions */}
                              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition shrink-0">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCreateParentPath(node.path);
                                    setIsCreatingFolder(false);
                                    setIsCreating(true);
                                  }}
                                  className="p-0.5 text-zinc-400 hover:text-indigo-400 rounded transition"
                                  title="Create File in folder"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCreateParentPath(node.path);
                                    setIsCreatingFolder(true);
                                    setIsCreating(true);
                                  }}
                                  className="p-0.5 text-zinc-400 hover:text-indigo-400 rounded transition"
                                  title="Create Folder in folder"
                                >
                                  <FolderPlus className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm(`Are you sure you want to delete folder "${node.path}"?`)) {
                                      onDeleteFile(node.path);
                                    }
                                  }}
                                  className="p-0.5 text-zinc-400 hover:text-red-400 rounded transition"
                                  title="Delete folder"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>

                            {/* Subfolders and nested files */}
                            {isExpanded && (
                              <div className="flex flex-col mt-0.5">
                                {renderTreeNodes(node.children, depth + 1)}
                              </div>
                            )}
                          </div>
                        );
                      } else {
                        // File row layout
                        return (
                          <div
                            key={node.path}
                            className={`group flex items-center justify-between px-2 py-1 rounded-md cursor-pointer transition border ${
                              isCurrent 
                                ? "bg-indigo-950/40 text-indigo-200 border-indigo-900/40" 
                                : "bg-zinc-900/10 hover:bg-zinc-900/50 text-zinc-300 border-transparent hover:border-zinc-800/40"
                            }`}
                            style={{ paddingLeft: `${depth * 10 + 20}px` }}
                            onClick={() => onSelectFile(node.path)}
                          >
                            <div className="flex items-center gap-1.5 overflow-hidden">
                              <span className={`text-[7px] font-mono font-bold px-1 py-0.2 rounded border uppercase shrink-0 ${badge.bg}`}>
                                {badge.text}
                              </span>
                              <span className="text-xs font-mono truncate text-zinc-300 group-hover:text-white">
                                {node.name}
                              </span>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Are you sure you want to delete file "${node.name}"?`)) {
                                  onDeleteFile(node.path);
                                }
                              }}
                              className="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-500 hover:text-red-400 rounded transition"
                              title="Delete file"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        );
                      }
                    });
                  };

                  return renderTreeNodes(rootNodes);
                })()}
              </div>
            </div>

            {/* NEXUS HOSTING LAUNCHER CARD */}
            <div className="mt-4 p-3 bg-indigo-950/20 border border-indigo-900/40 rounded-lg flex flex-col gap-2 shrink-0">
              <div className="flex items-center gap-1.5 text-indigo-300">
                <Globe className="h-4 w-4 text-indigo-400" />
                <span className="text-xs font-bold font-mono">NEXUS HOSTING</span>
              </div>
              <p className="text-[10px] text-zinc-400 leading-normal font-sans">
                Host and deploy your repositories live to the cloud with customized subdomains.
              </p>
              <button
                onClick={onNavigateToHosting}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold py-1.5 px-3 rounded-md transition flex items-center justify-center gap-1.5 shadow"
              >
                <span>Launch Hosting (/hosting)</span>
                <ExternalLink className="h-3 w-3" />
              </button>
            </div>

            <div 
              className="p-3 rounded border mt-6 flex flex-col gap-2 transition-all duration-200"
              style={{
                backgroundColor: isHighDensity ? "#0D1117" : "rgba(24, 24, 27, 0.4)",
                borderColor: activeTheme.border
              }}
            >
              <h4 className="text-xs font-mono font-bold flex items-center gap-1.5" style={{ color: activeTheme.accent }}>
                <HelpCircle className="h-3.5 w-3.5" /> 
                <span>IDE QUICK GUIDE</span>
              </h4>
              <div className="flex flex-col gap-2 text-[10px] font-sans leading-relaxed text-zinc-400">
                <div className="flex items-start gap-1.5 border-b pb-1.5" style={{ borderColor: activeTheme.border + "40" }}>
                  <span className="text-[10px] font-mono font-bold shrink-0 text-[#3FB950]">1.</span>
                  <div>
                    <span className="font-semibold text-zinc-200">Write & Run Code:</span> Select a file above, edit it, and press <strong className="text-white font-mono px-1 rounded bg-zinc-800 border border-zinc-700">F5</strong> or click <strong className="text-white font-mono px-1 rounded bg-emerald-800">RUN</strong> to execute.
                  </div>
                </div>
                <div className="flex items-start gap-1.5 border-b pb-1.5" style={{ borderColor: activeTheme.border + "40" }}>
                  <span className="text-[10px] font-mono font-bold shrink-0 text-[#3FB950]">2.</span>
                  <div>
                    <span className="font-semibold text-zinc-200">AI Intelligent Linter:</span> Enable it in the <strong className="text-zinc-200">Plugins</strong> tab. It scans your code live for syntax bugs as you type!
                  </div>
                </div>
                <div className="flex items-start" style={{ borderColor: activeTheme.border + "40" }}>
                  <span className="text-[10px] font-mono font-bold shrink-0 text-[#3FB950]">3.</span>
                  <div>
                    <span className="font-semibold text-zinc-200">Real-time Collaboration:</span> Enter any Room ID in the top bar (e.g. <strong className="text-zinc-200">123</strong>) to share and code together.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GEMINI AI ASSISTANT PANEL */}
        {activeTab === "ai" && (
          <div className="flex flex-col h-full flex-1 justify-between gap-3">
            {/* Quick assistant triggers */}
            <div className="flex flex-col gap-2 shrink-0">
              <span className="text-[10px] font-semibold text-zinc-400 tracking-wider uppercase">Prompts Templates</span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => triggerAiAction("Explain the current code line by line.")}
                  className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-[10px] font-medium text-zinc-300 text-left truncate transition"
                >
                  💡 Explain code
                </button>
                <button
                  onClick={() => triggerAiAction("Find potential bugs and suggest logic fixes in my code.")}
                  className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-[10px] font-medium text-zinc-300 text-left truncate transition"
                >
                  🐛 Optimize / Debug
                </button>
                <button
                  onClick={() => triggerAiAction("Translate this code into standard Rust with clear types.")}
                  className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-[10px] font-medium text-zinc-300 text-left truncate transition"
                >
                  🦀 Port to Rust
                </button>
                <button
                  onClick={() => triggerAiAction("Write comprehensive unit tests for this module.")}
                  className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-[10px] font-medium text-zinc-300 text-left truncate transition"
                >
                  🧪 Write Tests
                </button>
              </div>
            </div>

            {/* Chat message thread */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-2 border border-zinc-800 bg-zinc-900/20 p-2.5 rounded-lg min-h-[160px]">
              {aiMessages.map((msg) => (
                <div key={msg.id} className={`flex flex-col max-w-full ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                  <div className={`px-2.5 py-1.5 rounded-lg text-xs leading-relaxed max-w-[90%] break-words border ${
                    msg.sender === "user" 
                      ? "bg-indigo-600 text-white border-indigo-500" 
                      : "bg-zinc-900 text-zinc-200 border-zinc-800"
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                  <span className="text-[8px] text-zinc-500 mt-0.5 font-mono px-1">
                    {msg.sender === "user" ? "Me" : "NEXUS AI"} • {msg.timestamp}
                  </span>
                </div>
              ))}
              {isAiThinking && (
                <div className="flex items-center gap-2 text-zinc-400 text-xs py-2 bg-zinc-900/40 px-2 rounded border border-zinc-800/50">
                  <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-400 animate-ping" />
                  <span className="font-mono text-[10px]">AI is reading active file...</span>
                </div>
              )}
            </div>

            {/* Form query input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!aiInput.trim()) return;
                onSendAiMessage(aiInput);
                setAiInput("");
              }}
              className="flex gap-2 shrink-0"
            >
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="Ask AI anything about the code..."
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500 text-zinc-100 font-sans"
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white p-1.5 rounded transition shrink-0"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: COLLABORATION & PEER SYNC */}
        {activeTab === "collab" && (
          <div className="flex flex-col h-full flex-1 justify-between gap-3">
            <div className="flex flex-col gap-3 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">Collab Session</span>
                <span className="bg-emerald-950 text-emerald-400 text-[9px] font-mono px-1.5 py-0.5 rounded border border-emerald-900">
                  {collabRoom ? "Connected" : "Offline Simulation"}
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 leading-relaxed font-mono">
                {collabRoom 
                  ? `Room: ${collabRoom.id} • Active cursors synchronize peer changes on keystroke.`
                  : "Join a room ID in top bar to connect. You can share your link to sync simultaneously!"
                }
              </p>
              
              {collabRoom && (
                <div className="bg-zinc-900/50 p-2.5 rounded border border-zinc-800">
                  <div className="text-[9px] font-semibold text-zinc-400 uppercase mb-1">Active Room Members ({Object.keys(collabRoom.cursors).length}):</div>
                  <div className="flex flex-wrap gap-1">
                    {Object.values(collabRoom.cursors).map((cur) => (
                      <span 
                        key={cur.userId} 
                        className="text-[10px] font-mono px-2 py-0.5 rounded border flex items-center gap-1.5 bg-zinc-950"
                        style={{ borderColor: cur.color + "40", color: cur.color }}
                      >
                        <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: cur.color }} />
                        {cur.username}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Room sync chat logs */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-2 border border-zinc-800 bg-zinc-900/20 p-2.5 rounded-lg min-h-[160px]">
              {collabRoom ? (
                collabRoom.chat.map((msg) => (
                  <div key={msg.id} className="text-xs flex flex-col gap-0.5 bg-zinc-900/40 p-1.5 rounded border border-zinc-900">
                    <span className="text-[9px] font-mono text-indigo-400">{msg.timestamp}</span>
                    <p className="text-zinc-200 leading-relaxed">{msg.text}</p>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-zinc-500 p-4 gap-2">
                  <MessageSquare className="h-8 w-8 text-zinc-600" />
                  <span className="text-[10px] font-mono">Collab room chat is inactive. Join a room in the header to sync with other developers.</span>
                </div>
              )}
            </div>

            {/* Collab message submit */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!roomInput.trim() || !collabRoom) return;
                onSendCollabChat(roomInput);
                setRoomInput("");
              }}
              className="flex gap-2 shrink-0"
            >
              <input
                type="text"
                value={roomInput}
                disabled={!collabRoom}
                onChange={(e) => setRoomInput(e.target.value)}
                placeholder={collabRoom ? "Send message to room..." : "Join a room first"}
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500 text-zinc-100 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!collabRoom}
                className="bg-indigo-600 hover:bg-indigo-500 text-white p-1.5 rounded transition shrink-0 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}

        {/* TAB GITHUB: OFFICIAL GITHUB INTEGRATION CONTROL PANEL */}
        {activeTab === "github" && (
          <div className="flex flex-col h-full flex-1 gap-4">
            <div>
              <span className="text-xs font-semibold tracking-wider text-zinc-400 uppercase font-mono">GitHub Connection</span>
              <p className="text-[10px] text-zinc-400 leading-relaxed mt-1 font-sans">
                Connect your real GitHub account securely to sync, fork, create repositories, and commit code live.
              </p>
            </div>

            {/* Error or Success notification */}
            {gitError && (
              <div className="bg-red-950/50 border border-red-900/60 p-2.5 rounded text-[10px] text-red-300 font-mono flex flex-col gap-1">
                <span className="font-bold">⚠️ Error:</span>
                <p className="leading-relaxed">{gitError}</p>
              </div>
            )}

            {pushStatus && (
              <div className="bg-indigo-950/50 border border-indigo-900/60 p-2.5 rounded text-[10px] text-indigo-300 font-mono flex flex-col gap-1">
                <span className="font-bold animate-pulse">⚙️ Status:</span>
                <p className="leading-relaxed">{pushStatus}</p>
                {pushSuccessUrl && (
                  <a
                    href={pushSuccessUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-[10px] py-1 px-2 rounded flex items-center justify-center gap-1 transition"
                  >
                    <span>View Repository on GitHub</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            )}

            {/* CASE 1: NOT AUTHENTICATED */}
            {!gitUser ? (
              <div className="flex flex-col gap-3.5 bg-zinc-900/40 border border-zinc-800/80 p-3.5 rounded-lg">
                <div className="flex items-center gap-2" style={{ color: activeTheme.accent }}>
                  <Lock className="h-4 w-4" />
                  <span className="text-xs font-mono font-bold">GITHUB TOKEN REQUIRED</span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-relaxed font-sans">
                  Generate a Personal Access Token (PAT) with <strong className="text-zinc-200">"repo"</strong> scope on GitHub, then paste it below to link your live account.
                </p>
                <div className="flex flex-col gap-2">
                  <input
                    type="password"
                    id="github-token-input"
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500 font-mono text-zinc-100"
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById("github-token-input") as HTMLInputElement;
                      if (input && input.value.trim()) {
                        const token = input.value.trim();
                        localStorage.setItem("github_pat", token);
                        setGitPat(token);
                      } else {
                        setGitError("Please enter a valid GitHub token.");
                      }
                    }}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2 rounded-lg transition"
                  >
                    Link GitHub Account
                  </button>
                </div>
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo&description=Nexus%20IDE%20Token"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[9px] text-[#58A6FF] hover:underline flex items-center justify-center gap-1 font-mono py-1 border border-zinc-800 rounded bg-zinc-950 hover:bg-zinc-900 transition"
                >
                  <span>Create token on GitHub</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>
            ) : (
              // CASE 2: LIVE CONNECTED GITHUB DASHBOARD
              <div className="flex flex-col gap-4">
                {/* User Info Header */}
                <div className="flex items-center gap-3 bg-zinc-900/60 border border-zinc-800 p-2.5 rounded-lg">
                  <img
                    src={gitUser.avatar_url}
                    alt={gitUser.login}
                    referrerPolicy="no-referrer"
                    className="h-8 w-8 rounded-full border border-zinc-700 shrink-0"
                  />
                  <div className="flex-1 overflow-hidden">
                    <div className="text-xs font-bold text-zinc-200 truncate flex items-center gap-1">
                      <span>{gitUser.name || gitUser.login}</span>
                      <span className="text-[9px] font-normal text-zinc-500">(@{gitUser.login})</span>
                    </div>
                    <div className="text-[9px] text-zinc-400 truncate leading-relaxed">{gitUser.bio || "Active developer"}</div>
                  </div>
                  <button
                    onClick={() => {
                      localStorage.removeItem("github_pat");
                      setGitPat("");
                      setGitUser(null);
                    }}
                    className="p-1 rounded bg-zinc-950 hover:bg-red-950 border border-zinc-800 text-zinc-400 hover:text-red-400 transition"
                    title="Sign Out GitHub"
                  >
                    <LogOut className="h-3 w-3" />
                  </button>
                </div>

                {/* Modules list */}
                <div className="flex flex-col gap-3">
                  
                  {/* PUSH CHANGES MODULE */}
                  <div className="bg-zinc-900/30 border border-zinc-800 p-3 rounded-lg flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-zinc-400 font-mono flex items-center gap-1">
                        <GitCommit className="h-3.5 w-3.5 text-[#3FB950]" />
                        <span>PUSH WORKSPACE FILES</span>
                      </span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] text-zinc-500 font-mono">Target Repository</label>
                      <select
                        value={gitSelectedRepo ? gitSelectedRepo.full_name : ""}
                        onChange={(e) => {
                          const r = gitRepos.find(repo => repo.full_name === e.target.value);
                          if (r) setGitSelectedRepo(r);
                        }}
                        className="w-full bg-zinc-950 border border-zinc-850 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500 font-mono text-zinc-100"
                      >
                        {gitRepos.map(repo => (
                          <option key={repo.id} value={repo.full_name}>
                            {repo.name} ({repo.private ? "Private" : "Public"})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] text-zinc-500 font-mono font-bold">Select Files</label>
                      <div className="max-h-24 overflow-y-auto border border-zinc-850 bg-zinc-950 p-1.5 rounded flex flex-col gap-0.5">
                        {files.map(f => {
                          const isSelected = pushSelectedFiles.includes(f.path);
                          return (
                            <label key={f.path} className="flex items-center gap-1.5 text-[9.5px] font-mono text-zinc-400 hover:text-white cursor-pointer py-0.5">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setPushSelectedFiles(prev => [...prev, f.path]);
                                  } else {
                                    setPushSelectedFiles(prev => prev.filter(p => p !== f.path));
                                  }
                                }}
                                className="rounded text-indigo-600 bg-zinc-900 border-zinc-800 focus:ring-0 focus:ring-offset-0"
                              />
                              <span className="truncate">{f.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] text-zinc-500 font-mono">Commit Message</label>
                      <input
                        type="text"
                        value={pushCommitMsg}
                        onChange={(e) => setPushCommitMsg(e.target.value)}
                        placeholder="e.g. update code"
                        className="w-full bg-zinc-950 border border-zinc-850 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500 text-zinc-100 font-mono"
                      />
                    </div>

                    <button
                      onClick={handlePushFiles}
                      disabled={pushing || pushSelectedFiles.length === 0}
                      className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-mono font-bold text-xs py-1.5 rounded transition disabled:opacity-50"
                    >
                      {pushing ? "Pushing..." : `Commit & Push (${pushSelectedFiles.length} files)`}
                    </button>
                  </div>

                  {/* EDIT EXISTING REPO FILES */}
                  <div className="bg-zinc-900/30 border border-zinc-850 p-3 rounded-lg flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-zinc-400 font-mono flex items-center gap-1.5">
                        <FolderOpen className="h-3.5 w-3.5 text-[#58A6FF]" />
                        <span>EDIT REPOSITORY FILES</span>
                      </span>
                    </div>

                    <p className="text-[9px] text-zinc-500 font-sans leading-normal">
                      Select any code file inside <strong className="text-zinc-300">{gitSelectedRepo ? gitSelectedRepo.name : "repo"}</strong> to load and edit directly in the Nexus editor.
                    </p>

                    {gitFilesLoading ? (
                      <div className="flex items-center justify-center py-4 text-xs font-mono text-zinc-500 gap-1.5">
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>Loading repository contents...</span>
                      </div>
                    ) : gitRepoFiles.length === 0 ? (
                      <div className="text-[10px] font-mono text-zinc-600 text-center py-2 border border-zinc-900 rounded bg-zinc-950">
                        No files found or empty branch.
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1 max-h-48 overflow-y-auto border border-zinc-850 bg-zinc-950 p-1.5 rounded">
                        {/* If we are deep inside folders, add a back folder navigation option */}
                        {gitCurrentPath && (
                          <button
                            onClick={() => {
                              const parts = gitCurrentPath.split("/");
                              parts.pop();
                              fetchGitRepoFiles(parts.join("/"));
                            }}
                            className="text-left text-[9.5px] font-mono text-[#58A6FF] hover:underline py-1 flex items-center gap-1 shrink-0"
                          >
                            <span>← .. (Parent directory)</span>
                          </button>
                        )}
                        {gitRepoFiles.map((fileItem) => {
                          const isDir = fileItem.type === "dir";
                          return (
                            <button
                              key={fileItem.sha}
                              onClick={() => {
                                if (isDir) {
                                  fetchGitRepoFiles(fileItem.path);
                                } else {
                                  handleLoadGitFileToWorkspace(fileItem);
                                }
                              }}
                              className="text-left text-[9.5px] font-mono hover:text-white flex items-center justify-between gap-2 py-1 px-1.5 rounded hover:bg-zinc-900/60 transition truncate border border-transparent hover:border-zinc-800"
                              title={fileItem.name}
                            >
                              <span className="truncate flex items-center gap-1.5">
                                <span className="text-zinc-500">{isDir ? "📁" : "📄"}</span>
                                <span className={isDir ? "text-indigo-300 font-semibold" : "text-zinc-300"}>{fileItem.name}</span>
                              </span>
                              {isDir && <span className="text-[8px] text-zinc-500 font-bold uppercase shrink-0">Dir</span>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* CREATE NEW REPO MODULE */}
                  <div className="bg-zinc-900/30 border border-zinc-800 p-3 rounded-lg flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-zinc-400 font-mono flex items-center gap-1">
                      <Plus className="h-3.5 w-3.5 text-indigo-400" />
                      <span>CREATE NEW REPOSITORY</span>
                    </span>
                    <form onSubmit={handleCreateRepo} className="flex flex-col gap-1.5">
                      <input
                        type="text"
                        value={newRepoName}
                        onChange={(e) => setNewRepoName(e.target.value)}
                        placeholder="Repository name..."
                        required
                        className="w-full bg-zinc-950 border border-zinc-850 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500 text-zinc-100 font-mono"
                      />
                      <input
                        type="text"
                        value={newRepoDesc}
                        onChange={(e) => setNewRepoDesc(e.target.value)}
                        placeholder="Description (optional)..."
                        className="w-full bg-zinc-950 border border-zinc-850 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500 text-zinc-100 font-mono"
                      />
                      <label className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono cursor-pointer my-0.5">
                        <input
                          type="checkbox"
                          checked={newRepoPrivate}
                          onChange={(e) => setNewRepoPrivate(e.target.checked)}
                          className="rounded text-indigo-600 bg-zinc-900 border-zinc-850 focus:ring-0"
                        />
                        <span>Private repository</span>
                      </label>
                      <button
                        type="submit"
                        disabled={repoCreating}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs py-1.5 rounded transition disabled:opacity-50"
                      >
                        {repoCreating ? "Creating..." : "Create Repo"}
                      </button>
                    </form>
                  </div>

                  {/* FORK REPO MODULE */}
                  <div className="bg-zinc-900/30 border border-zinc-800 p-3 rounded-lg flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-zinc-400 font-mono flex items-center gap-1">
                      <GitFork className="h-3.5 w-3.5 text-amber-400" />
                      <span>FORK ANY REPOSITORY</span>
                    </span>
                    <form onSubmit={handleForkRepo} className="flex flex-col gap-1.5">
                      <input
                        type="text"
                        value={forkTarget}
                        onChange={(e) => setForkTarget(e.target.value)}
                        placeholder="e.g. octocat/Spoon-Knife"
                        required
                        className="w-full bg-zinc-950 border border-zinc-850 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500 text-zinc-100 font-mono"
                      />
                      <button
                        type="submit"
                        disabled={forking}
                        className="w-full bg-amber-600 hover:bg-amber-500 text-white font-mono font-bold text-xs py-1.5 rounded transition disabled:opacity-50"
                      >
                        {forking ? "Forking..." : "Fork Repository"}
                      </button>
                    </form>
                  </div>

                  {/* HOSTING DETAILS */}
                  <div className="bg-emerald-950/20 border border-emerald-900 p-3 rounded-lg flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-emerald-400 font-mono flex items-center gap-1">
                      <Globe className="h-3.5 w-3.5" />
                      <span>NEXUS HOSTING & WEB DOMAIN</span>
                    </span>
                    <p className="text-[9px] text-zinc-400 font-sans leading-relaxed">
                      Toggle 'GitHub Pages' in repo settings to publish immediately on:
                    </p>
                    <div className="text-[9.5px] font-mono text-emerald-300 bg-zinc-950 p-1.5 rounded border border-zinc-800 select-all leading-normal text-center truncate">
                      {gitSelectedRepo ? `${gitSelectedRepo.owner.login}.github.io/${gitSelectedRepo.name}` : "username.github.io/repo"}
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: EXTENSIONS AND PLUGINS MANAGER */}
        {activeTab === "plugins" && (
          <div className="flex flex-col h-full flex-1 gap-4">
            <div>
              <span className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">Workspace Plugins</span>
              <p className="text-[10px] text-zinc-400 leading-relaxed mt-1 font-mono">
                Toggle core features to customize compilation lints, formatting triggers, and telemetry.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {plugins.map((plug) => (
                <div key={plug.id} className="p-3 bg-zinc-900/60 rounded-lg border border-zinc-800 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold tracking-wide text-zinc-200 font-mono">{plug.name}</span>
                      <span className="text-[9px] text-zinc-500">v{plug.version} • {plug.author}</span>
                    </div>
                    <button
                      onClick={() => onTogglePlugin(plug.id)}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded transition border ${
                        plug.enabled 
                          ? "bg-emerald-950/60 border-emerald-900 text-emerald-400" 
                          : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {plug.enabled ? "Active" : "Disabled"}
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-normal">{plug.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: SETTINGS & THEMES CONFIGURATION */}
        {activeTab === "settings" && (
          <div className="flex flex-col h-full flex-1 gap-4">
            <div>
              <span className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">IDE Custom Theme</span>
              <p className="text-[10px] text-zinc-400 leading-relaxed mt-1 font-mono">
                Select matching high-contrast skins for editor aesthetics and status lines.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              {themes.map((theme) => {
                const isActive = activeTheme.id === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => onSelectTheme(theme.id)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg border text-left transition ${
                      isActive 
                        ? "bg-indigo-950/30 text-indigo-300 border-indigo-500/80" 
                        : "bg-zinc-900/50 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: theme.accent }} />
                      <span className="text-xs font-mono font-medium">{theme.name}</span>
                    </div>
                    {isActive && <CheckCircle className="h-3.5 w-3.5 text-indigo-400" />}
                  </button>
                );
              })}
            </div>

            <div className="h-px bg-zinc-900 my-2" />

            <div>
              <span className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">Preferences</span>
              <p className="text-[10px] text-zinc-400 leading-relaxed mt-1 font-mono">
                Configure workspace automation and editor behaviors.
              </p>
            </div>

            <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-mono font-medium text-zinc-200 flex items-center gap-1.5">
                  <Save className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Auto-save changes</span>
                </span>
                <span className="text-[9px] text-zinc-500 mt-0.5">Saves file when you stop typing</span>
              </div>
              <button
                type="button"
                onClick={onToggleAutoSave}
                className={`w-10 h-6 flex items-center rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                  autoSave ? "bg-indigo-600" : "bg-zinc-800 border border-zinc-700"
                }`}
                title="Toggle auto-save"
              >
                <div
                  className={`bg-white w-5 h-5 rounded-full shadow-md transform duration-200 ease-in-out ${
                    autoSave ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="h-px bg-zinc-900 my-2" />

            <div className="bg-zinc-900/30 p-3 rounded-lg border border-zinc-800">
              <h4 className="text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5 text-indigo-400" /> About Nexus IDE
              </h4>
              <p className="text-[10px] text-zinc-400 leading-relaxed leading-normal">
                Nexus is an open-source, highly responsive development sandbox optimized for quick-load and collaborative workspaces. Designed with robust sandboxed compiling simulators.
              </p>
            </div>
          </div>
        )}

      </div>
    </aside>
  );
}
