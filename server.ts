import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory file storage and collaborative state (with disk backups)
const STORE_DIR = path.join(process.cwd(), "data");
const FILES_PATH = path.join(STORE_DIR, "files.json");
const ROOMS_PATH = path.join(STORE_DIR, "rooms.json");

if (!fs.existsSync(STORE_DIR)) {
  fs.mkdirSync(STORE_DIR, { recursive: true });
}

// Initial default code files
const defaultFiles = {
  "src/main.cpp": {
    name: "main.cpp",
    path: "src/main.cpp",
    language: "cpp",
    content: `#include <iostream>
#include <vector>
#include <string>

using namespace std;

int main() {
    cout << "🚀 Welcome to NEXUS IDE - C++ Sandbox!" << endl;
    
    vector<string> features = {"Collaborative Editing", "Real-time AI Linter", "Multi-language Shell"};
    
    cout << "\\nExploring IDE Capabilities:" << endl;
    for (int i = 0; i < features.size(); ++i) {
        cout << "  [+] " << features[i] << endl;
    }
    
    cout << "\\nHappy coding!" << endl;
    return 0;
}`
  },
  "src/main.go": {
    name: "main.go",
    path: "src/main.go",
    language: "go",
    content: `package main

import (
	"fmt"
	"time"
)

func main() {
	fmt.Println("⚡ Nexus IDE Go Environment initialized.")
	
	tasks := []string{"Linter online", "Syntax coloring active", "E2E sync established"}
	
	for idx, val := range tasks {
		fmt.Printf("Task %d: %s\\n", idx+1, val)
	}
	
	fmt.Printf("Current server time: %s\\n", time.Now().Format("15:04:05"))
}`
  },
  "src/main.rs": {
    name: "main.rs",
    path: "src/main.rs",
    language: "rust",
    content: `fn main() {
    println!("🦀 Hello from the Rust Environment on Nexus!");
    
    let speed_optimization = true;
    let collaborative_mode = "simultaneous";
    
    println!("Loading speed optimized: {}", speed_optimization);
    println!("Active co-authoring: {}", collaborative_mode);
    
    let score = vec![98, 99, 100];
    println!("Nexus stability score: {:?}", score);
}`
  },
  "src/index.js": {
    name: "index.js",
    path: "src/index.js",
    language: "javascript",
    content: `// Client and Server Scripting Demo
console.log("🌟 Nexus JavaScript Workspace Ready!");

function calculatePerformance() {
  const start = performance.now();
  let iterations = 100000;
  for (let i = 0; i < iterations; i++) {
    Math.sqrt(i) * Math.sin(i);
  }
  const end = performance.now();
  console.log(\`Processed \${iterations} operations in \${(end - start).toFixed(4)}ms\`);
}

calculatePerformance();`
  }
};

// Helper: load stored files
function loadFiles() {
  try {
    if (fs.existsSync(FILES_PATH)) {
      return JSON.parse(fs.readFileSync(FILES_PATH, "utf8"));
    }
  } catch (e) {
    console.error("Error reading stored files, resetting.", e);
  }
  fs.writeFileSync(FILES_PATH, JSON.stringify(defaultFiles, null, 2));
  return defaultFiles;
}

// Helper: save files to disk
function saveFilesToDisk(files: any) {
  try {
    fs.writeFileSync(FILES_PATH, JSON.stringify(files, null, 2));
  } catch (e) {
    console.error("Failed to save files to disk", e);
  }
}

// Helper: load/save rooms
let collabRooms: Record<string, any> = {};
try {
  if (fs.existsSync(ROOMS_PATH)) {
    collabRooms = JSON.parse(fs.readFileSync(ROOMS_PATH, "utf8"));
  }
} catch (e) {
  console.error("Error reading rooms", e);
}

function saveRoomsToDisk() {
  try {
    fs.writeFileSync(ROOMS_PATH, JSON.stringify(collabRooms, null, 2));
  } catch (e) {
    console.error("Failed to save rooms to disk", e);
  }
}

// Initialize files
let workspaceFiles = loadFiles();

// Lazy Gemini API instantiation
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not defined");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
  }
  return aiClient;
}

// ================= API ENDPOINTS =================

// 1. Files operations
app.get("/api/files", (req, res) => {
  res.json(Object.values(workspaceFiles));
});

