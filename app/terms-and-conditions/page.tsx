import { CONTACT_EMAIL_ID } from "@/lib/data"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Terms and Conditions",
  robots: {
    index: false,
    follow: true,
  },
}

const acceptanceItems = [
  "By using Xenith, you agree to these Terms.",
  "If you use Xenith for a business, team, or another person or entity, you confirm that you have authority to bind that entity to these Terms.",
  "If you do not agree to these Terms, you must not use Xenith.",
]

const aboutItems = [
  "Xenith provides AI-assisted tools for generating X posts, suggested replies, engagement insights, scheduling and publishing workflows, and related creator workflow features.",
  "Xenith may change, suspend, improve, or discontinue features over time.",
  "Xenith does not guarantee growth, impressions, revenue, engagement, followers, or any other platform outcome.",
]

const eligibilityItems = [
  "You must be allowed to use the X account you connect to Xenith.",
  "You must comply with X's own terms, rules, developer policies, and account requirements.",
  "You are responsible for keeping your login credentials secure.",
  "You are responsible for all activity under your Xenith account.",
  "Xenith may suspend or terminate accounts that violate these Terms, misuse the service, create risk, or violate third-party platform rules.",
]

const xConnectionItems = [
  "Xenith can connect to X only when you authorize it.",
  "Depending on the permissions you grant, Xenith may read authorized or public X data and publish or schedule posts when you choose those actions.",
  "You remain responsible for content posted to X through Xenith.",
  "You must comply with X Terms, X Rules, X Developer Policy, automation limits, anti-spam rules, and applicable law.",
  "X may change, limit, suspend, or revoke API access, which can affect Xenith features.",
  "Xenith is not responsible for X outages, API limits, enforcement decisions, account restrictions, or policy changes.",
]

const contentItems = [
  "User Content means information, preferences, prompts, drafts, edits, posts, replies, feature requests, account settings, and other content you submit or create in Xenith.",
  "Generated Content means AI-generated or AI-assisted drafts, replies, suggestions, scores, insights, or other outputs from Xenith.",
  "You keep ownership of your User Content.",
  "Subject to these Terms and the Privacy Policy, you grant Xenith a limited license to process User Content to operate, improve, secure, and support the service.",
  "You are responsible for reviewing Generated Content before using or publishing it.",
  "Generated Content may be inaccurate, incomplete, repetitive, offensive, unsuitable, or similar to content generated for others.",
  "Xenith does not guarantee originality, legal compliance, non-infringement, factual accuracy, or suitability of Generated Content.",
  "You are responsible for deciding whether you have the rights to publish or use any content.",
]

const publishingItems = [
  "If you schedule or publish content through Xenith, you authorize Xenith to send that content to X using your connected account.",
  "You are responsible for timing, wording, claims, hashtags, compliance, and consequences of published content.",
  "Xenith may fail to publish because of API limits, expired tokens, X restrictions, outages, permission changes, rate limits, or technical errors.",
  "You should verify important posts directly on X.",
  "Xenith may provide controls to cancel schedules, disconnect X, or edit drafts, but cannot guarantee every action can be reversed after content is sent to X.",
]

const acceptableUseItems = [
  "Do not violate laws, regulations, or third-party rights.",
  "Do not use Xenith for spam, manipulation, platform abuse, fake engagement, harassment, deception, impersonation, scams, malware, phishing, or harmful content.",
  "Do not attempt to bypass rate limits, security controls, usage limits, subscription limits, or access restrictions.",
  "Do not scrape, reverse engineer, probe, attack, or disrupt Xenith.",
  "Do not upload or enter confidential, sensitive, regulated, or illegal data unless you have authority and it is necessary for your use of the service.",
  "Do not use Xenith to violate X's rules or policies.",
  "Do not resell, sublicense, or provide Xenith access to others without permission.",
]

