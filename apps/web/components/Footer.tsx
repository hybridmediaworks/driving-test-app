"use client";

import Image from "next/image";
import Link from "next/link";
import Paragraph from "@/components/ui/Paragraph";
import { stateToSlug } from "@/lib/usStates";
import { useWebLayout } from "@/lib/web-layout-context";

export default function Footer() {
  const { selectedState } = useWebLayout();
  const stateSlug = selectedState ? stateToSlug(selectedState) : "";

  return (
    <footer className="px-6 py-10 lg:py-30">
      <div className="mx-auto max-w-container space-y-15">
        <Image src="/company-logo.svg" alt="Company logo" width={146} height={48} className="h-10 w-auto" />

        <div className="flex flex-wrap justify-between gap-10">
          <div className="space-y-6 md:w-[45%] lg:w-auto">
            <Paragraph size="xl" color="dark" className="font-semibold">
              Car
            </Paragraph>
            <div className="grid grid-cols-1 gap-4">
              <Link href={stateSlug ? `/${stateSlug}` : "/quizzes?vehicle_type=car"} className="text-base text-neutral-700 hover:text-neutral-800">
                Practice Test
              </Link>
              <Link href="/exam-simulator" className="text-base text-neutral-700 hover:text-neutral-800">
                Exam Simulator
              </Link>
              <Link href="/cheat-sheets" className="text-base text-neutral-700 hover:text-neutral-800">
                Cheat Sheets
              </Link>
              <Link href="/how-it-works" className="text-base text-neutral-700 hover:text-neutral-800">
                Beginner&apos;s Guide
              </Link>
            </div>
          </div>

          <div className="space-y-6 md:w-[45%] lg:w-auto">
            <Paragraph size="xl" color="dark" className="font-semibold">
              CDL
            </Paragraph>
            <div className="grid grid-cols-1 gap-4">
              <Link href={stateSlug ? `/${stateSlug}/cdl` : "/quizzes?vehicle_type=cdl"} className="text-base text-neutral-700 hover:text-neutral-800">
                CDL Practice Test
              </Link>
              <Link href="/cheat-sheets" className="text-base text-neutral-700 hover:text-neutral-800">
                CDL Cheat Sheets
              </Link>
            </div>
          </div>

          <div className="space-y-6 md:w-[45%] lg:w-auto">
            <Paragraph size="xl" color="dark" className="font-semibold">
              Bike
            </Paragraph>
            <div className="grid grid-cols-1 gap-4">
              <Link href={stateSlug ? `/${stateSlug}/motorcycle` : "/quizzes?vehicle_type=motorcycle"} className="text-base text-neutral-700 hover:text-neutral-800">
                Motorcycle Practice Test
              </Link>
              <Link href="/exam-simulator" className="text-base text-neutral-700 hover:text-neutral-800">
                Exam Simulator
              </Link>
              <Link href="/cheat-sheets" className="text-base text-neutral-700 hover:text-neutral-800">
                Cheat Sheets
              </Link>
            </div>
          </div>

          <div className="w-[45%] space-y-6 lg:w-auto">
            <Paragraph size="xl" color="dark" className="font-semibold">
              Account
            </Paragraph>
            <div className="grid grid-cols-1 gap-4">
              <Link href="/pricing" className="text-base text-neutral-700 hover:text-neutral-800">
                Pricing
              </Link>
              <Link href="/dashboard" className="text-base text-neutral-700 hover:text-neutral-800">
                Dashboard
              </Link>
              <Link href="/login" className="text-base text-neutral-700 hover:text-neutral-800">
                Login
              </Link>
              <Link href="/register" className="text-base text-neutral-700 hover:text-neutral-800">
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