app.post("/api/files/save", (req, res) => {
  const { path: filePath, content, language, name } = req.body;
  if (!filePath) {
    return res.status(400).json({ error: "Missing filePath parameter" });
  }
  workspaceFiles[filePath] = {
    name: name || filePath.split("/").pop() || "untitled",
    path: filePath,
    content,
    language: language || "javascript",
    isSaved: true
  };
  saveFilesToDisk(workspaceFiles);
  res.json({ success: true, file: workspaceFiles[filePath] });
});

app.post("/api/files/delete", (req, res) => {
  const { path: filePath } = req.body;
  if (filePath && workspaceFiles[filePath]) {
    delete workspaceFiles[filePath];
    saveFilesToDisk(workspaceFiles);
    return res.json({ success: true });
  }
  res.status(404).json({ error: "File not found" });
});

// 2. Collaborative editing room synchronization
app.post("/api/collab/join", (req, res) => {
  const { roomId, username, userId } = req.body;
  if (!roomId || !userId) {
    return res.status(400).json({ error: "Room ID and User ID are required" });
  }

  if (!collabRooms[roomId]) {
    collabRooms[roomId] = {
      id: roomId,
      name: `Room #${roomId.substring(0, 5)}`,
      files: Object.keys(workspaceFiles).reduce((acc, key) => {
        acc[key] = workspaceFiles[key].content;
        return acc;
      }, {} as Record<string, string>),
      cursors: {},
      chat: [
        {
          id: "welcome-" + Date.now(),
          sender: "ai",
          text: `Welcome, ${username || 'developer'}, to secure session room ${roomId}! Type with peers in real-time.`,
          timestamp: new Date().toLocaleTimeString()
        }
      ]
    };
  }

  // Register user cursor
  collabRooms[roomId].cursors[userId] = {
    userId,
    username: username || `Dev-${userId.substring(0, 4)}`,
    color: "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
    path: Object.keys(workspaceFiles)[0] || "",
    row: 0,
    col: 0,
    lastActive: Date.now()
  };

  saveRoomsToDisk();
  res.json({ success: true, room: collabRooms[roomId] });
});

app.post("/api/collab/sync", (req, res) => {
  const { roomId, userId, filesUpdate, cursorUpdate } = req.body;
  if (!roomId || !userId || !collabRooms[roomId]) {
    return res.status(400).json({ error: "Invalid collaboration request" });
  }

  const room = collabRooms[roomId];

  // Update room files if client sent any revisions
  if (filesUpdate) {
    Object.keys(filesUpdate).forEach((filePath) => {
      room.files[filePath] = filesUpdate[filePath];
      // Keep master workspace files updated too
      if (workspaceFiles[filePath]) {
        workspaceFiles[filePath].content = filesUpdate[filePath];
      }
    });
    saveFilesToDisk(workspaceFiles);
  }

  // Update cursor info
  if (cursorUpdate) {
    if (!room.cursors[userId]) {
      room.cursors[userId] = { userId, lastActive: Date.now() };
    }
    room.cursors[userId] = {
      ...room.cursors[userId],
      ...cursorUpdate,
      lastActive: Date.now()
    };
  }

  // Remove stale cursors (>10 seconds)
  const cutoff = Date.now() - 10000;
  Object.keys(room.cursors).forEach((id) => {
    if (room.cursors[id].lastActive < cutoff && id !== userId) {
      delete room.cursors[id];
    }
  });

  saveRoomsToDisk();
  res.json({ success: true, files: room.files, cursors: room.cursors, chat: room.chat });
});

app.post("/api/collab/chat", (req, res) => {
  const { roomId, userId, username, text } = req.body;
  if (!roomId || !collabRooms[roomId] || !text) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  const newMessage = {
    id: "msg-" + Date.now() + Math.random().toString(36).substring(2, 5),
    sender: "user" as const,
    text: `${username || 'User'}: ${text}`,
    timestamp: new Date().toLocaleTimeString()
  };

  collabRooms[roomId].chat.push(newMessage);
  
  // Cap chat history to last 50 entries
  if (collabRooms[roomId].chat.length > 50) {
    collabRooms[roomId].chat.shift();
  }

  saveRoomsToDisk();
  res.json({ success: true, chat: collabRooms[roomId].chat });
});

