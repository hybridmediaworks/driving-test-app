"use client";

import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import Button from "@/components/ui/Button";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import DrivingTests from "@/components/state/DrivingTests";
import LineChart from "@/components/state/LineChart";
import { isValidState, slugToStateName, stateAbbreviations, stateToSlug } from "@/lib/usStates";
import { useWebLayout } from "@/lib/web-layout-context";

export default function StateLandingPage({ state = "" }: { state?: string }) {
  const router = useRouter();
  // WebLayoutProvider is rendered by the page's root, so `selectedState` acts
  // as a fallback only when the route itself doesn't carry a state slug.
  const { selectedState } = useWebLayout();

  const propStateName = state ? slugToStateName(state) : "";
  const stateName = (isValidState(propStateName) ? propStateName : "") || selectedState || "Oregon";
  const stateAbbr = stateAbbreviations[stateName] || "OR";
  const stateSlug = state || stateToSlug(stateName);

  function goToWrittenTest() {
    router.push(`/${stateSlug}/dmv-written-test`);
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header variant="states" />
      <main className="flex-1">
        <section className="px-3.5 py-10">
          <div className="mx-auto max-w-container">
            <div className="flex gap-4">
              <div className="w-3/5 space-y-3">
                <h1 className="text-[44px] leading-tight font-bold">
                  {stateAbbr} DMV Permit Test - Requirements, Study Guide & Practice
                </h1>
                <p>
                  Practice with <strong>real exam-like questions</strong> that mirror your {stateName} DMV permit
                  test - same format, same difficulty, same tricky answer choices.
                </p>
                <div className="flex items-center space-x-2.5 divide-x divide-[#D1D5DC]">
                  <a className="inline-flex items-center gap-2 pr-2" href="">
                    <span className="inline-flex items-center gap-2">
                      <svg width="93px" viewBox="0 0 93 18" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="m18.881 7.0472h-7.1913l-2.2137-6.7034-2.2268 6.7034-7.1913-0.01286 5.8159 4.1478-2.2268 6.7034 5.8159-4.1479 5.8159 4.1479-2.2137-6.7034 5.8159-4.135z"
                          fill="#00B67A"
                        />
                        <path d="m13.562 12.697-0.4977-1.5154-3.5891 2.5555 4.0868-1.0401z" fill="#005128" />
                        <path
                          d="m36.887 7.0472h-6.8128l-2.0972-6.7034-2.1096 6.7034-6.8128-0.01286 5.5098 4.1478-2.1096 6.7034 5.5098-4.1479 5.5098 4.1479-2.0972-6.7034 5.5098-4.135z"
                          fill="#00B67A"
                        />
                        <path d="m31.849 12.697-0.4716-1.5154-3.4002 2.5555 3.8718-1.0401z" fill="#005128" />
                        <path
                          d="m55.881 7.0472h-7.1913l-2.2137-6.7034-2.2268 6.7034-7.1913-0.01286 5.8159 4.1478-2.2268 6.7034 5.8159-4.1479 5.8159 4.1479-2.2137-6.7034 5.8159-4.135z"
                          fill="#00B67A"
                        />
                        <path d="m50.562 12.697-0.4977-1.5154-3.5891 2.5555 4.0868-1.0401z" fill="#005128" />
                        <path
                          d="m73.887 7.0472h-6.8128l-2.0972-6.7034-2.1096 6.7034-6.8128-0.01286 5.5098 4.1478-2.1096 6.7034 5.5098-4.1479 5.5098 4.1479-2.0972-6.7034 5.5098-4.135z"
                          fill="#00B67A"
                        />
                        <path d="m68.849 12.697-0.4716-1.5154-3.4002 2.5555 3.8718-1.0401z" fill="#005128" />
                        <path
                          d="m92.881 7.0472h-7.1913l-2.2137-6.7034-2.2268 6.7034-7.1913-0.01286 5.8159 4.1478-2.2268 6.7034 5.8159-4.1479 5.8159 4.1479-2.2137-6.7034 5.8159-4.135z"
                          fill="#00B67A"
                        />
                        <path d="m87.562 12.697-0.4977-1.5154-3.5891 2.5555 4.0868-1.0401z" fill="#005128" />
                      </svg>
                      <span className="text-sm font-semibold text-[#00B67A]">4.7/5</span>
                    </span>
                    <span className="text-sm font-semibold">from 16,700+ students</span>
                  </a>
                  <p className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path
                          d="M12.8973 10.7422L14.1598 17.8472C14.1739 17.9309 14.1622 18.0168 14.1261 18.0936C14.0901 18.1705 14.0315 18.2344 13.9581 18.277C13.8847 18.3196 13.8 18.3388 13.7155 18.3319C13.6309 18.3251 13.5504 18.2926 13.4848 18.2389L10.5015 15.9997C10.3574 15.8921 10.1825 15.834 10.0027 15.834C9.82294 15.834 9.64798 15.8921 9.50396 15.9997L6.51563 18.238C6.45006 18.2917 6.36968 18.3241 6.28521 18.331C6.20073 18.3378 6.11619 18.3187 6.04285 18.2762C5.9695 18.2338 5.91086 18.17 5.87473 18.0933C5.83859 18.0166 5.8267 17.9308 5.84063 17.8472L7.10229 10.7422"
                          stroke="#007AFF"
                          strokeWidth="1.66667"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M10 11.666C12.7614 11.666 15 9.42744 15 6.66602C15 3.90459 12.7614 1.66602 10 1.66602C7.23858 1.66602 5 3.90459 5 6.66602C5 9.42744 7.23858 11.666 10 11.666Z"
                          stroke="#007AFF"
                          strokeWidth="1.66667"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="text-sm font-semibold text-blue-primary">97%</span>
                    </span>
                    <span className="text-sm font-semibold">pass rate with Premium</span>
                  </p>
                </div>
                <div className="mt-4 flex gap-3">
                  <Button onClick={goToWrittenTest}>
                    Start {stateAbbr} DMV permit practice test
                    <ChevronRight />
                  </Button>
                  <Button variant="outline">
                    View All Tests
                    <ChevronRight />
                  </Button>
                </div>
              </div>
              <div className="w-2/5">
                <div className="relative rounded-3xl border-[0.5px] border-[#e5e7eb80] p-3 shadow-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/oregon-drivers-license.avif" alt="" className="rounded-2xl" />
                  <div className="absolute -bottom-3.5 left-1/2 flex max-w-fit -translate-x-1/2 items-center gap-2 rounded-full border bg-white px-3 py-2 shadow-xl">
                    <div className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                    </div>
                    <span className="text-sm lg:whitespace-nowrap">
                      Active learners today: <b>33</b>
                    </span>
                    <span className="rounded-full bg-green-400/30 px-2 py-1 text-xs font-semibold text-green-500">LIVE</span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <ul className="my-2 flex flex-col gap-1 text-grey sm:flex-row sm:gap-0 sm:text-base md:text-lg">
                <li className="text-sm font-semibold after:mx-2 after:hidden after:content-['•'] last:after:content-none sm:after:inline">
                  5-min quizzes
                </li>
                <li className="text-sm font-semibold after:mx-2 after:hidden after:content-['•'] last:after:content-none sm:after:inline">
                  No signup required
                </li>
              </ul>
              <p className="text-base">
                Making it to a lovely hike in Mt. Hood or taking the trip to see the Ducks play the Beavers in the
                statewide &ldquo;civil war&rdquo; is significantly easier if you don&apos;t need someone else to
                drive you. This site has step-by-step instructions that include everything you need to make your
                trip to the {stateName} DMV stress-free. Whether you are looking to get a learner&apos;s permit,
                renew your license to drive a car, getting one for the first time, or looking to ride a motorcycle
                or Mack truck, we&apos;ve put together DMV practice tests for you.
              </p>
            </div>
            <div className="my-6 text-center">
              <h4 className="mb-2 text-sm font-semibold">Recommended by DMVs and safety organizations</h4>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/partner-logos-v2.svg" alt="" className="w-full" />
            </div>
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-2xl font-bold">How {stateAbbr} students are practicing (last 30 days)</h3>
                <p className="text-sm text-grey">Last updated: 51 minutes ago</p>
              </div>
              <div className="grid grid-cols-6 justify-between gap-2">
                <div className="space-y-2.5 rounded-xl bg-[#F2F7FF] p-2.5">
                  <p className="text-sm text-grey lg:whitespace-nowrap">Students practiced</p>
                  <div className="flex items-start gap-1">
                    <h4 className="text-lg font-semibold">9.1k</h4>
                    <LineChart />
                  </div>
                </div>
                <div className="space-y-2.5 rounded-xl bg-[#F2F7FF] p-2.5">
                  <p className="text-sm text-grey lg:whitespace-nowrap">Questions answered</p>
                  <div className="flex items-start gap-1">
                    <h4 className="text-lg font-semibold">166.1K</h4>
                    <LineChart />
                  </div>
                </div>
                <div className="space-y-2.5 rounded-xl bg-[#F2F7FF] p-2.5">
                  <p className="text-sm text-grey lg:whitespace-nowrap">Avg. session length</p>
                  <div className="flex items-start gap-1">
                    <h4 className="text-lg font-semibold">18 min</h4>
                    <LineChart />
                  </div>
                </div>
                <div className="space-y-2.5 rounded-xl bg-[#F2F7FF] p-2.5">
                  <p className="text-sm text-grey lg:whitespace-nowrap">Combined practice</p>
                  <p className="text-lg font-semibold">33 days</p>
                </div>
                <div className="space-y-2.5 rounded-xl bg-[#F2F7FF] p-2.5">
                  <p className="text-sm text-grey lg:whitespace-nowrap">Peak time</p>
                  <p className="text-lg font-semibold">1PM on Mon</p>
                </div>
                <div className="space-y-2.5 rounded-xl bg-[#F2F7FF] p-2.5">
                  <p className="text-sm text-grey lg:whitespace-nowrap">Study intensity rank</p>
                  <p className="text-lg font-semibold">#1 nationwide</p>
                </div>
              </div>
            </div>
            <DrivingTests state={stateSlug} />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
