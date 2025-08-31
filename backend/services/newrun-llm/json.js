// services/newrun-llm/json.js
function tryParseJSONLoose(text) {
  if (!text) return null;
  const m = text.match(/\{[\s\S]*\}/); // grab first {...} even if wrapped in prose
  const raw = m ? m[0] : text;
  try { return JSON.parse(raw); } catch {
    try {
      const fixed = raw
        .replace(/,\s*([}\]])/g, '$1')   // trailing commas
        .replace(/\u201C|\u201D/g, '"')  // smart quotes → "
        .replace(/\u2019/g, "'");        // smart apostrophe
      return JSON.parse(fixed);
    } catch { return null; }
  }
}

/** ultra-light shape check (best-effort) */
function validateShape(obj, schema) {
  if (!obj || typeof obj !== 'object') return false;
  for (const [k, t] of Object.entries(schema || {})) {
    const v = obj[k];
    const isNull = v === null || typeof v === 'undefined';
    switch (t) {
      case 'number':           if (typeof v !== 'number') return false; break;
      case 'string':           if (typeof v !== 'string') return false; break;
      case 'array':            if (!Array.isArray(v)) return false; break;
      case 'object':           if (typeof v !== 'object' || Array.isArray(v)) return false; break;
      case 'nullable-number':  if (!(isNull || typeof v === 'number')) return false; break;
      case 'nullable-string':  if (!(isNull || typeof v === 'string')) return false; break;
      default: break;
    }
  }
  return true;
}

module.exports = { tryParseJSONLoose, validateShape };
