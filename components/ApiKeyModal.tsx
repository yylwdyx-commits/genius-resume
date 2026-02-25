"use client";

import { useState, useEffect } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

type Provider = "anthropic" | "openai" | "gemini" | "deepseek";

const PROVIDERS: { id: Provider; name: string; icon: string; placeholder: string; defaultModel: string; models: string[]; docsUrl: string }[] = [
  {
    id: "anthropic",
    name: "Anthropic Claude",
    icon: "🟠",
    placeholder: "sk-ant-api03-...",
    defaultModel: "claude-sonnet-4-6",
    models: ["claude-sonnet-4-6", "claude-opus-4-6", "claude-haiku-4-5-20251001"],
    docsUrl: "https://console.anthropic.com/settings/keys",
  },
  {
    id: "openai",
    name: "OpenAI GPT",
    icon: "🟢",
    placeholder: "sk-proj-...",
    defaultModel: "gpt-4o",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
    docsUrl: "https://platform.openai.com/api-keys",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    icon: "🔵",
    placeholder: "sk-...",
    defaultModel: "deepseek-chat",
    models: ["deepseek-chat", "deepseek-reasoner"],
    docsUrl: "https://platform.deepseek.com/api_keys",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    icon: "🔴",
    placeholder: "AIza...",
    defaultModel: "gemini-1.5-flash",
    models: ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash-exp"],
    docsUrl: "https://aistudio.google.com/app/apikey",
  },
];

export default function ApiKeyModal({ isOpen, onClose, onSaved }: Props) {
  const [provider, setProvider] = useState<Provider>("anthropic");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [loading, setLoading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [existingConfig, setExistingConfig] = useState<{
    hasKey: boolean;
    provider: string | null;
    keyHint: string | null;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/user/apikey")
      .then((r) => r.json())
      .then((d) => {
        setExistingConfig(d);
        if (d.provider) setProvider(d.provider as Provider);
      })
      .catch(() => {});
  }, [isOpen]);

  const currentProvider = PROVIDERS.find((p) => p.id === provider)!;

  const handleSave = async () => {
    if (!apiKey.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/user/apikey", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey: apiKey.trim(), model: model.trim() || null }),
      });
      if (res.ok) {
        setApiKey("");
        onSaved();
        onClose();
      } else {
        const d = await res.json();
        alert(d.error ?? "Failed to save");
      }
    } catch {
      alert("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm("Remove your API key? You'll use Jobna's model (with free tier limits).")) return;
    setRemoving(true);
    try {
      await fetch("/api/user/apikey", { method: "DELETE" });
      setExistingConfig(null);
      onSaved();
      onClose();
    } catch {
      alert("Network error");
    } finally {
      setRemoving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#141414] rounded-2xl max-w-md w-full border border-white/[0.08] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white font-semibold text-lg">🔑 Your API Key</h2>
              <p className="text-white/50 text-xs mt-0.5">
                Use your own key — no usage limits, your preferred model
              </p>
            </div>
            <button onClick={onClose} className="text-white/30 hover:text-white/60 transition p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {existingConfig?.hasKey && (
            <div className="mt-3 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
              <span className="text-green-400 text-xs">
                Active: {existingConfig.provider} · {existingConfig.keyHint}
              </span>
            </div>
          )}
        </div>

        {/* Provider selector */}
        <div className="px-6 pt-4">
          <label className="text-white/50 text-xs font-medium uppercase tracking-wide mb-2 block">
            Provider
          </label>
          <div className="grid grid-cols-2 gap-2">
            {PROVIDERS.map((p) => (
              <button
                key={p.id}
                onClick={() => setProvider(p.id)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all ${
                  provider === p.id
                    ? "border-violet-500 bg-violet-500/10 text-white"
                    : "border-white/[0.08] text-white/50 hover:border-white/20 hover:text-white/70"
                }`}
              >
                <span>{p.icon}</span>
                <span className="font-medium truncate">{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* API Key input */}
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-white/50 text-xs font-medium uppercase tracking-wide">
              API Key
            </label>
            <a
              href={currentProvider.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-400 text-xs hover:text-violet-300 transition"
            >
              Get key →
            </a>
          </div>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={existingConfig?.hasKey ? "Enter new key to update…" : currentProvider.placeholder}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder-white/20 focus:outline-none focus:border-violet-500/50 transition font-mono"
          />
        </div>

        {/* Model selector */}
        <div className="px-6 pt-3 pb-5">
          <label className="text-white/50 text-xs font-medium uppercase tracking-wide mb-2 block">
            Model <span className="normal-case text-white/30">(optional)</span>
          </label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-violet-500/50 transition appearance-none"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23ffffff40'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", backgroundSize: "16px" }}
          >
            <option value="">Default ({currentProvider.defaultModel})</option>
            {currentProvider.models.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <p className="text-white/25 text-xs mt-2">
            Your key is stored securely and only used server-side. We never share it.
          </p>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-2">
          <button
            onClick={handleSave}
            disabled={loading || !apiKey.trim()}
            className="flex-1 h-10 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-full transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "Save Key"
            )}
          </button>
          {existingConfig?.hasKey && (
            <button
              onClick={handleRemove}
              disabled={removing}
              className="px-4 h-10 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium rounded-full border border-red-500/20 transition disabled:opacity-40"
            >
              {removing ? "…" : "Remove"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
