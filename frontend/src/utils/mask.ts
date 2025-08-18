// utils/mask.ts
export const maskEmail = (e = "") =>
  e.replace(/(^.).*(@.*$)/, (_m, a, b) => (a ? a + "•••" + b : e));

export const maskPhone = (p = "") =>
  p.replace(/\d(?=\d{2})/g, "*").replace(/^\*+/, (m) => m.slice(0, Math.max(0, m.length - 4)));
