"use client";

import {
  Bike,
  Car,
  ChevronDown,
  Gem,
  GraduationCap,
  Info,
  Mail,
  MapPin,
  MessagesSquare,
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

type Dropdown = null | "states" | "car" | "testType" | "help";

/** Where "Send email" goes. Empty until a support address is published — the item then falls back
 * to the contact page rather than opening a mail client addressed to nobody. */
const SUPPORT_EMAIL = "";

/** Live chat needs a provider widget; until one is wired up the item points at the contact page. */
const LIVE_CHAT_URL = "";

const helpOptions = [
  { label: "Help center", icon: Info, href: "/how-it-works" },
  {
    label: "Live Chat",
    icon: MessagesSquare,
    href: LIVE_CHAT_URL || "/contact",
  },
  {
    label: "Send email",
    icon: Mail,
    href: SUPPORT_EMAIL ? `mailto:${SUPPORT_EMAIL}` : "/contact",
  },
];

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
  { label: "Permit Tests", value: "permit_test", icon: GraduationCap },
  { label: "Driving Test", value: "driving_test", icon: Route },
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
  const {
    selectedState,
    hasStoredState,
    selectedVehicle,
    setSelectedVehicle,
    selectedTestType,
    setSelectedTestType,
  } = useWebLayout();
  const [activeDropdown, setActiveDropdown] = useState<Dropdown>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileStatesOpen, setMobileStatesOpen] = useState(false);
  const [mobileCarOpen, setMobileCarOpen] = useState(false);
  const [mobileTestTypeOpen, setMobileTestTypeOpen] = useState(false);
  const [mobileHelpOpen, setMobileHelpOpen] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);
  const helpRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      // Both menu groups have to be checked: the state/vehicle/test-type dropdowns live inside
      // the nav, but Help sits in the actions bar beside it. Testing the nav alone meant a click
      // on Help counted as "outside" and closed the menu in the same click that opened it.
      const inside = [navRef.current, helpRef.current].some(
        (el) => el && el.contains(e.target as Node),
      );

      if (!inside) {
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

  function selectTestType(testTypeValue: string) {
    setSelectedTestType(testTypeValue);
    setActiveDropdown(null);
    setMobileTestTypeOpen(false);
    setMobileMenuOpen(false);
  }

  function toggleDropdown(menu: Dropdown) {
    setActiveDropdown((current) => (current === menu ? null : menu));
  }

  const VehicleIcon =
    vehicleOptions.find((v) => v.label === selectedVehicle)?.icon ?? Car;
  const selectedTestTypeOption =
    testTypeOptions.find((t) => t.value === selectedTestType) ??
    testTypeOptions[0];
  const TestTypeIcon = selectedTestTypeOption.icon;
  const showNav = !hideNav && (variant === "states" || hasStoredState);

  return (
    <header className="relative w-full px-5 py-2 lg:py-3">
      <div className="mx-auto flex max-w-container items-center justify-between">
        <Link href="/">
          <Image
            src="/driving-test-logo.png"
            alt="Driving Test"
            width={529}
            height={198}
            className="h-[100px] w-auto"
            priority
          />
        </Link>

        {showNav && (
          <nav ref={navRef} className="hidden items-center gap-4 lg:flex">
            <div className="relative">
              <button
                onClick={() => toggleDropdown("states")}
                className="flex h-11.5 items-center gap-2 rounded-full bg-blue-50 dark:bg-blue-500/10 p-3 text-base font-medium text-blue-700 dark:text-blue-300 transition-shadow hover:shadow-md"
              >
                <MapPin className="h-6 w-6 text-blue-500" />
                {selectedState}
                <ChevronDown className="h-5 w-5 text-blue-400" />
              </button>

              {activeDropdown === "states" && (
                <div className="absolute top-full left-0 z-50 mt-2 w-145 rounded-2xl border border-gray-100 dark:border-white/10 bg-white dark:bg-neutral-800 p-4 shadow-xl">
                  <p className="mb-3 text-xs font-semibold tracking-wide text-neutral-400 dark:text-neutral-500 uppercase">
                    Select State
                  </p>
                  <div className="grid grid-cols-3 gap-0.5 text-sm">
                    {usStates.map((state) => (
                      <Link
                        key={state}
                        href={stateHref(state)}
                        onClick={closeStateDropdown}
                        className={`cursor-pointer rounded-lg px-3 py-1.5 text-neutral-700 dark:text-neutral-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 ${
                          selectedState === state
                            ? "bg-blue-50 dark:bg-blue-500/10 font-medium text-blue-600 dark:text-blue-400"
                            : ""
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
                className="flex h-11.5 items-center gap-2 rounded-full bg-neutral-100 dark:bg-neutral-700 p-3 text-base font-medium text-neutral-700 dark:text-neutral-300 transition-shadow hover:shadow-md"
              >
                <VehicleIcon className="h-6 w-6 text-neutral-500 dark:text-neutral-400" />
                {selectedVehicle}
                <ChevronDown className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
              </button>

              {activeDropdown === "car" && (
                <div className="absolute top-full left-0 z-50 mt-2 w-52 rounded-2xl border border-gray-100 dark:border-white/10 bg-white dark:bg-neutral-800 py-2 shadow-xl">
                  {vehicleOptions.map((item) => (
                    <a
                      key={item.label}
                      onClick={() => selectVehicle(item.label)}
                      className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-neutral-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 ${
                        selectedVehicle === item.label
                          ? "bg-blue-50 dark:bg-blue-500/10 font-medium text-blue-600 dark:text-blue-400"
                          : ""
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
                  className="flex h-11.5 items-center gap-2 rounded-full bg-neutral-100 dark:bg-neutral-700 p-3 text-base font-medium text-neutral-700 dark:text-neutral-300 transition-shadow hover:shadow-md"
                >
                  <TestTypeIcon className="h-6 w-6 text-neutral-500 dark:text-neutral-400" />
                  {selectedTestTypeOption.label}
                  <ChevronDown className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
                </button>

                {activeDropdown === "testType" && (
                  <div className="absolute top-full left-0 z-50 mt-2 w-52 rounded-2xl border border-gray-100 dark:border-white/10 bg-white dark:bg-neutral-800 py-2 shadow-xl">
                    {testTypeOptions.map((item) => (
                      <a
                        key={item.value}
                        onClick={() => selectTestType(item.value)}
                        className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-neutral-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 ${
                          selectedTestType === item.value
                            ? "bg-blue-50 dark:bg-blue-500/10 font-medium text-blue-600 dark:text-blue-400"
                            : ""
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

        <div className="hidden items-center gap-6 lg:flex">
          {/* Support links are for people with an account — signed-out visitors don't see them. */}
          {user && (
            <div className="relative" ref={helpRef}>
              <button
                onClick={() => toggleDropdown("help")}
                className="flex items-center gap-1.5 rounded-full px-2 py-1 text-base font-medium text-neutral-900 dark:text-neutral-100"
              >
                Help
                <ChevronDown className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
              </button>

              {activeDropdown === "help" && (
                <div className="absolute top-full right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl dark:border-white/10 dark:bg-neutral-800">
                  {helpOptions.map((item, index) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setActiveDropdown(null)}
                      className={`flex items-center gap-3 px-4 py-3.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 dark:text-neutral-300 dark:hover:bg-blue-500/10 dark:hover:text-blue-400 ${
                        index > 0
                          ? "border-t border-gray-100 dark:border-white/10"
                          : ""
                      }`}
                    >
                      <item.icon className="h-5 w-5 text-blue-500" />
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
          {user ? (
            <PublicAccountMenu user={user} />
          ) : (
            <>
              <Button
                className="p-3! font-medium"
                variant="ghost"
                href="/login"
              >
                Login
              </Button>
              <Button
                size="md"
                variant="gold"
                className="gap-2 bg-yellow-500! font-semibold text-neutral-700 dark:text-neutral-300! shadow-xs hover:bg-yellow-600!"
                href="/pricing"
              >
                <Gem className="h-5 w-5" />
                Upgrade to Premium
              </Button>
            </>
          )}
        </div>

        <button
          className="flex items-center justify-center rounded-lg p-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 lg:hidden"
          onClick={() => setMobileMenuOpen((v) => !v)}
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="absolute top-full right-4 left-4 z-50 mt-2 rounded-2xl border border-gray-100 dark:border-white/10 bg-white dark:bg-neutral-800 p-5 shadow-xl lg:hidden">
          {showNav && (
            <>
              <button
                onClick={() => setMobileStatesOpen((v) => !v)}
                className="flex w-full items-center justify-between rounded-xl bg-blue-50 dark:bg-blue-500/10 px-4 py-3 font-medium text-blue-700 dark:text-blue-300"
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
                  <p className="mb-2 text-xs font-semibold tracking-wide text-gray-400 dark:text-neutral-500 uppercase">
                    Select State
                  </p>
                  <div className="grid grid-cols-2 gap-0.5 text-sm">
                    {usStates.map((state) => (
                      <Link
                        key={state}
                        href={stateHref(state)}
                        onClick={closeStateDropdown}
                        className={`cursor-pointer rounded-lg px-3 py-2 text-gray-700 dark:text-neutral-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 ${
                          selectedState === state
                            ? "bg-blue-50 dark:bg-blue-500/10 font-medium text-blue-600 dark:text-blue-400"
                            : ""
                        }`}
                      >
                        {state}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 space-y-2 border-t border-gray-100 dark:border-white/10 pt-4">
                <button
                  onClick={() => setMobileCarOpen((v) => !v)}
                  className="flex w-full items-center justify-between rounded-xl bg-neutral-100 dark:bg-neutral-700 px-4 py-3 font-medium text-neutral-700 dark:text-neutral-300"
                >
                  <span className="flex items-center gap-2">
                    <VehicleIcon className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
                    {selectedVehicle}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 text-neutral-400 dark:text-neutral-500 transition-transform ${mobileCarOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {mobileCarOpen && (
                  <div className="space-y-1 pt-1">
                    {vehicleOptions.map((item) => (
                      <a
                        key={item.label}
                        onClick={() => selectVehicle(item.label)}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl px-4 py-2.5 pl-10 text-sm text-gray-600 dark:text-neutral-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 ${
                          selectedVehicle === item.label
                            ? "bg-blue-50 dark:bg-blue-500/10 font-medium text-blue-600 dark:text-blue-400"
                            : ""
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
            <div className="mt-4 space-y-2 border-t border-gray-100 dark:border-white/10 pt-4">
              <button
                onClick={() => setMobileTestTypeOpen((v) => !v)}
                className="flex w-full items-center justify-between rounded-xl bg-neutral-100 dark:bg-neutral-700 px-4 py-3 font-medium text-neutral-700 dark:text-neutral-300"
              >
                <span className="flex items-center gap-2">
                  <TestTypeIcon className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
                  {selectedTestTypeOption.label}
                </span>
                <ChevronDown
                  className={`h-5 w-5 text-neutral-400 dark:text-neutral-500 transition-transform ${mobileTestTypeOpen ? "rotate-180" : ""}`}
                />
              </button>
              {mobileTestTypeOpen && (
                <div className="space-y-1 pt-1">
                  {testTypeOptions.map((item) => (
                    <a
                      key={item.value}
                      onClick={() => selectTestType(item.value)}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl px-4 py-2.5 pl-10 text-sm text-gray-600 dark:text-neutral-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 ${
                        selectedTestType === item.value
                          ? "bg-blue-50 dark:bg-blue-500/10 font-medium text-blue-600 dark:text-blue-400"
                          : ""
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

          {/* Help lives in the desktop bar too — repeated here because that bar is hidden
              below lg, and support links shouldn't drop off on a phone. Signed-in only,
              matching the desktop bar. */}
          {user && (
            <div className={showNav ? "mt-4" : ""}>
              <button
                onClick={() => setMobileHelpOpen((v) => !v)}
                className="flex w-full items-center justify-between rounded-xl px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100"
              >
                <span className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-500" />
                  Help
                </span>
                <ChevronDown
                  className={`h-5 w-5 text-neutral-400 dark:text-neutral-500 transition-transform ${mobileHelpOpen ? "rotate-180" : ""}`}
                />
              </button>

              {mobileHelpOpen && (
                <div className="mt-1 flex flex-col">
                  {helpOptions.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-4 py-2.5 pl-10 text-sm text-gray-600 dark:text-neutral-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/10 dark:hover:text-blue-400"
                    >
                      <item.icon className="h-4 w-4 text-blue-500" />
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mt-4 flex justify-center gap-3 border-t border-gray-100 dark:border-white/10 pt-4">
            {user ? (
              <PublicAccountMenu user={user} />
            ) : (
              <>
                <Button
                  className="flex-1 justify-center py-3! font-medium"
                  variant="ghost"
                  href="/login"
                >
                  Login
                </Button>
                <Button
                  size="md"
                  variant="gold"
                  className="flex-1 justify-center gap-2 bg-yellow-500! font-semibold text-neutral-700 dark:text-neutral-300! shadow-xs hover:bg-yellow-600!"
                  href="/pricing"
                >
                  <Gem className="h-5 w-5" />
                  Upgrade to Premium
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
