// src/utils/languageNames.js
// Expand ISO language codes ("ta","te","en") -> "Tamil","Telugu","English"
// Uses Intl.DisplayNames when available; falls back to iso-639-1 package if installed.

let intlDisplay = null;
try {
  // navigator may not exist in SSR; guard it
  const locale = (typeof navigator !== "undefined" && navigator.language) ? [navigator.language] : ["en"];
  intlDisplay = new Intl.DisplayNames(locale, { type: "language" });
} catch (_) {
  intlDisplay = null;
}

let ISO6391 = null;
try {
  // optional fallback (npm i iso-639-1)
  ISO6391 = require("iso-639-1");
} catch (_) { /* fallback stays null */ }

// single code -> human name (or the code if unknown)
export function languageName(code) {
  const c = String(code || "").trim().toLowerCase();
  if (!c) return "";
  try {
    const viaIntl = intlDisplay && intlDisplay.of(c);
    if (viaIntl && viaIntl !== c) return viaIntl;
  } catch (_) {}
  try {
    if (ISO6391) {
      const n = ISO6391.getName(c);
      if (n && n !== c) return n;
    }
  } catch (_) {}
  return c; // last resort: show the code
}

export function expandLanguageCodes(codes) {
  return (Array.isArray(codes) ? codes : [])
    .map(languageName)
    .filter(Boolean);
}

// Replace standalone 2–3 letter codes in a sentence.
// Example: "Both speak ta, te, en" -> "Both speak Tamil, Telugu, English"
export function expandLangsInText(text) {
  if (!text) return "";
  return String(text).replace(/\b([a-z]{2,3})(?=[,\s]|$)/gi, (m) => languageName(m) || m);
}
