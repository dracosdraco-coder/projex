import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service — Projex',
  description: 'Terms of Service for Projex. Read our terms before using the platform.',
  robots: 'index, follow',
  alternates: { canonical: 'https://projex.live/terms' },
}

const LAST_UPDATED = 'April 7, 2026'
const COMPANY = 'Projex'
const SITE = 'projex.live'
const CONTACT_EMAIL = 'legal@projex.live'

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-[0.15em] uppercase text-white">
            Projex
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-sm text-zinc-400 hover:text-white transition-colors">
              Privacy Policy
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
          <h1 className="text-4xl md:text-5xl font-bold tracking-[-0.03em] mb-4">Terms of Service</h1>
          <p className="text-zinc-500 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>

        {/* Intro */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-6 mb-10 text-sm text-zinc-300 leading-relaxed">
          By accessing or using <strong className="text-white">{SITE}</strong> or any {COMPANY} service (including SMS, voice, and in-app communications), you agree to be bound by these Terms of Service. If you do not agree, do not use our services.
        </div>

        <div className="space-y-10 text-sm text-zinc-300 leading-[1.85]">

          {/* 1 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
            <p>
              These Terms of Service (&quot;Terms&quot;) constitute a legally binding agreement between you (&quot;User,&quot; &quot;you,&quot; or &quot;your&quot;) and {COMPANY} (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) governing your access to and use of the {SITE} platform, APIs, mobile applications, and all related services (collectively, the &quot;Service&quot;).
            </p>
            <p className="mt-3">
              By creating an account, clicking &quot;I Agree,&quot; or otherwise using the Service, you confirm that you are at least 18 years of age, have the legal authority to enter into this agreement, and accept these Terms in full.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. Description of Service</h2>
            <p>
              {COMPANY} is a B2B SaaS platform designed for construction contractors and service businesses. The Service includes, but is not limited to:
            </p>
            <ul className="mt-3 space-y-1.5 list-none">
              {[
                'Project and task management tools',
                'Estimating, invoicing, and budgeting features',
                'Client portal and communication hub',
                'Team management and role-based access controls',
                'SMS and voice communication via Twilio-powered VoIP',
                'Document generation, photo reporting, and drawing tools',
                'Stripe-based subscription billing and payment processing',
                'Third-party integrations and API access',
              ].map(item => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="text-zinc-600 mt-1">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. Account Registration</h2>
            <p>
              To access the Service, you must register for an account. You agree to provide accurate, current, and complete information and to keep your account credentials confidential. You are solely responsible for all activity that occurs under your account.
            </p>
            <p className="mt-3">
              You may not share your account with others, create accounts for the purpose of abuse or circumventing restrictions, or use another user&apos;s account without permission. We reserve the right to suspend or terminate accounts that violate these Terms.
            </p>
          </section>

          {/* 4 — SMS/Voice — Critical for Twilio */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. SMS & Voice Communication Services</h2>
            <p className="text-zinc-200 font-medium mb-3">
              {COMPANY} uses Twilio, Inc. to provide SMS messaging and voice calling features within the platform. By using these features, you agree to the following:
            </p>

            <div className="space-y-4">
              <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
                <h3 className="text-white font-semibold mb-2">4.1 Consent to Receive Communications</h3>
                <p>
                  By providing a phone number and using our SMS or voice features, you consent to receive transactional and operational messages from {COMPANY}. These may include project updates, appointment reminders, invoice notifications, and team communications. Standard message and data rates may apply.
                </p>
              </div>

              <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
                <h3 className="text-white font-semibold mb-2">4.2 Permitted Use of Messaging</h3>
                <p>
                  You may only use our SMS and voice features to communicate with individuals who have explicitly consented to receive communications from you. You are solely responsible for obtaining all required consents from your recipients. You may not use our messaging features to send spam, unsolicited marketing messages, or any content that violates applicable law.
                </p>
              </div>

              <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
                <h3 className="text-white font-semibold mb-2">4.3 Opt-Out</h3>
                <p>
                  Recipients may opt out of SMS communications at any time by replying <strong className="text-white">STOP</strong> to any message. Upon receipt of a STOP request, we will cease sending messages to that number. Recipients may reply <strong className="text-white">HELP</strong> for assistance or contact us at <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-400 hover:underline">{CONTACT_EMAIL}</a>.
                </p>
              </div>

              <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
                <h3 className="text-white font-semibold mb-2">4.4 Prohibited Content</h3>
                <p>
                  You may not use our messaging services to transmit content that is: illegal, abusive, harassing, threatening, fraudulent, deceptive, defamatory, obscene, or that violates any third-party rights. We reserve the right to suspend messaging access for any user who violates this policy.
                </p>
              </div>

              <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
                <h3 className="text-white font-semibold mb-2">4.5 Twilio Terms</h3>
                <p>
                  SMS and voice services are provided in part by Twilio Inc. Your use of these features is also subject to Twilio&apos;s{' '}
                  <a href="https://www.twilio.com/en-us/legal/tos" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="https://www.twilio.com/en-us/legal/aup" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                    Acceptable Use Policy
                  </a>.
                </p>
              </div>
            </div>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. Subscription & Billing</h2>
            <p>
              Access to certain features requires a paid subscription. All billing is processed securely through Stripe. By subscribing, you authorize us to charge your payment method on a recurring basis according to your selected plan.
            </p>
            <p className="mt-3">
              Subscription fees are non-refundable except as required by law or at our sole discretion. You may cancel your subscription at any time; cancellation takes effect at the end of the current billing period. We reserve the right to change pricing with 30 days&apos; advance notice.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">6. Acceptable Use</h2>
            <p>You agree not to use the Service to:</p>
            <ul className="mt-3 space-y-1.5 list-none">
              {[
                'Violate any applicable local, state, federal, or international law or regulation',
                'Transmit spam, unsolicited messages, or bulk communications without consent',
                'Infringe upon the intellectual property or privacy rights of any third party',
                'Upload or distribute malware, viruses, or any malicious code',
                'Attempt to gain unauthorized access to our systems or other user accounts',
                'Reverse engineer, decompile, or disassemble any portion of the Service',
                'Use the Service for any purpose that could harm {COMPANY} or its users',
              ].map(item => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="text-zinc-600 mt-1">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">7. Intellectual Property</h2>
            <p>
              All content, features, and functionality of the Service — including but not limited to software, design, logos, trademarks, and documentation — are owned by {COMPANY} and protected by applicable intellectual property laws.
            </p>
            <p className="mt-3">
              You retain ownership of all data and content you submit to the platform. By uploading content, you grant {COMPANY} a limited, non-exclusive license to use, store, and display your content solely as necessary to provide the Service.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">8. Privacy</h2>
            <p>
              Your use of the Service is subject to our{' '}
              <Link href="/privacy" className="text-blue-400 hover:underline">
                Privacy Policy
              </Link>
              , which is incorporated into these Terms by reference. By using the Service, you consent to the data practices described in our Privacy Policy.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">9. Disclaimer of Warranties</h2>
            <p>
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR FREE OF VIRUSES. YOUR USE OF THE SERVICE IS AT YOUR SOLE RISK.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">10. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, {COMPANY.toUpperCase()} SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR GOODWILL, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SERVICE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
            </p>
            <p className="mt-3">
              IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU EXCEED THE AMOUNT YOU PAID TO US IN THE 12 MONTHS PRECEDING THE CLAIM.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">11. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless {COMPANY} and its officers, directors, employees, and agents from any claims, liabilities, damages, losses, and expenses (including reasonable attorneys&apos; fees) arising out of or relating to your use of the Service, your violation of these Terms, or your violation of any applicable law or third-party rights.
            </p>
          </section>

          {/* 12 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">12. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your access to the Service at any time, with or without cause, and with or without notice, including for violations of these Terms. Upon termination, your right to use the Service will immediately cease.
            </p>
          </section>

          {/* 13 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">13. Governing Law & Dispute Resolution</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the State of Florida, without regard to its conflict of law provisions. Any disputes arising under these Terms shall be resolved through binding arbitration in Miami-Dade County, Florida, except that either party may seek injunctive or equitable relief in a court of competent jurisdiction.
            </p>
          </section>

          {/* 14 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">14. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. We will notify you of material changes by email or by posting a notice within the platform. Continued use of the Service after changes take effect constitutes your acceptance of the revised Terms.
            </p>
          </section>

          {/* 15 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">15. Contact Us</h2>
            <p>If you have questions about these Terms, please contact us:</p>
            <div className="mt-4 bg-[#18181b] border border-[#27272a] rounded-xl p-5 space-y-1">
              <p className="text-white font-medium">{COMPANY}</p>
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
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/docs" className="hover:text-white transition-colors">Documentation</Link>
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
          </div>
        </div>
      </div>
    </main>
  )
}
