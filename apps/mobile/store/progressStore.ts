import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface TestResult {
  testId: string;
  score: number; // percentage 0-100
  completedAt: string; // ISO date string
  missedIds: string; // comma-separated missed question IDs
}

interface ProgressState {
  testResults: Record<string, TestResult>;
  completedTestIds: string[];
  streakDays: number;
  lastStudyDate: string | null;

  // Actions
  recordTestResult: (testId: string, score: number, missedIds: string) => void;
  updateStreak: () => void;
  resetProgress: () => void;
}

function getTodayISO() {
  return new Date().toISOString().split("T")[0];
}

function getYesterdayISO() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      testResults: {},
      completedTestIds: [],
      streakDays: 0,
      lastStudyDate: null,

      recordTestResult: (testId, score, missedIds) => {
        const result: TestResult = {
          testId,
          score,
          completedAt: new Date().toISOString(),
          missedIds,
        };
        set((state) => ({
          testResults: { ...state.testResults, [testId]: result },
          completedTestIds: state.completedTestIds.includes(testId)
            ? state.completedTestIds
            : [...state.completedTestIds, testId],
        }));
        get().updateStreak();
      },

      updateStreak: () => {
        const today = getTodayISO();
        const yesterday = getYesterdayISO();
        const { lastStudyDate, streakDays } = get();

        if (lastStudyDate === today) return;

        if (lastStudyDate === yesterday) {
          set({ streakDays: streakDays + 1, lastStudyDate: today });
        } else {
          set({ streakDays: 1, lastStudyDate: today });
        }
      },

      resetProgress: () =>
        set({
          testResults: {},
          completedTestIds: [],
          streakDays: 0,
          lastStudyDate: null,
        }),
    }),
    {
      name: "progress-store",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
