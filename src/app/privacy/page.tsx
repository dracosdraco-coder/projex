import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — Projex',
  description: 'Privacy Policy for Projex. Learn how we collect, use, and protect your data.',
  robots: 'index, follow',
  alternates: { canonical: 'https://projex.live/privacy' },
}

const LAST_UPDATED = 'April 7, 2026'
const COMPANY = 'Projex'
const SITE = 'projex.live'
const CONTACT_EMAIL = 'privacy@projex.live'

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-[0.15em] uppercase text-white">
            Projex
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="text-sm text-zinc-400 hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link href="/login" className="px-4 py-1.5 bg-white text-black rounded-full text-sm font-medium hover:bg-zinc-200 transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 pt-28 pb-24">
        {/* Header */}
        <div className="mb-12">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Legal</p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-[-0.03em] mb-4">Privacy Policy</h1>
          <p className="text-zinc-500 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>

        {/* Intro */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-6 mb-10 text-sm text-zinc-300 leading-relaxed">
          At <strong className="text-white">{COMPANY}</strong>, your privacy matters. This Privacy Policy explains how we collect, use, disclose, and protect information about you when you use our platform at <strong className="text-white">{SITE}</strong>. By using {COMPANY}, you agree to the data practices described here.
        </div>

        <div className="space-y-10 text-sm text-zinc-300 leading-[1.85]">

          {/* 1 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Information We Collect</h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-zinc-200 font-semibold mb-2">1.1 Information You Provide</h3>
                <ul className="space-y-1.5 list-none">
                  {[
                    'Account information: name, email address, company name, phone number',
                    'Profile data: job title, profile photo, team member details',
                    'Payment information: billing address and payment method (processed securely by Stripe — we do not store card numbers)',
                    'Project data: estimates, invoices, documents, photos, notes, and other content you create or upload',
                    'Communications: messages sent through the platform, SMS content, and call logs',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2.5">
                      <span className="text-zinc-600 mt-1">—</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-zinc-200 font-semibold mb-2">1.2 Information Collected Automatically</h3>
                <ul className="space-y-1.5 list-none">
                  {[
                    'Log data: IP address, browser type, pages visited, access times',
                    'Device information: device type, operating system, unique device identifiers',
                    'Usage data: features used, actions taken, session duration',
                    'Cookies and similar tracking technologies (see Section 7)',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2.5">
                      <span className="text-zinc-600 mt-1">—</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-zinc-200 font-semibold mb-2">1.3 Information from Third Parties</h3>
                <p>
                  We may receive information from third-party services you connect to {COMPANY}, including Stripe (payment processing), Twilio (SMS and voice), Supabase (database infrastructure), and others as we expand our integration offerings.
                </p>
              </div>
            </div>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="mt-3 space-y-1.5 list-none">
              {[
                'Provide, operate, and improve the Service',
                'Process transactions and manage your subscription',
                'Send transactional communications (account verification, invoices, project updates)',
                'Deliver SMS and voice communications via Twilio on your behalf',
                'Provide customer support and respond to inquiries',
                'Detect and prevent fraud, abuse, and security incidents',
                'Analyze usage patterns to improve features and user experience',
                'Comply with legal obligations',
              ].map(item => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="text-zinc-600 mt-1">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4">
              We do <strong className="text-white">not</strong> sell your personal information to third parties. We do not use your data to train AI models without your explicit consent.
            </p>
          </section>

          {/* 3 — Twilio Critical */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. SMS & Voice Communications</h2>

            <div className="space-y-4">
              <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
                <h3 className="text-white font-semibold mb-2">3.1 How We Use Phone Numbers</h3>
                <p>
                  Phone numbers you provide are used to enable SMS and voice features within the platform. This includes sending project updates, client notifications, team alerts, and other business communications on your behalf. Phone numbers are not sold, rented, or shared with marketing third parties.
                </p>
              </div>

              <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
                <h3 className="text-white font-semibold mb-2">3.2 Twilio Data Processing</h3>
                <p>
                  SMS and voice services are powered by Twilio Inc. When you use these features, message content, phone numbers, and call metadata are processed by Twilio in accordance with their{' '}
                  <a href="https://www.twilio.com/en-us/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                    Privacy Policy
                  </a>.
                  {' '}{COMPANY} retains logs of SMS and call activity associated with your account for operational and compliance purposes.
                </p>
              </div>

              <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
                <h3 className="text-white font-semibold mb-2">3.3 Opt-Out</h3>
                <p>
                  Recipients of SMS messages can opt out at any time by replying <strong className="text-white">STOP</strong> to any message. We will honor all opt-out requests promptly. For assistance, reply <strong className="text-white">HELP</strong> or contact{' '}
                  <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-400 hover:underline">{CONTACT_EMAIL}</a>.
                </p>
              </div>

              <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
                <h3 className="text-white font-semibold mb-2">3.4 Message Frequency & Rates</h3>
                <p>
                  Message frequency varies based on your usage and the communications you configure. Standard message and data rates from your mobile carrier may apply. {COMPANY} does not charge separately for SMS delivery beyond your subscription plan.
                </p>
              </div>
            </div>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. Sharing of Information</h2>
            <p>We may share your information with:</p>

            <div className="mt-4 space-y-3">
              {[
                {
                  title: 'Service Providers',
                  desc: 'Third-party vendors who assist in operating our platform, including Supabase (database), Stripe (payments), Twilio (communications), Resend (email), and cloud infrastructure providers. These vendors are contractually bound to protect your data.',
                },
                {
                  title: 'Your Team Members',
                  desc: 'Within your organization, data is shared with the users you invite according to their assigned roles and permissions.',
                },
                {
                  title: 'Your Clients (via Client Portal)',
                  desc: 'Project information you choose to share through the client portal is visible to the clients you grant access to.',
                },
                {
                  title: 'Legal Requirements',
                  desc: 'We may disclose information if required by law, court order, or governmental authority, or to protect the rights, property, or safety of Projex, our users, or the public.',
                },
                {
                  title: 'Business Transfers',
                  desc: 'In the event of a merger, acquisition, or sale of assets, your data may be transferred as part of that transaction. We will notify you in advance of any such change.',
                },
              ].map(({ title, desc }) => (
                <div key={title} className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
                  <h3 className="text-zinc-200 font-semibold mb-1.5">{title}</h3>
                  <p>{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. Data Retention</h2>
            <p>
              We retain your data for as long as your account is active or as needed to provide the Service. When you delete your account, we will delete or anonymize your personal data within 90 days, except where we are required to retain it by law or for legitimate business purposes (such as resolving disputes or preventing fraud).
            </p>
            <p className="mt-3">
              SMS logs and call records are retained for up to 12 months for operational and compliance purposes, after which they are purged from our systems.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">6. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your data, including:
            </p>
            <ul className="mt-3 space-y-1.5 list-none">
              {[
                'Encryption of data in transit (TLS/SSL) and at rest',
                'Supabase Row Level Security (RLS) for database access control',
                'Role-based access controls within your organization',
                'Secure authentication via Supabase Auth with session management',
                'Regular security reviews and dependency updates',
              ].map(item => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="text-zinc-600 mt-1">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4">
              No method of transmission or storage is 100% secure. While we strive to protect your data, we cannot guarantee absolute security. If you believe your account has been compromised, contact us immediately at{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-400 hover:underline">{CONTACT_EMAIL}</a>.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">7. Cookies & Tracking</h2>
            <p>
              We use cookies and similar technologies to maintain sessions, remember preferences, and analyze usage. These include:
            </p>
            <ul className="mt-3 space-y-1.5 list-none">
              {[
                'Session cookies: required for authentication and platform functionality',
                'Preference cookies: to remember your settings and display preferences',
                'Analytics cookies: to understand how the platform is used (aggregated, non-personal)',
              ].map(item => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="text-zinc-600 mt-1">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4">
              You can control cookie settings through your browser. Disabling cookies may affect platform functionality.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">8. Your Rights & Choices</h2>
            <p>Depending on your jurisdiction, you may have the right to:</p>
            <ul className="mt-3 space-y-1.5 list-none">
              {[
                'Access and receive a copy of the personal data we hold about you',
                'Correct inaccurate or incomplete personal data',
                'Request deletion of your personal data (subject to legal retention requirements)',
                'Object to or restrict certain types of processing',
                'Data portability — receive your data in a machine-readable format',
                'Withdraw consent at any time where processing is based on consent',
              ].map(item => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="text-zinc-600 mt-1">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4">
              To exercise any of these rights, contact us at{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-400 hover:underline">{CONTACT_EMAIL}</a>.
              We will respond within 30 days.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">9. Children&apos;s Privacy</h2>
            <p>
              The Service is not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately and we will delete it.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy periodically. We will notify you of material changes by posting the new policy on this page with a revised &quot;Last Updated&quot; date and, where appropriate, by sending an email notification. Your continued use of the Service after changes take effect constitutes acceptance of the updated policy.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">11. Contact Us</h2>
            <p>
              If you have questions, concerns, or requests related to this Privacy Policy, please reach out:
            </p>
            <div className="mt-4 bg-[#18181b] border border-[#27272a] rounded-xl p-5 space-y-1">
              <p className="text-white font-medium">{COMPANY} — Privacy Team</p>
              <p>
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-400 hover:underline">
                  {CONTACT_EMAIL}
                </a>
              </p>
              <p>
                <a href={`https://${SITE}`} className="text-zinc-400 hover:text-white transition-colors">
                  {SITE}
                </a>
              </p>
            </div>
          </section>

        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/[0.04] px-6 py-10">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-600">© {new Date().getFullYear()} {COMPANY}. All rights reserved.</p>
          <div className="flex items-center gap-6 text-xs text-zinc-500">
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/docs" className="hover:text-white transition-colors">Documentation</Link>
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
          </div>
        </div>
      </div>
    </main>
  )
}
