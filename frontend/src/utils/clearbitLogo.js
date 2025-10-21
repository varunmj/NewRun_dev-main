// Clearbit university logo helpers with simple caching/prefetch

const OVERRIDES = {
  "northern illinois university": "niu.edu",
  "niu": "niu.edu",
  "university of texas at dallas": "utdallas.edu",
  "ut dallas": "utdallas.edu",
  "university of texas at austin": "utexas.edu",
  "ut austin": "utexas.edu",
  "university of texas": "utexas.edu",
  "university of chicago": "uchicago.edu",
  "uchicago": "uchicago.edu",
  "stanford university": "stanford.edu",
  "stanford": "stanford.edu",
  "ucla": "ucla.edu",
  "university of california los angeles": "ucla.edu",
  "uc berkeley": "berkeley.edu",
  "berkeley": "berkeley.edu",
  "university of california berkeley": "berkeley.edu",
  "harvard": "harvard.edu",
  "harvard university": "harvard.edu",
  "mit": "mit.edu",
  "massachusetts institute of technology": "mit.edu",
  "cornell": "cornell.edu",
  "cornell university": "cornell.edu",
  "penn": "upenn.edu",
  "upenn": "upenn.edu",
  "university of pennsylvania": "upenn.edu",
  "nyu": "nyu.edu",
  "columbia": "columbia.edu",
  "columbia university": "columbia.edu",
  "northeastern": "northeastern.edu",
  "northeastern university": "northeastern.edu",
  "northwestern": "northwestern.edu",
  "northwestern university": "northwestern.edu",
  "texas a&m": "tamu.edu",
  "tamu": "tamu.edu",
  "uiuc": "illinois.edu",
  "university of illinois": "illinois.edu",
  "university of illinois urbana-champaign": "illinois.edu",
  "uic": "uic.edu",
  "university of illinois chicago": "uic.edu",
  "depaul": "depaul.edu",
  "depaul university": "depaul.edu",
  "loyola": "luc.edu",
  "loyola university chicago": "luc.edu",
  "iit": "iit.edu",
  "illinois tech": "iit.edu",
  "illinois institute of technology": "iit.edu",
  "usc": "usc.edu",
  "university of southern california": "usc.edu",
  "caltech": "caltech.edu",
  "california institute of technology": "caltech.edu",
};

// Special cases where Clearbit returns wrong logos - use full URL overrides
// Note: Add entries here only when we have verified working URLs
const LOGO_OVERRIDES = {
  // Harvard - using locally hosted logo to avoid HMS confusion
  "harvard": "/logos/harvard.svg",
  "harvard university": "/logos/harvard.svg",
};

const inMemoryCache = new Map();

function normalizeName(name = "") {
  return String(name || "").trim().toLowerCase();
}

function nameToDomain(name = "") {
  const key = normalizeName(name);
  if (!key) return "";
  if (OVERRIDES[key]) return OVERRIDES[key];
  
  // Handle special cases for common university name patterns
  // Remove common words from university names to build domain
  const cleaned = key
    .replace(/\s+(university|college|institute|school|of|the|at)\s+/g, " ")
    .trim()
    .split(/\s+/);
  
  // Try to build domain from remaining words
  if (cleaned.length > 0) {
    // For multi-word universities like "University of Texas at Dallas"
    // After cleanup, we might have ["texas", "dallas"]
    // We want "texasdallas.edu"
    const base = cleaned.join("");
    return base ? `${base}.edu` : "";
  }
  
  // Fallback: alnum-only + .edu
  const base = key.replace(/[^a-z0-9]+/g, "");
  return base ? `${base}.edu` : "";
}

function buildUrl(domain) {
  return domain ? `https://logo.clearbit.com/${domain}` : "";
}

const LS_PREFIX = "nr:uniLogo:";

export function getUniversityLogoUrl(name) {
  const key = normalizeName(name);
  if (!key) return "";

  // Check if we have a full URL override (for cases where Clearbit returns wrong logos)
  if (LOGO_OVERRIDES[key]) {
    return LOGO_OVERRIDES[key];
  }

  const mem = inMemoryCache.get(key);
  if (mem) return mem;

  try {
    const fromLs = localStorage.getItem(LS_PREFIX + key);
    if (fromLs) {
      inMemoryCache.set(key, fromLs);
      return fromLs;
    }
  } catch {}

  const guessed = buildUrl(nameToDomain(name));
  if (guessed) inMemoryCache.set(key, guessed);
  return guessed;
}

// Fire-and-forget prefetch that verifies the image loads once and stores the URL
export function prefetchUniversityLogo(name) {
  const key = normalizeName(name);
  if (!key) return;

  const url = getUniversityLogoUrl(name);
  if (!url) return;

  // If already cached in LS, skip
  try {
    if (localStorage.getItem(LS_PREFIX + key)) return;
  } catch {}

  const img = new Image();
  img.referrerPolicy = "no-referrer";
  img.onload = () => {
    try {
      localStorage.setItem(LS_PREFIX + key, url);
    } catch {}
    inMemoryCache.set(key, url);
  };
  img.onerror = () => {
    // leave cache empty so we can try again next time or fall back to hidden
  };
  img.src = url;
}

export default getUniversityLogoUrl;


