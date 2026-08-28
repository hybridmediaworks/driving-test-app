import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type VehicleType = "car" | "cdl" | "motorcycle";
export type ExamDateRange = "0-3" | "4-7" | "8-14" | "15+";
export type RetakeStatus = "first" | "retake";
// Language the quiz *content* (questions/answers/explanations) is served in. The backend
// auto-translates on request (GET /quizzes/{id}?language=es); "en" is the untranslated source.
export type TestLanguage = "en" | "es";

interface UserState {
  // Onboarding data
  vehicleType: VehicleType | null;
  state: string | null;
  isRetake: RetakeStatus | null;
  examDateRange: ExamDateRange | null;
  reminderPreferences: string[];
  onboardingComplete: boolean;

  // Preferences
  testLanguage: TestLanguage;

  // Actions
  setVehicleType: (vehicle: VehicleType) => void;
  setState: (state: string) => void;
  setIsRetake: (status: RetakeStatus) => void;
  setExamDateRange: (range: ExamDateRange) => void;
  setReminderPreferences: (prefs: string[]) => void;
  setTestLanguage: (language: TestLanguage) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      vehicleType: null,
      state: null,
      isRetake: null,
      examDateRange: null,
      reminderPreferences: [],
      onboardingComplete: false,
      testLanguage: "en",

      setVehicleType: (vehicleType) => set({ vehicleType }),
      setState: (state) => set({ state }),
      setIsRetake: (isRetake) => set({ isRetake }),
      setExamDateRange: (examDateRange) => set({ examDateRange }),
      setReminderPreferences: (reminderPreferences) =>
        set({ reminderPreferences }),
      setTestLanguage: (testLanguage) => set({ testLanguage }),
      completeOnboarding: () => set({ onboardingComplete: true }),
      resetOnboarding: () =>
        set({
          vehicleType: null,
          state: null,
          isRetake: null,
          examDateRange: null,
          reminderPreferences: [],
          onboardingComplete: false,
        }),
    }),
    {
      name: "user-store",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
