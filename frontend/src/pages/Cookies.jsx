import React from "react";
import { Link } from "react-router-dom";

export default function Cookies() {
  const lastUpdated = "October 1, 2025";

  const Section = ({ id, title, children }) => (
    <section id={id} className="scroll-mt-24">
      <h3 className="text-white text-xl font-semibold mt-8 mb-3">{title}</h3>
      <div className="text-white/85 text-sm leading-6 space-y-3">{children}</div>
    </section>
  );

  return (
    <main className="min-h-screen bg-black">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-2xl border border-white/10 bg-transparent p-6">
          {/* Header */}
          <h1 className="brand-script text-5xl leading-none bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent mb-2">
            NewRun
          </h1>
          <h2 className="text-white text-2xl font-semibold mb-2">Cookies Policy</h2>
          <p className="text-white/60 text-xs mb-6">Last updated: {lastUpdated}</p>

          {/* Intro */}
          <div className="text-white/85 text-sm leading-6 space-y-3 mb-6">
            <p>
              We use cookies and similar technologies so NewRun works reliably, stays secure, and feels personal.
              This page explains what these technologies are, how we use them, and the choices you have.
              For how we handle personal data more broadly, see our{" "}
              <Link to="/privacy" className="text-sky-400 hover:underline">Privacy Policy</Link>.
            </p>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <ul className="list-disc list-inside space-y-1">
                <li>Essential cookies are required for login, security, and core features.</li>
                <li>We use privacy-respecting analytics to improve performance and reliability.</li>
                <li>You can control non-essential cookies via browser settings and in-app preferences.</li>
              </ul>
            </div>
          </div>

          {/* Table of Contents */}
          <nav className="mb-6">
            <div className="text-white/70 text-xs uppercase tracking-wide mb-2">On this page</div>
            <ul className="grid sm:grid-cols-2 gap-2 text-sm">
              {[
                ["what", "What cookies & similar tech are"],
                ["how", "How we use them"],
                ["types", "Types of cookies we use"],
                ["third", "Third-party services & analytics"],
                ["controls", "Your choices & controls"],
                ["retention", "Retention & expiry"],
                ["signals", "Do Not Track & GPC"],
                ["changes", "Changes to this policy"],
                ["contact", "Contact us"],
              ].map(([id, label]) => (
                <li key={id}>
                  <a href={`#${id}`} className="text-sky-400 hover:underline">{label}</a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Sections */}
          <Section id="what" title="What cookies & similar technologies are">
            <p>
              <span className="text-white">Cookies</span> are small text files placed on your device by your browser.
              We also use <span className="text-white">localStorage/sessionStorage</span> (key-value storage in your browser),
              <span className="text-white"> device identifiers</span>, and <span className="text-white">pixels/web beacons</span> (tiny, invisible images).
              These help us keep you signed in, remember preferences, measure usage, secure the service, and improve performance.
            </p>
          </Section>

          <Section id="how" title="How we use these technologies">
            <ul className="list-disc list-inside space-y-2">
              <li><span className="text-white">Authentication & sessions:</span> keep you logged in, route requests, prevent session hijacking.</li>
              <li><span className="text-white">Security & abuse prevention:</span> detect unusual activity, rate-limit, prevent spam/fraud.</li>
              <li><span className="text-white">Preferences:</span> remember settings like theme, campus, filters, notification choices.</li>
              <li><span className="text-white">Performance & analytics:</span> understand feature usage, fix bugs, improve reliability and speed.</li>
              <li><span className="text-white">Feature personalization:</span> recommend housing and marketplace content relevant to your university context.</li>
            </ul>
          </Section>

          <Section id="types" title="Types of cookies we use">
            <div className="space-y-3">
              <div>
                <p className="text-white font-medium">1) Essential (required)</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Login/session tokens, CSRF protection, load balancing, bot/spam defense.</li>
                  <li>These are necessary for NewRun to function; you cannot opt out of essentials.</li>
                </ul>
              </div>
              <div>
                <p className="text-white font-medium">2) Preferences</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Language, campus, saved filters, UI theme, dismissed tips/tooltips.</li>
                </ul>
              </div>
              <div>
                <p className="text-white font-medium">3) Performance & analytics</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Anonymous or pseudonymous metrics to improve reliability and product quality.</li>
                  <li>Crash diagnostics and latency measurements to troubleshoot issues.</li>
                </ul>
              </div>
              <div>
                <p className="text-white font-medium">4) Communications</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Controls for email/SMS/push preferences and delivery reliability.</li>
                </ul>
              </div>
              <div>
                <p className="text-white font-medium">5) Payments & verification (as applicable)</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>When you use payments or identity checks, third-party providers may set their own cookies to operate those features securely.</li>
                </ul>
              </div>
            </div>
          </Section>

          <Section id="third" title="Third-party services & analytics">
            <p>
              We partner with service providers for hosting, analytics, crash reporting, content delivery,
              anti-abuse, payments, and (optionally) verification. Examples include cloud infrastructure,
              basic product analytics, and payment processors (e.g., Stripe). These providers may set their own
              cookies or read ours to provide their services on our behalf under contracts that limit their use
              of data to our instructions. We don’t allow third-party ad networks to sell your personal information.
            </p>
            <p className="text-white/70 text-xs">
              The specific providers we use can change as we improve NewRun. Where required, we will update this page or
              surface provider details in-app.
            </p>
          </Section>

          <Section id="controls" title="Your choices & controls">
            <ul className="list-disc list-inside space-y-2">
              <li>
                <span className="text-white">In-app settings:</span> Manage non-essential cookies and analytics in{" "}
                <Link to="/cookies/settings" className="text-sky-400 hover:underline">Cookie Settings</Link> (when available).
              </li>
              <li>
                <span className="text-white">Browser controls:</span> Most browsers let you block/delete cookies.
                See: Settings → Privacy/Security → Cookies & site data. Blocking essentials may break login.
              </li>
              <li>
                <span className="text-white">Private mode / clearing:</span> Use private windows or clear browsing data to remove stored cookies and localStorage.
              </li>
              <li>
                <span className="text-white">Mobile OS:</span> On iOS/Android, manage WebView/browser cookies in system settings.
              </li>
            </ul>
            <p>
              You can also adjust marketing emails and push notifications in{" "}
              <Link to="/settings" className="text-sky-400 hover:underline">Settings</Link> or via unsubscribe links.
            </p>
          </Section>

          <Section id="retention" title="Retention & expiry">
            <ul className="list-disc list-inside space-y-2">
              <li>Session cookies expire when you close the browser or after a short period of inactivity.</li>
              <li>Persistent cookies/localStorage keys may remain for weeks to months (e.g., remembering campus or preferences) unless you clear them.</li>
              <li>Where we rely on consent, we periodically re-prompt or honor your revocation in settings.</li>
            </ul>
          </Section>

          <Section id="signals" title="Do Not Track & Global Privacy Control (GPC)">
            <p>
              Some browsers send <span className="text-white">Do Not Track</span> or <span className="text-white">Global Privacy Control</span> signals.
              We honor legally required signals (including GPC for certain jurisdictions) for non-essential cookies and cross-context signals,
              and we do not sell personal information. You can still fine-tune cookie preferences in settings.
            </p>
          </Section>

          <Section id="changes" title="Changes to this policy">
            <p>
              We may update this Cookies Policy as NewRun evolves. We’ll post updates here and, when appropriate,
              notify you in-app. If changes materially affect your choices, we will provide additional notice.
            </p>
          </Section>

          <Section id="contact" title="Contact us">
            <p>
              Questions about cookies at NewRun? Contact{" "}
              <a href="mailto:privacy@newrun.club" className="text-sky-400 hover:underline">privacy@newrun.club</a>.
            </p>
            <p className="text-xs text-white/50">
              This page provides general information and does not constitute legal advice.
            </p>
          </Section>
        </div>
      </div>
    </main>
  );
}
