import { create } from "zustand";
import type { Plan } from "@driving-test-app/shared";

import { api } from "@/lib/api";

interface PlanState {
  plans: Plan[];
  loading: boolean;
  error: string | null;
  fetchPlans: () => Promise<void>;
}

export const usePlanStore = create<PlanState>((set, get) => ({
  plans: [],
  loading: false,
  error: null,

  async fetchPlans() {
    if (get().plans.length > 0 || get().loading) return;
    set({ loading: true, error: null });
    try {
      const res = await api.get<{ data: Plan[] }>("/plans");
      set({ plans: res.data });
    } catch {
      set({ error: "Unable to load plans. Please try again." });
    } finally {
      set({ loading: false });
    }
  },
}));
