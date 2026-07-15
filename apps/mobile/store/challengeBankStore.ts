import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface ChallengeBankState {
  missedQuestionIds: string[];
  addMissedQuestions: (ids: string[]) => void;
  removeMissedQuestion: (id: string) => void;
  clearAll: () => void;
}

export const useChallengeBankStore = create<ChallengeBankState>()(
  persist(
    (set) => ({
      missedQuestionIds: [],

      addMissedQuestions: (ids) =>
        set((state) => ({
          missedQuestionIds: [
            ...new Set([...state.missedQuestionIds, ...ids]),
          ],
        })),

      removeMissedQuestion: (id) =>
        set((state) => ({
          missedQuestionIds: state.missedQuestionIds.filter((q) => q !== id),
        })),

      clearAll: () => set({ missedQuestionIds: [] }),
    }),
    {
      name: "challenge-bank-store",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
