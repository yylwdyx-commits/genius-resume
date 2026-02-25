"use client";

import { useState, useRef, useEffect } from "react";
import { T } from "@/lib/i18n";

export interface JobInput {
  company: string;
  jd: string;
  resume: string;
}

interface CompanyInfo {
  description: string;
  website: string;
  domain: string;
}

interface Props {
  onSubmit: (input: JobInput) => void;
  isLoading: boolean;
  t: T;
}

export default function InputSection({ onSubmit, isLoading, t }: Props) {
  const [company, setCompany] = useState("");
  const [jd, setJd] = useState("");
  const [resume, setResume] = useState("");
  const [resumeMode, setResumeMode] = useState<"text" | "file">("text");
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setCompanyInfo(null);
    setLogoError(false);
    if (!company.trim()) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setCompanyLoading(true);
      try {
        const res = await fetch("/api/company-info", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ company }),
        });
        const data = await res.json();
        if (data.domain) setCompanyInfo(data);
      } catch { /* silently ignore */ }
      finally { setCompanyLoading(false); }
    }, 800);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [company]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setFileName(file.name);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/parse-file", { method: "POST", body: formData });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResume(data.text);
      setResumeMode("text");
    } catch (err) {
      alert(err instanceof Error ? err.message : t.uploading);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!jd.trim()) { alert(t.jdAlert); return; }
    onSubmit({ company, jd, resume });
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Company */}
      <div>
        <label className="block text-xs font-medium text-[#6b7280] uppercase tracking-wide mb-1.5">
          {t.targetCompany}
        </label>
        <input
          type="text"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder={t.companyPlaceholder}
          className="w-full px-3 py-2.5 rounded-lg border border-[#e5e7eb] bg-white text-[#111827] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition"
        />

        {companyLoading && (
          <div className="mt-2 p-3 rounded-xl bg-[#fafafa] border border-[#e5e7eb]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg skeleton" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 skeleton rounded w-3/4" />
                <div className="h-3 skeleton rounded w-1/2" />
              </div>
            </div>
          </div>
        )}

        {!companyLoading && companyInfo && (
          <div className="mt-2 p-3 rounded-xl bg-[#fafafa] border-l-4 border-violet-500 border border-[#e5e7eb]">
            <div className="flex items-start gap-2.5">
              {!logoError ? (
                <img
                  src={`https://logo.clearbit.com/${companyInfo.domain}`}
                  alt={company}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-lg object-contain flex-shrink-0"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                  {company.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs text-[#6b7280] leading-relaxed line-clamp-2">
                  {companyInfo.description.slice(0, 80)}
                </p>
                {companyInfo.website && (
                  <a href={companyInfo.website} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-violet-600 hover:underline mt-1 inline-block truncate max-w-full">
                    {companyInfo.domain}
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* JD */}
      <div className="flex-1 min-h-0">
        <label className="block text-xs font-medium text-[#6b7280] uppercase tracking-wide mb-1.5">
          {t.jobDescription}<span className="text-red-500 ml-0.5 normal-case"> *</span>
        </label>
        <textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          placeholder={t.jdPlaceholder}
          className="w-full h-44 px-3 py-2.5 rounded-lg border border-[#e5e7eb] bg-white text-[#111827] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm resize-none transition scrollbar-thin"
        />
      </div>

      {/* Resume */}
      <div className="flex-1 min-h-0">
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-medium text-[#6b7280] uppercase tracking-wide">
            {t.resume}
          </label>
          <div className="flex rounded-lg overflow-hidden border border-[#e5e7eb] text-xs">
            <button onClick={() => setResumeMode("text")}
              className={`px-2.5 py-1 transition ${resumeMode === "text" ? "bg-violet-600 text-white" : "bg-white text-[#6b7280] hover:bg-[#fafafa]"}`}>
              {t.paste}
            </button>
            <button onClick={() => setResumeMode("file")}
              className={`px-2.5 py-1 transition ${resumeMode === "file" ? "bg-violet-600 text-white" : "bg-white text-[#6b7280] hover:bg-[#fafafa]"}`}>
              {t.upload}
            </button>
          </div>
        </div>

        {resumeMode === "text" ? (
          <textarea
            value={resume}
            onChange={(e) => setResume(e.target.value)}
            placeholder={t.resumePlaceholder}
            className="w-full h-40 px-3 py-2.5 rounded-lg border border-[#e5e7eb] bg-white text-[#111827] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm resize-none transition scrollbar-thin"
          />
        ) : (
          <div onClick={() => fileRef.current?.click()}
            className="w-full h-40 rounded-lg border-2 border-dashed border-[#e5e7eb] bg-white flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-violet-500 hover:bg-violet-50/30 transition">
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-[#6b7280]">{t.uploading}</span>
              </div>
            ) : fileName ? (
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-2xl">📄</span>
                <span className="text-sm text-[#111827] font-medium">{fileName}</span>
                <span className="text-xs text-emerald-600">{t.parsedSuccess}</span>
              </div>
            ) : (
              <>
                <span className="text-3xl">📎</span>
                <span className="text-sm text-[#6b7280]">{t.uploadClick}</span>
                <span className="text-xs text-[#9ca3af]">{t.uploadFormats}</span>
              </>
            )}
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleFileUpload} className="hidden" />
          </div>
        )}
      </div>

      {/* Start button */}
      <button
        onClick={handleSubmit}
        disabled={isLoading}
        className="w-full h-11 bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-700 hover:to-indigo-600 text-white text-sm font-medium rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>{t.analyzing}</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>{t.startAnalysis}</span>
          </>
        )}
      </button>
    </div>
  );
}
