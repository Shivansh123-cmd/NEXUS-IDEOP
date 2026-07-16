import React, { useState, useEffect, useRef } from "react";
import { 
  Command, Search, Settings, Terminal as TermIcon, Palette, Trash2, 
  Play, Code2, HelpCircle, Save, ChevronRight, CornerDownLeft
} from "lucide-react";
import { IDETheme } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onFormatActiveFile: () => void;
  onToggleTerminal: () => void;
  onClearCache: () => void;
  onSelectTheme: (theme: IDETheme) => void;
  themes: IDETheme[];
  activeTheme: IDETheme;
  autoSave: boolean;
  onToggleAutoSave: () => void;
  onShowShortcuts: () => void;
  onRunCode: () => void;
}

interface CommandAction {
  id: string;
  name: string;
  description: string;
  shortcut?: string;
  icon: React.ReactNode;
  category: "editor" | "terminal" | "appearance" | "workspace" | "help";
  handler: () => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
  onFormatActiveFile,
  onToggleTerminal,
  onClearCache,
  onSelectTheme,
  themes,
  activeTheme,
  autoSave,
  onToggleAutoSave,
  onShowShortcuts,
  onRunCode
}: CommandPaletteProps) {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [currentView, setCurrentView] = useState<"main" | "theme">("main");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset state when opening/closing
  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setSelectedIndex(0);
      setCurrentView("main");
      // Focus input on next render tick
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Define core actions
  const mainActions: CommandAction[] = [
    {
      id: "format",
      name: "Format File",
      description: "Trigger prettier to format code structure and indent spacing.",
      icon: <Code2 className="h-4 w-4 text-emerald-400" />,
      category: "editor",
      handler: () => {
        onFormatActiveFile();
        onClose();
      }
    },
    {
      id: "run-code",
      name: "Run Active File",
      description: "Compiles and executes the current file inside the Termux shell.",
      shortcut: "F5",
      icon: <Play className="h-4 w-4 text-indigo-400" />,
      category: "terminal",
      handler: () => {
        onRunCode();
        onClose();
      }
    },
    {
      id: "toggle-terminal",
      name: "Toggle Terminal",
      description: "Show or hide the interactive bottom Termux console panel.",
      icon: <TermIcon className="h-4 w-4 text-sky-400" />,
      category: "terminal",
      handler: () => {
        onToggleTerminal();
        onClose();
      }
    },
    {
      id: "switch-theme",
      name: "Switch Theme...",
      description: "Change the IDE colors, sidebar accent backgrounds, and editor layout style.",
      icon: <Palette className="h-4 w-4 text-pink-400" />,
      category: "appearance",
      handler: () => {
        setCurrentView("theme");
        setSearch("");
        setSelectedIndex(0);
      }
    },
    {
      id: "toggle-autosave",
      name: `Toggle Auto-Save (${autoSave ? "Disable" : "Enable"})`,
      description: `Automatically save your active modifications when you stop typing. Currently ${autoSave ? "ENABLED" : "DISABLED"}.`,
      icon: <Save className="h-4 w-4 text-amber-400" />,
      category: "workspace",
      handler: () => {
        onToggleAutoSave();
        onClose();
      }
    },
    {
      id: "clear-cache",
      name: "Clear Cache",
      description: "Flush all workspace session data, stored credentials, and compiled variables.",
      icon: <Trash2 className="h-4 w-4 text-rose-400" />,
      category: "workspace",
      handler: () => {
        onClearCache();
        onClose();
      }
    },
    {
      id: "shortcuts",
      name: "Open Shortcuts Help",
      description: "Display the keyboard short binding configuration layout guide.",
      icon: <HelpCircle className="h-4 w-4 text-indigo-400" />,
      category: "help",
      handler: () => {
        onShowShortcuts();
        onClose();
      }
    }
  ];

  // Define theme selections as pseudo-actions
  const themeActions = themes.map(t => ({
    id: `theme-${t.id}`,
    name: `Switch Theme: ${t.name}`,
    description: `Activate theme layout config '${t.id}' with customized colors and contrast frames.`,
    icon: <Palette className="h-4 w-4 text-pink-400" />,
    category: "appearance" as const,
    isActive: t.id === activeTheme.id,
    handler: () => {
      onSelectTheme(t);
      onClose();
    }
  }));

  // Back action in theme sub-view
  const backAction = {
    id: "back-main",
    name: "< Back to Main Menu",
    description: "Return to the top level navigation list of workspace IDE commands.",
    icon: <ChevronRight className="h-4 w-4 rotate-180 text-zinc-400" />,
    category: "help" as const,
    handler: () => {
      setCurrentView("main");
      setSearch("");
      setSelectedIndex(0);
    }
  };

  const getFilteredActions = () => {
    const query = search.toLowerCase().trim();
    if (currentView === "theme") {
      const themesFiltered = themeActions.filter(action => 
        action.name.toLowerCase().includes(query) || 
        action.description.toLowerCase().includes(query)
      );
      return [backAction, ...themesFiltered];
    }

    return mainActions.filter(action => 
      action.name.toLowerCase().includes(query) || 
      action.description.toLowerCase().includes(query) ||
      action.category.toLowerCase().includes(query)
    );
  };

  const filtered = getFilteredActions();

  // Handle arrow keys & selection execution
  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].handler();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeys);
    return () => window.removeEventListener("keydown", handleKeys);
  }, [isOpen, filtered, selectedIndex, onClose]);

  // Cap selection index if filtered list shrinks
  useEffect(() => {
    if (selectedIndex >= filtered.length && filtered.length > 0) {
      setSelectedIndex(filtered.length - 1);
    }
  }, [filtered, selectedIndex]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-24 px-4">
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          ref={containerRef}
          className="bg-zinc-950 border border-zinc-800 rounded-xl max-w-xl w-full overflow-hidden shadow-2xl flex flex-col text-white"
        >
          {/* Command Search Header */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-900 bg-zinc-900/20">
            <Search className="h-5 w-5 text-zinc-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder={currentView === "theme" ? "Search themes..." : "Type a command or search action..."}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelectedIndex(0);
              }}
              className="bg-transparent text-sm text-zinc-100 placeholder-zinc-500 w-full focus:outline-none font-sans"
            />
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-800/80 px-1.5 py-0.5 rounded">ESC</span>
            </div>
          </div>

          {/* Actions List Area */}
          <div className="p-2 max-h-[340px] overflow-y-auto flex flex-col gap-0.5 custom-scrollbar">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 text-xs font-sans flex flex-col items-center justify-center gap-2">
                <Command className="h-8 w-8 text-zinc-600 animate-pulse" />
                <span>No commands matching "{search}" found.</span>
              </div>
            ) : (
              filtered.map((action, idx) => {
                const isSelected = idx === selectedIndex;
                const isThemeItem = 'isActive' in action;
                const isItemActive = isThemeItem && (action as any).isActive;

                return (
                  <button
                    key={action.id}
                    onClick={() => action.handler()}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between transition-all duration-100 ${
                      isSelected 
                        ? "bg-indigo-600/95 text-white" 
                        : "hover:bg-zinc-900 text-zinc-300"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-1.5 rounded-md ${isSelected ? "bg-indigo-500/30 text-white" : "bg-zinc-900/60 text-zinc-400"}`}>
                        {action.icon}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-medium font-sans flex items-center gap-1.5">
                          {action.name}
                          {isItemActive && (
                            <span className="text-[9px] bg-emerald-500/20 text-emerald-400 font-mono px-1 py-0.2 rounded border border-emerald-500/30">
                              Active
                            </span>
                          )}
                        </span>
                        <span className={`text-[10px] truncate mt-0.5 ${isSelected ? "text-indigo-200" : "text-zinc-500"}`}>
                          {action.description}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-4">
                      {action.shortcut ? (
                        <kbd className={`px-1.5 py-0.5 rounded font-mono text-[9px] ${
                          isSelected ? "bg-indigo-700 border border-indigo-500" : "bg-zinc-900 border border-zinc-800 text-zinc-400"
                        }`}>
                          {action.shortcut}
                        </kbd>
                      ) : isSelected ? (
                        <span className="flex items-center gap-1 text-[10px] font-mono text-indigo-200 bg-indigo-500/20 px-1.5 py-0.5 rounded">
                          <span>Select</span>
                          <CornerDownLeft className="h-2.5 w-2.5" />
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Guide */}
          <div className="px-4 py-3 border-t border-zinc-900 bg-zinc-900/20 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.2 bg-zinc-900 border border-zinc-800 rounded">↑↓</kbd>
                <span>Navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.2 bg-zinc-900 border border-zinc-800 rounded">Enter</kbd>
                <span>Execute</span>
              </span>
            </div>
            <span>
              {currentView === "theme" ? "Theme Selector Mode" : "Nexus Cmd Center"}
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
