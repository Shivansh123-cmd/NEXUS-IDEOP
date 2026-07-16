/**
 * Custom ultra-high-speed syntax tokenizer for NEXUS IDE.
 * Avoids heavy external dependency compilation issues while delivering robust code coloring.
 */

export interface CodeToken {
  text: string;
  type: "keyword" | "type" | "string" | "comment" | "number" | "operator" | "preprocessor" | "builtin" | "text";
}

// Key word definitions for the 20 requested languages
const CPP_KEYWORDS = new Set(["if", "else", "for", "while", "do", "return", "switch", "case", "break", "continue", "class", "struct", "public", "private", "protected", "namespace", "const", "new", "delete", "this", "friend", "virtual", "inline", "template", "typename", "operator", "try", "catch", "throw"]);
const CPP_TYPES = new Set(["int", "double", "float", "char", "bool", "void", "short", "long", "signed", "unsigned", "size_t", "vector", "string", "unordered_map", "map", "set", "pair"]);
const CPP_BUILTINS = new Set(["std", "cout", "cin", "endl", "main", "printf", "scanf"]);

const GO_KEYWORDS = new Set(["package", "import", "func", "var", "const", "type", "struct", "interface", "map", "chan", "go", "select", "defer", "if", "else", "for", "range", "return", "switch", "case", "fallthrough", "default", "nil"]);
const GO_TYPES = new Set(["string", "int", "bool", "float64", "float32", "byte", "rune", "uint", "uint64", "error"]);
const GO_BUILTINS = new Set(["fmt", "Println", "Printf", "Print", "time", "make", "append", "len", "cap", "panic", "recover"]);

const RUST_KEYWORDS = new Set(["fn", "let", "mut", "pub", "use", "mod", "struct", "enum", "impl", "trait", "if", "else", "for", "while", "loop", "match", "return", "break", "continue", "const", "static", "as", "in", "where", "unsafe", "type", "self", "Self"]);
const RUST_TYPES = new Set(["i32", "u32", "i64", "u64", "usize", "isize", "f32", "f64", "bool", "char", "str", "String", "Vec", "Option", "Result", "Box"]);
const RUST_BUILTINS = new Set(["println!", "print!", "vec!", "format!", "panic!", "assert!", "unwrap", "expect"]);

const JS_KEYWORDS = new Set(["function", "const", "let", "var", "class", "interface", "type", "import", "export", "from", "default", "if", "else", "for", "while", "do", "return", "switch", "case", "break", "continue", "try", "catch", "finally", "throw", "new", "this", "super", "await", "async", "yield", "extends", "implements", "of", "in", "typeof", "instanceof"]);
const JS_TYPES = new Set(["string", "number", "boolean", "any", "void", "unknown", "never", "object", "Promise", "Array", "Map", "Set"]);
const JS_BUILTINS = new Set(["console", "log", "warn", "error", "info", "window", "document", "process", "require", "module", "performance", "now", "Math", "JSON", "stringify", "parse"]);

const PYTHON_KEYWORDS = new Set(["def", "class", "if", "elif", "else", "for", "while", "return", "import", "from", "as", "try", "except", "finally", "raise", "assert", "with", "yield", "lambda", "global", "nonlocal", "pass", "break", "continue", "in", "is", "and", "or", "not"]);
const PYTHON_TYPES = new Set(["int", "float", "str", "bool", "list", "dict", "set", "tuple", "object", "True", "False", "None"]);
const PYTHON_BUILTINS = new Set(["print", "len", "range", "input", "str", "int", "float", "list", "dict", "set", "type", "open", "enumerate", "zip", "sum", "min", "max", "abs"]);

const JAVA_KEYWORDS = new Set(["public", "private", "protected", "class", "interface", "enum", "extends", "implements", "import", "package", "new", "this", "super", "if", "else", "for", "while", "do", "return", "switch", "case", "break", "continue", "try", "catch", "finally", "throw", "throws", "static", "final", "abstract", "synchronized", "volatile", "transient", "assert", "instanceof"]);
const JAVA_TYPES = new Set(["int", "double", "float", "char", "boolean", "void", "byte", "short", "long", "String", "Object", "List", "ArrayList", "Map", "HashMap", "System"]);
const JAVA_BUILTINS = new Set(["out", "println", "print", "err", "main", "Scanner", "Math"]);

