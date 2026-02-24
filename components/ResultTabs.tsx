"use client";

import { ReactNode } from "react";

export type TabId = "resume" | "intel" | "questions" | "mock";

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

const TABS: Tab[] = [
  { id: "resume", label: "简历优化", icon: "✨" },
  { id: "intel", label: "岗位情报", icon: "🔍" },
  { id: "questions", label: "面试题库", icon: "📝" },
  { id: "mock", label: "模拟面试", icon: "🎙️" },
];

interface Props {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  children: ReactNode;
}

export default function ResultTabs({ activeTab, onTabChange, children }: Props) {
  return (
    <div className="flex flex-col h-full">
      {/* Tab Bar */}
      <div className="flex border-b border-slate-200 mb-4 gap-0.5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg transition border-b-2 -mb-px ${
              activeTab === tab.id
                ? "border-sky-500 text-sky-600 bg-sky-50"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}
