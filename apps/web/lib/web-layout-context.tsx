"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { isValidState, slugToStateName } from "./usStates";

const STORAGE_KEY = "selectedState";
const VEHICLE_STORAGE_KEY = "selectedVehicle";
const TEST_TYPE_STORAGE_KEY = "selectedTestType";
const validVehicles = ["Car", "CDL", "Motorcycle"];
const validTestTracks = ["permit_test", "driving_test"];

type WebLayoutContextValue = {
  selectedState: string;
  setSelectedState: (state: string) => void;
  hasStoredState: boolean;
  selectedVehicle: string;
  setSelectedVehicle: (vehicle: string) => void;
  selectedTestType: string;
  setSelectedTestType: (testType: string) => void;
};

const WebLayoutContext = createContext<WebLayoutContextValue | null>(null);

export function WebLayoutProvider({
  children,
  stateSlug = "",
}: {
  children: ReactNode;
  stateSlug?: string;
}) {
  const [selectedState, setSelectedStateRaw] = useState("");
  const [hasStoredState, setHasStoredState] = useState(false);
  const [selectedVehicle, setSelectedVehicleRaw] = useState("Car");
  const [selectedTestType, setSelectedTestTypeRaw] = useState("permit_test");

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

    const storedTestTypeRaw = localStorage.getItem(TEST_TYPE_STORAGE_KEY);
    const storedTestType =
      storedTestTypeRaw && validTestTracks.includes(storedTestTypeRaw) ? storedTestTypeRaw : "";

    const initialState = validPropState || storedState || "";
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration-safe: server/first client render both start empty, then sync to the real stored value
    setSelectedStateRaw(initialState);
    setHasStoredState(!!storedState || !!validPropState);
    setSelectedVehicleRaw(storedVehicle || "Car");
    setSelectedTestTypeRaw(storedTestType || "permit_test");

    if (validPropState) {
      localStorage.setItem(STORAGE_KEY, initialState);
      localStorage.setItem(VEHICLE_STORAGE_KEY, storedVehicle || "Car");
      localStorage.setItem(TEST_TYPE_STORAGE_KEY, storedTestType || "permit_test");
    }
  }, [stateSlug]);

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
