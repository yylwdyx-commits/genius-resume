"use client";

import { useState, useEffect, useRef } from "react";
import { Lang, T } from "@/lib/i18n";

interface QuickAction { label: string; action: string }
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  actionType?: string;
  quickActions?: QuickAction[];
}
interface MockMessage { role: "user" | "assistant"; content: string }

interface Props {
  company: string;
  jd: string;
  resume: string;
  triggerAction: { action: string; ts: number } | null;
  onRequestAction: (action: string) => void;
  lang: Lang;
  t: T;
}

function getQuickActions(action: string, t: T): QuickAction[] {
  const map: Record<string, QuickAction[]> = {
    "optimize-resume": [
      { label: t.qa_reOptimize, action: "optimize-resume" },
      { label: t.qa_getIntel, action: "job-intel" },
      { label: t.qa_genQuestions, action: "interview-questions" },
      { label: t.qa_mockInterview, action: "mock-interview" },
      { label: t.qa_exportPdf, action: "export-pdf" },
    ],
    "job-intel": [
      { label: t.qa_genQuestions, action: "interview-questions" },
      { label: t.qa_optimize, action: "optimize-resume" },
      { label: t.qa_mockInterview, action: "mock-interview" },
    ],
    "interview-questions": [
      { label: t.qa_mockInterview, action: "mock-interview" },
      { label: t.qa_optimize, action: "optimize-resume" },
      { label: t.qa_getIntel, action: "job-intel" },
    ],
    chat: [
      { label: t.qa_optimize, action: "optimize-resume" },
      { label: t.qa_getIntel, action: "job-intel" },
      { label: t.qa_genQuestions, action: "interview-questions" },
    ],
    "mock-end": [
      { label: t.qa_reInterview, action: "mock-interview" },
      { label: t.qa_optimize, action: "optimize-resume" },
    ],
  };
  return map[action] ?? [];
}

const ACTION_PROMPTS: Record<string, (t: T) => string> = {
  "optimize-resume": (t) => t.prompt_optimize,
  "job-intel": (t) => t.prompt_intel,
  "interview-questions": (t) => t.prompt_questions,
};

const API_ROUTES: Record<string, string> = {
  "optimize-resume": "/api/optimize-resume",
  "job-intel": "/api/job-intel",
  "interview-questions": "/api/interview-questions",
};

async function readSSE(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onChunk: (text: string) => void
): Promise<string> {
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6);
      if (data === "[DONE]") continue;
      try {
        const parsed = JSON.parse(data);
        if (parsed.text) { full += parsed.text; onChunk(full); }
      } catch { /* ignore */ }
    }
  }
  return full;
}