const CSHARP_KEYWORDS = new Set(["public", "private", "protected", "internal", "class", "struct", "interface", "enum", "delegate", "event", "namespace", "using", "new", "this", "base", "if", "else", "for", "foreach", "while", "do", "return", "switch", "case", "break", "continue", "try", "catch", "finally", "throw", "static", "readonly", "const", "virtual", "override", "abstract", "sealed", "partial", "async", "await", "yield", "get", "set", "value", "var"]);
const CSHARP_TYPES = new Set(["int", "double", "float", "char", "bool", "void", "string", "object", "List", "Dictionary", "Console", "Task", "null", "true", "false"]);
const CSHARP_BUILTINS = new Set(["WriteLine", "Write", "ReadLine", "Math", "Convert"]);

const C_KEYWORDS = new Set(["if", "else", "for", "while", "do", "return", "switch", "case", "break", "continue", "struct", "union", "typedef", "sizeof", "const", "static", "extern", "volatile", "goto"]);
const C_TYPES = new Set(["int", "double", "float", "char", "void", "short", "long", "signed", "unsigned", "size_t", "FILE"]);
const C_BUILTINS = new Set(["printf", "scanf", "malloc", "free", "exit", "fopen", "fclose", "fprintf", "fscanf"]);

const SQL_KEYWORDS = new Set(["select", "insert", "update", "delete", "create", "alter", "drop", "table", "from", "where", "join", "inner", "left", "right", "on", "and", "or", "not", "group", "by", "order", "having", "into", "values", "index", "primary", "key", "foreign", "references", "null", "is", "in", "between", "like", "exists", "as", "union", "all"]);
const SQL_TYPES = new Set(["int", "integer", "varchar", "char", "text", "boolean", "date", "timestamp", "float", "double", "real", "blob"]);
const SQL_BUILTINS = new Set(["count", "sum", "avg", "min", "max", "now", "coalesce", "concat"]);

const PHP_KEYWORDS = new Set(["echo", "print", "function", "class", "public", "private", "protected", "if", "else", "elseif", "for", "foreach", "while", "do", "return", "switch", "case", "break", "continue", "try", "catch", "finally", "throw", "new", "this", "namespace", "use", "include", "require", "require_once", "include_once", "var", "const", "global", "static"]);
const PHP_TYPES = new Set(["string", "int", "float", "bool", "array", "object", "null"]);
const PHP_BUILTINS = new Set(["array_merge", "count", "explode", "implode", "strlen", "json_encode", "json_decode", "header"]);

const RUBY_KEYWORDS = new Set(["def", "class", "module", "if", "unless", "else", "elsif", "for", "while", "until", "return", "yield", "begin", "rescue", "ensure", "raise", "fail", "and", "or", "not", "end", "do", "self", "super", "require", "include"]);
const RUBY_TYPES = new Set(["true", "false", "nil", "String", "Integer", "Float", "Array", "Hash", "Symbol"]);
const RUBY_BUILTINS = new Set(["puts", "print", "gets", "p", "require_relative", "attr_accessor", "attr_reader", "attr_writer"]);

const SWIFT_KEYWORDS = new Set(["func", "class", "struct", "enum", "protocol", "extension", "let", "var", "if", "else", "for", "while", "repeat", "return", "switch", "case", "break", "continue", "fallthrough", "guard", "defer", "import", "init", "self", "try", "catch", "throw", "as", "is", "weak", "unowned"]);
const SWIFT_TYPES = new Set(["Int", "Double", "Float", "String", "Bool", "Character", "Array", "Dictionary", "Optional", "nil", "true", "false"]);
const SWIFT_BUILTINS = new Set(["print", "readLine", "fatalError", "min", "max", "abs"]);