// 3. Gemini Linter (Real-time Syntax Error Checking)
app.post("/api/gemini/lint", async (req, res) => {
  const { code, language } = req.body;
  if (!code) {
    return res.json({ problems: [] });
  }

  try {
    const ai = getGeminiClient();
    const prompt = `Analyze the following ${language} code for syntax, style issues, or logical bugs.
Return a valid JSON array of problems. Each element must contain exactly:
- line: 1-indexed line number of the problem
- column: column index (approximate)
- severity: either "error" or "warning"
- message: clear helpful explanation of what is wrong
- rule: custom rule id (e.g. "missing-semicolon", "type-mismatch", "syntax")

Ensure that if the code is perfectly clean, you return an empty array: []
Do not include any Markdown ticks like \`\`\`json. Return pure JSON output.

Code to analyze:
${code}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash", // Use general-purpose flash
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text || "[]";
    const parsed = JSON.parse(text.trim());
    res.json({ problems: parsed });
  } catch (err: any) {
    console.error("Gemini linting error:", err.message);
    
    // Fail gracefully: apply local basic static linter so the user always has feedback
    const problems = [];
    const lines = code.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const lineText = lines[i];
      if (language === "cpp" || language === "rust" || language === "go") {
        if (!lineText.trim().endsWith(";") && 
            !lineText.trim().endsWith("{") && 
            !lineText.trim().endsWith("}") && 
            !lineText.trim().startsWith("#") &&
            !lineText.trim().startsWith("//") &&
            lineText.trim().length > 0) {
          // Rust macro calls or normal statements require semicolon
          if (language === "rust" && lineText.includes("println!") && !lineText.includes(";")) {
            problems.push({
              line: i + 1,
              column: lineText.length,
              severity: "error" as const,
              message: "Missing semicolon after print macro statement.",
              rule: "rustfmt-semi"
            });
          } else if (language === "cpp" && (lineText.includes("cout") || lineText.includes("return")) && !lineText.includes(";")) {
            problems.push({
              line: i + 1,
              column: lineText.length,
              severity: "error" as const,
              message: "Expected ';' at end of statement.",
              rule: "cpp-semi"
            });
          }
        }
      }
    }
    res.json({ problems, warning: "Fell back to standard regex checking (No API key found or error)." });
  }
});

// 4. Gemini AI Chatbot / Assistant Inside Workspace
app.post("/api/gemini/chat", async (req, res) => {
  const { messages, currentFileContent, currentFilePath } = req.body;
  if (!messages || messages.length === 0) {
    return res.status(400).json({ error: "Missing messages history" });
  }

  try {
    const ai = getGeminiClient();
    
    // Setup system instructions role
    const systemPrompt = `You are NEXUS AI, an expert embedded coding assistant in NEXUS IDE.
You are helping developers with high-level code explanations, debugging, optimization, and generation.
The active file the user is editing is: ${currentFilePath || "unknown"}.
Active code in the editor is:
\`\`\`
${currentFileContent || "(No file open)"}
\`\`\`
Be highly technical, concise, clear, and precise. Provide code corrections clearly.`;

    const chatContent = messages.map((m: any) => ({
      role: m.sender === "user" ? "user" : "model",
      parts: [{ text: m.text }]
    }));

    // Inject system context to the first prompt or as instruction
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: chatContent,
      config: {
        systemInstruction: systemPrompt,
      }
    });

    res.json({ text: response.text || "Sorry, I am unable to compute a response." });
  } catch (err: any) {
    console.error("Gemini Assistant error:", err.message);
    res.json({ 
      text: `⚠️ [Nexus AI offline]: ${err.message}. Please configure your \`GEMINI_API_KEY\` in Settings > Secrets to enable smart AI guidance, real-time complex compiler lints, and inline code completion.` 
    });
  }
});