const billingItems = [
  "Xenith offers a Creator plan with monthly and yearly billing options.",
  "Current displayed pricing is $24 per month for monthly billing and $20 per month billed annually for yearly billing.",
  "The Creator plan currently includes 10 post drafts per day, 1,000 reply credits, post scheduling, tracking and analysis across up to 10 X profiles, and X algorithm-based analytics.",
  "Xenith may change plan features, pricing, limits, credit rules, and billing intervals prospectively.",
  "Checkout, payment methods, invoices, taxes, and payment processing are handled by Dodo Payments.",
  "Dodo Payments' buyer terms may apply to transactions.",
  "Starting a subscription authorizes applicable recurring charges unless you cancel.",
  "Any legacy trial access previously granted by Xenith may remain subject to its original trial length, eligibility, and limits.",
  "You can cancel anytime from settings where cancellation is available.",
  "Cancellation schedules the subscription to end at the close of the current billing period or any applicable legacy trial access period.",
  "Access generally remains active until the end of the current paid period or applicable legacy trial access period, unless your account is terminated for violation of these Terms.",
  "Refund requests are reviewed case by case through support, with no guaranteed refund except where required by law or where Dodo Payments separately determines a refund is required or appropriate.",
  "Failed, disputed, reversed, or overdue payments may cause access to be paused, downgraded, or terminated.",
]

const intellectualPropertyItems = [
  "Xenith, the Xenith brand, software, design, interfaces, logos, workflows, and underlying technology are owned by Xenith or its licensors.",
  "You receive a limited, revocable, non-exclusive, non-transferable right to use Xenith in accordance with these Terms.",
  "You may not copy, modify, distribute, sell, lease, reverse engineer, or create competing services from Xenith except as permitted by law.",
  "Feedback may be used by Xenith without obligation or compensation.",
]

const thirdPartyItems = [
  "Xenith depends on third-party services, including X, Supabase, Dodo Payments, Resend, AI providers, search providers, analytics providers, and hosting or infrastructure providers.",
  "Third-party services are governed by their own terms and policies.",
  "Xenith is not responsible for third-party services, policies, outages, errors, data practices, or billing systems.",
]

const availabilityItems = [
  "Xenith is provided as an evolving service.",
  "Features may be unavailable, delayed, rate-limited, interrupted, modified, or discontinued.",
  "Xenith may perform maintenance, respond to abuse, adjust limits, or change workflows.",
  "Xenith does not guarantee uninterrupted, error-free, or permanent availability.",
]

const disclaimerItems = [
  "Xenith is provided as is and as available.",
  "To the maximum extent allowed by law, Xenith disclaims warranties of merchantability, fitness for a particular purpose, non-infringement, accuracy, availability, and reliability.",
  "Xenith does not provide legal, financial, professional, marketing, compliance, or platform-policy advice.",
  "You should independently review content, claims, and compliance before publishing.",
]

const liabilityItems = [
  "To the maximum extent allowed by law, Xenith is not liable for indirect, incidental, special, consequential, exemplary, or punitive damages.",
  "Xenith is not liable for lost profits, lost revenue, lost goodwill, lost data, business interruption, X account penalties, content takedowns, reduced reach, or missed posting opportunities.",
  "Where permitted by law, Xenith's total liability for any claim is limited to the amount you paid Xenith for the service in the 3 months before the claim, or the INR equivalent of USD $100 if you paid nothing.",
  "Nothing in these Terms limits rights or remedies that cannot legally be waived.",
]

const indemnityItems = [
  "Your User Content.",
  "Generated Content that you publish or use.",
  "Your use or misuse of Xenith.",
  "Your violation of these Terms.",
  "Your violation of law.",
  "Your violation of X or third-party rules.",
  "Infringement or rights violations caused by your activity.",
]

const terminationItems = [
  "You may stop using Xenith at any time.",
  "You may disconnect X where supported.",
  "Xenith may suspend or terminate access for Terms violations, non-payment, security risk, fraud risk, platform-policy risk, legal requirements, or harm to Xenith or others.",
  "Termination may disable access to the dashboard, generated content, scheduled posts, credits, and connected integrations.",
  "Sections covering ownership, payment obligations, disclaimers, limitation of liability, indemnity, governing law, and contact provisions survive termination.",
]

const changesItems = [
  "Xenith may update these Terms from time to time.",
  "Material updates may be communicated by website notice, email, or in-app notice.",
  "Continued use after updates means you accept the updated Terms.",
  "If you do not agree, you must stop using Xenith and cancel any active subscription.",
]