export default function ChatPanel({ company, jd, resume, triggerAction, onRequestAction, lang, t }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [mode, setMode] = useState<"chat" | "mock">("chat");
  const [mockMessages, setMockMessages] = useState<MockMessage[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, streamingText]);

  useEffect(() => {
    if (!triggerAction) return;
    const { action } = triggerAction;
    if (action === "mock-interview") { enterMockMode(); return; }
    if (action === "export-pdf") { exportPDF(); return; }
    runAction(action);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerAction]);

  const push = (msg: ChatMessage) => setMessages((p) => [...p, msg]);

  const enterMockMode = () => {
    if (isLoading) return;
    setMode("mock");
    setMockMessages([]);
    push({
      id: `${Date.now()}-sys`,
      role: "assistant",
      content: t.mockIntroMsg,
      actionType: "system",
    });
    sendMockWith(t.mockInitMsg, []);
  };

  const sendMockWith = async (content: string, history: MockMessage[]) => {
    if (!content.trim() || isLoading) return;
    push({ id: `${Date.now()}-u`, role: "user", content });
    setInput("");
    setIsLoading(true);
    setStreamingText("");
    const updated: MockMessage[] = [...history, { role: "user", content }];
    try {
      const res = await fetch("/api/mock-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jd, resume, company, messages: history, userMessage: content, language: lang }),
      });
      if (!res.ok) throw new Error();
      const reader = res.body?.getReader();
      if (!reader) throw new Error();
      const fullText = await readSSE(reader, setStreamingText);
      const isEnd = content.toLowerCase().includes(t.endKeyword.toLowerCase());
      const finalHistory: MockMessage[] = [...updated, { role: "assistant", content: fullText }];
      setMockMessages(finalHistory);
      push({
        id: `${Date.now()}-a`,
        role: "assistant",
        content: fullText,
        actionType: isEnd ? "mock-end" : "mock",
        quickActions: isEnd ? getQuickActions("mock-end", t) : undefined,
      });
      if (isEnd) { setMode("chat"); setMockMessages([]); }
    } catch {
      push({ id: `${Date.now()}-e`, role: "assistant", content: "An error occurred. Please try again." });
    } finally { setIsLoading(false); setStreamingText(""); }
  };

  const runAction = async (action: string) => {
    if (isLoading) return;
    const promptFn = ACTION_PROMPTS[action];
    if (!promptFn) return;
    push({ id: `${Date.now()}-u`, role: "user", content: promptFn(t), actionType: action });
    setIsLoading(true);
    setStreamingText("");
    try {
      const res = await fetch(API_ROUTES[action], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, jd, resume, language: lang }),
      });
      if (!res.ok) throw new Error();
      let fullText = "";
      if (action === "job-intel") {
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        fullText = data.report;
      } else {
        const reader = res.body?.getReader();
        if (!reader) throw new Error();
        fullText = await readSSE(reader, setStreamingText);
      }
      push({
        id: `${Date.now()}-a`,
        role: "assistant",
        content: fullText,
        actionType: action,
        quickActions: getQuickActions(action, t),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error";
      push({ id: `${Date.now()}-e`, role: "assistant", content: `${t.errorPrefix}${msg}` });
    } finally { setIsLoading(false); setStreamingText(""); }
  };

  const sendChat = async (content: string) => {
    if (!content.trim() || isLoading) return;
    push({ id: `${Date.now()}-u`, role: "user", content });
    setInput("");
    setIsLoading(true);
    setStreamingText("");
    const history = messages.filter((m) => m.actionType !== "system").map((m) => ({ role: m.role, content: m.content }));
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, jd, resume, messages: history, userMessage: content, language: lang }),
      });
      if (!res.ok) throw new Error();
      const reader = res.body?.getReader();
      if (!reader) throw new Error();
      const fullText = await readSSE(reader, setStreamingText);
      push({ id: `${Date.now()}-a`, role: "assistant", content: fullText, actionType: "chat", quickActions: getQuickActions("chat", t) });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error";
      push({ id: `${Date.now()}-e`, role: "assistant", content: `${t.errorPrefix}${msg}` });
    } finally { setIsLoading(false); setStreamingText(""); }
  };

  const exportPDF = () => {
    const msg = [...messages].reverse().find((m) => m.actionType === "optimize-resume" && m.role === "assistant");
    if (!msg) { alert(t.exportError); return; }
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(
      `<html><head><title>Resume — Jobna.ai</title>` +
      `<style>body{font-family:'Helvetica Neue',Arial,sans-serif;max-width:800px;margin:2rem auto;line-height:1.7;color:#111}` +
      `pre{white-space:pre-wrap;font-family:inherit}@media print{button{display:none}}</style></head>` +
      `<body><pre>${msg.content}</pre><script>window.print()<\/script></body></html>`
    );
  };

  const handleSend = () => { mode === "mock" ? sendMockWith(input, mockMessages) : sendChat(input); };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#e5e7eb] flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-xl bg-violet-100 flex items-center justify-center text-sm">🤖</div>
          <span className="text-sm font-medium text-[#111827]">{t.aiAssistant}</span>
          {mode === "mock" && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 font-medium border border-orange-200">
              🎙️ {t.inInterview}
            </span>
          )}
        </div>
        {messages.length > 0 && (
          <button onClick={() => { setMessages([]); setMockMessages([]); setMode("chat"); setStreamingText(""); }}
            className="text-xs text-[#6b7280] hover:text-[#111827] transition px-2 py-1 rounded hover:bg-[#f3f4f6]">
            {t.clearChat}
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-5">
        {messages.length === 0 && !streamingText && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-xs">
              <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-4 text-3xl">✨</div>
              <p className="text-[#111827] font-medium mb-1">{t.emptyTitle}</p>
              <p className="text-[#6b7280] text-sm leading-relaxed whitespace-pre-line">{t.emptyDesc}</p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-xl bg-violet-100 flex-shrink-0 flex items-center justify-center text-base">🤖</div>
            )}
            <div className={`flex flex-col gap-2 max-w-[85%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-violet-600 text-white rounded-tr-sm"
                  : "bg-white border border-[#e5e7eb] shadow-sm text-[#111827] rounded-tl-sm"
              }`}>
                {msg.content}
              </div>
              {msg.quickActions && msg.quickActions.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {msg.quickActions.map((qa) => (
                    <button key={qa.action} onClick={() => onRequestAction(qa.action)}
                      className="text-xs px-3 py-1.5 rounded-full border border-violet-500 text-violet-600 hover:bg-violet-50 transition font-medium">
                      {qa.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-xl bg-violet-600 flex-shrink-0 flex items-center justify-center text-white text-xs font-semibold">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                </svg>
              </div>
            )}
          </div>
        ))}

        {streamingText && isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-violet-100 flex-shrink-0 flex items-center justify-center text-base">🤖</div>
            <div className="max-w-[85%]">
              <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white border border-[#e5e7eb] shadow-sm text-sm leading-relaxed whitespace-pre-wrap text-[#111827] typing-cursor">
                {streamingText}
              </div>
            </div>
          </div>
        )}

        {isLoading && !streamingText && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-violet-100 flex-shrink-0 flex items-center justify-center text-base">🤖</div>
            <div className="bg-white border border-[#e5e7eb] px-4 py-3.5 rounded-2xl rounded-tl-sm shadow-sm">
              <div className="flex gap-1.5">
                {[0, 150, 300].map((d) => (
                  <div key={d} className="w-2 h-2 bg-[#9ca3af] rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[#e5e7eb] p-3 flex gap-2 flex-shrink-0 bg-white">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={mode === "mock" ? t.mockPlaceholder : t.chatPlaceholder}
          rows={2}
          className="flex-1 px-3 py-2 rounded-lg border border-[#e5e7eb] bg-[#fafafa] text-[#111827] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent focus:bg-white text-sm resize-none transition scrollbar-thin"
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="w-10 h-full bg-gradient-to-b from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0"
        >
          {isLoading
            ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <svg className="w-4 h-4 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
          }
        </button>
      </div>
    </div>
  );
}
