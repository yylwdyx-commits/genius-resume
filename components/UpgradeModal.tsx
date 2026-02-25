"use client";

import { useState } from "react";

interface Props {
  isOpen: boolean;
  reason: "limit_reached" | "pro_required" | string;
  onClose: () => void;
  onOpenApiKey: () => void;
}

const REASON_TEXT: Record<string, { title: string; desc: string }> = {
  limit_reached: {
    title: "You've used all 3 free analyses this month",
    desc: "Upgrade to Pro for unlimited resume optimizations and all features.",
  },
  pro_required: {
    title: "This feature is available on Pro",
    desc: "Unlock Job Intel, Interview Prep, Mock Interview, AI Chat and more.",
  },
};

const FEATURES = [
  { icon: "✨", label: "Unlimited resume optimizations" },
  { icon: "🔍", label: "Job Intel — company deep-dives" },
  { icon: "📝", label: "Interview question generator" },
  { icon: "🎙️", label: "AI mock interviews" },
  { icon: "💬", label: "Free-form career chat" },
  { icon: "📄", label: "PDF export" },
  { icon: "📂", label: "Unlimited history records" },
];

export default function UpgradeModal({ isOpen, reason, onClose, onOpenApiKey }: Props) {
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("yearly");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const text = REASON_TEXT[reason] ?? REASON_TEXT.pro_required;

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error ?? "Something went wrong");
        setLoading(false);
      }
    } catch {
      alert("Network error. Please try again.");
      setLoading(false);
    }
  };

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
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-lg">
              ⚡
            </div>
            <div>
              <h2 className="text-white font-semibold text-lg leading-tight">Upgrade to Pro</h2>
              <p className="text-white/50 text-xs">{text.title}</p>
            </div>
          </div>
          <p className="text-white/60 text-sm mt-2">{text.desc}</p>
        </div>

        {/* Plan picker */}
        <div className="px-6 py-4 flex gap-3">
          <button
            onClick={() => setSelectedPlan("monthly")}
            className={`flex-1 rounded-xl border p-3.5 text-left transition-all ${
              selectedPlan === "monthly"
                ? "border-violet-500 bg-violet-500/10"
                : "border-white/[0.08] hover:border-white/20"
            }`}
          >
            <div className="text-white font-semibold text-lg">$29</div>
            <div className="text-white/50 text-xs">per month</div>
            <div className="text-white/40 text-xs mt-1">Monthly</div>
          </button>
          <button
            onClick={() => setSelectedPlan("yearly")}
            className={`flex-1 rounded-xl border p-3.5 text-left transition-all relative ${
              selectedPlan === "yearly"
                ? "border-violet-500 bg-violet-500/10"
                : "border-white/[0.08] hover:border-white/20"
            }`}
          >
            <div className="absolute -top-2.5 right-3">
              <span className="bg-gradient-to-r from-violet-500 to-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                BEST VALUE
              </span>
            </div>
            <div className="text-white font-semibold text-lg">$14</div>
            <div className="text-white/50 text-xs">per month</div>
            <div className="text-white/40 text-xs mt-1">$169/yr · Save 51%</div>
          </button>
        </div>

        {/* Features */}
        <div className="px-6 pb-4">
          <div className="grid grid-cols-2 gap-1.5">
            {FEATURES.map((f) => (
              <div key={f.label} className="flex items-center gap-2 text-xs text-white/60">
                <span className="text-sm">{f.icon}</span>
                <span>{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex flex-col gap-2">
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full h-11 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-sm rounded-full transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>Upgrade to Pro →</>
            )}
          </button>
          <div className="text-center">
            <span className="text-white/30 text-xs">or </span>
            <button
              onClick={() => { onClose(); onOpenApiKey(); }}
              className="text-violet-400 text-xs hover:text-violet-300 underline underline-offset-2 transition"
            >
              use your own API key for free
            </button>
          </div>
          <button
            onClick={onClose}
            className="w-full h-9 text-white/40 text-sm hover:text-white/60 transition"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
