"use client";

import {
  Bike,
  Car,
  ChevronDown,
  GraduationCap,
  HelpCircle,
  MapPin,
  Menu,
  Route,
  Truck,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import PublicAccountMenu from "@/components/PublicAccountMenu";
import Button from "@/components/ui/Button";
import { useAuth } from "@/lib/auth-context";
import { stateToSlug, usStates } from "@/lib/usStates";
import { useWebLayout } from "@/lib/web-layout-context";

type Dropdown = null | "states" | "car" | "testType";

const vehiclePaths: Record<string, string> = {
  Car: "",
  CDL: "/cdl",
  Motorcycle: "/motorcycle",
};

const vehicleOptions = [
  { label: "Car", icon: Car },
  { label: "CDL", icon: Truck },
  { label: "Motorcycle", icon: Bike },
];

const testTypeOptions = [
  { label: "Permit Tests", icon: GraduationCap },
  { label: "Driving Test", icon: Route },
];

export default function Header({
  variant = "home",
  hideNav = false,
}: {
  variant?: string;
  hideNav?: boolean;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const { selectedState, hasStoredState, selectedVehicle, setSelectedVehicle } = useWebLayout();
  const [selectedTestType, setSelectedTestType] = useState("Permit Tests");
  const [activeDropdown, setActiveDropdown] = useState<Dropdown>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileStatesOpen, setMobileStatesOpen] = useState(false);
  const [mobileCarOpen, setMobileCarOpen] = useState(false);
  const [mobileTestTypeOpen, setMobileTestTypeOpen] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  function closeStateDropdown() {
    setActiveDropdown(null);
    setMobileStatesOpen(false);
    setMobileMenuOpen(false);
  }

  function selectVehicle(vehicle: string) {
    setSelectedVehicle(vehicle);
    setActiveDropdown(null);
    setMobileCarOpen(false);
    setMobileMenuOpen(false);

    if (!selectedState) return;

    router.push(`/${stateToSlug(selectedState)}${vehiclePaths[vehicle]}`);
  }

  function stateHref(state: string) {
    return `/${stateToSlug(state)}${vehiclePaths[selectedVehicle] ?? ""}`;
  }

  function selectTestType(testType: string) {
    setSelectedTestType(testType);
    setActiveDropdown(null);
    setMobileTestTypeOpen(false);
    setMobileMenuOpen(false);
  }

  function toggleDropdown(menu: Dropdown) {
    setActiveDropdown((current) => (current === menu ? null : menu));
  }

  const VehicleIcon = vehicleOptions.find((v) => v.label === selectedVehicle)?.icon ?? Car;
  const TestTypeIcon = testTypeOptions.find((t) => t.label === selectedTestType)?.icon ?? GraduationCap;
  const showNav = !hideNav && (variant === "states" || hasStoredState);

  return (
    <header className="relative w-full px-5 py-4 lg:py-6">
      <div className="mx-auto flex max-w-container items-center justify-between">
        <Link href="/">
          <Image src="/company-logo.svg" alt="" width={146} height={48} className="w-full max-w-36.5" />
        </Link>

        {showNav && (
          <nav ref={navRef} className="hidden items-center gap-4 lg:flex">
            <div className="relative">
              <button
                onClick={() => toggleDropdown("states")}
                className="flex h-11.5 items-center gap-2 rounded-full bg-blue-50 p-3 text-base font-medium text-blue-700 transition-shadow hover:shadow-md"
              >
                <MapPin className="h-6 w-6 text-blue-500" />
                {selectedState}
                <ChevronDown className="h-5 w-5 text-blue-400" />
              </button>

              {activeDropdown === "states" && (
                <div className="absolute top-full left-0 z-50 mt-2 w-145 rounded-2xl border border-gray-100 bg-white p-4 shadow-xl">
                  <p className="mb-3 text-xs font-semibold tracking-wide text-gray-400 uppercase">
                    Select State
                  </p>
                  <div className="grid grid-cols-3 gap-0.5 text-sm">
                    {usStates.map((state) => (
                      <Link
                        key={state}
                        href={stateHref(state)}
                        onClick={closeStateDropdown}
                        className={`cursor-pointer rounded-lg px-3 py-1.5 text-gray-700 hover:bg-blue-50 hover:text-blue-600 ${
                          selectedState === state ? "bg-blue-50 font-medium text-blue-600" : ""
                        }`}
                      >
                        {state}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => toggleDropdown("car")}
                className="flex h-11.5 items-center gap-2 rounded-full bg-neutral-100 p-3 text-base font-medium text-neutral-700 transition-shadow hover:shadow-md"
              >
                <VehicleIcon className="h-6 w-6 text-neutral-500" />
                {selectedVehicle}
                <ChevronDown className="h-5 w-5 text-neutral-400" />
              </button>

              {activeDropdown === "car" && (
                <div className="absolute top-full left-0 z-50 mt-2 w-52 rounded-2xl border border-gray-100 bg-white py-2 shadow-xl">
                  {vehicleOptions.map((item) => (
                    <a
                      key={item.label}
                      onClick={() => selectVehicle(item.label)}
                      className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 ${
                        selectedVehicle === item.label ? "bg-blue-50 font-medium text-blue-600" : ""
                      }`}
                    >
                      <item.icon className="h-4 w-4 text-blue-500" />
                      {item.label}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {variant === "states" && selectedVehicle !== "CDL" && (
              <div className="relative">
                <button
                  onClick={() => toggleDropdown("testType")}
                  className="flex h-11.5 items-center gap-2 rounded-full bg-neutral-100 p-3 text-base font-medium text-neutral-700 transition-shadow hover:shadow-md"
                >
                  <TestTypeIcon className="h-6 w-6 text-neutral-500" />
                  {selectedTestType}
                  <ChevronDown className="h-5 w-5 text-neutral-400" />
                </button>

                {activeDropdown === "testType" && (
                  <div className="absolute top-full left-0 z-50 mt-2 w-52 rounded-2xl border border-gray-100 bg-white py-2 shadow-xl">
                    {testTypeOptions.map((item) => (
                      <a
                        key={item.label}
                        onClick={() => selectTestType(item.label)}
                        className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 ${
                          selectedTestType === item.label ? "bg-blue-50 font-medium text-blue-600" : ""
                        }`}
                      >
                        <item.icon className="h-4 w-4 text-blue-500" />
                        {item.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </nav>
        )}

        <div className="hidden items-center gap-4 lg:flex">
          <Button className="p-0!" variant="ghost">
            <HelpCircle className="h-6 w-6 text-neutral-500" />
          </Button>
          {user ? (
            <PublicAccountMenu user={user} />
          ) : (
            <>
              <Button className="p-3! font-medium" variant="ghost" href="/login">
                Login
              </Button>
              <Button className="py-3! font-semibold" href="/register">
                Signup
              </Button>
            </>
          )}
        </div>

        <button
          className="flex items-center justify-center rounded-lg p-2 text-neutral-700 hover:bg-neutral-100 lg:hidden"
          onClick={() => setMobileMenuOpen((v) => !v)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="absolute top-full right-4 left-4 z-50 mt-2 rounded-2xl border border-gray-100 bg-white p-5 shadow-xl lg:hidden">
          {showNav && (
            <>
              <button
                onClick={() => setMobileStatesOpen((v) => !v)}
                className="flex w-full items-center justify-between rounded-xl bg-blue-50 px-4 py-3 font-medium text-blue-700"
              >
                <span className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-500" />
                  {selectedState}
                </span>
                <ChevronDown
                  className={`h-5 w-5 text-blue-400 transition-transform ${mobileStatesOpen ? "rotate-180" : ""}`}
                />
              </button>

              {mobileStatesOpen && (
                <div className="mt-3 max-h-64 overflow-y-auto">
                  <p className="mb-2 text-xs font-semibold tracking-wide text-gray-400 uppercase">
                    Select State
                  </p>
                  <div className="grid grid-cols-2 gap-0.5 text-sm">
                    {usStates.map((state) => (
                      <Link
                        key={state}
                        href={stateHref(state)}
                        onClick={closeStateDropdown}
                        className={`cursor-pointer rounded-lg px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 ${
                          selectedState === state ? "bg-blue-50 font-medium text-blue-600" : ""
                        }`}
                      >
                        {state}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
                <button
                  onClick={() => setMobileCarOpen((v) => !v)}
                  className="flex w-full items-center justify-between rounded-xl bg-neutral-100 px-4 py-3 font-medium text-neutral-700"
                >
                  <span className="flex items-center gap-2">
                    <VehicleIcon className="h-5 w-5 text-neutral-500" />
                    {selectedVehicle}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 text-neutral-400 transition-transform ${mobileCarOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {mobileCarOpen && (
                  <div className="space-y-1 pt-1">
                    {vehicleOptions.map((item) => (
                      <a
                        key={item.label}
                        onClick={() => selectVehicle(item.label)}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl px-4 py-2.5 pl-10 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 ${
                          selectedVehicle === item.label ? "bg-blue-50 font-medium text-blue-600" : ""
                        }`}
                      >
                        <item.icon className="h-4 w-4 text-blue-500" />
                        {item.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {!hideNav && variant === "states" && selectedVehicle !== "CDL" && (
            <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
              <button
                onClick={() => setMobileTestTypeOpen((v) => !v)}
                className="flex w-full items-center justify-between rounded-xl bg-neutral-100 px-4 py-3 font-medium text-neutral-700"
              >
                <span className="flex items-center gap-2">
                  <TestTypeIcon className="h-5 w-5 text-neutral-500" />
                  {selectedTestType}
                </span>
                <ChevronDown
                  className={`h-5 w-5 text-neutral-400 transition-transform ${mobileTestTypeOpen ? "rotate-180" : ""}`}
                />
              </button>
              {mobileTestTypeOpen && (
                <div className="space-y-1 pt-1">
                  {testTypeOptions.map((item) => (
                    <a
                      key={item.label}
                      onClick={() => selectTestType(item.label)}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl px-4 py-2.5 pl-10 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 ${
                        selectedTestType === item.label ? "bg-blue-50 font-medium text-blue-600" : ""
                      }`}
                    >
                      <item.icon className="h-4 w-4 text-blue-500" />
                      {item.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mt-4 flex justify-center gap-3 border-t border-gray-100 pt-4">
            {user ? (
              <PublicAccountMenu user={user} />
            ) : (
              <>
                <Button className="flex-1 justify-center py-3! font-medium" variant="ghost" href="/login">
                  Login
                </Button>
                <Button className="flex-1 justify-center py-3! font-semibold" href="/register">
                  Signup
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
