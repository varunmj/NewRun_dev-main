// services/newrun-llm/provider.js
const axios = require('axios');

const OPENAI_BASE = 'https://api.openai.com/v1/chat/completions';

/** Minimal OpenAI chat wrapper (easy to swap later if needed) */
async function callOpenAI({ apiKey, model, messages, temperature = 0.2 }) {
  const resp = await axios.post(OPENAI_BASE, { model, temperature, messages }, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });
  const content = resp?.data?.choices?.[0]?.message?.content ?? '';
  return { content, raw: resp.data };
}

module.exports = { callOpenAI };