// 5. Terminal execution / Sandbox Simulator
app.post("/api/terminal/run", async (req, res) => {
  const { code, language, stdinInput } = req.body;
  if (!code) {
    return res.json({ output: "❌ Code workspace is empty. Write some code first!" });
  }

  try {
    const ai = getGeminiClient();
    const prompt = `You are a real-time terminal shell runtime executing code.
The user wants to execute/compile the following ${language} code.
Standard Input (stdin) provided by the user is: "${stdinInput || ""}".

Simulate a realistic shell execution cycle. Provide the step-by-step compilation logs first (as if g++, go build, or rustc is running), and then capture the exact logical output/stdout/stderr of the code logic based on the user's stdin.
Keep the output looking like a real Linux Bash console session. Use standard ANSI colors if appropriate.

Example structure for C++:
$ g++ -std=c++17 main.cpp -o main
$ ./main
[Actual program output printed here]
$

Code content to compile and run:
${code}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ output: response.text || "Runtime completed with exit code 0." });
  } catch (err: any) {
    // Elegant fallback simulation if Gemini API key is missing or errored
    let simulatedOutput = "";
    const lowerLang = (language || "javascript").toLowerCase();
    
    // Helper function to dynamically extract print statements from the user's actual code
    const extractOutputs = (codeStr: string, langName: string, stdinText?: string): string[] => {
      const lines = codeStr.split("\n");
      const outputs: string[] = [];
      
      lines.forEach((line) => {
        const trimmed = line.trim();
        // Skip comments
        if (trimmed.startsWith("//") || trimmed.startsWith("#") || trimmed.startsWith("--") || trimmed.startsWith("%") || trimmed.startsWith(";")) {
          return;
        }

        // 1. Python / Swift / Kotlin / Dart / R / PHP print (e.g., print("hello"))
        const printMatch = trimmed.match(/print\s*\(\s*["'`](.*?)["'`]\s*\)/i);
        if (printMatch) {
          outputs.push(printMatch[1]);
          return;
        }

        // 2. JavaScript / TypeScript console.log
        const consoleLogMatch = trimmed.match(/console\.log\s*\(\s*["'`](.*?)["'`]\s*\)/);
        if (consoleLogMatch) {
          outputs.push(consoleLogMatch[1]);
          return;
        }

        // 3. Java System.out.println / System.out.print
        const javaPrintMatch = trimmed.match(/System\.out\.print(ln)?\s*\(\s*["'`](.*?)["'`]\s*\)/);
        if (javaPrintMatch) {
          outputs.push(javaPrintMatch[2]);
          return;
        }

        // 4. C# Console.WriteLine
        const csharpPrintMatch = trimmed.match(/Console\.Write(Line)?\s*\(\s*["'`](.*?)["'`]\s*\)/);
        if (csharpPrintMatch) {
          outputs.push(csharpPrintMatch[2]);
          return;
        }

        // 5. C++ cout << "..."
        const cppCoutMatch = trimmed.match(/cout\s*<<\s*["'](.*?)["']/);
        if (cppCoutMatch) {
          outputs.push(cppCoutMatch[1]);
          return;
        }

        // 6. C printf("...")
        const cPrintfMatch = trimmed.match(/printf\s*\(\s*["'](.*?)["']/);
        if (cPrintfMatch) {
          outputs.push(cPrintfMatch[1]);
          return;
        }

        // 7. Go fmt.Println("...")
        const goPrintMatch = trimmed.match(/fmt\.Print(ln)?\s*\(\s*["'](.*?)["']\s*\)/);
        if (goPrintMatch) {
          outputs.push(goPrintMatch[2]);
          return;
        }

        // 8. Rust println!("...")
        const rustPrintMatch = trimmed.match(/println!\s*\(\s*["'](.*?)["']\s*\)/);
        if (rustPrintMatch) {
          outputs.push(rustPrintMatch[1]);
          return;
        }

        // 9. PHP echo "..."
        const phpEchoMatch = trimmed.match(/echo\s+["'](.*?)["']/);
        if (phpEchoMatch) {
          outputs.push(phpEchoMatch[1]);
          return;
        }

        // 10. Ruby puts "..."
        const rubyPutsMatch = trimmed.match(/puts\s+["'](.*?)["']/);
        if (rubyPutsMatch) {
          outputs.push(rubyPutsMatch[1]);
          return;
        }

        // 11. MATLAB disp('...')
        const matlabDispMatch = trimmed.match(/disp\s*\(\s*['"](.*?)['"]\s*\)/);
        if (matlabDispMatch) {
          outputs.push(matlabDispMatch[1]);
          return;
        }

        // 12. Bash/Shell echo "..."
        const bashEchoMatch = trimmed.match(/echo\s+["'](.*?)["']/);
        if (bashEchoMatch) {
          outputs.push(bashEchoMatch[1]);
          return;
        }
        const bashEchoPlainMatch = trimmed.match(/^echo\s+(.*)/);
        if (bashEchoPlainMatch && !trimmed.includes('"') && !trimmed.includes("'")) {
          outputs.push(bashEchoPlainMatch[1]);
          return;
        }
      });

      if (outputs.length === 0) {
        if (stdinText) {
          outputs.push(`Program read stdin input: "${stdinText}"`);
          outputs.push(`Execution completed successfully.`);
        } else {
          outputs.push("Program executed successfully. Exit code: 0");
        }
      }
      return outputs;
    };

    const userOutputs = extractOutputs(code, lowerLang, stdinInput);
    const stdoutStr = userOutputs.join("\n");

    if (lowerLang === "python") {
      simulatedOutput = `[NEXUS Sandbox v2.1: Python 3.11 Offline Environment]
$ python -m venv .venv
$ source .venv/bin/activate
(.venv) $ pip install -r requirements.txt --quiet
✓ Restoring packages... Done. Installed 0 extra dependencies.
(.venv) $ python main.py
${stdinInput ? `[Stdin input: ${stdinInput}]\n` : ""}${stdoutStr}
(.venv) $`;
    } else if (lowerLang === "javascript") {
      try {
        let logged: string[] = [];
        const originalLog = console.log;
        console.log = (...args) => { logged.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(" ")); };
        const cleanCode = code.replace(/import\s+.*?;/g, "");
        const result = new Function(cleanCode)();
        console.log = originalLog;
        simulatedOutput = `[NEXUS Sandbox v2.1: Node.js v20 Offline Runtime]
$ npm install --quiet
✓ Node modules synchronized with package.json.
$ node index.js
${stdinInput ? `[Stdin: ${stdinInput}]\n` : ""}${logged.length > 0 ? logged.join("\n") : stdoutStr}${result !== undefined ? `\nReturned value: ${result}` : ""}`;
      } catch (evalErr: any) {
        simulatedOutput = `[NEXUS Sandbox v2.1: Node.js v20 Offline Runtime]
$ node index.js
❌ Runtime Error: ${evalErr.message}`;
      }
    } else if (lowerLang === "typescript") {
      try {
        let logged: string[] = [];
        const originalLog = console.log;
        console.log = (...args) => { logged.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(" ")); };
        // Strip TS types simple regex
        const cleanCode = code
          .replace(/:\s*(string|number|boolean|any|void|unknown|never)/g, "")
          .replace(/import\s+.*?;/g, "");
        const result = new Function(cleanCode)();
        console.log = originalLog;
        simulatedOutput = `[NEXUS Sandbox v2.1: TypeScript 5.2 Compiler & Node Runtime]
$ tsc main.ts --target es2022 --module commonjs
✓ Compilation completed. 0 syntax errors.
$ node main.js
${logged.length > 0 ? logged.join("\n") : stdoutStr}${result !== undefined ? `\nReturned: ${result}` : ""}`;
      } catch (evalErr: any) {
        simulatedOutput = `[NEXUS Sandbox v2.1: TypeScript Compiler]
$ tsc main.ts
❌ Compilation/Runtime Error: ${evalErr.message}`;
      }
    } else if (lowerLang === "java") {
      simulatedOutput = `[NEXUS Sandbox v2.1: OpenJDK 21 Offline environment]
$ java -version
openjdk version "21.0.2" 2024-01-16
OpenJDK Runtime Environment (build 21.0.2+13-Ubuntu-122.04)
$ javac Main.java
✓ Bytecode emitted successfully.
$ java Main
${stdinInput ? `[Stdin Stream Linked: ${stdinInput}]\n` : ""}${stdoutStr}`;
    } else if (lowerLang === "csharp") {
      simulatedOutput = `[NEXUS Sandbox v2.1: .NET Core SDK 8.0 Compiler]
$ dotnet --version
8.0.101
$ dotnet restore
  Determining projects to restore...
  Restored Program.csproj in 18 ms.
$ dotnet run
${stdinInput ? `[Stdin Stream: ${stdinInput}]\n` : ""}${stdoutStr}`;
    } else if (lowerLang === "cpp") {
      simulatedOutput = `[NEXUS Sandbox v2.1: GCC/g++ 13.2 C++ Compiler]
$ g++ -std=c++17 main.cpp -o main
✓ Compiled and linked in 180ms.
$ ./main
${stdinInput ? `[Reading stdin: ${stdinInput}]\n` : ""}${stdoutStr}`;
    } else if (lowerLang === "c") {
      simulatedOutput = `[NEXUS Sandbox v2.1: GCC 13.2 C Compiler]
$ gcc main.c -o main
✓ Compilation completed successfully.
$ ./main
${stdinInput ? `[Reading stdin: ${stdinInput}]\n` : ""}${stdoutStr}`;
    } else if (lowerLang === "go") {
      simulatedOutput = `[NEXUS Sandbox v2.1: Go 1.21.5 Runtime Compiler]
$ go version
go version go1.21.5 linux/amd64
$ go mod tidy
✓ Synchronized go.mod dependencies.
$ go run main.go
${stdinInput ? `[Stdin input: ${stdinInput}]\n` : ""}${stdoutStr}`;
    } else if (lowerLang === "rust") {
      simulatedOutput = `[NEXUS Sandbox v2.1: Rustc 1.75 / Cargo Environment]
$ cargo --version
cargo 1.75.0 (1d8b05cdd 2023-11-20)
$ cargo build --quiet
✓ Compiled binary package "nexus-bin" successfully.
$ cargo run
${stdinInput ? `[Stdin input: ${stdinInput}]\n` : ""}${stdoutStr}`;
    } else if (lowerLang === "sql") {
      simulatedOutput = `[NEXUS Sandbox v2.1: SQLite3 Client Engine]
$ sqlite3 sandbox.db
SQLite version 3.42.0 2023-05-16 12:36:15
sqlite> .read query.sql
[SQL Execute OK] Statements parsed: ${code.split(";").length - 1}
-------------------------------
Executing logic:
${stdoutStr}`;
    } else if (lowerLang === "php") {
      simulatedOutput = `[NEXUS Sandbox v2.1: PHP 8.2.12 Zend Engine]
$ php -v
PHP 8.2.12 (cli) (built: Oct 27 2023 11:01:21)
$ php script.php
${stdoutStr}`;
    } else if (lowerLang === "ruby") {
      simulatedOutput = `[NEXUS Sandbox v2.1: Ruby 3.2.2 Environment]
$ ruby -v
ruby 3.2.2 (2023-03-30 revision e51014f9c0) [x86_64-linux]
$ ruby script.rb
${stdoutStr}`;
    } else if (lowerLang === "swift") {
      simulatedOutput = `[NEXUS Sandbox v2.1: Swift 5.9 Compiler Runtime]
$ swiftc main.swift -o main
✓ Compilation succeeded.
$ ./main
${stdoutStr}`;
    } else if (lowerLang === "kotlin") {
      simulatedOutput = `[NEXUS Sandbox v2.1: Kotlin v1.9.22 (JRE 21.0.2)]
$ kotlinc main.kt -include-runtime -d main.jar
✓ Jar package emitted.
$ java -jar main.jar
${stdoutStr}`;
    } else if (lowerLang === "dart") {
      simulatedOutput = `[NEXUS Sandbox v2.1: Dart SDK 3.2.3 VM]
$ dart --version
Dart SDK version: 3.2.3 (stable)
$ dart run main.dart
${stdoutStr}`;
    } else if (lowerLang === "r") {
      simulatedOutput = `[NEXUS Sandbox v2.1: R version 4.3.2 Workspace]
$ Rscript script.r
${stdoutStr}`;
    } else if (lowerLang === "matlab") {
      simulatedOutput = `[NEXUS Sandbox v2.1: MATLAB R2023b Core Runtime]
$ matlab -nodesktop -nosplash -r "run('script.m')"
Executing script.m...
${stdoutStr}`;
    } else if (lowerLang === "html" || lowerLang === "css") {
      simulatedOutput = `[NEXUS Sandbox v2.1: Live Static Preview Web Server]
$ npm install -g live-server --quiet
$ live-server --port=3000 --no-browser
[Live Server] Serving static files from workspace.
[Live Server] Watching index.html, styles.css and assets.
[Live Server] Server running on http://localhost:3000/
[Web UI Engine]: HTML DOM parsed with active Stylesheets. 
Preview live rendered inside the Nexus iframe sandbox.`;
    } else if (lowerLang === "assembly") {
      simulatedOutput = `[NEXUS Sandbox v2.1: NASM Assembler & GNU Linker (x86_64)]
$ nasm -f elf64 main.asm -o main.o
✓ Assembler output main.o created.
$ ld main.o -o main
✓ Linking complete. Output binary size: 8.4 KB.
$ ./main
${stdoutStr}`;
    } else if (lowerLang === "bash") {
      simulatedOutput = `[NEXUS Sandbox v2.1: GNU bash version 5.2.15-release]
$ chmod +x script.sh
$ ./script.sh
${stdinInput ? `[Stdin stream linked]\n` : ""}${stdoutStr}`;
    } else {
      simulatedOutput = `[NEXUS Sandbox v2.1: Standard Script Runtime]
$ executing environment for ${language}...
${stdoutStr}`;
    }

    res.json({ output: simulatedOutput, warning: "Simulated execution fallback (Offline)." });
  }
});

// ================= VITE OR STATIC HANDLING =================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite dev server middleware mounted.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Nexus IDE running on port ${PORT}`);
  });
}

startServer();
