// src/utils/onboardingProgress.js
const KEY = "nr_onboarding";

export function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "null");
  } catch {
    return null;
  }
}

export function saveProgress(patch) {
  const prev = loadProgress() || { startedAt: Date.now(), completed: false, stage: "start" };
  const next = { ...prev, ...patch, updatedAt: Date.now() };
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function clearProgress() {
  localStorage.removeItem(KEY);
}

export function hasDraft() {
  const p = loadProgress();
  return !!(p && !p.completed);
}
