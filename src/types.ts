/**
 * Nexus IDE Types
 */

export interface ProjectFile {
  name: string;
  path: string;
  content: string;
  language: string;
  isSaved?: boolean;
  isFolder?: boolean;
}

export interface EditorCursor {
  userId: string;
  username: string;
  color: string;
  path: string;
  row: number;
  col: number;
  lastActive: number;
}

export interface LintProblem {
  line: number;
  column: number;
  severity: "error" | "warning";
  message: string;
  rule?: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

export interface CollaborationRoom {
  id: string;
  name: string;
  files: Record<string, string>; // path -> content
  cursors: Record<string, EditorCursor>;
  chat: ChatMessage[];
}

export interface IDETheme {
  id: string;
  name: string;
  bgPrimary: string;
  bgSecondary: string;
  bgActive: string;
  textPrimary: string;
  textMuted: string;
  accent: string;
  accentHover: string;
  border: string;
  editorBg: string;
  editorGutter: string;
  editorLineNumber: string;
}

export interface PluginExtension {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  version: string;
  author: string;
  category: "utility" | "theme" | "intelligence";
}
