"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";

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
}

export default function InputSection({ onSubmit, isLoading }: Props) {
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
      } catch {
        // silently ignore
      } finally {
        setCompanyLoading(false);
      }
    }, 800);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [company]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setFileName(file.name);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/parse-file", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResume(data.text);
      setResumeMode("text");
    } catch (err) {
      alert(err instanceof Error ? err.message : "文件解析失败，请粘贴文字");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!jd.trim()) {
      alert("请输入职位描述（JD）");
      return;
    }
    onSubmit({ company, jd, resume });
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Company */}
      <div>
        <label className="block text-xs font-medium text-[#5f6368] uppercase tracking-wide mb-1.5">
          目标公司
        </label>
        <input
          type="text"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="例如：字节跳动、Google、OpenAI..."
          className="w-full px-3 py-2.5 rounded-lg border border-[#e8eaed] bg-white text-[#202124] placeholder-[#9aa0a6] focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:border-transparent text-sm transition"
        />

        {/* Company info card */}
        {companyLoading && (
          <div className="mt-2 p-3 rounded-xl bg-[#f8f9fa] border border-[#e8eaed]">
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
          <div className="mt-2 p-3 rounded-xl bg-[#f8f9fa] border-l-4 border-[#1a73e8] border border-[#e8eaed]">
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
                <div className="w-8 h-8 rounded-lg bg-[#1a73e8] flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                  {company.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs text-[#5f6368] leading-relaxed line-clamp-2">
                  {companyInfo.description.slice(0, 80)}
                </p>
                {companyInfo.website && (
                  <a
                    href={companyInfo.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#1a73e8] hover:underline mt-1 inline-block truncate max-w-full"
                  >
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
        <label className="block text-xs font-medium text-[#5f6368] uppercase tracking-wide mb-1.5">
          职位描述（JD）<span className="text-red-500 ml-0.5 normal-case">*</span>
        </label>
        <textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          placeholder="粘贴职位描述，包含岗位职责、任职要求等..."
          className="w-full h-44 px-3 py-2.5 rounded-lg border border-[#e8eaed] bg-white text-[#202124] placeholder-[#9aa0a6] focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:border-transparent text-sm resize-none transition scrollbar-thin"
        />
      </div>

      {/* Resume */}
      <div className="flex-1 min-h-0">
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-medium text-[#5f6368] uppercase tracking-wide">
            个人简历
          </label>
          <div className="flex rounded-lg overflow-hidden border border-[#e8eaed] text-xs">
            <button
              onClick={() => setResumeMode("text")}
              className={`px-2.5 py-1 transition ${
                resumeMode === "text"
                  ? "bg-[#1a73e8] text-white"
                  : "bg-white text-[#5f6368] hover:bg-[#f8f9fa]"
              }`}
            >
              粘贴
            </button>
            <button
              onClick={() => setResumeMode("file")}
              className={`px-2.5 py-1 transition ${
                resumeMode === "file"
                  ? "bg-[#1a73e8] text-white"
                  : "bg-white text-[#5f6368] hover:bg-[#f8f9fa]"
              }`}
            >
              上传
            </button>
          </div>
        </div>

        {resumeMode === "text" ? (
          <textarea
            value={resume}
            onChange={(e) => setResume(e.target.value)}
            placeholder="粘贴简历内容（工作经历、项目经历、技能等）..."
            className="w-full h-40 px-3 py-2.5 rounded-lg border border-[#e8eaed] bg-white text-[#202124] placeholder-[#9aa0a6] focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:border-transparent text-sm resize-none transition scrollbar-thin"
          />
        ) : (
          <div
            onClick={() => fileRef.current?.click()}
            className="w-full h-40 rounded-lg border-2 border-dashed border-[#e8eaed] bg-white flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#1a73e8] hover:bg-[#f8f9fa] transition"
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-[#1a73e8] border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-[#5f6368]">解析中...</span>
              </div>
            ) : fileName ? (
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-2xl">📄</span>
                <span className="text-sm text-[#202124] font-medium">{fileName}</span>
                <span className="text-xs text-emerald-600">✓ 解析成功，点击重新上传</span>
              </div>
            ) : (
              <>
                <span className="text-3xl">📎</span>
                <span className="text-sm text-[#5f6368]">点击上传简历文件</span>
                <span className="text-xs text-[#9aa0a6]">支持 PDF、Word(.docx)、TXT</span>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        )}
      </div>

      {/* Start button */}
      <button
        onClick={handleSubmit}
        disabled={isLoading}
        className="w-full h-11 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-sm font-medium rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>分析中...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>开始分析</span>
          </>
        )}
      </button>
    </div>
  );
}
