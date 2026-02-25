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

/* ── Nana Avatar ── */
function NanaAvatar({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" style={{ flexShrink: 0 }}>
      {/* Background circle */}
      <circle cx="20" cy="20" r="20" fill="#6750A4" />
      {/* Hair — back layer */}
      <ellipse cx="20" cy="14.5" rx="10" ry="7" fill="#1A0A2E" />
      {/* Hair — top dome */}
      <path d="M10.2 17 Q10 8.5 20 8.5 Q30 8.5 29.8 17Z" fill="#1A0A2E" />
      {/* Hair — side left */}
      <path d="M10.5 16 Q9.5 21 11 27" stroke="#1A0A2E" strokeWidth="4" strokeLinecap="round" fill="none" />
      {/* Hair — side right */}
      <path d="M29.5 16 Q30.5 21 29 27" stroke="#1A0A2E" strokeWidth="4" strokeLinecap="round" fill="none" />
      {/* Face */}
      <ellipse cx="20" cy="22" rx="7.5" ry="8.5" fill="#FDDCAF" />
      {/* Glasses — left lens */}
      <rect x="11.5" y="19" width="7" height="4.5" rx="1.5" stroke="#3D1A78" strokeWidth="1.2" fill="rgba(255,255,255,0.08)" />
      {/* Glasses — right lens */}
      <rect x="21.5" y="19" width="7" height="4.5" rx="1.5" stroke="#3D1A78" strokeWidth="1.2" fill="rgba(255,255,255,0.08)" />
      {/* Glasses — bridge */}
      <line x1="18.5" y1="21.25" x2="21.5" y2="21.25" stroke="#3D1A78" strokeWidth="1.2" />
      {/* Glasses — left temple */}
      <line x1="11.5" y1="21.25" x2="10" y2="21.25" stroke="#3D1A78" strokeWidth="1.2" />
      {/* Glasses — right temple */}
      <line x1="28.5" y1="21.25" x2="30" y2="21.25" stroke="#3D1A78" strokeWidth="1.2" />
      {/* Eyebrows */}
      <path d="M12.5 17.5 Q15 16.5 17.5 17.2" stroke="#1A0A2E" strokeWidth="1" strokeLinecap="round" fill="none" />
      <path d="M22.5 17.2 Q25 16.5 27.5 17.5" stroke="#1A0A2E" strokeWidth="1" strokeLinecap="round" fill="none" />
      {/* Eyes */}
      <ellipse cx="15" cy="21.25" rx="1.9" ry="1.4" fill="#1A0A2E" />
      <ellipse cx="25" cy="21.25" rx="1.9" ry="1.4" fill="#1A0A2E" />
      {/* Eye highlights */}
      <circle cx="15.7" cy="20.7" r="0.5" fill="white" fillOpacity="0.9" />
      <circle cx="25.7" cy="20.7" r="0.5" fill="white" fillOpacity="0.9" />
      {/* Lips */}
      <path d="M17.5 27 Q20 29 22.5 27" stroke="#C07090" strokeWidth="1.3" strokeLinecap="round" fill="none" />
      {/* Cheek blush */}
      <ellipse cx="13" cy="25" rx="2" ry="1.2" fill="#FFAABB" fillOpacity="0.3" />
      <ellipse cx="27" cy="25" rx="2" ry="1.2" fill="#FFAABB" fillOpacity="0.3" />
    </svg>
  );
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
    push({ id: `${Date.now()}-sys`, role: "assistant", content: t.mockIntroMsg, actionType: "system" });
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
      `<style>body{font-family:'Helvetica Neue',Arial,sans-serif;max-width:800px;margin:2rem auto;line-height:1.7;color:#1C1B1F}` +
      `pre{white-space:pre-wrap;font-family:inherit}@media print{button{display:none}}</style></head>` +
      `<body><pre>${msg.content}</pre><script>window.print()<\/script></body></html>`
    );
  };

  const handleSend = () => { mode === "mock" ? sendMockWith(input, mockMessages) : sendChat(input); };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="flex flex-col h-full bg-[#FFFBFF]">

      {/* ── MD3 Top App Bar ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#CAC4D0] flex-shrink-0 bg-[#FFFBFF]">
        <div className="flex items-center gap-3">
          <NanaAvatar size={36} />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-[#1C1B1F] leading-tight">{t.aiAssistant}</span>
            <span className="text-xs text-[#49454F] leading-tight">AI Career Advisor</span>
          </div>
          {mode === "mock" && (
            <span className="text-xs px-3 py-1 rounded-full bg-[#F9DEDC] text-[#8C1D18] font-medium border border-[#F2B8B5]">
              🎙️ {t.inInterview}
            </span>
          )}
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => { setMessages([]); setMockMessages([]); setMode("chat"); setStreamingText(""); }}
            className="text-xs text-[#49454F] hover:text-[#1C1B1F] transition px-3 py-1.5 rounded-full hover:bg-[#E7E0EC] font-medium"
          >
            {t.clearChat}
          </button>
        )}
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-5 space-y-5" style={{ background: "#FFFBFF" }}>

        {/* Empty state */}
        {messages.length === 0 && !streamingText && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-xs">
              <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-[#EADDFF] flex items-center justify-center">
                <NanaAvatar size={56} />
              </div>
              <p className="text-[#1C1B1F] font-semibold text-base mb-1.5">{t.emptyTitle}</p>
              <p className="text-[#49454F] text-sm leading-relaxed whitespace-pre-line">{t.emptyDesc}</p>
            </div>
          </div>
        )}

        {/* Message list */}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>

            {/* Nana avatar */}
            {msg.role === "assistant" && (
              <div className="flex-shrink-0 mt-0.5">
                <NanaAvatar size={32} />
              </div>
            )}

            <div className={`flex flex-col gap-2 max-w-[82%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
              {/* Bubble */}
              <div className={`px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-[#6750A4] text-white rounded-[20px] rounded-tr-[4px]"
                  : "bg-[#F3EDF7] text-[#1C1B1F] rounded-[20px] rounded-tl-[4px]"
              }`}>
                {msg.content}
              </div>

              {/* MD3 Assist Chips */}
              {msg.quickActions && msg.quickActions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {msg.quickActions.map((qa) => (
                    <button
                      key={qa.action}
                      onClick={() => onRequestAction(qa.action)}
                      className="text-xs px-3.5 py-1.5 rounded-full border border-[#CAC4D0] text-[#49454F] bg-[#FFFBFF] hover:bg-[#EADDFF] hover:border-[#6750A4] hover:text-[#6750A4] transition-all font-medium"
                    >
                      {qa.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User avatar */}
            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-[#E8DEF8] flex-shrink-0 flex items-center justify-center mt-0.5">
                <svg className="w-4 h-4 text-[#6750A4]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                </svg>
              </div>
            )}
          </div>
        ))}

        {/* Streaming bubble */}
        {streamingText && isLoading && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 mt-0.5"><NanaAvatar size={32} /></div>
            <div className="max-w-[82%]">
              <div className="px-4 py-3 rounded-[20px] rounded-tl-[4px] bg-[#F3EDF7] text-sm leading-relaxed whitespace-pre-wrap text-[#1C1B1F] typing-cursor">
                {streamingText}
              </div>
            </div>
          </div>
        )}

        {/* Typing indicator */}
        {isLoading && !streamingText && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 mt-0.5"><NanaAvatar size={32} /></div>
            <div className="bg-[#F3EDF7] px-4 py-3.5 rounded-[20px] rounded-tl-[4px]">
              <div className="flex gap-1.5 items-center h-4">
                {[0, 160, 320].map((d) => (
                  <div
                    key={d}
                    className="w-2 h-2 bg-[#6750A4] rounded-full animate-bounce opacity-60"
                    style={{ animationDelay: `${d}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input area ── */}
      <div className="border-t border-[#CAC4D0] px-4 py-3 flex gap-3 flex-shrink-0 bg-[#FFFBFF]">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={mode === "mock" ? t.mockPlaceholder : t.chatPlaceholder}
          rows={2}
          disabled={isLoading}
          className="flex-1 px-4 py-2.5 rounded-[4px] border border-[#79747E] bg-[#FFFBFF] text-[#1C1B1F] placeholder-[#49454F] focus:outline-none focus:border-2 focus:border-[#6750A4] text-sm resize-none transition scrollbar-thin"
        />
        {/* MD3 Filled Icon Button */}
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="w-12 h-12 self-end bg-[#6750A4] hover:bg-[#5B4397] active:bg-[#4F378B] text-white rounded-full transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0 shadow-sm"
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
