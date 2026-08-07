"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { isValidState, slugToStateName } from "./usStates";

const STORAGE_KEY = "selectedState";
const VEHICLE_STORAGE_KEY = "selectedVehicle";
const TEST_TYPE_STORAGE_KEY = "selectedTestType";
const validVehicles = ["Car", "CDL", "Motorcycle"];
const validTestTracks = ["permit_test", "driving_test"];

/** Route vehicle segment -> the label stored/used everywhere else (matches `validVehicles`). */
const vehicleSlugToLabel: Record<string, string> = {
  car: "Car",
  motorcycle: "Motorcycle",
  cdl: "CDL",
};

type WebLayoutContextValue = {
  selectedState: string;
  setSelectedState: (state: string) => void;
  hasStoredState: boolean;
  selectedVehicle: string;
  setSelectedVehicle: (vehicle: string) => void;
  selectedTestType: string;
  setSelectedTestType: (testType: string) => void;
  hasResolvedTestType: boolean;
};

const WebLayoutContext = createContext<WebLayoutContextValue | null>(null);

export function WebLayoutProvider({
  children,
  stateSlug = "",
  vehicleSlug = "",
}: {
  children: ReactNode;
  stateSlug?: string;
  /** Set only by routes whose URL itself encodes the vehicle (e.g. `/[state]/motorcycle`,
   * `/[state]/cdl` — car has no segment, pass "car" explicitly there too). Forces
   * `selectedVehicle` to match the page actually being rendered, the same way `stateSlug` already
   * forces `selectedState` — otherwise a stale localStorage value (e.g. "Motorcycle" from an
   * earlier visit) can silently disagree with which vehicle-specific component tree the route is
   * actually rendering. Routes that don't encode a vehicle (`/`, `/quizzes`, `/[state]/[test-slug]`)
   * omit this and keep relying on the stored preference. */
  vehicleSlug?: string;
}) {
  const [selectedState, setSelectedStateRaw] = useState("");
  const [hasStoredState, setHasStoredState] = useState(false);
  const [selectedVehicle, setSelectedVehicleRaw] = useState("Car");
  const [selectedTestType, setSelectedTestTypeRaw] = useState("permit_test");
  const [hasResolvedTestType, setHasResolvedTestType] = useState(false);

  // Reads from localStorage/route slug only after mount to avoid SSR/client hydration mismatches.
  useEffect(() => {
    const storedStateRaw = localStorage.getItem(STORAGE_KEY);
    const storedState = storedStateRaw && isValidState(storedStateRaw) ? storedStateRaw : "";
    if (storedStateRaw && !storedState) {
      localStorage.removeItem(STORAGE_KEY);
    }

    const propStateName = stateSlug ? slugToStateName(stateSlug) : "";
    const validPropState = isValidState(propStateName) ? propStateName : "";

    const storedVehicleRaw = localStorage.getItem(VEHICLE_STORAGE_KEY);
    const storedVehicle =
      storedVehicleRaw && validVehicles.includes(storedVehicleRaw) ? storedVehicleRaw : "";

    const propVehicle = vehicleSlugToLabel[vehicleSlug] ?? "";

    const storedTestTypeRaw = localStorage.getItem(TEST_TYPE_STORAGE_KEY);
    const storedTestType =
      storedTestTypeRaw && validTestTracks.includes(storedTestTypeRaw) ? storedTestTypeRaw : "";

    const initialState = validPropState || storedState || "";
    const initialVehicle = propVehicle || storedVehicle || "Car";
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration-safe: server/first client render both start empty, then sync to the real stored value
    setSelectedStateRaw(initialState);
    setHasStoredState(!!storedState || !!validPropState);
    setSelectedVehicleRaw(initialVehicle);
    setSelectedTestTypeRaw(storedTestType || "permit_test");
    setHasResolvedTestType(true);

    if (validPropState) {
      localStorage.setItem(STORAGE_KEY, initialState);
      localStorage.setItem(VEHICLE_STORAGE_KEY, initialVehicle);
      localStorage.setItem(TEST_TYPE_STORAGE_KEY, storedTestType || "permit_test");
    }
  }, [stateSlug, vehicleSlug]);

  function setSelectedState(value: string) {
    setSelectedStateRaw(value);
    if (!isValidState(value)) return;
    localStorage.setItem(STORAGE_KEY, value);
    localStorage.setItem(VEHICLE_STORAGE_KEY, selectedVehicle);
    setHasStoredState(true);
  }

  function setSelectedVehicle(value: string) {
    setSelectedVehicleRaw(value);
    if (!validVehicles.includes(value)) return;
    localStorage.setItem(VEHICLE_STORAGE_KEY, value);
  }

  function setSelectedTestType(value: string) {
    setSelectedTestTypeRaw(value);
    if (!validTestTracks.includes(value)) return;
    localStorage.setItem(TEST_TYPE_STORAGE_KEY, value);
  }

  return (
    <WebLayoutContext.Provider
      value={{
        selectedState,
        setSelectedState,
        hasStoredState,
        selectedVehicle,
        setSelectedVehicle,
        selectedTestType,
        setSelectedTestType,
        hasResolvedTestType,
      }}
    >
      {children}
    </WebLayoutContext.Provider>
  );
}

export function useWebLayout(): WebLayoutContextValue {
  const ctx = useContext(WebLayoutContext);
  if (!ctx) throw new Error("useWebLayout must be used within WebLayoutProvider");
  return ctx;
}