const KOTLIN_KEYWORDS = new Set(["fun", "val", "var", "class", "object", "interface", "if", "else", "for", "while", "do", "return", "when", "break", "continue", "try", "catch", "finally", "throw", "import", "package", "this", "super", "is", "as", "in", "by", "init", "constructor", "companion"]);
const KOTLIN_TYPES = new Set(["Int", "Double", "Float", "Long", "Short", "Byte", "Char", "Boolean", "String", "Any", "Unit", "Nothing", "null", "true", "false"]);
const KOTLIN_BUILTINS = new Set(["println", "print", "readLine", "arrayOf", "listOf", "mapOf", "setOf"]);

const DART_KEYWORDS = new Set(["void", "class", "import", "export", "library", "var", "final", "const", "late", "if", "else", "for", "while", "do", "return", "switch", "case", "break", "continue", "try", "catch", "finally", "throw", "new", "this", "super", "extends", "with", "implements", "async", "await", "yield", "get", "set"]);
const DART_TYPES = new Set(["int", "double", "num", "String", "bool", "List", "Map", "Set", "dynamic", "Object", "null", "true", "false"]);
const DART_BUILTINS = new Set(["print", "identical", "identityHashCode"]);

const R_KEYWORDS = new Set(["if", "else", "for", "while", "repeat", "in", "next", "break", "function", "return", "library", "require"]);
const R_TYPES = new Set(["TRUE", "FALSE", "NULL", "NA", "NaN", "Inf", "numeric", "character", "logical", "integer", "complex", "factor", "vector", "list", "matrix", "array", "data.frame"]);
const R_BUILTINS = new Set(["print", "cat", "c", "seq", "rep", "mean", "sum", "summary", "plot", "str", "head", "tail"]);

const MATLAB_KEYWORDS = new Set(["function", "end", "if", "else", "elseif", "for", "while", "break", "continue", "return", "try", "catch", "global", "persistent", "classdef", "properties", "methods", "events"]);
const MATLAB_TYPES = new Set(["double", "single", "int8", "int16", "int32", "int64", "uint8", "uint16", "uint32", "uint64", "char", "string", "logical", "cell", "struct"]);
const MATLAB_BUILTINS = new Set(["disp", "fprintf", "plot", "size", "length", "zeros", "ones", "eye", "rand", "sin", "cos", "tan", "exp", "log", "sqrt"]);

const ASSEMBLY_KEYWORDS = new Set(["global", "section", "extern", "db", "dw", "dd", "dq", "equ"]);
const ASSEMBLY_TYPES = new Set(["byte", "word", "dword", "qword", "ptr"]);
const ASSEMBLY_BUILTINS = new Set(["mov", "add", "sub", "mul", "div", "jmp", "cmp", "je", "jne", "jg", "jl", "int", "syscall", "push", "pop", "call", "ret", "xor", "and", "or", "inc", "dec"]);

const BASH_KEYWORDS = new Set(["if", "then", "elif", "else", "fi", "for", "in", "do", "done", "while", "until", "case", "esac", "function", "return", "exit", "local", "export", "alias", "source"]);
const BASH_TYPES = new Set(["true", "false"]);
const BASH_BUILTINS = new Set(["echo", "printf", "read", "cd", "pwd", "ls", "cat", "grep", "awk", "sed", "mkdir", "rm", "cp", "mv"]);


