import React from "react";
import { Code2, CloudLightning, ShieldCheck, Users, LogIn, LogOut, Command, Play, Save, RefreshCw } from "lucide-react";
import { IDETheme } from "../types";

interface TopBarProps {
  currentFile: string | null;
  unsavedFiles: Set<string>;
  onSave: () => void;
  onRunCode: () => void;
  onShowShortcuts: () => void;
  user: { email: string; name: string } | null;
  onSignInToggle: () => void;
  roomId: string;
  setRoomId: (val: string) => void;
  onJoinRoom: () => void;
  isSyncing: boolean;
  peersCount: number;
  activeTheme: IDETheme;
}

export default function TopBar({
  currentFile,
  unsavedFiles,
  onSave,
  onRunCode,
  onShowShortcuts,
  user,
  onSignInToggle,
  roomId,
  setRoomId,
  onJoinRoom,
  isSyncing,
  peersCount,
  activeTheme
}: TopBarProps) {
  const isHighDensity = activeTheme.id === "high-density";

  return (
    <header 
      className="flex w-full items-center justify-between border-b px-4 text-white shrink-0 transition-all duration-200"
      style={{
        height: isHighDensity ? "48px" : "56px",
        backgroundColor: isHighDensity ? "#161B22" : "rgba(9, 9, 11, 0.95)",
        borderColor: activeTheme.border,
      }}
    >
      {/* Brand & Compact Workspace Menu */}
      <div className="flex items-center gap-4">
        <div 
          className="flex h-7 w-7 items-center justify-center rounded border transition-colors"
          style={{
            backgroundColor: isHighDensity ? "rgba(88,166,255,0.1)" : "rgba(99,102,241,0.1)",
            borderColor: isHighDensity ? "rgba(88,166,255,0.2)" : "rgba(99,102,241,0.2)",
          }}
        >
          <Code2 className="h-4 w-4" style={{ color: activeTheme.accent }} />
        </div>
        <div>
          <h1 className="font-mono text-sm font-bold tracking-wider text-white select-none">
            NEXUS<span style={{ color: activeTheme.accent }}>IDE</span>
          </h1>
        </div>

        {/* High Density Desktop Workspace Dropdown Mock menu */}
        <div 
          className="hidden md:flex items-center gap-3 text-xs font-mono select-none pl-3 border-l"
          style={{ 
            borderColor: activeTheme.border,
            color: activeTheme.textMuted 
          }}
        >
          <span className="hover:text-white cursor-pointer transition">File</span>
          <span className="hover:text-white cursor-pointer transition">Edit</span>
          <span className="hover:text-white cursor-pointer transition">Selection</span>
          <span className="hover:text-white cursor-pointer transition">Terminal</span>
          <span className="hover:text-white cursor-pointer transition">Plugins</span>
        </div>
      </div>

      {/* Collaboration and Sync */}
      <div 
        className="hidden lg:flex items-center gap-2.5 p-1 rounded max-w-xs xl:max-w-md w-full border transition-all"
        style={{
          backgroundColor: isHighDensity ? "#010409" : "rgba(24, 24, 27, 0.6)",
          borderColor: activeTheme.border
        }}
      >
        <div className="flex items-center gap-1.5 text-xs pl-1 font-mono shrink-0" style={{ color: activeTheme.textMuted }}>
          <Users className="h-3.5 w-3.5" style={{ color: activeTheme.accent }} />
          <span>Sync:</span>
        </div>
        <input
          type="text"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          placeholder="Room ID (e.g. 1337)"
          className="flex-1 bg-transparent px-2 py-0.5 text-xs focus:outline-none font-mono"
          style={{ color: activeTheme.textPrimary }}
        />
        <button
          onClick={onJoinRoom}
          className="text-white font-mono font-medium text-[10px] px-2 py-0.5 rounded transition shrink-0 uppercase"
          style={{ backgroundColor: activeTheme.accent }}
        >
          Join
        </button>
        {peersCount > 0 && (
          <span 
            className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.2 rounded border shrink-0"
            style={{ 
              backgroundColor: "rgba(35, 134, 54, 0.15)", 
              borderColor: "rgba(35, 134, 54, 0.4)",
              color: "#3FB950"
            }}
          >
            ● {peersCount} active
          </span>
        )}
      </div>

      {/* Action Controls & User Auth */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Save & Run */}
        {currentFile && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={onSave}
              title="Save changes (Ctrl+S)"
              className="px-2 py-1 rounded border transition flex items-center gap-1 text-xs font-mono"
              style={{
                backgroundColor: isHighDensity ? "#0D1117" : "rgba(24, 24, 27, 0.6)",
                borderColor: activeTheme.border,
                color: activeTheme.textPrimary
              }}
            >
              <Save className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Save</span>
              {unsavedFiles.has(currentFile) && (
                <span className="h-1.5 w-1.5 rounded-full bg-[#F78166] animate-pulse" />
              )}
            </button>
            <button
              onClick={onRunCode}
              title="Run code in Terminal (F5)"
              className="px-2.5 py-1 rounded text-white transition flex items-center gap-1 text-xs font-mono font-bold uppercase"
              style={{
                backgroundColor: isHighDensity ? "#238636" : "#059669",
              }}
            >
              <Play className="h-3 w-3 fill-current" />
              <span>Run</span>
            </button>
          </div>
        )}

        {/* Sync Indicator */}
        <div className="flex items-center gap-1 font-mono">
          {isSyncing ? (
            <RefreshCw className="h-3.5 w-3.5 text-zinc-400 animate-spin" />
          ) : (
            <CloudLightning className="h-3.5 w-3.5" style={{ color: activeTheme.accent }} />
          )}
          <span className="text-[10px] hidden xl:inline" style={{ color: activeTheme.textMuted }}>
            {isSyncing ? "Syncing..." : "SYNCED"}
          </span>
        </div>

        {/* Shortcuts */}
        <button
          onClick={onShowShortcuts}
          title="Keyboard Shortcuts"
          className="p-1 px-2 rounded border transition flex items-center gap-1 text-xs font-mono"
          style={{
            backgroundColor: isHighDensity ? "#0D1117" : "rgba(24, 24, 27, 0.6)",
            borderColor: activeTheme.border,
            color: activeTheme.textMuted
          }}
        >
          <Command className="h-3.5 w-3.5" />
          <span className="hidden lg:inline">⌘ K</span>
        </button>

        {/* User Auth */}
        <div className="h-5 w-px" style={{ backgroundColor: activeTheme.border }} />
        {user ? (
          <div className="flex items-center gap-2">
            <div className="hidden lg:flex flex-col text-right">
              <span className="text-[11px] font-mono font-medium text-white">{user.name}</span>
              <span className="text-[9px] font-mono text-zinc-500">{user.email}</span>
            </div>
            {/* User Badge circular */}
            <div 
              className="h-6 w-6 rounded-full border flex items-center justify-center text-[10px] font-bold text-white uppercase font-mono"
              style={{
                backgroundColor: isHighDensity ? "#238636" : "#4f46e5",
                borderColor: activeTheme.border
              }}
            >
              {user.name.substring(0, 2)}
            </div>
            <button
              onClick={onSignInToggle}
              title="Sign Out"
              className="p-1 rounded border hover:text-red-400 transition"
              style={{
                backgroundColor: isHighDensity ? "#0D1117" : "rgba(24, 24, 27, 0.6)",
                borderColor: activeTheme.border,
                color: "#F85149"
              }}
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={onSignInToggle}
            className="border text-xs px-2.5 py-1 rounded font-mono font-medium transition flex items-center gap-1"
            style={{
              backgroundColor: isHighDensity ? "#0D1117" : "rgba(24, 24, 27, 0.6)",
              borderColor: activeTheme.border,
              color: activeTheme.textPrimary
            }}
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
}
