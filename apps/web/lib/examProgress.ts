export type ExamProgress = {
  answers: Record<number, number>;
  index: number;
  elapsedSeconds: number;
};

type StoredExamProgress = ExamProgress & { savedAt: number };

const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function storageKey(ownerKey: string, quizId: number): string {
  return `exam_progress:${ownerKey}:${quizId}`;
}

export function examOwnerKey(userId: number | null | undefined): string {
  return userId ? `user-${userId}` : "guest";
}

export function loadExamProgress(ownerKey: string, quizId: number): ExamProgress | null {
  try {
    const raw = window.localStorage.getItem(storageKey(ownerKey, quizId));
    if (!raw) return null;

    const stored = JSON.parse(raw) as StoredExamProgress;
    if (Date.now() - stored.savedAt > MAX_AGE_MS) {
      window.localStorage.removeItem(storageKey(ownerKey, quizId));
      return null;
    }

    return { answers: stored.answers, index: stored.index, elapsedSeconds: stored.elapsedSeconds };
  } catch {
    return null;
  }
}

export function saveExamProgress(ownerKey: string, quizId: number, progress: ExamProgress): void {
  try {
    const stored: StoredExamProgress = { ...progress, savedAt: Date.now() };
    window.localStorage.setItem(storageKey(ownerKey, quizId), JSON.stringify(stored));
  } catch {
  }
}

export function clearExamProgress(ownerKey: string, quizId: number): void {
  try {
    window.localStorage.removeItem(storageKey(ownerKey, quizId));
  } catch {
  }
}
