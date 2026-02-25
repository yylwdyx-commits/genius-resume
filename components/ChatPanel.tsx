"use client";

import { useState, useEffect, useRef } from "react";

interface QuickAction {
  label: string;
  action: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  actionType?: string;
  quickActions?: QuickAction[];
}

interface MockMessage {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  company: string;
  jd: string;
  resume: string;
  triggerAction: { action: string; ts: number } | null;
  onRequestAction: (action: string) => void;
}

const QUICK_ACTIONS: Record<string, QuickAction[]> = {
  "optimize-resume": [
    { label: "✨ 再次优化", action: "optimize-resume" },
    { label: "🔍 获取情报", action: "job-intel" },
    { label: "📝 生成面试题", action: "interview-questions" },
    { label: "🎙️ 模拟面试", action: "mock-interview" },
    { label: "📄 导出 PDF", action: "export-pdf" },
  ],
  "job-intel": [
    { label: "📝 生成面试题", action: "interview-questions" },
    { label: "✨ 优化简历", action: "optimize-resume" },
    { label: "🎙️ 模拟面试", action: "mock-interview" },
  ],
  "interview-questions": [
    { label: "🎙️ 模拟面试", action: "mock-interview" },
    { label: "✨ 优化简历", action: "optimize-resume" },
    { label: "🔍 获取情报", action: "job-intel" },
  ],
  chat: [
    { label: "✨ 优化简历", action: "optimize-resume" },
    { label: "🔍 获取情报", action: "job-intel" },
    { label: "📝 生成面试题", action: "interview-questions" },
  ],
  "mock-end": [
    { label: "🎙️ 重新面试", action: "mock-interview" },
    { label: "✨ 优化简历", action: "optimize-resume" },
  ],
};

const ACTION_USER_PROMPTS: Record<string, string> = {
  "optimize-resume": "请帮我优化简历，使其更符合该职位要求。",
  "job-intel": "请为我搜集这家公司的详细情报。",
  "interview-questions": "请根据 JD 和我的简历，生成针对性的面试题。",
};

const API_ROUTES: Record<string, string> = {
  "optimize-resume": "/api/optimize-resume",
  "job-intel": "/api/job-intel",
  "interview-questions": "/api/interview-questions",
};

async function readSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onChunk: (text: string) => void
): Promise<string> {
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") continue;
        try {
          const parsed = JSON.parse(data);
          if (parsed.text) {
            fullText += parsed.text;
            onChunk(fullText);
          }
        } catch {
          // ignore parse errors
        }
      }
    }
  }

  return fullText;
}

