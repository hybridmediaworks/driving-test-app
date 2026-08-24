import { create } from "zustand";
import type { State, VehicleType } from "@driving-test-app/shared";

import { api } from "@/lib/api";

interface ReferenceDataState {
  states: State[];
  vehicleTypes: VehicleType[];
  statesLoading: boolean;
  vehicleTypesLoading: boolean;
  statesError: string | null;
  vehicleTypesError: string | null;
  fetchStates: () => Promise<void>;
  fetchVehicleTypes: () => Promise<void>;
}

export const useReferenceDataStore = create<ReferenceDataState>((set, get) => ({
  states: [],
  vehicleTypes: [],
  statesLoading: false,
  vehicleTypesLoading: false,
  statesError: null,
  vehicleTypesError: null,

  async fetchStates() {
    if (get().states.length > 0 || get().statesLoading) return;
    set({ statesLoading: true, statesError: null });
    try {
      const res = await api.get<{ data: State[] }>("/states");
      set({ states: res.data });
    } catch {
      set({ statesError: "Unable to load states. Please try again." });
    } finally {
      set({ statesLoading: false });
    }
  },

  async fetchVehicleTypes() {
    if (get().vehicleTypes.length > 0 || get().vehicleTypesLoading) return;
    set({ vehicleTypesLoading: true, vehicleTypesError: null });
    try {
      const res = await api.get<{ data: VehicleType[] }>("/vehicle-types");
      set({ vehicleTypes: res.data });
    } catch {
      set({ vehicleTypesError: "Unable to load vehicle types. Please try again." });
    } finally {
      set({ vehicleTypesLoading: false });
    }
  },
}));
