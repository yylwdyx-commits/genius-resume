"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  jd: string;
  resume: string;
  company: string;
  initialMessages?: Message[];
  onMessagesUpdate?: (messages: Message[]) => void;
}

export default function MockInterview({
  jd,
  resume,
  company,
  initialMessages = [],
  onMessagesUpdate,
}: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [started, setStarted] = useState(initialMessages.length > 0);
  const [streamingText, setStreamingText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  const startInterview = async () => {
    setStarted(true);
    await sendMessage("你好，我准备好开始面试了。");
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    setStreamingText("");

    try {
      const res = await fetch("/api/mock-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jd,
          resume,
          company,
          messages: messages, // send history without the current message
          userMessage: content,
        }),
      });

      if (!res.ok) throw new Error("请求失败");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("无法读取响应");

      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                fullText += parsed.text;
                setStreamingText(fullText);
              }
            } catch {
              // ignore parse errors
            }
          }
        }
      }

      const assistantMsg: Message = { role: "assistant", content: fullText };
      const finalMessages = [...newMessages, assistantMsg];
      setMessages(finalMessages);
      onMessagesUpdate?.(finalMessages);
    } catch (err) {
      console.error(err);
      const errMsg: Message = {
        role: "assistant",
        content: "抱歉，出现了错误，请重试。",
      };
      setMessages([...newMessages, errMsg]);
    } finally {
      setIsLoading(false);
      setStreamingText("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const resetInterview = () => {
    setMessages([]);
    setStarted(false);
    setStreamingText("");
    onMessagesUpdate?.([]);
  };

  if (!started) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🎙️</div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            准备好接受挑战了吗？
          </h3>
          <p className="text-sm text-slate-500 mb-6">
            AI 将扮演{company ? `${company}的` : ""}面试官，根据 JD
            向你提问，可以随时输入「结束面试」获取综合评价。
          </p>
          {!jd && (
            <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg mb-4">
              建议先填写左侧的职位描述，让面试更有针对性
            </p>
          )}
          <button
            onClick={startInterview}
            className="bg-orange-600 hover:bg-orange-700 text-white font-medium px-6 py-2.5 rounded-lg transition"
          >
            开始模拟面试
          </button>
        </div>
      </div>
    );
  }

  const displayMessages = [...messages];
  if (streamingText && isLoading) {
    displayMessages.push({ role: "assistant", content: streamingText });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-medium text-slate-700">
            {company ? `${company} 面试进行中` : "模拟面试进行中"}
          </span>
        </div>
        <button
          onClick={resetInterview}
          className="text-xs text-slate-400 hover:text-slate-600 transition"
        >
          重置
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin space-y-3 pr-1 mb-3">
        {displayMessages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-2.5 ${
              msg.role === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm ${
                msg.role === "user"
                  ? "bg-sky-100 text-sky-700"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {msg.role === "user" ? "我" : "官"}
            </div>
            <div
              className={`max-w-[80%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-sky-600 text-white rounded-tr-sm"
                  : "bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm"
              } ${
                isLoading && idx === displayMessages.length - 1 && msg.role === "assistant"
                  ? "typing-cursor"
                  : ""
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && !streamingText && (
          <div className="flex gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm">
              官
            </div>
            <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 flex-shrink-0">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入你的回答...（Enter 发送，Shift+Enter 换行）"
          rows={2}
          className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm resize-none transition"
          disabled={isLoading}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || isLoading}
          className="w-10 bg-sky-600 hover:bg-sky-700 text-white rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
