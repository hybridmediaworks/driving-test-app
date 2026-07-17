"use client";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import CTASection from "@/components/home/CTASection";
import FAQSection from "@/components/home/FAQSection";
import SuccessStories from "@/components/home/SuccessStories";
import Button from "@/components/ui/Button";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import { Separator } from "@/components/ui/separator";
import { WebLayoutProvider } from "@/lib/web-layout-context";
import { ArrowRight, Check, ChevronDown, Minus } from "lucide-react";
import { Fragment, useState } from "react";

type CompareValue = string | boolean;

type CompareRow = {
  feature: string;
  learner: CompareValue;
  pro: CompareValue;
  teams: CompareValue;
  extra?: boolean;
};

const compareRows: CompareRow[] = [
  {
    feature: "Question bank",
    learner: "50 questions",
    pro: "1,500+ per state",
    teams: "1,500+ per state",
  },
  {
    feature: "Mock exams",
    learner: "3 total",
    pro: "Unlimited",
    teams: "Unlimited",
  },
  { feature: "AI Tutor", learner: false, pro: true, teams: true },
  { feature: "DMV simulation mode", learner: false, pro: true, teams: true },
  { feature: "Pass guarantee", learner: false, pro: true, teams: true },
  {
    feature: "Instructor dashboard & reports",
    learner: false,
    pro: false,
    teams: true,
  },
  {
    feature: "Progress analytics",
    learner: "Basic",
    pro: "Advanced",
    teams: "Advanced + team reports",
    extra: true,
  },
  {
    feature: "Offline access",
    learner: false,
    pro: true,
    teams: true,
    extra: true,
  },
  {
    feature: "Support",
    learner: "Community forum",
    pro: "Priority email",
    teams: "Priority + phone",
    extra: true,
  },
  {
    feature: "Data export",
    learner: false,
    pro: true,
    teams: true,
    extra: true,
  },
  {
    feature: "Custom branding",
    learner: false,
    pro: false,
    teams: true,
    extra: true,
  },
];

function CompareCell({ value }: { value: CompareValue }) {
  if (typeof value === "string") {
    return <Paragraph className="text-center">{value}</Paragraph>;
  }
  return value ? (
    <Check className="mx-auto h-4.5 w-4.5 text-blue-600" />
  ) : (
    <Minus className="mx-auto h-4.5 w-4.5 text-neutral-300" />
  );
}

