"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut, signIn } from "next-auth/react";
import InputSection, { JobInput } from "@/components/InputSection";
import ChatPanel from "@/components/ChatPanel";
import { Lang, LANGS, translations } from "@/lib/i18n";

interface HistoryItem {
  id: string;
  company: string;
  jdTitle: string;
  results: string;
  updatedAt: string;
}

export default function Home() {
  const { data: session } = useSession();
  const [lang, setLang] = useState<Lang>("en");
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [currentInput, setCurrentInput] = useState<JobInput>({ company: "", jd: "", resume: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [triggerAction, setTriggerAction] = useState<{ action: string; ts: number } | null>(null);
  const [mobileView, setMobileView] = useState<"input" | "chat">("input");
  const [recordId, setRecordId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [inputKey, setInputKey] = useState(0); // remount InputSection when loading a record
  const [initialValues, setInitialValues] = useState<Partial<JobInput>>({});
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Persist language
  useEffect(() => {
    const saved = localStorage.getItem("jobna_lang") as Lang | null;
    if (saved && translations[saved]) setLang(saved);
  }, []);

  // Load history
  useEffect(() => {
    if (session?.user?.id) {
      fetch("/api/records").then((r) => r.json()).then((data) => {
        if (Array.isArray(data)) setHistory(data);
      });
    }
  }, [session?.user?.id]);

  const switchLang = (l: Lang) => {
    setLang(l);
    localStorage.setItem("jobna_lang", l);
    setShowLangMenu(false);
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) setShowLangMenu(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const t = translations[lang];

  const handleStart = async (input: JobInput) => {
    if (!session?.user) {
      setShowLoginPrompt(true);
      return;
    }
    setCurrentInput(input);
    setIsLoading(true);
    setMobileView("chat");

    // Create a record in DB (non-blocking, best-effort)
    let newRecordId: string | null = null;
    try {
      const res = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company: input.company, jdContent: input.jd, resume: input.resume }),
      });
      const data = await res.json();
      if (data.id) {
        newRecordId = data.id;
        setRecordId(data.id);
        // Prepend to history
        setHistory((prev) => [{
          id: data.id,
          company: input.company,
          jdTitle: input.jd.slice(0, 60),
          results: "{}",
          updatedAt: new Date().toISOString(),
        }, ...prev]);
      }
    } catch { /* silently ignore — record saving is non-critical */ }

    setTriggerAction({ action: "optimize-resume", ts: Date.now() });
    setTimeout(() => setIsLoading(false), 100);
  };

  const handleQuickAction = (action: string) => {
    setTriggerAction({ action, ts: Date.now() });
  };

  const loadRecord = async (item: HistoryItem) => {
    try {
      const res = await fetch(`/api/records/${item.id}`);
      const data = await res.json();
      setInitialValues({ company: data.company, jd: data.jdContent, resume: data.resume });
      setInputKey((k) => k + 1); // remount InputSection with new values
      setRecordId(item.id);
      setShowHistory(false);
      setMobileView("input");
    } catch { /* ignore */ }
  };

  const resultCount = (results: string) => {
    try { return Object.keys(JSON.parse(results)).length; } catch { return 0; }
  };

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden" style={{ background: "var(--md-background)" }}>

      {/* ── Header ── */}
      <header className="bg-[#0d0d0d] border-b border-white/[0.07] px-4 md:px-6 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-500/20">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="7" r="2.8" fill="white" />
                <path d="M12 11.5 L13.2 15.2 L17 16.5 L13.2 17.8 L12 21.5 L10.8 17.8 L7 16.5 L10.8 15.2 Z" fill="white" />
              </svg>
            </div>
            <span className="text-white font-semibold text-[15px] tracking-tight">Jobna</span>
            <span className="text-violet-400 text-sm">.ai</span>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 md:gap-3">
            <span className="text-white/25 text-xs hidden md:block tracking-wide">{t.tagline}</span>

            {/* Language switcher */}
            <div className="relative" ref={langMenuRef}>
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/[0.08] transition text-xs font-medium"
              >
                <svg className="w-3.5 h-3.5 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                <span>{LANGS[lang].flag} {lang.toUpperCase()}</span>
                <svg className={`w-3 h-3 transition-transform ${showLangMenu ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showLangMenu && (
                <div className="absolute right-0 top-full mt-2 bg-[#141414] border border-white/[0.08] rounded-xl shadow-2xl z-50 overflow-hidden min-w-[168px] max-h-[70vh] overflow-y-auto">
                  {(Object.keys(LANGS) as Lang[]).map((l) => (
                    <button key={l} onClick={() => switchLang(l)}
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

            {/* User avatar + menu / Sign In button */}
            {session?.user ? (
              <div className="relative" ref={userMenuRef}>
                <button onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/[0.08] transition">
                  {session.user.image ? (
                    <img src={session.user.image} alt="" width={28} height={28}
                      className="w-7 h-7 rounded-full border border-white/20" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-[#EADDFF] flex items-center justify-center text-[#6750A4] text-xs font-semibold">
                      {session.user.name?.charAt(0) ?? "U"}
                    </div>
                  )}
                  <span className="text-white/70 text-xs hidden sm:block max-w-[100px] truncate">
                    {session.user.name}
                  </span>
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 bg-[#141414] border border-white/[0.08] rounded-xl shadow-2xl z-50 overflow-hidden min-w-[180px]">
                    <div className="px-4 py-3 border-b border-white/[0.06]">
                      <div className="text-white/90 text-sm font-medium truncate">{session.user.name}</div>
                      <div className="text-white/40 text-xs truncate">{session.user.email}</div>
                    </div>
                    {session.user.role === "admin" && (
                      <a href="/admin"
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-violet-400 hover:bg-white/[0.06] transition">
                        <span>⚙️</span><span>Admin Dashboard</span>
                      </a>
                    )}
                    <button
                      onClick={() => signOut({ callbackUrl: "/login" })}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-white/70 hover:bg-white/[0.06] transition"
                    >
                      <span>👋</span><span>Sign out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => signIn("google")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Login prompt modal ── */}
      {showLoginPrompt && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowLoginPrompt(false)}>
          <div className="bg-[#141414] rounded-2xl p-6 max-w-sm w-full mx-4 border border-white/[0.08]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-white font-semibold text-lg mb-2">Sign in to continue</h3>
            <p className="text-white/50 text-sm mb-5">Create a free account to analyze job descriptions and get AI-powered insights.</p>
            <button
              onClick={() => { setShowLoginPrompt(false); signIn("google"); }}
              className="w-full h-10 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-full transition"
            >
              Continue with Google
            </button>
            <button
              onClick={() => setShowLoginPrompt(false)}
              className="w-full mt-2 h-9 text-white/40 text-sm hover:text-white/60 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Main ── */}
      <main className="flex-1 min-h-0 max-w-7xl w-full mx-auto flex flex-col px-3 pt-3 pb-3 md:px-4 md:pt-5 md:pb-5 gap-3">

        {/* Mobile tab switcher */}
        <div className="flex md:hidden rounded-full border border-[#CAC4D0] overflow-hidden bg-[#FFFBFF] flex-shrink-0 text-sm">
          <button onClick={() => setMobileView("input")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 font-medium transition ${
              mobileView === "input" ? "bg-[#EADDFF] text-[#21005D]" : "text-[#49454F]"
            }`}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Job Info
          </button>
          <button onClick={() => setMobileView("chat")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 font-medium transition ${
              mobileView === "chat" ? "bg-[#EADDFF] text-[#21005D]" : "text-[#49454F]"
            }`}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Nana
          </button>
        </div>

        {/* Panels */}
        <div className="flex-1 min-h-0 flex gap-4">

          {/* Left panel */}
          <div
            className={`${mobileView === "input" ? "flex" : "hidden"} md:flex w-full md:w-[300px] flex-shrink-0 flex-col rounded-[16px] overflow-hidden border border-[#CAC4D0]`}
            style={{ background: "var(--md-surface)", boxShadow: "var(--md-elevation-1)" }}
          >
            {/* History section */}
            {history.length > 0 && (
              <div className="flex-shrink-0 border-b border-[#E7E0EC]">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#F7F2FA] transition text-sm"
                >
                  <div className="flex items-center gap-2 text-[#49454F]">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">My Records</span>
                    <span className="bg-[#EADDFF] text-[#6750A4] text-xs px-1.5 py-0.5 rounded-full font-semibold">
                      {history.length}
                    </span>
                  </div>
                  <svg className={`w-4 h-4 text-[#79747E] transition-transform ${showHistory ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showHistory && (
                  <div className="max-h-48 overflow-y-auto scrollbar-thin divide-y divide-[#E7E0EC]">
                    {history.map((item) => (
                      <button key={item.id} onClick={() => loadRecord(item)}
                        className="w-full text-left px-4 py-2.5 hover:bg-[#F3EDF7] transition group">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-[#1C1B1F] truncate max-w-[160px]">
                            {item.company || "No company"}
                          </span>
                          {resultCount(item.results) > 0 && (
                            <span className="text-xs bg-[#EADDFF] text-[#6750A4] px-1.5 py-0.5 rounded-full flex-shrink-0">
                              {resultCount(item.results)} ✓
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#79747E] truncate mt-0.5">{item.jdTitle || "No description"}</div>
                        <div className="text-xs text-[#CAC4D0] mt-0.5">
                          {new Date(item.updatedAt).toLocaleDateString()}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Input form */}
            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-4 md:p-5">
              <InputSection key={inputKey} initialValues={initialValues} onSubmit={handleStart} isLoading={isLoading} t={t} />
            </div>
          </div>

          {/* Right panel */}
          <div
            className={`${mobileView === "chat" ? "flex" : "hidden"} md:flex flex-1 min-w-0 flex-col rounded-[16px] overflow-hidden border border-[#CAC4D0]`}
            style={{ background: "var(--md-surface)", boxShadow: "var(--md-elevation-1)" }}
          >
            <ChatPanel
              company={currentInput.company}
              jd={currentInput.jd}
              resume={currentInput.resume}
              triggerAction={triggerAction}
              onRequestAction={handleQuickAction}
              lang={lang}
              t={t}
              recordId={recordId}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
