import Link from "next/link";

export const metadata = {
  title: "Privacy Policy – Jobna.ai",
  description: "Privacy Policy for Jobna.ai",
};

export default function PrivacyPage() {
  const lastUpdated = "February 25, 2026";

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white/80">
      {/* Header */}
      <header className="border-b border-white/[0.07] px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="7" r="2.8" fill="white" />
                <path d="M12 11.5 L13.2 15.2 L17 16.5 L13.2 17.8 L12 21.5 L10.8 17.8 L7 16.5 L10.8 15.2 Z" fill="white" />
              </svg>
            </div>
            <span className="text-white font-semibold text-sm">Jobna<span className="text-violet-400">.ai</span></span>
          </Link>
          <Link href="/terms" className="text-sm text-white/40 hover:text-white/70 transition">
            Terms of Service →
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-white/40 text-sm">Last updated: {lastUpdated}</p>
        </div>

        <div className="space-y-8 text-[15px] leading-relaxed">

          <section>
            <p>
              Jobna.ai (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to protecting your privacy.
              This Privacy Policy explains how we collect, use, and protect your information
              when you use our Service at jobna.ai.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. Information We Collect</h2>
            <div className="space-y-3">
              <div>
                <h3 className="text-white/90 font-medium mb-1">Account Information</h3>
                <p className="text-white/60">
                  When you sign in with Google, we receive your name, email address, and profile
                  picture from Google OAuth. We store this to identify your account.
                </p>
              </div>
              <div>
                <h3 className="text-white/90 font-medium mb-1">Content You Provide</h3>
                <p className="text-white/60">
                  Resumes, job descriptions, and company names you enter to use the Service.
                  This content is stored in your account history so you can revisit past analyses.
                </p>
              </div>
              <div>
                <h3 className="text-white/90 font-medium mb-1">Usage Data</h3>
                <p className="text-white/60">
                  We track usage counts (e.g., number of resume optimizations) to enforce plan limits.
                  We do not collect detailed behavioral analytics or sell usage data.
                </p>
              </div>
              <div>
                <h3 className="text-white/90 font-medium mb-1">Payment Information</h3>
                <p className="text-white/60">
                  Payments are processed by Paddle. We do not store your credit card details.
                  We only store a Paddle customer ID and subscription status to manage your plan.
                </p>
              </div>
              <div>
                <h3 className="text-white/90 font-medium mb-1">Custom API Keys (BYOK)</h3>
                <p className="text-white/60">
                  If you choose to provide your own AI API key, it is stored encrypted in our
                  database and used exclusively to make AI requests on your behalf. We never
                  share or use your key for any other purpose.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-1.5 text-white/70 ml-2">
              <li>To provide and operate the Service (resume analysis, interview prep, etc.).</li>
              <li>To manage your account, subscription, and usage limits.</li>
              <li>To process payments and send billing-related communications.</li>
              <li>To respond to your support requests.</li>
              <li>To improve the Service based on aggregate, anonymized usage patterns.</li>
            </ul>
            <p className="mt-3">
              We do <strong className="text-white">not</strong> sell your personal data to third parties.
              We do not use your resume or job content to train AI models.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. Third-Party Services</h2>
            <div className="space-y-2 text-white/70">
              <p><strong className="text-white/90">Google OAuth</strong> — For sign-in. Subject to Google&apos;s Privacy Policy.</p>
              <p><strong className="text-white/90">Anthropic</strong> — AI processing. Your content is sent to Anthropic&apos;s API to generate responses. Subject to Anthropic&apos;s usage policies.</p>
              <p><strong className="text-white/90">Paddle</strong> — Payment processing. Handles billing and subscription management. Subject to Paddle&apos;s Privacy Policy.</p>
              <p><strong className="text-white/90">Tavily</strong> — Web search for the Job Intel feature. Queries (company names) are sent to Tavily&apos;s API.</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Data Retention</h2>
            <p>
              Your account data and job records are retained as long as your account is active.
              You may delete individual records at any time from your account. To delete your
              entire account and all associated data, contact us at{" "}
              <a href="mailto:support@jobna.ai" className="text-violet-400 hover:underline">
                support@jobna.ai
              </a>.
              We will process deletion requests within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Data Security</h2>
            <p>
              We use industry-standard security practices including HTTPS encryption for all data
              in transit, and access controls to limit who can access production data.
              No system is perfectly secure; while we strive to protect your information, we
              cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. Cookies</h2>
            <p>
              We use session cookies solely to keep you signed in (via NextAuth.js). We do not
              use tracking cookies, advertising cookies, or third-party analytics cookies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. Children&apos;s Privacy</h2>
            <p>
              The Service is not directed to children under 13 years of age. We do not knowingly
              collect personal information from children. If you believe a child has provided us
              with personal information, please contact us and we will delete it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">8. Your Rights</h2>
            <p className="mb-3">Depending on your location, you may have the right to:</p>
            <ul className="list-disc list-inside space-y-1.5 text-white/70 ml-2">
              <li>Access the personal data we hold about you.</li>
              <li>Request correction of inaccurate data.</li>
              <li>Request deletion of your data.</li>
              <li>Object to or restrict processing of your data.</li>
              <li>Data portability (receive your data in a structured format).</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, contact us at{" "}
              <a href="mailto:support@jobna.ai" className="text-violet-400 hover:underline">
                support@jobna.ai
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">9. International Transfers</h2>
            <p>
              Your data may be processed on servers located outside your country of residence.
              By using the Service, you consent to the transfer of your information to countries
              that may have different data protection laws than your country.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy periodically. We will notify you of significant
              changes by email or by a prominent notice on our website. Continued use of the
              Service after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">11. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="mt-3 p-4 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white/60">
              <p>Jobna.ai</p>
              <p>Email: <a href="mailto:support@jobna.ai" className="text-violet-400 hover:underline">support@jobna.ai</a></p>
              <p>Website: <a href="https://jobna.ai" className="text-violet-400 hover:underline">https://jobna.ai</a></p>
            </div>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-white/[0.07] flex items-center justify-between text-sm text-white/30">
          <span>© 2026 Jobna.ai · All rights reserved</span>
          <Link href="/terms" className="hover:text-white/60 transition">Terms of Service</Link>
        </div>
      </main>
    </div>
  );
}