export default function ChatPanel({
  company,
  jd,
  resume,
  triggerAction,
  onRequestAction,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [mode, setMode] = useState<"chat" | "mock">("chat");
  const [mockMessages, setMockMessages] = useState<MockMessage[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  useEffect(() => {
    if (!triggerAction) return;
    const { action } = triggerAction;

    if (action === "mock-interview") {
      enterMockMode();
      return;
    }
    if (action === "export-pdf") {
      exportPDF();
      return;
    }
    runAction(action);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerAction]);

  const pushMessage = (msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  };

  const enterMockMode = () => {
    if (isLoading) return;
    setMode("mock");
    setMockMessages([]);

    const systemMsg: ChatMessage = {
      id: `${Date.now()}-sys`,
      role: "assistant",
      content:
        "已进入模拟面试模式 🎙️\n\nAI 将扮演面试官向你提问，请在下方输入框作答。输入「结束面试」可获取综合评价。",
      actionType: "system",
    };
    setMessages((prev) => [...prev, systemMsg]);

    // Start interview with empty history
    sendMockMessageWithHistory("你好，我准备好开始面试了。", []);
  };

  const sendMockMessageWithHistory = async (
    content: string,
    history: MockMessage[]
  ) => {
    if (!content.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `${Date.now()}-u`,
      role: "user",
      content,
    };
    pushMessage(userMsg);
    setInput("");
    setIsLoading(true);
    setStreamingText("");

    const updatedHistory: MockMessage[] = [
      ...history,
      { role: "user", content },
    ];

    try {
      const res = await fetch("/api/mock-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jd,
          resume,
          company,
          messages: history,
          userMessage: content,
        }),
      });

      if (!res.ok) throw new Error("请求失败");
      const reader = res.body?.getReader();
      if (!reader) throw new Error("无法读取响应");

      const fullText = await readSSEStream(reader, setStreamingText);

      const isEnd = content.includes("结束面试");
      const newHistory: MockMessage[] = [
        ...updatedHistory,
        { role: "assistant", content: fullText },
      ];

      setMockMessages(newHistory);

      const assistantMsg: ChatMessage = {
        id: `${Date.now()}-a`,
        role: "assistant",
        content: fullText,
        actionType: isEnd ? "mock-end" : "mock",
        quickActions: isEnd ? QUICK_ACTIONS["mock-end"] : undefined,
      };
      pushMessage(assistantMsg);

      if (isEnd) {
        setMode("chat");
        setMockMessages([]);
      }
    } catch (err) {
      const errMsg: ChatMessage = {
        id: `${Date.now()}-err`,
        role: "assistant",
        content: "抱歉，出现了错误，请重试。",
      };
      pushMessage(errMsg);
    } finally {
      setIsLoading(false);
      setStreamingText("");
    }
  };

  const runAction = async (action: string) => {
    if (isLoading) return;

    const userPrompt = ACTION_USER_PROMPTS[action] || "正在处理，请稍候...";
    const userMsg: ChatMessage = {
      id: `${Date.now()}-u`,
      role: "user",
      content: userPrompt,
      actionType: action,
    };
    pushMessage(userMsg);
    setIsLoading(true);
    setStreamingText("");

    const apiRoute = API_ROUTES[action];
    if (!apiRoute) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(apiRoute, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, jd, resume }),
      });

      if (!res.ok) throw new Error("请求失败");

      let fullText = "";

      if (action === "job-intel") {
        // Non-streaming JSON response
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        fullText = data.report;
      } else {
        const reader = res.body?.getReader();
        if (!reader) throw new Error("无法读取响应");
        fullText = await readSSEStream(reader, setStreamingText);
      }

      const assistantMsg: ChatMessage = {
        id: `${Date.now()}-a`,
        role: "assistant",
        content: fullText,
        actionType: action,
        quickActions: QUICK_ACTIONS[action],
      };
      pushMessage(assistantMsg);
    } catch (err) {
      const errContent =
        err instanceof Error ? err.message : "出现错误，请重试";
      const errMsg: ChatMessage = {
        id: `${Date.now()}-err`,
        role: "assistant",
        content: `错误：${errContent}`,
      };
      pushMessage(errMsg);
    } finally {
      setIsLoading(false);
      setStreamingText("");
    }
  };

  const sendChatMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `${Date.now()}-u`,
      role: "user",
      content,
    };
    pushMessage(userMsg);
    setInput("");
    setIsLoading(true);
    setStreamingText("");

    // Build history for chat API (only user/assistant messages)
    const chatHistory = messages
      .filter((m) => m.actionType !== "system")
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company,
          jd,
          resume,
          messages: chatHistory,
          userMessage: content,
        }),
      });

      if (!res.ok) throw new Error("请求失败");
      const reader = res.body?.getReader();
      if (!reader) throw new Error("无法读取响应");

      const fullText = await readSSEStream(reader, setStreamingText);

      const assistantMsg: ChatMessage = {
        id: `${Date.now()}-a`,
        role: "assistant",
        content: fullText,
        actionType: "chat",
        quickActions: QUICK_ACTIONS["chat"],
      };
      pushMessage(assistantMsg);
    } catch (err) {
      const errContent =
        err instanceof Error ? err.message : "出现错误，请重试";
      const errMsg: ChatMessage = {
        id: `${Date.now()}-err`,
        role: "assistant",
        content: `错误：${errContent}`,
      };
      pushMessage(errMsg);
    } finally {
      setIsLoading(false);
      setStreamingText("");
    }
  };

  const exportPDF = () => {
    const lastResumeMsg = [...messages]
      .reverse()
      .find((m) => m.actionType === "optimize-resume" && m.role === "assistant");
    if (!lastResumeMsg) {
      alert("请先优化简历，再导出 PDF");
      return;
    }
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(
      `<html><head><title>简历优化 - Jobna.ai</title>` +
        `<style>body{font-family:'Helvetica Neue',Arial,sans-serif;max-width:800px;margin:2rem auto;line-height:1.7;color:#111827}` +
        `pre{white-space:pre-wrap;font-family:inherit}` +
        `@media print{button{display:none}}</style></head>` +
        `<body><pre>${lastResumeMsg.content}</pre>` +
        `<script>window.print()<\/script></body></html>`
    );
  };

  const handleSend = () => {
    if (mode === "mock") {
      sendMockMessageWithHistory(input, mockMessages);
    } else {
      sendChatMessage(input);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearMessages = () => {
    setMessages([]);
    setMockMessages([]);
    setMode("chat");
    setStreamingText("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#e5e7eb] flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-full bg-[#ede9fe] flex items-center justify-center text-sm">
            🤖
          </div>
          <span className="text-sm font-medium text-[#111827]">AI 助手</span>
          {mode === "mock" && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 font-medium border border-orange-200">
              🎙️ 面试中
            </span>
          )}
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearMessages}
            className="text-xs text-[#6b7280] hover:text-[#111827] transition px-2 py-1 rounded hover:bg-[#f8f9fa]"
          >
            清空对话
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-5">
        {messages.length === 0 && !streamingText && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-xs">
              <div className="w-16 h-16 rounded-2xl bg-[#ede9fe] flex items-center justify-center mx-auto mb-4 text-3xl">
                ✨
              </div>
              <p className="text-[#111827] font-medium mb-1">开始你的求职旅程</p>
              <p className="text-[#6b7280] text-sm leading-relaxed">
                在左侧填写公司信息和职位描述，
                <br />
                点击「开始分析」获取 AI 分析报告
              </p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${
              msg.role === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-xl bg-[#ede9fe] flex-shrink-0 flex items-center justify-center text-base">
                🤖
              </div>
            )}
            <div
              className={`flex flex-col gap-2 max-w-[85%] ${
                msg.role === "user" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-[#7c3aed] text-white rounded-tr-sm"
                    : "bg-white border border-[#e5e7eb] shadow-sm text-[#111827] rounded-tl-sm"
                }`}
              >
                {msg.content}
              </div>
              {msg.quickActions && msg.quickActions.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {msg.quickActions.map((qa) => (
                    <button
                      key={qa.action}
                      onClick={() => onRequestAction(qa.action)}
                      className="text-xs px-3 py-1.5 rounded-full border border-[#7c3aed] text-[#7c3aed] hover:bg-[#ede9fe] transition font-medium"
                    >
                      {qa.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-xl bg-[#7c3aed] flex-shrink-0 flex items-center justify-center text-white text-xs font-semibold">
                我
              </div>
            )}
          </div>
        ))}

        {/* Streaming message */}
        {streamingText && isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#ede9fe] flex-shrink-0 flex items-center justify-center text-base">
              🤖
            </div>
            <div className="max-w-[85%]">
              <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white border border-[#e5e7eb] shadow-sm text-sm leading-relaxed whitespace-pre-wrap text-[#111827] typing-cursor">
                {streamingText}
              </div>
            </div>
          </div>
        )}

        {/* Loading dots */}
        {isLoading && !streamingText && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#ede9fe] flex-shrink-0 flex items-center justify-center text-base">
              🤖
            </div>
            <div className="bg-white border border-[#e5e7eb] px-4 py-3.5 rounded-2xl rounded-tl-sm shadow-sm">
              <div className="flex gap-1.5 items-center">
                <div
                  className="w-2 h-2 bg-[#9ca3af] rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <div
                  className="w-2 h-2 bg-[#9ca3af] rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <div
                  className="w-2 h-2 bg-[#9ca3af] rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-[#e5e7eb] p-3 flex gap-2 flex-shrink-0 bg-white">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            mode === "mock"
              ? "输入你的回答...（Enter 发送）"
              : "随时向 AI 提问...（Enter 发送，Shift+Enter 换行）"
          }
          rows={2}
          className="flex-1 px-3 py-2 rounded-lg border border-[#e5e7eb] bg-[#f8f9fa] text-[#111827] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#7c3aed] focus:border-transparent focus:bg-white text-sm resize-none transition scrollbar-thin"
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="w-10 h-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg
              className="w-4 h-4 rotate-90"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
