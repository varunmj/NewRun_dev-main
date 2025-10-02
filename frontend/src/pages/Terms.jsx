import React from "react";
import { Link } from "react-router-dom";
import LegalLayout from "../components/LegalLayout";

export default function Terms() {
  // Pick a stable date (don’t surprise users by changing per locale)
  const lastUpdated = "October 1, 2025";

  const Section = ({ id, title, children }) => (
    <section id={id} className="scroll-mt-24">
      <h3 className="text-white text-xl font-semibold mt-8 mb-3">{title}</h3>
      <div className="text-white/85 text-sm leading-6 space-y-3">{children}</div>
    </section>
  );

  const sections = [
    ["acceptance", "1. Acceptance of Terms"],
    ["eligibility", "2. Eligibility & Accounts"],
    ["use", "3. Permitted Use & Community Rules"],
    ["content", "4. Your Content & IP"],
    ["listings", "5. Listings, Housing & Marketplace"],
    ["payments", "6. Payments, Fees & Taxes"],
    ["safety", "7. Safety, Prohibited Items & Reporting"],
    ["comm", "8. Messaging & Notifications"],
    ["thirdparty", "9. Third-Party Services"],
    ["termination", "10. Suspension & Termination"],
    ["warranty", "11. Disclaimers"],
    ["liability", "12. Limitation of Liability"],
    ["indemnity", "13. Indemnification"],
    ["law", "14. Governing Law & Disputes"],
    ["changes", "15. Changes to the Service & Terms"],
    ["consent", "16. Consent & Versioning"],
    ["misc", "17. Miscellaneous"],
    ["dmca", "18. Copyright/DMCA"],
    ["contact", "19. Contact"],
  ];

  return (
    <LegalLayout title="Terms of Service" sections={sections.map(([id,label])=>({id,label}))}>
          <p className="text-white/60 text-xs mb-6">Last updated: {lastUpdated}</p>

          {/* Intro */}
          <div className="text-white/85 text-sm leading-6 space-y-3 mb-6">
            <p>
              Welcome to NewRun — a student-focused platform for housing, marketplace, and community.
              By using NewRun, you agree to these Terms. If you don’t agree, do not use the service.
              Our <Link to="/privacy" className="text-sky-400 hover:underline">Privacy Policy</Link> explains how we handle your information.
            </p>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <ul className="list-disc list-inside space-y-1">
                <li>NewRun does <span className="text-white font-medium">not</span> sell your personal information.</li>
                <li>Transactions occur between users unless we explicitly say otherwise.</li>
                <li>We can remove content or suspend accounts that violate these Terms or our policies.</li>
              </ul>
            </div>
          </div>

          {/* TOC moved into sidebar via LegalLayout */}

          {/* Sections */}
          <Section id="acceptance" title="1. Acceptance of Terms">
            <p>
              These Terms form a binding agreement between you and NewRun. You accept them by creating an
              account, accessing, or using the service. Additional policies may apply to specific features
              (e.g., verification, payments). If there is a conflict, those feature-specific terms control.
            </p>
          </Section>

          <Section id="eligibility" title="2. Eligibility & Accounts">
            <ul className="list-disc list-inside space-y-2">
              <li>
                You must be at least 13 to use NewRun. If you are under the age of majority in your state or country,
                you must have a parent or guardian’s consent. Some features (e.g., payments, housing contracts)
                may require you to be 18+.
              </li>
              <li>
                You agree to provide accurate information and keep your account secure (no sharing passwords,
                enable security best practices). You’re responsible for activity on your account.
              </li>
              <li>
                University-affiliated features may require verification (e.g., .edu email or ID check).
              </li>
            </ul>
          </Section>

          <Section id="use" title="3. Permitted Use & Community Rules">
            <p>Use NewRun lawfully and respectfully. You agree not to:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Harass, spam, impersonate others, or engage in hate, threats, or discrimination.</li>
              <li>Post illegal, misleading, or infringing content; scrape or reverse-engineer the service.</li>
              <li>Interfere with security or operations; attempt to bypass access controls.</li>
              <li>Use NewRun to facilitate unlawful activity or campus policy violations.</li>
            </ul>
          </Section>

          <Section id="content" title="4. Your Content & Intellectual Property">
            <ul className="list-disc list-inside space-y-2">
              <li>
                <span className="text-white">Your rights.</span> You retain ownership of the content you post.
                You grant NewRun a worldwide, non-exclusive, royalty-free license to host, store, reproduce,
                adapt, publish, and display your content to operate, promote, and improve the service (including
                moderation, caching, and distribution).
              </li>
              <li>
                <span className="text-white">Our rights.</span> The NewRun name, logos, code, and design are
                protected by IP laws. You may not use our marks without permission.
              </li>
              <li>
                <span className="text-white">Feedback.</span> If you send suggestions, you grant us a license to
                use them without obligation or compensation.
              </li>
            </ul>
          </Section>

          <Section id="listings" title="5. Listings, Housing & Marketplace">
            <ul className="list-disc list-inside space-y-2">
              <li>Describe items/housing accurately, include required disclosures, and honor your offers.</li>
              <li>
                Housing and roommate posts must comply with applicable laws and campus rules, including
                anti-discrimination (e.g., fair housing) and local rental regulations. Do not request
                or offer unlawful deposits, fees, or terms.
              </li>
              <li>
                NewRun is typically not a party to user-to-user transactions; we provide tools to discover and
                communicate. You are responsible for evaluating listings, users, and terms of any transaction.
              </li>
              <li>
                Do not post stolen, counterfeit, unsafe, expired, recalled, or otherwise prohibited items.
              </li>
            </ul>
          </Section>

          <Section id="payments" title="6. Payments, Fees & Taxes">
            <ul className="list-disc list-inside space-y-2">
              <li>
                Payments and payouts may be processed by third-party processors (e.g., Stripe). Their terms and
                privacy policies govern those services.
              </li>
              <li>
                We may charge service fees disclosed at the point of use. You are responsible for any applicable taxes.
              </li>
              <li>
                Except as required by law, all fees are non-refundable unless stated otherwise.
              </li>
            </ul>
          </Section>

          <Section id="safety" title="7. Safety, Prohibited Items & Reporting">
            <ul className="list-disc list-inside space-y-2">
              <li>
                We use automated signals and human review to detect spam/fraud and may remove content or take
                action on accounts to protect the community.
              </li>
              <li>
                Prohibited items/activities include: weapons, drugs, alcohol, tobacco/vapes, hazardous materials,
                stolen or counterfeit goods, explicit content, financial instruments, and any illegal or regulated
                services without authorization.
              </li>
              <li>
                If you see something concerning, report it in-app or email{" "}
                <a className="text-sky-400 hover:underline" href="mailto:safety@newrun.club">safety@newrun.club</a>.
              </li>
            </ul>
          </Section>

          <Section id="comm" title="8. Messaging & Notifications">
            <ul className="list-disc list-inside space-y-2">
              <li>NewRun offers messaging to coordinate listings and community interactions. Keep messages lawful and respectful.</li>
              <li>We may send transactional communications (e.g., account, security, listing activity). You can manage marketing preferences in Settings or via unsubscribe links.</li>
            </ul>
          </Section>

          <Section id="thirdparty" title="9. Third-Party Services">
            <p>
              The service may link to or integrate third-party services (e.g., payments, identity verification,
              analytics). NewRun is not responsible for those services; their terms and privacy policies apply.
            </p>
          </Section>

          <Section id="termination" title="10. Suspension & Termination">
            <ul className="list-disc list-inside space-y-2">
              <li>We may suspend or terminate accounts, or remove content, for violations of these Terms or to protect users.</li>
              <li>You may stop using NewRun at any time. Certain sections survive termination (e.g., IP, disclaimers, liability, disputes).</li>
            </ul>
          </Section>

          <Section id="warranty" title="11. Disclaimers">
            <p>
              THE SERVICE IS PROVIDED “AS IS” AND “AS AVAILABLE” WITHOUT WARRANTIES OF ANY KIND,
              EXPRESS OR IMPLIED (INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT).
              We do not guarantee accuracy of listings, availability, or that users will complete transactions.
            </p>
          </Section>

          <Section id="liability" title="12. Limitation of Liability">
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, NEWRUN AND ITS AFFILIATES WILL NOT BE LIABLE FOR INDIRECT,
              INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS,
              DATA, USE, OR GOODWILL, ARISING FROM OR RELATED TO YOUR USE OF THE SERVICE. Our aggregate liability
              will not exceed the greater of (a) amounts you paid to us for the service in the 12 months before
              the claim or (b) $100.
            </p>
          </Section>

          <Section id="indemnity" title="13. Indemnification">
            <p>
              You agree to defend, indemnify, and hold NewRun harmless from claims, losses, liabilities, damages,
              and expenses (including reasonable attorneys’ fees) arising from your content, your use of the service,
              or your violation of these Terms or applicable law.
            </p>
          </Section>

          <Section id="law" title="14. Governing Law & Disputes">
            <p>
              These Terms are governed by the laws of the State of Delaware, USA, without regard to its conflict of
              laws principles (update this to your company’s jurisdiction if different). You agree to the exclusive
              jurisdiction and venue of the state and federal courts located in Delaware for any action not subject
              to arbitration (if arbitration is later added).
            </p>
            <p className="text-white/60 text-xs">
              If your region mandates consumer dispute mechanisms, those rights are preserved to the extent required by law.
            </p>
          </Section>

          <Section id="changes" title="15. Changes to the Service & Terms">
            <p>
              We may update the service and these Terms from time to time. We’ll post changes here and, when appropriate,
              notify you in-app or by email. If you continue using NewRun after changes take effect, you accept the updated Terms.
            </p>
          </Section>

          <Section id="consent" title="16. Consent & Versioning">
            <p>
              When you create an account, we record your acceptance of these Terms (version and timestamp). You can view
              the current version anytime on this page. If we materially change these Terms, we’ll notify you and may
              request re‑acceptance in the app.
            </p>
          </Section>

          <Section id="misc" title="17. Miscellaneous">
            <ul className="list-disc list-inside space-y-2">
              <li><span className="text-white">Entire agreement.</span> These Terms + policies referenced herein are the entire agreement between you and NewRun.</li>
              <li><span className="text-white">Severability.</span> If any provision is unenforceable, the rest remain in effect.</li>
              <li><span className="text-white">No waiver.</span> Our failure to enforce a provision isn’t a waiver.</li>
              <li><span className="text-white">Assignment.</span> You may not assign these Terms without our consent; we may assign as part of a merger, acquisition, or asset sale.</li>
              <li><span className="text-white">App stores.</span> If you downloaded our app from an app store, their terms may apply in addition to these Terms.</li>
            </ul>
          </Section>

          <Section id="dmca" title="18. Copyright/DMCA">
            <p>
              If you believe content infringes your copyright, send a notice to{" "}
              <a href="mailto:legal@newrun.club" className="text-sky-400 hover:underline">legal@newrun.club</a>{" "}
              with: (1) your contact info, (2) a description of the work and the allegedly infringing material,
              (3) the URL or sufficient detail to locate it, (4) a statement of good-faith belief, and (5) a statement
              under penalty of perjury that you are the owner or authorized to act, plus your physical or electronic signature.
              We may remove content and, in appropriate cases, terminate repeat infringers.
            </p>
          </Section>

          <Section id="contact" title="19. Contact">
            <p>
              Questions about these Terms? Contact{" "}
              <a href="mailto:support@newrun.club" className="text-sky-400 hover:underline">support@newrun.club</a>.
            </p>
            <p className="text-xs text-white/50">
              This page provides general information and does not constitute legal advice. Please consult counsel
              for requirements applicable to your organization and jurisdiction.
            </p>
          </Section>
    </LegalLayout>
  );
}