function TermsList({ items }: { items: string[] }) {
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

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="text-blue-600 underline">
      {children}
    </a>
  )
}

export default function Page() {
  return (
    <main className="p-12 max-sm:p-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="p-12 max-sm:p-6 bg-gradient-to-b from-primary/20 from-20% to-muted rounded-lg border-2 border-primary space-y-2">
          <h1 className="text-4xl max-sm:text-2xl font-semibold">
            Terms and Conditions
          </h1>
          <p className="max-sm:text-sm">
            These Terms and Conditions govern your access to and use of Xenith,
            an AI growth engine for X that helps users generate posts, suggested
            replies, engagement insights, and publishing workflows. By creating
            an account, connecting X, subscribing, or using
            Xenith, you agree to these Terms.
          </p>
        </div>

        <p className="text-sm mb-6">Last Updated: 04-07-2026</p>

        <section className="mb-6">
          <h2 className="text-xl font-bold mb-2">Acceptance of Terms</h2>
          <TermsList items={acceptanceItems} />
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-bold mb-2">About Xenith</h2>
          <TermsList items={aboutItems} />
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-bold mb-2">
            Eligibility and Account Responsibility
          </h2>
          <TermsList items={eligibilityItems} />
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-bold mb-2">
            X Connection and Third-Party Platform Terms
          </h2>
          <TermsList items={xConnectionItems} />
          <p className="mt-3 max-sm:text-sm">
            You should review the{" "}
            <ExternalLink href="https://help.x.com/en/rules-and-policies/x-rules">
              X Rules
            </ExternalLink>{" "}
            and{" "}
            <ExternalLink href="https://docs.x.com/developer-terms/policy">
              X Developer Policy
            </ExternalLink>
            .
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-bold mb-2">
            User Content and Generated Content
          </h2>
          <TermsList items={contentItems} />
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-bold mb-2">
            Publishing, Scheduling, and Automation
          </h2>
          <TermsList items={publishingItems} />
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-bold mb-2">Acceptable Use</h2>
          <TermsList items={acceptableUseItems} />
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-bold mb-2">
            Subscriptions, Trials, Billing, and Credits
          </h2>
          <TermsList items={billingItems} />
          <p className="mt-3 max-sm:text-sm">
            You should also review the{" "}
            <ExternalLink href="https://dodopayments.com/legal/buyer-terms">
              Dodo Payments Buyer Terms
            </ExternalLink>
            .
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-bold mb-2">Intellectual Property</h2>
          <TermsList items={intellectualPropertyItems} />
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-bold mb-2">Privacy</h2>
          <p className="max-sm:text-sm">
            Xenith&apos;s{" "}
            <Link href="/privacy-policy" className="text-blue-600 underline">
              Privacy Policy
            </Link>{" "}
            explains how personal information is collected, used, shared, and
            retained. By using Xenith, you acknowledge the Privacy Policy.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-bold mb-2">Third-Party Services</h2>
          <TermsList items={thirdPartyItems} />
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-bold mb-2">
            Service Availability and Changes
          </h2>
          <TermsList items={availabilityItems} />
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-bold mb-2">Disclaimers</h2>
          <TermsList items={disclaimerItems} />
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-bold mb-2">Limitation of Liability</h2>
          <TermsList items={liabilityItems} />
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-bold mb-2">Indemnity</h2>
          <p className="mb-3 max-sm:text-sm">
            You agree to defend, indemnify, and hold Xenith harmless from claims
            arising from:
          </p>
          <TermsList items={indemnityItems} />
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-bold mb-2">
            Suspension and Termination
          </h2>
          <TermsList items={terminationItems} />
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-bold mb-2">
            Changes to These Terms
          </h2>
          <TermsList items={changesItems} />
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-bold mb-2">Governing Law</h2>
          <p className="max-sm:text-sm">
            These Terms are governed by the laws of India, without regard to
            conflict-of-law rules. Courts located in India will have
            jurisdiction, except where applicable law requires otherwise.
            Nothing in these Terms limits rights that cannot legally be waived.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2">Contact</h2>
          <p className="max-sm:text-sm">
            Questions about these Terms, billing concerns, refund requests, or
            account issues should be sent to <ContactLink />.
          </p>
        </section>
      </div>
    </main>
  )
}
