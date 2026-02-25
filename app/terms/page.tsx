import Link from "next/link";

export const metadata = {
  title: "Terms of Service – Jobna.ai",
  description: "Terms of Service for Jobna.ai",
};

export default function TermsPage() {
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
          <Link href="/privacy" className="text-sm text-white/40 hover:text-white/70 transition">
            Privacy Policy →
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
          <p className="text-white/40 text-sm">Last updated: {lastUpdated}</p>
        </div>

        <div className="space-y-8 text-[15px] leading-relaxed">

          <section>
            <p>
              Please read these Terms of Service (&quot;Terms&quot;) carefully before using Jobna.ai
              (&quot;Service&quot;). By accessing or using our Service, you agree to be bound by these Terms.
              If you do not agree, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. Description of Service</h2>
            <p>
              Jobna.ai is an AI-powered career assistant platform that helps users optimize resumes,
              gather company intelligence, prepare for interviews, and practice mock interviews.
              The Service is provided by Jobna.ai and its operators.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. Accounts</h2>
            <p>
              You must sign in with a valid Google account to use the Service. You are responsible
              for maintaining the security of your account and for all activity that occurs under it.
              You must not share your account credentials with others.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. Subscriptions and Billing</h2>
            <p className="mb-3">
              Jobna.ai offers a free tier and a paid Pro subscription. The Pro plan is available
              on a monthly ($29/month) or annual ($169/year) basis.
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-white/70 ml-2">
              <li>Subscriptions automatically renew at the end of each billing period.</li>
              <li>You may cancel your subscription at any time via your account settings.</li>
              <li>Cancellation takes effect at the end of the current billing period.</li>
              <li>All fees are non-refundable except as required by applicable law or as stated in our refund policy below.</li>
              <li>We reserve the right to change pricing with 30 days&apos; notice.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Refund Policy</h2>
            <p className="mb-3">
              We offer a <strong className="text-white">7-day refund</strong> for first-time Pro
              subscribers who are not satisfied with the Service. To request a refund, contact us at{" "}
              <a href="mailto:support@jobna.ai" className="text-violet-400 hover:underline">
                support@jobna.ai
              </a>{" "}
              within 7 days of your initial purchase.
            </p>
            <p>
              Refunds are not available for renewals or after the 7-day window has passed.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Free Tier Limitations</h2>
            <p>
              Free accounts are subject to usage limits, including a maximum of 3 resume
              optimizations per month and up to 3 saved records. Features including Job Intel,
              Interview Questions, Mock Interview, AI Chat, and PDF Export are available to
              Pro subscribers and users who provide their own API keys.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. Acceptable Use</h2>
            <p className="mb-3">You agree not to use the Service to:</p>
            <ul className="list-disc list-inside space-y-1.5 text-white/70 ml-2">
              <li>Violate any applicable laws or regulations.</li>
              <li>Upload harmful, offensive, or illegal content.</li>
              <li>Attempt to reverse engineer, hack, or disrupt the Service.</li>
              <li>Use automated scripts or bots to abuse the Service.</li>
              <li>Resell or redistribute access to the Service without authorization.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. Intellectual Property</h2>
            <p>
              The Jobna.ai name, logo, and all Service content (excluding user-submitted content)
              are the property of Jobna.ai and protected by applicable intellectual property laws.
              You retain ownership of content you submit (resumes, job descriptions, etc.).
              By submitting content, you grant us a limited license to process it to provide the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">8. Third-Party Services</h2>
            <p>
              The Service integrates with third-party providers including Google (authentication),
              Anthropic (AI), Paddle (payments), and Tavily (web search). Your use of these
              services is also subject to their respective terms and privacy policies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">9. Disclaimer of Warranties</h2>
            <p>
              The Service is provided &quot;as is&quot; without warranties of any kind. We do not guarantee
              that the Service will be uninterrupted, error-free, or that AI-generated content will
              be accurate or suitable for any particular purpose. AI output should not be considered
              professional career, legal, or financial advice.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">10. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Jobna.ai shall not be liable for any indirect,
              incidental, special, or consequential damages arising from your use of the Service.
              Our total liability to you shall not exceed the amount you paid us in the 12 months
              preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">11. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account at any time for violations
              of these Terms. You may also delete your account at any time. Upon termination,
              your right to use the Service ceases immediately.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">12. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. We will notify you of material changes
              by email or by posting a notice on the Service. Continued use of the Service after
              changes constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">13. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with applicable law.
              Any disputes shall be resolved through binding arbitration or a court of competent
              jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">14. Contact</h2>
            <p>
              If you have any questions about these Terms, please contact us at{" "}
              <a href="mailto:support@jobna.ai" className="text-violet-400 hover:underline">
                support@jobna.ai
              </a>.
            </p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-white/[0.07] flex items-center justify-between text-sm text-white/30">
          <span>© 2026 Jobna.ai · All rights reserved</span>
          <Link href="/privacy" className="hover:text-white/60 transition">Privacy Policy</Link>
        </div>
      </main>
    </div>
  );
}
