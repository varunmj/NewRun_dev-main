// src/utils/navigate.js
export function navigate(path) {
  // Works fine in SPA when you can't access hooks here
  window.location.assign(path);
}
