export type ProgressStore = {
  completed: string[];
  quizzes: Record<string, number>;
};

export const PROGRESS_KEY = "bench-course-progress-v1";

const EMPTY: ProgressStore = { completed: [], quizzes: {} };

export function readProgress(): ProgressStore {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(PROGRESS_KEY);
    if (!raw) return { completed: [], quizzes: {} };
    const parsed = JSON.parse(raw) as ProgressStore;
    return {
      completed: Array.isArray(parsed.completed) ? parsed.completed : [],
      quizzes: parsed.quizzes && typeof parsed.quizzes === "object" ? parsed.quizzes : {},
    };
  } catch {
    return { completed: [], quizzes: {} };
  }
}

export function writeProgress(store: ProgressStore) {
  window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(store));
  window.dispatchEvent(new Event("bench-progress"));
}

export function subscribeProgress(onStoreChange: () => void) {
  window.addEventListener("bench-progress", onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener("bench-progress", onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export function progressSnapshot() {
  return window.localStorage.getItem(PROGRESS_KEY) ?? "";
}

export function parseProgress(raw: string): ProgressStore {
  if (!raw) return { completed: [], quizzes: {} };
  try {
    const parsed = JSON.parse(raw) as ProgressStore;
    return {
      completed: Array.isArray(parsed.completed) ? parsed.completed : [],
      quizzes: parsed.quizzes && typeof parsed.quizzes === "object" ? parsed.quizzes : {},
    };
  } catch {
    return { completed: [], quizzes: {} };
  }
}
