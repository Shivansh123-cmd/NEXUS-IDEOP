import React from "react";
import { X, Command, Key, Sparkles, AlertCircle, ShieldCheck } from "lucide-react";

interface ShortcutModalProps {
  onClose: () => void;
}

export default function ShortcutModal({ onClose }: ShortcutModalProps) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-900 bg-zinc-900/40">
          <div className="flex items-center gap-2">
            <Command className="h-5 w-5 text-indigo-400" />
            <h3 className="font-sans text-base font-semibold">Nexus IDE Navigation Command Center</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-500 hover:text-zinc-200 rounded transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Shortcuts detail content */}
        <div className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[380px]">
          <div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Default Keyboard Bindings</span>
            <div className="flex flex-col gap-2.5 mt-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300">Run Active Code in Terminal</span>
                <kbd className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded text-indigo-300 font-mono text-[10px] shadow">F5</kbd>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300">Save Active File & Sync to Cloud</span>
                <kbd className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded text-indigo-300 font-mono text-[10px] shadow">Ctrl + S</kbd>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300">Focus AI Chat Assistant</span>
                <kbd className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded text-indigo-300 font-mono text-[10px] shadow">Ctrl + /</kbd>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300">Exit Command Modals / Close panels</span>
                <kbd className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded text-indigo-300 font-mono text-[10px] shadow">Esc</kbd>
              </div>
            </div>
          </div>

          <div className="h-px bg-zinc-900" />

          <div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Features Checklist</span>
            <div className="flex flex-col gap-2 mt-2">
              <div className="flex items-start gap-2.5 text-xs text-zinc-300">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-zinc-200">End-to-End Encryption Mode:</span> All user cloud sync data and communications are fully encrypted via server-side session protocols.
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-zinc-300">
                <Sparkles className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-zinc-200">Gemini Compiler Integration:</span> Real-time error matching, red squigglies, and lints for C++, Rust, Go, JavaScript, HTML, and CSS.
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-zinc-300">
                <AlertCircle className="h-4 w-4 text-pink-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-zinc-200">Simultaneous Co-authoring:</span> Work in active collaborative groups. Join room IDs instantly.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-900 bg-zinc-900/20 text-center text-[10px] text-zinc-500 font-mono">
          Press <kbd className="px-1 py-0.2 bg-zinc-950 border border-zinc-900 rounded text-zinc-400">Esc</kbd> to exit. Nexus IDE v1.0.0
        </div>

      </div>
    </div>
  );
}
