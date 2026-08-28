import {
  fetchChallengeBank,
  removeFromChallengeBank,
  type ChallengeBankQuestion,
} from "@/services/api/challengeBankApi";
import { create } from "zustand";

/**
 * Server-backed Challenge Bank. The questions live on the backend now (added automatically when an
 * attempt is graded, removed when answered correctly) — this store is just a client cache the
 * screens refresh on focus. No persistence: it's always re-fetched from the API.
 */
interface ChallengeBankState {
  questions: ChallengeBankQuestion[];
  loading: boolean;
  loaded: boolean;
  refresh: () => Promise<void>;
  /** Optimistically drop a question locally, then tell the server (used after a correct answer). */
  remove: (questionId: number) => Promise<void>;
  clearAll: () => Promise<void>;
}

export const useChallengeBankStore = create<ChallengeBankState>((set, get) => ({
  questions: [],
  loading: false,
  loaded: false,

  refresh: async () => {
    set({ loading: true });
    try {
      const questions = await fetchChallengeBank();
      set({ questions, loaded: true });
    } catch {
      // Keep whatever we had (e.g. offline / not signed in) rather than blanking the screen.
    } finally {
      set({ loading: false });
    }
  },

  remove: async (questionId) => {
    set({ questions: get().questions.filter((q) => q.id !== questionId) });
    try {
      await removeFromChallengeBank(questionId);
    } catch {
      // Best-effort — the next refresh reconciles with the server if this failed.
    }
  },

  clearAll: async () => {
    const ids = get().questions.map((q) => q.id);
    set({ questions: [] });
    await Promise.all(ids.map((id) => removeFromChallengeBank(id).catch(() => {})));
  },
}));
