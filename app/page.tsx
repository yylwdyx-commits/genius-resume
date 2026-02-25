"use client";

import { useState, useEffect, useRef } from "react";
import InputSection, { JobInput } from "@/components/InputSection";
import ChatPanel from "@/components/ChatPanel";
import { Lang, LANGS, translations } from "@/lib/i18n";

export default function Home() {
  const [lang, setLang] = useState<Lang>("en");
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [currentInput, setCurrentInput] = useState<JobInput>({ company: "", jd: "", resume: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [triggerAction, setTriggerAction] = useState<{ action: string; ts: number } | null>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);

  // Persist language
  useEffect(() => {
    const saved = localStorage.getItem("jobna_lang") as Lang | null;
    if (saved && translations[saved]) setLang(saved);
  }, []);

  const switchLang = (l: Lang) => {
    setLang(l);
    localStorage.setItem("jobna_lang", l);
    setShowLangMenu(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setShowLangMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const t = translations[lang];

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
    <div className="min-h-screen flex flex-col" style={{ background: "var(--md-background)" }}>
      {/* Header — MD3 Top App Bar (dark brand) */}
      <header className="bg-[#0d0d0d] border-b border-white/[0.07] px-6 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-500/20">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                {/* Person head */}
                <circle cx="12" cy="7" r="2.8" fill="white" />
                {/* 4-pointed sparkle body */}
                <path
                  d="M12 11.5 L13.2 15.2 L17 16.5 L13.2 17.8 L12 21.5 L10.8 17.8 L7 16.5 L10.8 15.2 Z"
                  fill="white"
                />
              </svg>
            </div>
            <span className="text-white font-semibold text-[15px] tracking-tight">Jobna</span>
            <span className="text-violet-400 text-sm">.ai</span>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <span className="text-white/25 text-xs hidden md:block tracking-wide">{t.tagline}</span>

            {/* Language switcher */}
            <div className="relative" ref={langMenuRef}>
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/[0.08] transition text-xs font-medium"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                <span>{LANGS[lang].flag} {lang.toUpperCase()}</span>
                <svg className={`w-3 h-3 transition-transform ${showLangMenu ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showLangMenu && (
                <div className="absolute right-0 top-full mt-2 bg-[#141414] border border-white/[0.08] rounded-xl shadow-2xl z-50 overflow-hidden min-w-[168px]">
                  {(Object.keys(LANGS) as Lang[]).map((l) => (
                    <button
                      key={l}
                      onClick={() => switchLang(l)}
                      className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition hover:bg-white/[0.06] ${
                        l === lang ? "text-violet-400 bg-white/[0.04]" : "text-white/70"
                      }`}
                    >
                      <span className="text-base">{LANGS[l].flag}</span>
                      <span>{LANGS[l].native}</span>
                      {l === lang && (
                        <svg className="w-3.5 h-3.5 ml-auto text-violet-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-5">
        <div className="flex gap-5 h-[calc(100vh-96px)]">
          {/* Left panel — MD3 Elevated Surface */}
          <div
            className="w-[300px] flex-shrink-0 rounded-[16px] overflow-hidden flex flex-col border border-[#CAC4D0]"
            style={{
              background: "var(--md-surface)",
              boxShadow: "var(--md-elevation-1)",
            }}
          >
            <div className="flex-1 overflow-y-auto scrollbar-thin p-5">
              <InputSection onSubmit={handleStart} isLoading={isLoading} t={t} />
            </div>
          </div>

          {/* Right panel — MD3 Elevated Surface */}
          <div
            className="flex-1 min-w-0 rounded-[16px] overflow-hidden border border-[#CAC4D0]"
            style={{
              background: "var(--md-surface)",
              boxShadow: "var(--md-elevation-1)",
            }}
          >
            <ChatPanel
              company={currentInput.company}
              jd={currentInput.jd}
              resume={currentInput.resume}
              triggerAction={triggerAction}
              onRequestAction={handleQuickAction}
              lang={lang}
              t={t}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
