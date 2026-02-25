"use client";

import { useState } from "react";
import InputSection, { JobInput } from "@/components/InputSection";
import ChatPanel from "@/components/ChatPanel";

export default function Home() {
  const [currentInput, setCurrentInput] = useState<JobInput>({
    company: "",
    jd: "",
    resume: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [triggerAction, setTriggerAction] = useState<{
    action: string;
    ts: number;
  } | null>(null);

  const handleStart = (input: JobInput) => {
    setCurrentInput(input);
    setIsLoading(true);
    setTriggerAction({ action: "optimize-resume", ts: Date.now() });
    setTimeout(() => setIsLoading(false), 100);
  };

  const handleQuickAction = (action: string) => {
    setTriggerAction({ action, ts: Date.now() });
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--color-background)" }}>
      {/* Header */}
      <header className="bg-[#0a0a0a] border-b border-white/[0.06] px-6 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z" />
              </svg>
            </div>
            <span className="text-white font-semibold text-base tracking-tight">Jobna</span>
            <span className="text-violet-400 text-sm font-normal">.ai</span>
          </div>

          {/* Nav right */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/30 hidden sm:block">
              AI-Powered Job Intelligence
            </span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-5">
        <div className="flex gap-5 h-[calc(100vh-96px)]">
          {/* Left panel */}
          <div
            className="w-[300px] flex-shrink-0 rounded-2xl border overflow-hidden flex flex-col"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-border)",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)",
            }}
          >
            <div className="flex-1 overflow-y-auto scrollbar-thin p-5">
              <InputSection
                onSubmit={handleStart}
                isLoading={isLoading}
              />
            </div>
          </div>

          {/* Right panel */}
          <div
            className="flex-1 min-w-0 rounded-2xl border overflow-hidden"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-border)",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)",
            }}
          >
            <ChatPanel
              company={currentInput.company}
              jd={currentInput.jd}
              resume={currentInput.resume}
              triggerAction={triggerAction}
              onRequestAction={handleQuickAction}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
