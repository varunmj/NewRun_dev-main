// services/newrun-llm/newrunLLM.js
const axios = require('axios');

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_KEY = process.env.NEWRUN_APP_OPENAI_API_KEY;

// small helper: tolerant JSON parser that looks for a {...} block
function safeJsonFrom(text = '{}') {
  try {
    const m = String(text).match(/\{[\s\S]*\}/);
    return m ? JSON.parse(m[0]) : {};
  } catch {
    return {};
  }
}

// optional: minimal rule-based fallback if LLM fails
function fallbackExtract(prompt = '') {
  const out = {
    maxPrice: null,
    bedrooms: null,
    bathrooms: null,
    distanceMiles: null,
    moveIn: null,
    keywords: [],
  };

  const price = prompt.match(/\$?\s?(\d{3,5})/);
  if (price) out.maxPrice = Number(price[1]);

  const beds = prompt.match(/(\d+)\s*bed/gi);
  if (beds) out.bedrooms = Number((beds[beds.length - 1].match(/\d+/) || [])[0]);

  const baths = prompt.match(/(\d+)\s*bath/gi);
  if (baths) out.bathrooms = Number((baths[baths.length - 1].match(/\d+/) || [])[0]);

  const dist = prompt.match(/within\s*(\d+)\s*miles?/i);
  if (dist) out.distanceMiles = Number(dist[1]);

  // naive move-in detection
  const move = prompt.match(/(october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep)\s*\d{0,2}/i);
  if (move) out.moveIn = move[0];

  // toss a few tokens as keywords
  out.keywords = (prompt || '')
    .toLowerCase()
    .split(/\W+/)
    .filter(Boolean)
    .slice(0, 8);

  return out;
}

/**
 * extractHousingCriteria({ prompt, campus })
 * Calls OpenAI and returns { ok, data, raw, error }
 */
async function extractHousingCriteria({ prompt = '', campus = '' }) {
  if (!OPENAI_KEY) {
    return { ok: false, error: 'Missing NEWRUN_APP_OPENAI_API_KEY env', data: fallbackExtract(prompt) };
  }

  const system = `You extract structured JSON search criteria for student housing.
Return ONLY JSON with keys:
{
  "maxPrice": number|null,
  "bedrooms": number|null,
  "bathrooms": number|null,
  "distanceMiles": number|null,
  "moveIn": string|null,   // ISO or free-form month
  "keywords": string[]     // 3-10 tokens/phrases
}`;

  const user = `Campus: ${campus || 'unknown'}\nRequest: ${prompt}`;

  try {
    const resp = await axios.post(OPENAI_URL, {
      model: 'gpt-5',
      temperature: 0.2,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }, {
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 25_000,
    });

    const raw = resp?.data?.choices?.[0]?.message?.content || '{}';
    const data = safeJsonFrom(raw);

    // basic sanity guard
    const normalized = {
      maxPrice: Number.isFinite(Number(data.maxPrice)) ? Number(data.maxPrice) : null,
      bedrooms: Number.isFinite(Number(data.bedrooms)) ? Number(data.bedrooms) : null,
      bathrooms: Number.isFinite(Number(data.bathrooms)) ? Number(data.bathrooms) : null,
      distanceMiles: Number.isFinite(Number(data.distanceMiles)) ? Number(data.distanceMiles) : null,
      moveIn: data.moveIn || null,
      keywords: Array.isArray(data.keywords) ? data.keywords.filter(Boolean).slice(0, 10) : [],
    };

    return { ok: true, data: normalized, raw };
  } catch (err) {
    // fallback so UX still works
    return { ok: false, error: err?.message || 'OpenAI error', data: fallbackExtract(prompt) };
  }
}

module.exports = { extractHousingCriteria };
