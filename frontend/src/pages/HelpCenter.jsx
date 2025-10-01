import React from "react";
import { Link } from "react-router-dom";

export default function PersonalizationLearnMore() {
  const lastUpdated = "October 1, 2025";

  const Section = ({ id, title, children }) => (
    <section id={id} className="scroll-mt-24">
      <h3 className="text-white text-xl font-semibold mt-8 mb-3">{title}</h3>
      <div className="text-white/85 text-sm leading-6 space-y-3">{children}</div>
    </section>
  );

  const Callout = ({ children }) => (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">{children}</div>
  );

  return (
    <main className="min-h-screen bg-black">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-2xl border border-white/10 bg-transparent p-6">
          {/* Header */}
          <h1 className="brand-script text-5xl leading-none bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent mb-2">
            NewRun
          </h1>
          <h2 className="text-white text-2xl font-semibold mb-2">How personalization works</h2>
          <p className="text-white/60 text-xs mb-6">Last updated: {lastUpdated}</p>

          {/* Intro */}
          <div className="text-white/85 text-sm leading-6 space-y-3 mb-6">
            <p>
              We use a few basic details to make NewRun more useful for you—showing housing, marketplace items,
              and community posts that fit your campus context. This page explains exactly what we use, why,
              and how to control it.
            </p>
            <Callout>
              <ul className="list-disc list-inside space-y-1">
                <li>We do <span className="text-white font-medium">not</span> sell your personal information.</li>
                <li>You can adjust personalization and analytics in Settings at any time.</li>
                <li>For broader data practices, see our{" "}
                  <Link to="/privacy" className="text-sky-400 hover:underline">Privacy Policy</Link>.
                </li>
              </ul>
            </Callout>
          </div>

          {/* TOC */}
          <nav className="mb-6">
            <div className="text-white/70 text-xs uppercase tracking-wide mb-2">On this page</div>
            <ul className="grid sm:grid-cols-2 gap-2 text-sm">
              {[
                ["what", "What we use"],
                ["where", "Where it’s used"],
                ["why", "Why we personalize"],
                ["dont", "What we don’t use"],
                ["controls", "Your controls"],
                ["examples", "Examples"],
                ["handling", "Data handling & retention"],
                ["fairness", "Fairness, safety & reporting"],
                ["contact", "Questions? Contact us"],
              ].map(([id, label]) => (
                <li key={id}><a href={`#${id}`} className="text-sky-400 hover:underline">{label}</a></li>
              ))}
            </ul>
          </nav>

          {/* Sections */}
          <Section id="what" title="What “basic details” we use">
            <p>Only what’s needed to tailor content to your university context:</p>
            <ul className="list-disc list-inside space-y-2">
              <li><span className="text-white">Account & campus:</span> email domain (e.g., .edu), selected campus, class year, and program/major if you provide it.</li>
              <li><span className="text-white">Preferences:</span> housing filters (budget, distance), saved searches, language, notification choices.</li>
              <li><span className="text-white">Simple activity:</span> saves/likes, hides, basic search terms, and listing categories you view—used to rank relevance.</li>
              <li><span className="text-white">Device basics:</span> locale/timezone and app version to help us render the right content and fix issues.</li>
            </ul>
          </Section>

          <Section id="where" title="Where personalization is used">
            <ul className="list-disc list-inside space-y-2">
              <li><span className="text-white">Housing feed:</span> matches near campus, price range, and roommates with compatible preferences.</li>
              <li><span className="text-white">Marketplace:</span> items commonly bought by peers at your campus, filtered by your interests.</li>
              <li><span className="text-white">Search & discover:</span> quicker suggestions and recent searches.</li>
              <li><span className="text-white">Notifications:</span> activity on your posts, saved searches, safety alerts, and relevant product updates.</li>
            </ul>
          </Section>

          <Section id="why" title="Why we personalize">
            <ul className="list-disc list-inside space-y-2">
              <li>Reduce noise and show relevant options faster.</li>
              <li>Improve safety by downranking spammy or low-quality content.</li>
              <li>Cut time-to-find for critical tasks (housing deadlines, move-in essentials).</li>
            </ul>
          </Section>

          <Section id="dont" title="What we don’t use">
            <Callout>
              <ul className="list-disc list-inside space-y-1">
                <li>No sensitive attributes (e.g., health, religion, sexual orientation) for recommendations.</li>
                <li>No contacts/media unless you explicitly opt in for features that need them.</li>
                <li>No third-party advertising cookies that sell your data.</li>
              </ul>
            </Callout>
          </Section>

          <Section id="controls" title="Your controls">
            <ul className="list-disc list-inside space-y-2">
              <li><span className="text-white">Edit preferences:</span> update housing filters, campus, interests, and notification choices in <Link to="/settings" className="text-sky-400 hover:underline">Settings</Link>.</li>
              <li><span className="text-white">Turn off non-essential personalization/analytics:</span> manage in <Link to="/cookies/settings" className="text-sky-400 hover:underline">Cookie Settings</Link> (when available).</li>
              <li><span className="text-white">Clear signals:</span> remove saved searches and history; clear cookies/local storage in your browser.</li>
              <li><span className="text-white">Emails & push:</span> use unsubscribe links or adjust notification toggles in Settings.</li>
              <li><span className="text-white">Your rights:</span> access/export/delete — see the <Link to="/privacy#your-choices" className="text-sky-400 hover:underline">Privacy Policy</Link>.</li>
            </ul>
          </Section>

          <Section id="examples" title="Examples">
            <ul className="list-disc list-inside space-y-2">
              <li>If you set rent ≤ $900 and “walkable to campus,” we rank those listings higher in your feed.</li>
              <li>If you save “desk + chair,” we’ll surface similar marketplace posts and restock alerts.</li>
              <li>If you mute “pets allowed,” we downrank pet-friendly places in your housing results.</li>
            </ul>
          </Section>

          <Section id="handling" title="Data handling & retention">
            <ul className="list-disc list-inside space-y-2">
              <li>Signals like saves/searches are retained while your account is active and then deleted or de-identified on a schedule.</li>
              <li>We work with service providers (hosting, analytics, payments) under contracts that limit their use to our instructions.</li>
              <li>We may review content and related metadata if it’s reported for safety or fraud.</li>
            </ul>
            <p className="text-white/70 text-xs">
              See <Link to="/privacy#retention" className="text-sky-400 hover:underline">Retention</Link> for more detail.
            </p>
          </Section>

          <Section id="fairness" title="Fairness, safety & reporting">
            <ul className="list-disc list-inside space-y-2">
              <li>Ranking avoids protected attributes and includes anti-discrimination checks.</li>
              <li>Spam/scam signals reduce the visibility of bad actors; repeat violators may be removed.</li>
              <li>Report concerns in-app or email <a href="mailto:safety@newrun.club" className="text-sky-400 hover:underline">safety@newrun.club</a>.</li>
            </ul>
          </Section>

          <Section id="contact" title="Questions? Contact us">
            <p>
              Email <a href="mailto:privacy@newrun.club" className="text-sky-400 hover:underline">privacy@newrun.club</a> for privacy questions,
              or <a href="mailto:support@newrun.club" className="text-sky-400 hover:underline">support@newrun.club</a> for product help.
            </p>
            <div className="mt-2 text-white/85 text-sm">
              <p><span className="text-white">Support hours:</span> Mon–Fri, 9am–6pm CT. Typical response within 24–48 hours.</p>
              <p><span className="text-white">Safety issues:</span> Report in‑app or email <a href="mailto:safety@newrun.club" className="text-sky-400 hover:underline">safety@newrun.club</a>.</p>
            </div>
          </Section>
        </div>
      </div>
    </main>
  );
}
