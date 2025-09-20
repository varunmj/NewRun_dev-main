// Clearbit university logo helpers with simple caching/prefetch

const OVERRIDES = {
  "northern illinois university": "niu.edu",
};

const inMemoryCache = new Map();

function normalizeName(name = "") {
  return String(name || "").trim().toLowerCase();
}

function nameToDomain(name = "") {
  const key = normalizeName(name);
  if (!key) return "";
  if (OVERRIDES[key]) return OVERRIDES[key];
  // naive guess: alnum-only + .edu
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


