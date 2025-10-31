function sanitizeAIText(text) {
  if (!text || typeof text !== 'string') return text;
  let out = text;
  // Mask emails
  out = out.replace(/([A-Z0-9._%+-])[A-Z0-9._%+-]*(@[A-Z0-9.-]+\.[A-Z]{2,})/gi, (m, first, domain) => `${first}•••••${domain}`);
  // Mask phone numbers (various formats)
  out = out.replace(/\b(?:\+?\d{1,3}[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}\b/g, (m) => {
    const digits = m.replace(/\D/g, '');
    const masked = digits.slice(0, -2).replace(/\d/g, '•') + digits.slice(-2);
    return masked;
  });
  return out;
}

module.exports = { sanitizeAIText };


