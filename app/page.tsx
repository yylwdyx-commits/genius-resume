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
  };

  const handleQuickAction = (action: string) => {
    setTriggerAction({ action, ts: Date.now() });
  };

  // isLoading is driven by ChatPanel — we just need it to disable the button
  // We toggle it off after trigger is set (ChatPanel manages its own loading state)
  const handleLoadingChange = () => {
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      {/* Header */}
      <header
        className="border-b px-6 py-0"
        style={{
          background: "var(--color-surface)",
          borderColor: "var(--color-border)",
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            {/* Logo mark */}
            <div className="flex items-center gap-0.5">
              <span className="text-2xl font-bold" style={{ color: "#4285f4" }}>G</span>
              <span className="text-2xl font-bold" style={{ color: "#ea4335" }}>e</span>
              <span className="text-2xl font-bold" style={{ color: "#fbbc05" }}>n</span>
              <span className="text-2xl font-bold" style={{ color: "#4285f4" }}>i</span>
              <span className="text-2xl font-bold" style={{ color: "#34a853" }}>u</span>
              <span className="text-2xl font-bold" style={{ color: "#ea4335" }}>s</span>
            </div>
            <div
              className="w-px h-6"
              style={{ background: "var(--color-border)" }}
            />
            <div>
              <span
                className="text-base font-medium"
                style={{ color: "var(--color-text-primary)" }}
              >
                Resume
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full bg-emerald-500"
            />
            <span
              className="text-xs"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Claude Sonnet 4.6
            </span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-5 h-[calc(100vh-104px)]">
          {/* Left panel */}
          <div
            className="w-80 flex-shrink-0 rounded-2xl border p-5 overflow-y-auto scrollbar-thin"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-border)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            <InputSection
              onSubmit={(input) => {
                handleStart(input);
                // Reset loading after a tick so ChatPanel can take over
                setTimeout(handleLoadingChange, 100);
              }}
              isLoading={isLoading}
            />
          </div>

          {/* Right panel — Chat */}
          <div
            className="flex-1 min-w-0 rounded-2xl border overflow-hidden"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-border)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
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