export default function Pricing() {
  const [showAllRows, setShowAllRows] = useState(false);
  const visibleRows = showAllRows
    ? compareRows
    : compareRows.filter((row) => !row.extra);

  return (
    <WebLayoutProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="home" />
        <main className="flex-1">
          <section className="py-15 md:space-y-15 lg:py-30">
            <div className="mx-auto max-w-container space-y-12 px-5">
              <div className="flex flex-col items-center justify-center gap-4 max-w-225 mx-auto">
                <Paragraph
                  className="mb-2 border-b border-blue-50 px-3.5 py-1.25 font-bold tracking-[1.2px] uppercase"
                  size="xs"
                  color="primary"
                >
                  ✦ Pricing
                </Paragraph>
                <Heading as="h1" className="text-center">
                  One Plan Gets You the Card. Pick how You Pay for it.
                </Heading>
                <Paragraph className="max-w-156 text-center" size="xl">
                  Start free, upgrade when you're ready to make test day a
                  formality. No contracts. Cancel in two clicks.
                </Paragraph>
              </div>
              <div className="p-1 rounded-full border shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]  max-w-fit mx-auto flex items-center">
                <Paragraph className="px-5 py-2.5 font-semibold" size="2xl">
                  Monthly
                </Paragraph>
                <Paragraph
                  size="2xl"
                  className="px-5 py-2.5 font-semibold shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)] rounded-full bg-white"
                  color="primary"
                >
                  <span className="bg-blue-500/12 rounded-full px-2.5 py-1 mr-2">
                    Save 33%
                  </span>
                  Yearly
                </Paragraph>
              </div>
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                <div className="lg:my-11.5 space-y-5 rounded-xl bg-white p-8 border shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)] flex flex-col justify-between">
                  <div className="space-y-5">
                    <Paragraph
                      size="2xl"
                      className="font-semibold mb-4"
                      color="dark"
                    >
                      Learner
                    </Paragraph>
                    <Paragraph>Per learner. No credit card required.</Paragraph>
                    <div className="flex items-end gap-2 mb-4">
                      <Heading as="h2">$0</Heading>
                      <Paragraph className="pb-2"> / forever </Paragraph>
                    </div>
                    <Paragraph>
                      Try the real thing before you pay anything.
                    </Paragraph>
                    <Separator />
                    <div className="space-y-2">
                      <Paragraph className="flex gap-2 items-start">
                        <Check className="text-blue-500 mt-0.5" />
                        <span>
                          <strong className="font-semibold">
                            50 practice questions
                          </strong>{" "}
                          for your state
                        </span>
                      </Paragraph>
                      <Paragraph className="flex gap-2 items-start">
                        <Check className="text-blue-500 mt-0.5" />3 full mock
                        exams
                      </Paragraph>
                      <Paragraph className="flex gap-2 items-start">
                        <Check className="text-blue-500 mt-0.5" />
                        Road signs guide
                      </Paragraph>
                      <Paragraph className="flex gap-2 items-start">
                        <Check className="text-blue-500 mt-0.5" />
                        Basic progress tracking
                      </Paragraph>
                    </div>
                  </div>
                  <Button variant="outline" className="rounded-[8px]! w-full">
                    Start Free
                  </Button>
                </div>
                <div className="space-y-5 rounded-xl relative bg-white p-8 border border-blue-600 shadow-[0_24px_50px_-26px_rgba(20,60,120,0.25),0_4px_6px_-2px_rgba(20,60,120,0.03)]">
                  <div className="absolute left-0 flex items-center w-full justify-center -mt-11.5">
                    <Paragraph
                      className="px-3 pb-0.5 rounded-full font-semibold bg-linear-to-r from-blue-500 to-blue-700"
                      color="white"
                    >
                      Most popular
                    </Paragraph>
                  </div>
                  <Paragraph
                    size="2xl"
                    className="font-semibold mb-4"
                    color="dark"
                  >
                    Pro
                  </Paragraph>
                  <Paragraph>
                    Everything DriveLane can do, until you pass.
                  </Paragraph>
                  <div className="flex items-end gap-2 mb-4">
                    <Heading as="h2">$8</Heading>
                    <Paragraph className="pb-2"> / month </Paragraph>
                  </div>
                  <Paragraph>
                    <strong className="font-semibold">
                      Billed $96 once a year —
                    </strong>{" "}
                    vs $144 paid monthly.
                  </Paragraph>
                  <Separator />
                  <div className="space-y-2">
                    <Paragraph className="flex gap-2 items-start">
                      <Check className="text-blue-500 mt-0.5" />{" "}
                      <span>
                        <strong className="font-semibold">
                          Everything in Learner,
                        </strong>{" "}
                        plus:
                      </span>
                    </Paragraph>
                    <Paragraph className="flex gap-2 items-start">
                      <Check className="text-blue-500 mt-0.5" />
                      <span>
                        <strong className="font-semibold">
                          Full question bank
                        </strong>{" "}
                        — 1,500+ state-specific questions
                      </span>
                    </Paragraph>
                    <Paragraph className="flex gap-2 items-start">
                      <Check className="text-blue-500 mt-0.5" />{" "}
                      <span>
                        Unlimited mock exams +{" "}
                        <strong className="font-semibold">
                          DMV simulation mode
                        </strong>
                      </span>
                    </Paragraph>
                    <Paragraph className="flex gap-2 items-start">
                      <Check className="text-blue-500 mt-0.5" />
                      <span>
                        <strong className="font-semibold">AI Tutor</strong> —
                        explains every answer you miss
                      </span>
                    </Paragraph>
                    <Paragraph className="flex gap-2 items-start">
                      <Check className="text-blue-500 mt-0.5" />
                      Voice learning, flashcards & video lessons
                    </Paragraph>
                    <Paragraph className="flex gap-2 items-start">
                      <Check className="text-blue-500 mt-0.5" />
                      <span>
                        <strong className="font-semibold">
                          Pass guarantee
                        </strong>{" "}
                        — fail your test, get your money back*
                      </span>
                    </Paragraph>
                  </div>
                  <Button className="w-full">
                    Get started with Pro <ArrowRight />
                  </Button>
                </div>
                <div className="lg:my-11.5 space-y-5 rounded-xl bg-white p-8 border shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)] flex flex-col justify-between">
                  <div className="space-y-5">
                    <Paragraph
                      size="2xl"
                      className="font-semibold mb-4"
                      color="dark"
                    >
                      Teams
                    </Paragraph>
                    <Paragraph>
                      For driving schools, fleets and families.
                    </Paragraph>
                    <div className="flex items-end gap-2 mb-4">
                      <Heading as="h2">$0</Heading>
                      <Paragraph className="pb-2"> / seat / month </Paragraph>
                    </div>
                    <Paragraph>
                      <strong className="font-semibold">Billed yearly.</strong>{" "}
                      5-seat minimum — from $360/year.
                    </Paragraph>
                    <Separator />
                    <div className="space-y-2">
                      <Paragraph className="flex gap-2 items-start">
                        <Check className="text-blue-500 mt-0.5" />
                        <span>
                          <strong className="font-semibold">
                            Everything in Pro
                          </strong>{" "}
                          , for every seat
                        </span>
                      </Paragraph>
                      <Paragraph className="flex gap-2 items-start">
                        <Check className="text-blue-500 mt-0.5" />
                        <span>
                          <strong className="font-semibold">
                            Instructor dashboard
                          </strong>{" "}
                          with per-learner progress
                        </span>
                      </Paragraph>
                      <Paragraph className="flex gap-2 items-start">
                        <Check className="text-blue-500 mt-0.5" />
                        Add and remove seats as classes change
                      </Paragraph>
                      <Paragraph className="flex gap-2 items-start">
                        <Check className="text-blue-500 mt-0.5" />
                        Consolidated billing & invoicing
                      </Paragraph>
                      <Paragraph className="flex gap-2 items-start">
                        <Check className="text-blue-500 mt-0.5" />
                        Priority support
                      </Paragraph>
                    </div>
                  </div>
                  <Button variant="outline" className="rounded-[8px]! w-full">
                    Talk to sales
                  </Button>
                </div>
              </div>
              <Paragraph size="sm" color="muted" className="text-center">
                Prices in USD. *Pass guarantee: full refund if you fail your
                official knowledge test after completing your DriveLane
                readiness path — see terms. Pricing shown is illustrative —
                [CLIENT TO CONFIRM].
              </Paragraph>
            </div>
          </section>
          <section className="py-15 md:space-y-15 lg:py-30 bg-[#F2F1EC]">
            <div className="mx-auto max-w-container space-y-12 px-5">
              <div className="flex flex-col items-center justify-center gap-4 max-w-141.5 mx-auto">
                <Paragraph
                  className="mb-2 border-b border-blue-50 px-3.5 py-1.25 font-bold tracking-[1.2px] uppercase"
                  size="xs"
                  color="primary"
                >
                  ✦ Compare Plans
                </Paragraph>
                <Heading as="h2" className="text-center">
                  The differences that actually matter
                </Heading>
                <Paragraph className="max-w-130 text-center">
                  Most people decide on these rows. The full feature matrix is
                  below if you want every detail.
                </Paragraph>
              </div>
              <div className="rounded-3xl bg-white border-border shadow-[0_20px_24px_-4px_rgba(20,60,120,0.08),0_8px_8px_-4px_rgba(20,60,120,0.03),0_1px_2px_0_rgba(0,0,0,0.05)] overflow-hidden">
                {/* Table */}
                <div className="overflow-x-auto">
                  <div className="grid grid-cols-[1.8fr_1fr_1fr_1fr] min-w-175">
                    <div className="px-6 py-5 bg-neutral-50 flex items-center">
                      <Paragraph
                        size="2xl"
                        color="dark"
                        className="font-semibold"
                      >
                        Feature
                      </Paragraph>
                    </div>
                    <div className="px-6 py-5 bg-neutral-50 flex items-center justify-center">
                      <Paragraph
                        size="2xl"
                        color="dark"
                        className="font-semibold"
                      >
                        Learner
                      </Paragraph>
                    </div>
                    <div className="px-6 py-5 bg-blue-50 flex items-center justify-center">
                      <Paragraph
                        size="2xl"
                        color="primary"
                        className="font-semibold"
                      >
                        Pro
                      </Paragraph>
                    </div>
                    <div className="px-6 py-5 bg-neutral-50 flex items-center justify-center">
                      <Paragraph
                        size="2xl"
                        color="dark"
                        className="font-semibold"
                      >
                        Teams
                      </Paragraph>
                    </div>

                    {visibleRows.map((row, index) => {
                      const isLast = index === visibleRows.length - 1;
                      return (
                        <Fragment key={row.feature}>
                          <div
                            className={`px-6 py-5 flex items-center ${isLast ? "" : "border-b border-border"}`}
                          >
                            <Paragraph size="sm">{row.feature}</Paragraph>
                          </div>
                          <div
                            className={`px-6 py-5 flex items-center justify-center ${isLast ? "" : "border-b border-border"}`}
                          >
                            <CompareCell value={row.learner} />
                          </div>
                          <div
                            className={`px-6 py-5 flex items-center justify-center bg-blue-50 ${isLast ? "" : "border-b border-blue-100"}`}
                          >
                            <CompareCell value={row.pro} />
                          </div>
                          <div
                            className={`px-6 py-5 flex items-center justify-center ${isLast ? "" : "border-b border-border"}`}
                          >
                            <CompareCell value={row.teams} />
                          </div>
                        </Fragment>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => setShowAllRows((value) => !value)}
                      className="col-span-4 flex items-center justify-center gap-1 p-6 border-t border-border cursor-pointer hover:bg-neutral-50"
                    >
                      <ChevronDown
                        className={`h-4 w-4 text-blue-600 transition-transform ${showAllRows ? "rotate-180" : ""}`}
                      />
                      <Paragraph color="primary" className="font-semibold">
                        {showAllRows
                          ? "Show fewer rows"
                          : "See the full comparison"}
                      </Paragraph>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
          <FAQSection className="lg:pt-30 pt-15" />
          <SuccessStories className="pt-0 lg:pt-0 pb-15 lg:pb-30" />
          <CTASection />
        </main>
        <Footer />
      </div>
    </WebLayoutProvider>
  );
}
