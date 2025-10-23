export const BASE_URL = (
  (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL)) ||
  (typeof window !== 'undefined' && /newrun\.club$/i.test(window.location.hostname) ? 'https://api.newrun.club' : 'http://localhost:8000')
).replace(/\/+$/, '')