export function tokenizeLine(line: string, language: string): CodeToken[] {
  if (!line) return [{ text: " ", type: "text" }];

  const tokens: CodeToken[] = [];
  let index = 0;

  const trimmed = line.trim();

  // Multi-language Comment Matcher
  const isPythonOrRubyOrShellComment = trimmed.startsWith("#");
  const isSqlComment = trimmed.startsWith("--");
  const isMatlabComment = trimmed.startsWith("%");
  const isAssemblyComment = trimmed.startsWith(";");
  const isCppGoRustJsComment = trimmed.startsWith("//");

  if (isCppGoRustJsComment || isPythonOrRubyOrShellComment || isSqlComment || isMatlabComment || isAssemblyComment) {
    if (language === "cpp" && trimmed.startsWith("#include")) {
      // Check if C++ #include
      const includeIndex = line.indexOf("#include");
      if (includeIndex > -1) {
        if (includeIndex > 0) {
          tokens.push({ text: line.substring(0, includeIndex), type: "text" });
        }
        tokens.push({ text: "#include", type: "preprocessor" });
        tokens.push({ text: line.substring(includeIndex + 8), type: "string" });
        return tokens;
      }
    }
    
    // Check if it really matches comment style of the active language
    const isComment = 
      (isCppGoRustJsComment && ["cpp", "go", "rust", "javascript", "typescript", "java", "csharp", "c", "php", "kotlin", "dart", "html", "css"].includes(language)) ||
      (isPythonOrRubyOrShellComment && ["python", "ruby", "bash"].includes(language)) ||
      (isSqlComment && language === "sql") ||
      (isMatlabComment && language === "matlab") ||
      (isAssemblyComment && language === "assembly");

    if (isComment) {
      return [{ text: line, type: "comment" }];
    }
  }

  while (index < line.length) {
    const char = line[index];

    // String matches (double quotes)
    if (char === '"') {
      let strVal = '"';
      index++;
      while (index < line.length) {
        const c = line[index];
        strVal += c;
        if (c === '"' && line[index - 1] !== '\\') {
          index++;
          break;
        }
        index++;
      }
      tokens.push({ text: strVal, type: "string" });
      continue;
    }

    // String matches (single quotes / backticks)
    if (char === "'" || char === "`") {
      let strVal = char;
      index++;
      while (index < line.length) {
        const c = line[index];
        strVal += c;
        if (c === char && line[index - 1] !== '\\') {
          index++;
          break;
        }
        index++;
      }
      tokens.push({ text: strVal, type: "string" });
      continue;
    }

    // Inline Comments
    if (char === "/" && line[index + 1] === "/") {
      if (["cpp", "go", "rust", "javascript", "typescript", "java", "csharp", "c", "php", "kotlin", "dart"].includes(language)) {
        tokens.push({ text: line.substring(index), type: "comment" });
        break;
      }
    }
    if (char === "#" && ["python", "ruby", "bash"].includes(language)) {
      tokens.push({ text: line.substring(index), type: "comment" });
      break;
    }
    if (char === "-" && line[index + 1] === "-" && language === "sql") {
      tokens.push({ text: line.substring(index), type: "comment" });
      break;
    }
    if (char === "%" && language === "matlab") {
      tokens.push({ text: line.substring(index), type: "comment" });
      break;
    }
    if (char === ";" && language === "assembly") {
      tokens.push({ text: line.substring(index), type: "comment" });
      break;
    }

    // Numbers
    if (/\d/.test(char)) {
      let num = "";
      while (index < line.length && /[\d\.]/.test(line[index])) {
        num += line[index];
        index++;
      }
      tokens.push({ text: num, type: "number" });
      continue;
    }

    // Identifiers & Words
    if (/[a-zA-Z_!@]/.test(char)) {
      let word = "";
      while (index < line.length && /[a-zA-Z0-9_!@]/.test(line[index])) {
        word += line[index];
        index++;
      }

      // Categorize word by language
      let type: CodeToken["type"] = "text";
      const lowerWord = word.toLowerCase();

      switch (language) {
        case "cpp":
          if (CPP_KEYWORDS.has(word)) type = "keyword";
          else if (CPP_TYPES.has(word)) type = "type";
          else if (CPP_BUILTINS.has(word)) type = "builtin";
          break;
        case "go":
          if (GO_KEYWORDS.has(word)) type = "keyword";
          else if (GO_TYPES.has(word)) type = "type";
          else if (GO_BUILTINS.has(word)) type = "builtin";
          break;
        case "rust":
          if (RUST_KEYWORDS.has(word)) type = "keyword";
          else if (RUST_TYPES.has(word)) type = "type";
          else if (RUST_BUILTINS.has(word) || word.endsWith("!")) type = "builtin";
          break;
        case "python":
          if (PYTHON_KEYWORDS.has(word)) type = "keyword";
          else if (PYTHON_TYPES.has(word)) type = "type";
          else if (PYTHON_BUILTINS.has(word)) type = "builtin";
          break;
        case "java":
          if (JAVA_KEYWORDS.has(word)) type = "keyword";
          else if (JAVA_TYPES.has(word)) type = "type";
          else if (JAVA_BUILTINS.has(word)) type = "builtin";
          break;
        case "csharp":
          if (CSHARP_KEYWORDS.has(word)) type = "keyword";
          else if (CSHARP_TYPES.has(word)) type = "type";
          else if (CSHARP_BUILTINS.has(word)) type = "builtin";
          break;
        case "c":
          if (C_KEYWORDS.has(word)) type = "keyword";
          else if (C_TYPES.has(word)) type = "type";
          else if (C_BUILTINS.has(word)) type = "builtin";
          break;
        case "sql":
          if (SQL_KEYWORDS.has(lowerWord)) type = "keyword";
          else if (SQL_TYPES.has(lowerWord)) type = "type";
          else if (SQL_BUILTINS.has(lowerWord)) type = "builtin";
          break;
        case "php":
          if (PHP_KEYWORDS.has(word)) type = "keyword";
          else if (PHP_TYPES.has(word)) type = "type";
          else if (PHP_BUILTINS.has(word)) type = "builtin";
          break;
        case "ruby":
          if (RUBY_KEYWORDS.has(word)) type = "keyword";
          else if (RUBY_TYPES.has(word)) type = "type";
          else if (RUBY_BUILTINS.has(word)) type = "builtin";
          break;
        case "swift":
          if (SWIFT_KEYWORDS.has(word)) type = "keyword";
          else if (SWIFT_TYPES.has(word)) type = "type";
          else if (SWIFT_BUILTINS.has(word)) type = "builtin";
          break;
        case "kotlin":
          if (KOTLIN_KEYWORDS.has(word)) type = "keyword";
          else if (KOTLIN_TYPES.has(word)) type = "type";
          else if (KOTLIN_BUILTINS.has(word)) type = "builtin";
          break;
        case "dart":
          if (DART_KEYWORDS.has(word)) type = "keyword";
          else if (DART_TYPES.has(word)) type = "type";
          else if (DART_BUILTINS.has(word)) type = "builtin";
          break;
        case "r":
          if (R_KEYWORDS.has(word)) type = "keyword";
          else if (R_TYPES.has(word)) type = "type";
          else if (R_BUILTINS.has(word)) type = "builtin";
          break;
        case "matlab":
          if (MATLAB_KEYWORDS.has(word)) type = "keyword";
          else if (MATLAB_TYPES.has(word)) type = "type";
          else if (MATLAB_BUILTINS.has(word)) type = "builtin";
          break;
        case "assembly":
          if (ASSEMBLY_KEYWORDS.has(lowerWord)) type = "keyword";
          else if (ASSEMBLY_TYPES.has(lowerWord)) type = "type";
          else if (ASSEMBLY_BUILTINS.has(lowerWord)) type = "builtin";
          break;
        case "bash":
          if (BASH_KEYWORDS.has(word)) type = "keyword";
          else if (BASH_TYPES.has(word)) type = "type";
          else if (BASH_BUILTINS.has(word)) type = "builtin";
          break;
        default:
          // Default JavaScript / TypeScript
          if (JS_KEYWORDS.has(word)) type = "keyword";
          else if (JS_TYPES.has(word)) type = "type";
          else if (JS_BUILTINS.has(word)) type = "builtin";
          break;
      }

      tokens.push({ text: word, type });
      continue;
    }

    // Operators and Punctuations
    if (/[\+\-\*\/%=<>!&|~^?:\.\(\)\[\]\{\};,]/.test(char)) {
      tokens.push({ text: char, type: "operator" });
      index++;
      continue;
    }

    // Default character text
    tokens.push({ text: char, type: "text" });
    index++;
  }

  return tokens;
}

