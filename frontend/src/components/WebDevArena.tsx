import React, { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import {
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Smartphone,
  Tablet,
  Monitor,
  Terminal,
  FileCode,
  Sparkles,
  Trophy,
  ExternalLink,
  ChevronDown,
  Layers,
  Code2,
  Eye,
  Check,
  AlertCircle
} from "lucide-react";
import { webdevChallenges, WebDevChallenge } from "../data/webdevChallenges";
import { useTheme } from "../context/ThemeContext";

interface ConsoleLog {
  id: string;
  level: "info" | "warn" | "error";
  message: string;
  time: string;
}

interface TestResult {
  id: string;
  description: string;
  passed: boolean;
  error?: string;
}

interface WebDevArenaProps {
  initialChallengeId?: string;
  onChallengeComplete?: (challengeId: string, score: number) => void;
}

export const WebDevArena: React.FC<WebDevArenaProps> = ({
  initialChallengeId,
  onChallengeComplete
}) => {
  const { resolvedTheme } = useTheme();

  // Selected Challenge
  const [selectedChallenge, setSelectedChallenge] = useState<WebDevChallenge>(() => {
    return (
      webdevChallenges.find((c) => c.id === initialChallengeId) ||
      webdevChallenges[0]
    );
  });

  // Multi-file editor state
  const [activeFile, setActiveFile] = useState<"html" | "css" | "js">("html");
  const [files, setFiles] = useState<{ html: string; css: string; js: string }>(
    selectedChallenge.files
  );

  // View & Device settings
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [viewMode, setViewMode] = useState<"split" | "editor" | "preview">("split");
  const [isConsoleOpen, setIsConsoleOpen] = useState<boolean>(false);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);

  // Testing & Verification State
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState<boolean>(false);
  const [allPassed, setAllPassed] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"spec" | "tests">("spec");

  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // When challenge changes, reload files and reset results
  useEffect(() => {
    setFiles(selectedChallenge.files);
    setTestResults([]);
    setAllPassed(false);
    setConsoleLogs([]);
    setActiveFile("html");
  }, [selectedChallenge]);

  // Listen to iframe console messages
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === "SKILLSPHERE_CONSOLE_LOG") {
        const newLog: ConsoleLog = {
          id: Math.random().toString(36).substring(2, 9),
          level: e.data.level,
          message: e.data.message,
          time: new Date().toLocaleTimeString()
        };
        setConsoleLogs((prev) => [...prev.slice(-49), newLog]);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Generate complete HTML source with intercepted console
  const generatePreviewHtml = () => {
    const consoleInterceptorScript = `
      <script>
        (function() {
          const sendLog = (level, args) => {
            try {
              const msg = Array.from(args).map(a => {
                if (typeof a === 'object') {
                  try { return JSON.stringify(a); } catch(e) { return String(a); }
                }
                return String(a);
              }).join(' ');
              window.parent.postMessage({ type: 'SKILLSPHERE_CONSOLE_LOG', level: level, message: msg }, '*');
            } catch(err) {}
          };

          const _log = console.log;
          const _warn = console.warn;
          const _err = console.error;

          console.log = function() { sendLog('info', arguments); _log.apply(console, arguments); };
          console.warn = function() { sendLog('warn', arguments); _warn.apply(console, arguments); };
          console.error = function() { sendLog('error', arguments); _err.apply(console, arguments); };

          window.onerror = function(msg, url, line) {
            sendLog('error', [msg + ' (line ' + line + ')']);
          };
        })();
      </script>
    `;

    // Inject CSS into HTML head
    let htmlContent = files.html;
    const styleTag = `<style>${files.css}</style>`;
    const scriptTag = `<script>${files.js}</script>`;

    if (htmlContent.includes("</head>")) {
      htmlContent = htmlContent.replace("</head>", `${styleTag}</head>`);
    } else {
      htmlContent = `${styleTag}${htmlContent}`;
    }

    // Inject console script at the top of body, and user script at end
    if (htmlContent.includes("</body>")) {
      htmlContent = htmlContent.replace("</body>", `${scriptTag}</body>`);
    } else {
      htmlContent = `${htmlContent}${scriptTag}`;
    }

    return `${consoleInterceptorScript}${htmlContent}`;
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value === undefined) return;
    setFiles((prev) => ({
      ...prev,
      [activeFile]: value
    }));
  };

  const handleReset = () => {
    if (confirm("Reset current challenge to initial starter code?")) {
      setFiles(selectedChallenge.files);
      setTestResults([]);
      setAllPassed(false);
      setConsoleLogs([]);
    }
  };

  // Run Test Verification
  const runVerification = () => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) return;
    setIsRunningTests(true);
    setActiveTab("tests");

    const iframeWin = iframeRef.current.contentWindow as any;
    const iframeDoc = iframeRef.current.contentDocument || iframeWin.document;

    setTimeout(() => {
      const results: TestResult[] = [];
      let passedCount = 0;

      for (const t of selectedChallenge.tests) {
        try {
          // Run testFn inside the iframe execution context
          const testRunner = new iframeWin.Function("document", "window", `return (${t.testFn});`);
          const passed = Boolean(testRunner(iframeDoc, iframeWin));
          if (passed) passedCount++;
          results.push({
            id: t.id,
            description: t.description,
            passed
          });
        } catch (err: any) {
          results.push({
            id: t.id,
            description: t.description,
            passed: false,
            error: err.message
          });
        }
      }

      setTestResults(results);
      const isComplete = results.length > 0 && passedCount === results.length;
      setAllPassed(isComplete);
      setIsRunningTests(false);

      if (isComplete && onChallengeComplete) {
        onChallengeComplete(selectedChallenge.id, selectedChallenge.points);
      }
    }, 400);
  };

  const getMonacoLanguage = () => {
    if (activeFile === "html") return "html";
    if (activeFile === "css") return "css";
    return "javascript";
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-background text-foreground select-none">
      {/* Top Header Bar */}
      <header className="h-14 border-b border-border bg-card px-4 flex items-center justify-between shrink-0">
        {/* Left: Challenge Badge & Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20 text-primary text-xs font-bold font-mono tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>WebDev Arena</span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedChallenge.id}
              onChange={(e) => {
                const found = webdevChallenges.find((c) => c.id === e.target.value);
                if (found) setSelectedChallenge(found);
              }}
              className="bg-secondary text-foreground text-xs font-semibold py-1.5 px-3 rounded-md border border-border outline-none focus:ring-1 focus:ring-primary cursor-pointer max-w-[240px] truncate"
            >
              {webdevChallenges.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.difficulty})
                </option>
              ))}
            </select>

            <span
              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded font-mono ${
                selectedChallenge.difficulty === "EASY"
                  ? "bg-emerald-500/15 text-emerald-500"
                  : selectedChallenge.difficulty === "MEDIUM"
                  ? "bg-amber-500/15 text-amber-500"
                  : "bg-destructive/15 text-destructive"
              }`}
            >
              {selectedChallenge.difficulty}
            </span>
          </div>
        </div>

        {/* Center: Viewport & View Mode Controls */}
        <div className="flex items-center gap-2">
          {/* Viewport switchers */}
          <div className="flex items-center bg-secondary p-0.5 rounded-lg border border-border">
            <button
              onClick={() => setViewport("desktop")}
              title="Desktop View (100%)"
              className={`p-1.5 rounded-md transition-colors ${
                viewport === "desktop"
                  ? "bg-card text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewport("tablet")}
              title="Tablet View (768px)"
              className={`p-1.5 rounded-md transition-colors ${
                viewport === "tablet"
                  ? "bg-card text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewport("mobile")}
              title="Mobile View (375px)"
              className={`p-1.5 rounded-md transition-colors ${
                viewport === "mobile"
                  ? "bg-card text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-border mx-1" />

          {/* View layout mode */}
          <div className="flex items-center bg-secondary p-0.5 rounded-lg border border-border">
            <button
              onClick={() => setViewMode("split")}
              title="Split View"
              className={`px-2 py-1 rounded-md text-xs font-semibold transition-colors flex items-center gap-1 ${
                viewMode === "split"
                  ? "bg-card text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Split</span>
            </button>
            <button
              onClick={() => setViewMode("editor")}
              title="Editor Only"
              className={`px-2 py-1 rounded-md text-xs font-semibold transition-colors flex items-center gap-1 ${
                viewMode === "editor"
                  ? "bg-card text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Code2 className="w-3 h-3" />
              <span>Code</span>
            </button>
            <button
              onClick={() => setViewMode("preview")}
              title="Preview Only"
              className={`px-2 py-1 rounded-md text-xs font-semibold transition-colors flex items-center gap-1 ${
                viewMode === "preview"
                  ? "bg-card text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Preview</span>
            </button>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            title="Reset code"
            className="p-1.5 rounded-md bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors border border-border cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={runVerification}
            disabled={isRunningTests}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer ${
              allPassed
                ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                : "bg-primary hover:bg-primary/90 text-primary-foreground"
            }`}
          >
            {allPassed ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Passed (+{selectedChallenge.points} pts)</span>
              </>
            ) : isRunningTests ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                <span>Testing...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run & Verify</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANE: Editor & Specifications */}
        {(viewMode === "split" || viewMode === "editor") && (
          <div
            className={`flex flex-col border-r border-border bg-card transition-all ${
              viewMode === "editor" ? "w-full" : "w-1/2"
            }`}
          >
            {/* Left Header Tabs (Specs vs Tests, and File Tabs) */}
            <div className="h-10 border-b border-border bg-secondary/50 px-3 flex items-center justify-between shrink-0">
              {/* File selection tabs */}
              <div className="flex items-center gap-1">
                {(["html", "css", "js"] as const).map((fileType) => (
                  <button
                    key={fileType}
                    onClick={() => setActiveFile(fileType)}
                    className={`px-3 py-1 rounded text-xs font-mono font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                      activeFile === fileType
                        ? "bg-card text-primary border border-border shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>
                      {fileType === "html"
                        ? "index.html"
                        : fileType === "css"
                        ? "styles.css"
                        : "script.js"}
                    </span>
                  </button>
                ))}
              </div>

              {/* Spec vs Tests Tab Toggle */}
              <div className="flex items-center bg-card rounded p-0.5 border border-border">
                <button
                  onClick={() => setActiveTab("spec")}
                  className={`px-2 py-0.5 text-[11px] font-semibold rounded transition-colors ${
                    activeTab === "spec"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Brief
                </button>
                <button
                  onClick={() => setActiveTab("tests")}
                  className={`px-2 py-0.5 text-[11px] font-semibold rounded transition-colors flex items-center gap-1 ${
                    activeTab === "tests"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>Tests</span>
                  {testResults.length > 0 && (
                    <span className="text-[10px] opacity-80">
                      ({testResults.filter((t) => t.passed).length}/{testResults.length})
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Spec / Test Drawer Drawer */}
            {activeTab === "spec" ? (
              <div className="p-4 border-b border-border bg-card/60 max-h-48 overflow-y-auto text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-foreground">
                    {selectedChallenge.title}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    {selectedChallenge.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded bg-secondary text-muted-foreground text-[10px] font-mono"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {selectedChallenge.description}
                </p>
                <div className="pt-1">
                  <span className="font-bold text-[11px] text-foreground uppercase tracking-wider block mb-1">
                    Requirements:
                  </span>
                  <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                    {selectedChallenge.instructions.map((ins, i) => (
                      <li key={i}>{ins}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="p-4 border-b border-border bg-card/60 max-h-48 overflow-y-auto text-xs space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs uppercase tracking-wider text-foreground">
                    Automated Test Suite
                  </span>
                  <button
                    onClick={runVerification}
                    className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                  >
                    Rerun All Tests
                  </button>
                </div>

                {testResults.length === 0 ? (
                  <p className="text-muted-foreground text-xs italic">
                    No tests run yet. Click "Run & Verify" above to test your code!
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {testResults.map((tr) => (
                      <div
                        key={tr.id}
                        className={`p-2 rounded-md border flex items-center justify-between ${
                          tr.passed
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                            : "bg-destructive/10 border-destructive/20 text-destructive"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {tr.passed ? (
                            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                          ) : (
                            <XCircle className="w-4 h-4 shrink-0 text-destructive" />
                          )}
                          <span className="text-xs font-medium text-foreground">
                            {tr.description}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono font-bold uppercase">
                          {tr.passed ? "PASSED" : "FAILED"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Monaco Code Editor */}
            <div className="flex-1 min-h-0 relative">
              <Editor
                height="100%"
                language={getMonacoLanguage()}
                theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
                value={files[activeFile]}
                onChange={handleEditorChange}
                options={{
                  fontSize: 13,
                  fontFamily: "'Fira Code', 'JetBrains Mono', Consolas, monospace",
                  fontLigatures: true,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  lineNumbers: "on",
                  tabSize: 2,
                  wordWrap: "on"
                }}
              />
            </div>
          </div>
        )}

        {/* RIGHT PANE: Live Sandbox Preview & Console */}
        {(viewMode === "split" || viewMode === "preview") && (
          <div
            className={`flex flex-col bg-secondary/30 relative overflow-hidden transition-all ${
              viewMode === "preview" ? "w-full" : "w-1/2"
            }`}
          >
            {/* Live Preview Container with Device Frame */}
            <div className="flex-1 flex items-center justify-center p-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-200 overflow-hidden shadow-2xl border border-border bg-background rounded-lg flex flex-col ${
                  viewport === "mobile"
                    ? "w-[375px] max-w-full"
                    : viewport === "tablet"
                    ? "w-[768px] max-w-full"
                    : "w-full"
                }`}
              >
                {/* Browser address mock header */}
                <div className="h-7 bg-muted/60 border-b border-border px-3 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <div className="text-[11px] font-mono text-muted-foreground truncate max-w-[200px]">
                    https://sandbox.skillsphere.local/{selectedChallenge.id}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    {viewport === "mobile"
                      ? "375 × 667"
                      : viewport === "tablet"
                      ? "768 × 1024"
                      : "100% Responsive"}
                  </div>
                </div>

                {/* Sandboxed Iframe */}
                <iframe
                  ref={iframeRef}
                  title="WebDev Sandbox Preview"
                  srcDoc={generatePreviewHtml()}
                  sandbox="allow-scripts allow-modals allow-same-origin"
                  className="w-full flex-1 border-none bg-white"
                />
              </div>
            </div>

            {/* Bottom Floating Console Trigger */}
            <div className="h-9 border-t border-border bg-card px-4 flex items-center justify-between shrink-0">
              <button
                onClick={() => setIsConsoleOpen(!isConsoleOpen)}
                className="flex items-center gap-2 text-xs font-mono font-medium text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <Terminal className="w-3.5 h-3.5 text-primary" />
                <span>Console Logs</span>
                {consoleLogs.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-primary/20 text-primary text-[10px] font-bold">
                    {consoleLogs.length}
                  </span>
                )}
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isConsoleOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <div className="flex items-center gap-3">
                {consoleLogs.length > 0 && (
                  <button
                    onClick={() => setConsoleLogs([])}
                    className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer font-mono"
                  >
                    Clear Console
                  </button>
                )}
                <span className="text-[11px] text-muted-foreground font-mono">
                  Sandbox Status: <span className="text-emerald-500 font-bold">Ready</span>
                </span>
              </div>
            </div>

            {/* Expandable Console Logs Drawer */}
            {isConsoleOpen && (
              <div className="h-44 border-t border-border bg-card/95 font-mono text-xs overflow-y-auto p-2.5 space-y-1">
                {consoleLogs.length === 0 ? (
                  <div className="text-muted-foreground italic text-[11px] py-2 px-1">
                    No console output yet. Call `console.log()` in your JavaScript to view output here!
                  </div>
                ) : (
                  consoleLogs.map((log) => (
                    <div
                      key={log.id}
                      className={`flex items-start gap-2 py-0.5 px-1.5 rounded ${
                        log.level === "error"
                          ? "bg-destructive/10 text-destructive"
                          : log.level === "warn"
                          ? "bg-amber-500/10 text-amber-400"
                          : "text-foreground hover:bg-secondary/40"
                      }`}
                    >
                      <span className="text-[10px] text-muted-foreground shrink-0 select-none">
                        [{log.time}]
                      </span>
                      <span className="break-all whitespace-pre-wrap">{log.message}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WebDevArena;
