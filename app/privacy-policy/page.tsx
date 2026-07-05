import { CONTACT_EMAIL_ID } from "@/lib/data"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy",
  robots: {
    index: false,
    follow: true,
  },
}

const collectedItems = [
  "Account information, including your name, email address, and authentication profile.",
  "X account connection data, including your X user ID, username, display name, avatar, OAuth scopes, and encrypted access and refresh tokens.",
  "User preferences, including niches, inspiration accounts, posting and reply settings, delivery time, and timezone.",
  "Generated content and workflow data, including generated posts, drafts, hashtags, scheduled or published status, generated replies, edits, feature requests, and blocked accounts.",
  "Public X data used for recommendations, including public posts, liked-post signals, source post metadata, public metrics, and profile images.",
  "Billing and subscription data, including Dodo customer and subscription identifiers, plan, status, billing dates, and any legacy trial data. Payment details are handled by Dodo Payments.",
  "Support and communication data, including messages you send us and transactional email records.",
  "Usage, device, log, and analytics data, including IP address, browser or device information, pages and features used, analytics events, and rate-limit or security logs.",
]

const collectionMethods = [
  "Directly from you during signup, onboarding, settings, support requests, billing flows, and feature requests.",
  "Automatically when you use Xenith through cookies, local storage, logs, analytics, and security or rate-limit systems.",
  "From connected services and providers such as X, Supabase authentication, Dodo Payments, analytics providers, and AI or search providers.",
]

const usageItems = [
  "Provide, maintain, and secure your account.",
  "Connect to X and publish or schedule content where you authorize us to do so.",
  "Generate posts, suggested replies, profile and style insights, engagement scores, and niche suggestions.",
  "Operate billing, subscriptions, credits, legacy trial records, and transactional emails.",
  "Provide support and respond to your requests.",
  "Improve product quality, understand feature usage, and troubleshoot issues.",
  "Prevent abuse, fraud, unauthorized access, and misuse of the service.",
  "Comply with legal obligations and enforce our rights.",
]

const thirdParties = [
  "Supabase for authentication and session handling.",
  "PostgreSQL, Supabase-hosted database services, or other database hosting used to store app data.",
  "The X API for account connection, reading authorized or public X data, and posting when you authorize it.",
  "Dodo Payments for checkout, customer and subscription records, and payment processing.",
  "Resend for transactional email.",
  "OpenAI, Google Gemini, xAI, Perplexity, and Tavily where configured for AI and search workflows.",
  "Umami, Google Analytics, and Vercel Analytics for analytics.",
  "Hosting and infrastructure providers needed to operate Xenith.",
  "Legal authorities or other parties when required by law or needed to protect rights, safety, and security.",
]

const rights = [
  "Request access to a copy of the personal data we hold about you.",
  "Request correction of inaccurate or incomplete personal data.",
  "Request deletion of your personal data, subject to legal and operational limits.",
  "Object to or restrict certain processing where applicable law gives you that right.",
  "Request portability of your personal data where applicable.",
  "Opt out of marketing emails by using the unsubscribe option or contacting us.",
  "Disconnect X access from your account settings or through X where supported.",
  "Manage cookies through your browser controls.",
]

function PolicyList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc list-inside space-y-1 max-sm:text-sm">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )
}

function ContactLink() {
  return (
    <a href={`mailto:${CONTACT_EMAIL_ID}`} className="text-blue-600 underline">
      {CONTACT_EMAIL_ID}
    </a>
  )
}

