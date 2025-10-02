import React from "react";
import { Link } from "react-router-dom";
import LegalLayout from "../components/LegalLayout";

export default function Privacy() {
  const lastUpdated = "October 1, 2025";

  const Section = ({ id, title, children }) => (
    <section id={id} className="scroll-mt-24">
      <h3 className="text-white text-xl font-semibold mt-8 mb-3">{title}</h3>
      <div className="text-white/85 text-sm leading-6 space-y-3">
        {children}
      </div>
    </section>
  );

  const sections = [
    ["what-we-collect","Information we collect"],
    ["how-we-use","How we use information"],
    ["sharing","How we share"],
    ["legal-bases","Legal bases"],
    ["retention","Retention"],
    ["your-choices","Your choices"],
    ["safety","Safety"],
    ["cookies","Cookies"],
    ["ai","AI"],
    ["children","Children"],
    ["security","Security"],
    ["intl","International transfers"],
    ["changes","Changes"],
    ["contact","Contact"]
  ];

  return (
    <LegalLayout title="Privacy Policy" sections={sections.map(([id,label])=>({id,label}))}>
          <p className="text-white/60 text-xs mb-6">Last updated: {lastUpdated}</p>

          {/* Intro / Promise */}
          <div className="text-white/85 text-sm leading-6 space-y-3 mb-6">
            <p>
              We built NewRun to help students find housing, essentials, and community
              within their university networks. Privacy and safety are core to that mission.
              This policy explains what we collect, why we collect it, how we use and share it,
              and the choices you have.
            </p>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <ul className="list-disc list-inside space-y-1">
                <li>We do <span className="text-white font-medium">not</span> sell your personal information.</li>
                <li>You control your profile visibility and communications.</li>
                <li>We use industry-standard security to protect your data.</li>
                <li>You can request access, export, correction, or deletion at any time.</li>
              </ul>
            </div>
          </div>

          {/* TOC moved to LegalLayout sidebar */}

          {/* Sections */}
          <Section id="what-we-collect" title="Information we collect">
            <p>We collect the minimum necessary to provide NewRun’s services:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <span className="text-white">Account & profile.</span> Name, username, email and/or mobile
                number, password (hashed), university affiliation, class year, profile photo, and preferences
                you add (e.g., housing filters, notification settings).
              </li>
              <li>
                <span className="text-white">Usage & activity.</span> Listings you create, messages you send,
                likes/saves, searches, reports, and interactions with features (e.g., onboarding flows).
              </li>
              <li>
                <span className="text-white">Transactional.</span> If you buy or sell through NewRun, payment
                and payout processing is handled by a third-party processor (e.g., Stripe). We receive limited
                transaction metadata (status, last4, timestamps) but not full card or bank details.
              </li>
              <li>
                <span className="text-white">Device & technical.</span> IP address, device type, OS/browser,
                app version, language, approximate location (derived from IP), and performance/crash logs.
              </li>
              <li>
                <span className="text-white">Contacts & media (optional).</span> If you grant permission, we may
                access your contacts to help you find friends, and your camera/photos to upload images
                for listings or profile.
              </li>
              <li>
                <span className="text-white">Verification (optional).</span> If you choose to verify (e.g., with a
                .edu email or ID check), we process the data required to confirm eligibility and keep the community safe.
              </li>
            </ul>
          </Section>

          <Section id="how-we-use" title="How we use information">
            <ul className="list-disc list-inside space-y-2">
              <li>Provide core features: account creation, login, listings, messaging, search, notifications.</li>
              <li>Personalize recommendations (e.g., housing near campus, relevant marketplace items).</li>
              <li>Maintain safety: detect spam, fraud, and policy violations; support user reporting and appeals.</li>
              <li>Improve performance and reliability; fix bugs, analyze crashes, and run product experiments.</li>
              <li>Communicate with you about account activity, updates, and changes to our terms/policies.</li>
              <li>Comply with legal obligations and enforce our <Link to="/terms" className="text-sky-400 hover:underline">Terms</Link>.</li>
            </ul>
          </Section>

          <Section id="sharing" title="How we share information">
            <p>We share data only as needed to operate NewRun or when you ask us to:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <span className="text-white">You and the community.</span> Content you choose to make public
                (e.g., listings, profile username/photo) is visible to others. Direct messages are private
                to participants unless reported for safety review.
              </li>
              <li>
                <span className="text-white">Service providers.</span> Cloud hosting, analytics, crash reporting,
                content delivery, anti-abuse, and payment processors act under contracts that limit their use
                of your information to our instructions.
              </li>
              <li>
                <span className="text-white">University / eligibility checks (optional).</span> If you opt in to
                verification, we may confirm status via your .edu email or a verification vendor.
              </li>
              <li>
                <span className="text-white">Legal & safety.</span> We may disclose information to comply with law,
                respond to lawful requests, or protect the rights, safety, and property of users and NewRun.
              </li>
              <li>
                <span className="text-white">Business transfers.</span> If we undergo a merger, acquisition, or
                asset sale, your information may transfer as part of that transaction subject to this policy.
              </li>
            </ul>
            <p className="text-white/85">
              We do <span className="text-white font-medium">not</span> sell your personal information.
            </p>
          </Section>

          <Section id="legal-bases" title="Legal bases (EEA/UK)">
            <p>If you are in the EEA/UK, we process your data under these bases:</p>
            <ul className="list-disc list-inside space-y-2">
              <li><span className="text-white">Contract.</span> To provide the service you request.</li>
              <li><span className="text-white">Legitimate interests.</span> Product improvement, security, and anti-abuse.</li>
              <li><span className="text-white">Consent.</span> Optional features like contacts import, location, or marketing.</li>
              <li><span className="text-white">Legal obligation.</span> Compliance with applicable laws and regulations.</li>
            </ul>
          </Section>

          <Section id="retention" title="Retention">
            <ul className="list-disc list-inside space-y-2">
              <li>We keep account data while your account is active.</li>
              <li>Content you delete is removed or anonymized from user-facing surfaces promptly; backups/logs roll off on a schedule.</li>
              <li>If you request deletion, we delete or de-identify your personal data except where we must retain it for legal, security, or fraud-prevention reasons.</li>
            </ul>
          </Section>

          <Section id="verification" title="Verification data (if you opt in)">
            <ul className="list-disc list-inside space-y-2">
              <li>.edu email checks: we store the verified email and verification status.</li>
              <li>ID checks (if enabled in future): we store status and limited metadata; sensitive images are processed by the provider and not retained by NewRun.</li>
              <li>Retention: verification records are kept while your account remains verified and then deleted or archived per legal requirements.</li>
            </ul>
          </Section>

          <Section id="your-choices" title="Your choices & rights">
            <ul className="list-disc list-inside space-y-2">
              <li><span className="text-white">Access & export.</span> You can request a copy of your data.</li>
              <li><span className="text-white">Correction.</span> Update your profile and account information.</li>
              <li><span className="text-white">Deletion.</span> Request deletion of your account and associated data.</li>
              <li><span className="text-white">Marketing controls.</span> Manage emails, SMS, and push in Settings or via unsubscribe links.</li>
              <li><span className="text-white">Do-Not-Sell/Share (US state laws).</span> We do not sell personal information; where “share” is defined for cross-context advertising, you can opt out in Cookies settings.</li>
              <li><span className="text-white">GDPR/EEA rights.</span> You may object or restrict processing, and you have data portability rights and the right to lodge a complaint with your supervisory authority.</li>
            </ul>
            <p>
              To exercise any rights, contact us at{" "}
              <a href="mailto:privacy@newrun.club" className="text-sky-400 hover:underline">privacy@newrun.club</a>.
              We may need to verify your identity before fulfilling the request.
            </p>
          </Section>

          <Section id="safety" title="Safety, moderation, and reporting">
            <ul className="list-disc list-inside space-y-2">
              <li>We use automated signals and human review to detect spam, scams, and policy violations.</li>
              <li>Reported content may be reviewed by trained moderators. We retain related data to investigate and prevent abuse.</li>
              <li>We may limit, suspend, or remove accounts involved in harmful behavior per our <Link to="/terms" className="text-sky-400 hover:underline">Terms</Link>.</li>
            </ul>
          </Section>

          <Section id="cookies" title="Cookies, local storage, and analytics">
            <p>
              We use cookies and similar technologies to keep you signed in, remember preferences, measure usage,
              and improve performance. You can control cookies in your browser and through our{" "}
              <Link to="/cookies" className="text-sky-400 hover:underline">Cookies Policy</Link>.
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>Essential cookies for authentication and security are required to use NewRun.</li>
              <li>Analytics help us understand which features are working and where to improve.</li>
              <li>We do not use third-party advertising cookies that sell your data.</li>
            </ul>
          </Section>

          <Section id="ai" title="AI features & data use">
            <p>
              Some NewRun features may leverage AI (e.g., content suggestions, safety filtering).
              Unless we say otherwise, personal data processed for these features is used to operate the feature
              and improve NewRun. We do not allow third-party model providers to use your data to train their
              models for unrelated purposes without your consent.
            </p>
          </Section>

          <Section id="children" title="Children">
            <p>
              NewRun is not intended for children under 13 (or the age of digital consent in your region).
              If we learn we have collected personal information from a child, we will take steps to delete it.
            </p>
          </Section>

          <Section id="security" title="Security">
            <ul className="list-disc list-inside space-y-2">
              <li>Encryption in transit (HTTPS) and at rest for key data stores.</li>
              <li>Strict access controls, audit logging, and least-privilege practices.</li>
              <li>Regular backups and disaster-recovery testing.</li>
              <li>Vulnerability management and third-party security tooling.</li>
            </ul>
            <p>
              No system is 100% secure. If you suspect a security issue, please email{" "}
              <a href="mailto:security@newrun.club" className="text-sky-400 hover:underline">security@newrun.club</a>.
            </p>
          </Section>

          <Section id="intl" title="International data transfers">
            <p>
              We may process and store information in countries outside your own. Where required, we use
              appropriate safeguards for international transfers (e.g., standard contractual clauses).
            </p>
          </Section>

          <Section id="changes" title="Changes to this policy">
            <p>
              We may update this policy as NewRun evolves. We will post updates here and, when appropriate,
              notify you in-app or by email. If changes materially affect your rights, we will provide
              additional notice.
            </p>
          </Section>

          <Section id="contact" title="Contact us">
            <p>
              Questions or concerns? Contact our privacy team at{" "}
              <a href="mailto:privacy@newrun.club" className="text-sky-400 hover:underline">privacy@newrun.club</a>.
            </p>
            <div className="mt-2 text-white/85 text-sm">
              <p><span className="text-white">Data Controller:</span> NewRun Labs, Inc. (update with your legal entity). Contact: <a href="mailto:privacy@newrun.club" className="text-sky-400 hover:underline">privacy@newrun.club</a></p>
            </div>
            <p className="text-xs text-white/50">
              This page provides general information and does not constitute legal advice. Please consult counsel
              for requirements applicable to your organization and jurisdiction.
            </p>
          </Section>
    </LegalLayout>
  );
}
