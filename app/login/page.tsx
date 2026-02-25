"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") router.replace("/");
  }, [status, router]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--md-background)" }}>
      <div className="w-full max-w-sm mx-4">

        {/* Card */}
        <div
          className="rounded-[28px] overflow-hidden border border-[#CAC4D0] bg-[#FFFBFF] p-8 flex flex-col items-center gap-6"
          style={{ boxShadow: "var(--md-elevation-2)" }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-[20px] bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="7" r="2.8" fill="white" />
                <path d="M12 11.5 L13.2 15.2 L17 16.5 L13.2 17.8 L12 21.5 L10.8 17.8 L7 16.5 L10.8 15.2 Z" fill="white" />
              </svg>
            </div>
            <div className="text-center">
              <div className="flex items-baseline gap-1 justify-center">
                <span className="text-[#1C1B1F] font-bold text-xl">Jobna</span>
                <span className="text-[#6750A4] font-semibold">.ai</span>
              </div>
              <p className="text-[#49454F] text-sm mt-1">AI-Powered Job Intelligence</p>
            </div>
          </div>

          {/* Divider */}
          <div className="w-full border-t border-[#E7E0EC]" />

          {/* Sign in text */}
          <div className="text-center">
            <h1 className="text-[#1C1B1F] font-semibold text-base">Sign in to continue</h1>
            <p className="text-[#49454F] text-sm mt-1">
              Save your analyses and access them anywhere.
            </p>
          </div>

          {/* Google Sign-in button — MD3 outlined */}
          <button
            onClick={() => signIn("google")}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-full border-2 border-[#CAC4D0] bg-[#FFFBFF] text-[#1C1B1F] font-medium text-sm hover:bg-[#F3EDF7] hover:border-[#6750A4] transition-all"
            style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.08)" }}
          >
            {/* Google logo */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>

          <p className="text-xs text-[#79747E] text-center leading-relaxed">
            By signing in, you agree to our terms of service.<br />
            Your data is stored securely.
          </p>
        </div>
      </div>
    </div>
  );
}