export default function Page() {
  return (
    <main className="p-12 max-sm:p-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="p-12 max-sm:p-6 bg-gradient-to-b from-primary/20 from-20% to-muted rounded-lg border-2 border-primary space-y-2">
          <h1 className="text-4xl max-sm:text-2xl font-semibold">
            Privacy Policy
          </h1>
          <p className="max-sm:text-sm">
            Xenith respects your privacy and is committed to protecting your
            personal information. This Privacy Policy explains how Xenith, an AI
            growth engine for X, collects and uses data to help users generate
            posts, suggested replies, engagement insights, and publishing
            workflows.
          </p>
        </div>

        <p className="text-sm mb-6">Last Updated: 04-07-2026</p>

        <section className="mb-6">
          <h2 className="text-xl font-bold mb-2">What We Collect</h2>
          <PolicyList items={collectedItems} />
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-bold mb-2">
            How We Collect Information
          </h2>
          <PolicyList items={collectionMethods} />
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-bold mb-2">How We Use Information</h2>
          <PolicyList items={usageItems} />
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-bold mb-2">AI Processing</h2>
          <div className="space-y-3 max-sm:text-sm">
            <p>
              Xenith uses AI to generate posts, replies, scoring, profile
              analysis, and suggestions. To provide those features, your
              preferences, public X content, drafts, and related context may be
              processed by AI providers.
            </p>
            <p>
              Please do not submit confidential or sensitive personal data
              unless it is necessary for your use of the service. AI outputs may
              be inaccurate, incomplete, or unsuitable for your goals, so you
              should review generated content before publishing it.
            </p>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-bold mb-2">Cookies and Tracking</h2>
          <p className="max-sm:text-sm">
            We use cookies, local storage, and similar technologies for
            authentication, password recovery, sidebar preferences, UI notices,
            cached app state, analytics, security, and service operation. Xenith
            may use Supabase/auth cookies, a password recovery cookie, a sidebar
            preference cookie, Umami analytics, Google Analytics when configured,
            and Vercel Analytics. You can control cookies through your browser
            settings, but disabling essential cookies may prevent parts of the
            app from working.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-bold mb-2">
            Sharing and Third Parties
          </h2>
          <p className="mb-3 max-sm:text-sm">
            We do not sell your personal information. We may share information
            with service providers and third parties that help us operate Xenith,
            including:
          </p>
          <PolicyList items={thirdParties} />
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-bold mb-2">
            Data Storage and Protection
          </h2>
          <ul className="list-disc list-inside space-y-1 max-sm:text-sm">
            <li>
              X OAuth tokens are encrypted before storage according to Xenith&apos;s
              backend implementation.
            </li>
            <li>
              We use HTTPS/TLS, security headers, rate limiting, access
              controls, and production HSTS to help protect the service.
            </li>
            <li>
              No internet service, storage system, or security process can be
              guaranteed to be completely secure.
            </li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-bold mb-2">Data Retention</h2>
          <ul className="list-disc list-inside space-y-1 max-sm:text-sm">
            <li>
              We retain account, preference, X connection, generated content,
              billing, and workflow data while your account is active.
            </li>
            <li>
              On request or account deletion, we will delete or anonymize
              personal data unless retention is required for legal, billing,
              tax, dispute, fraud-prevention, backup, or security purposes.
            </li>
            <li>
              Billing, webhook, and transaction records may be retained as
              legally required.
            </li>
            <li>
              Some backup copies may persist briefly before routine deletion.
            </li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-bold mb-2">
            International Processing
          </h2>
          <p className="max-sm:text-sm">
            Xenith is operated with a US-first privacy approach, and your data
            may be processed in the United States and other countries where
            Xenith or its providers operate. If you access Xenith from outside
            the United States, your local data protection rules may differ from
            the rules in places where your data is processed.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-bold mb-2">Your Rights</h2>
          <PolicyList items={rights} />
          <p className="mt-3 max-sm:text-sm">
            To exercise privacy rights or ask questions about your data, contact
            us at <ContactLink />.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-bold mb-2">Children&apos;s Privacy</h2>
          <p className="max-sm:text-sm">
            Xenith is not intended for children under 13. If we learn that we
            collected personal data from a child under 13, we will delete it.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-bold mb-2">Third-Party Links</h2>
          <p className="max-sm:text-sm">
            Xenith may link to X, payment pages, or other external websites and
            services. Those services have their own privacy policies and data
            practices, and this Privacy Policy does not control them.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-bold mb-2">Changes to This Policy</h2>
          <p className="max-sm:text-sm">
            We may update this Privacy Policy from time to time. If we make
            material changes, we may notify you by posting an update on the
            website, sending an email, or showing an in-app notice. Continued
            use of Xenith after changes means the updated policy applies.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2">Contact</h2>
          <p className="max-sm:text-sm">
            For privacy questions, requests, or concerns, contact Xenith at{" "}
            <ContactLink />.
          </p>
        </section>
      </div>
    </main>
  )
}
