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

/* shared MD3 outlined text-field class */
const fieldCls =
  "w-full px-4 py-3 rounded-[4px] border border-[#79747E] bg-[#FFFBFF] text-[#1C1B1F] placeholder-[#49454F]/70 " +
  "focus:outline-none focus:border-2 focus:border-[#6750A4] text-sm transition";

const labelCls = "block text-xs font-semibold text-[#49454F] uppercase tracking-widest mb-1.5";

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
    <div className="flex flex-col gap-5 h-full">

      {/* ── Company ── */}
      <div>
        <label className={labelCls}>{t.targetCompany}</label>
        <input
          type="text"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder={t.companyPlaceholder}
          className={fieldCls}
        />

        {/* Skeleton */}
        {companyLoading && (
          <div className="mt-2 p-3 rounded-[12px] bg-[#F3EDF7] border border-[#CAC4D0]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full skeleton" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 skeleton rounded w-3/4" />
                <div className="h-3 skeleton rounded w-1/2" />
              </div>
            </div>
          </div>
        )}

        {/* MD3 Elevated Card — company info */}
        {!companyLoading && companyInfo && (
          <div className="mt-2 p-3 rounded-[12px] bg-[#F3EDF7] border-l-4 border-[#6750A4] border border-[#CAC4D0]" style={{ boxShadow: "var(--md-elevation-1)" }}>
            <div className="flex items-start gap-2.5">
              {!logoError ? (
                <img
                  src={`https://logo.clearbit.com/${companyInfo.domain}`}
                  alt={company}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-contain flex-shrink-0 border border-[#CAC4D0]"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#6750A4] flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                  {company.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs text-[#1C1B1F] leading-relaxed line-clamp-2">
                  {companyInfo.description.slice(0, 80)}
                </p>
                {companyInfo.website && (
                  <a href={companyInfo.website} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-[#6750A4] hover:underline mt-1 inline-block truncate max-w-full">
                    {companyInfo.domain}
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Job Description ── */}
      <div className="flex-1 min-h-0">
        <label className={labelCls}>
          {t.jobDescription}<span className="text-[#B3261E] ml-0.5 normal-case"> *</span>
        </label>
        <textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          placeholder={t.jdPlaceholder}
          className={`${fieldCls} h-44 resize-none scrollbar-thin`}
        />
      </div>

      {/* ── Resume ── */}
      <div className="flex-1 min-h-0">
        <div className="flex items-center justify-between mb-1.5">
          <label className={labelCls}>{t.resume}</label>
          {/* MD3 Segmented Button */}
          <div className="flex rounded-full overflow-hidden border border-[#CAC4D0] text-xs">
            <button
              onClick={() => setResumeMode("text")}
              className={`px-3 py-1.5 transition font-medium ${
                resumeMode === "text"
                  ? "bg-[#EADDFF] text-[#21005D]"
                  : "bg-[#FFFBFF] text-[#49454F] hover:bg-[#F3EDF7]"
              }`}
            >
              {t.paste}
            </button>
            <button
              onClick={() => setResumeMode("file")}
              className={`px-3 py-1.5 transition font-medium ${
                resumeMode === "file"
                  ? "bg-[#EADDFF] text-[#21005D]"
                  : "bg-[#FFFBFF] text-[#49454F] hover:bg-[#F3EDF7]"
              }`}
            >
              {t.upload}
            </button>
          </div>
        </div>

        {resumeMode === "text" ? (
          <textarea
            value={resume}
            onChange={(e) => setResume(e.target.value)}
            placeholder={t.resumePlaceholder}
            className={`${fieldCls} h-36 resize-none scrollbar-thin`}
          />
        ) : (
          <div
            onClick={() => fileRef.current?.click()}
            className="w-full h-36 rounded-[12px] border-2 border-dashed border-[#CAC4D0] bg-[#FFFBFF] flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#6750A4] hover:bg-[#F3EDF7] transition-all"
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-[#6750A4] border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-[#49454F]">{t.uploading}</span>
              </div>
            ) : fileName ? (
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-10 h-10 rounded-full bg-[#EADDFF] flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#6750A4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-sm text-[#1C1B1F] font-medium">{fileName}</span>
                <span className="text-xs text-[#386A1F]">{t.parsedSuccess}</span>
              </div>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-[#EADDFF] flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#6750A4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </div>
                <span className="text-sm text-[#49454F]">{t.uploadClick}</span>
                <span className="text-xs text-[#79747E]">{t.uploadFormats}</span>
              </>
            )}
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleFileUpload} className="hidden" />
          </div>
        )}
      </div>

      {/* ── MD3 Filled Button ── */}
      <button
        onClick={handleSubmit}
        disabled={isLoading}
        className="w-full h-10 bg-[#6750A4] hover:bg-[#5B4397] active:bg-[#4F378B] text-white text-sm font-medium rounded-full transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{ boxShadow: "var(--md-elevation-1)" }}
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
