"use client";

import { BookOpen, ChevronRight, RotateCcw, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { PaginatedResponse, Quiz, State } from "@driving-test-app/shared";
import Button from "@/components/ui/Button";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import { stateAbbreviations, stateToSlug, usStates } from "@/lib/usStates";
import { otherStateLinks } from "@/lib/otherStateLinks";
import { useWebLayout } from "@/lib/web-layout-context";
import { api } from "@/lib/api";

function slugToStateName(slug: string): string {
  return slug
    .split("-")
    .map((word) => (word === "of" ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(" ");
}

const vehicleSlugs: Record<string, string> = {
  Car: "car",
  Motorcycle: "motorcycle",
  CDL: "cdl",
};

function formatMinutes(durationSeconds: number | null | undefined): string | null {
  if (!durationSeconds) return null;
  const minutes = Math.round(durationSeconds / 60);
  return minutes > 0 ? `~${minutes} min` : null;
}

export default function WrittenTestContent({ state, testSlug }: { state: string; testSlug: string }) {
  const stateName = usStates.includes(slugToStateName(state)) ? slugToStateName(state) : "Alaska";
  const stateCode = stateAbbreviations[stateName] ?? "";
  const stateSlug = stateToSlug(stateName);
  const quizHref = `/${stateSlug}/${testSlug}/quiz`;

  const { selectedVehicle } = useWebLayout();
  const vehicleType = vehicleSlugs[selectedVehicle] ?? "car";

  const [quiz, setQuiz] = useState<Quiz | null | undefined>(undefined);
  const [stateInfo, setStateInfo] = useState<State | null>(null);

  useEffect(() => {
    if (!stateCode) return;
    let cancelled = false;

    api
      .get<PaginatedResponse<Quiz>>(`/quizzes?state=${stateCode}&vehicle_type=${vehicleType}&slug=${testSlug}`)
      .then((res) => {
        if (!cancelled) setQuiz(res.data[0] ?? null);
      })
      .catch(() => {
        if (!cancelled) setQuiz(null);
      });

    return () => {
      cancelled = true;
    };
  }, [stateCode, vehicleType, testSlug]);

  useEffect(() => {
    if (!stateCode) return;
    let cancelled = false;

    api
      .get<{ data: State[] }>("/states")
      .then((res) => {
        if (cancelled) return;
        setStateInfo(res.data.find((s) => s.code === stateCode) ?? null);
      })
      .catch(() => {
        if (!cancelled) setStateInfo(null);
      });

    return () => {
      cancelled = true;
    };
  }, [stateCode]);

  const totalQuestions = quiz?.total_questions;
  const passingScore = quiz?.passing_score_percent;
  const duration = formatMinutes(quiz?.duration_seconds);
  const categoryTitle = quiz?.category?.title;
  const agencyName = stateInfo?.agency_name ?? "DMV";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header variant="states" hideNav />

      <main className="flex-1">
        <div id="atWrap" className="relative mx-auto block max-w-container" role="main">
            <nav id="breadcrumbs" className="text-sm text-[#888]" data-nosnippet="">
              <div id="bcrumbs" className="mx-auto box-border py-2.5 max-md:py-0 max-md:pb-2">
                <Paragraph className="flex items-center gap-0.5" color="muted" size="sm">
                  <Link href="/">Home</Link>
                  <ChevronRight className="w-4" />
                  <Link href={`/${stateSlug}`}>{stateName}</Link>
                  <ChevronRight className="w-4" />
                  <span>{quiz?.title ?? `Online Written Test Practice for ${stateName}`}</span>
                </Paragraph>
              </div>
            </nav>

            <div id="preinit">
              <div
                id="trustbar"
                className="flex w-full flex-wrap items-center gap-5 rounded-t-lg border-b border-[#e2e8f0] bg-[#f8fafc] px-4 py-2.5 max-md:mx-0 max-md:-ml-5 max-md:w-[110%] max-md:flex-row max-md:gap-1.5 max-md:rounded-none"
              >
                <span className="inline-flex cursor-pointer items-center gap-1 text-sm leading-none whitespace-nowrap text-[#475569] max-md:text-[13px]">
                  Original questions based on the latest{" "}
                  <strong className="font-semibold text-[#1e293b]">{stateName} Driver Handbook</strong>
                </span>
                <span className="text-sm leading-none whitespace-nowrap text-[#cbd5e1] max-md:hidden">•</span>
                <span className="text-sm leading-none whitespace-nowrap text-[#475569] max-md:text-[13px]">
                  Expert-reviewed by our editorial team
                </span>
              </div>

            <div id="wrpAtDescr" className="relative mb-20 rounded-b-[20px] bg-white p-5 pb-15 max-md:m-0 max-md:rounded-none max-md:bg-inherit max-md:p-0">
              <div id="atDescr" className="flex flex-nowrap items-start gap-8 text-black max-lg:flex-col max-md:mt-0! max-md:flex-col-reverse">
                <div id="mainDescr" className="flex w-full flex-1 flex-col overflow-hidden pb-5 max-md:m-0 max-md:overflow-visible max-md:p-0">
                  <Heading id="pgTitle" as="h1" size="lg" className="mb-2 max-md:-order-2 max-md:mt-5">
                    {quiz?.title ?? (quiz === null ? "Test not found" : "Loading test…")}
                  </Heading>
                  <div className="mb-2.75 flex flex-wrap items-center gap-1 text-black max-md:order-0 max-md:mb-2.5">
                    <strong className="text-[15px] font-semibold max-md:text-sm">Perfect for:</strong>
                    <div className="inline-flex h-[25px] items-center gap-1 rounded-lg bg-[#f2f7ff] px-1.5 text-sm leading-none whitespace-nowrap text-black">
                      Learner&apos;s permit applicants
                    </div>
                    <div className="inline-flex h-[25px] items-center gap-1 rounded-lg bg-[#f2f7ff] px-1.5 text-sm leading-none whitespace-nowrap text-black">
                      First-time adult applicants
                    </div>
                  </div>
                  <div className="relative min-h-0! overflow-hidden">
                    <div className="overflow-visible text-[18px] leading-[1.5] font-normal text-[#4e4e59] max-md:relative max-md:m-0 max-md:text-sm max-md:leading-[1.35] max-md:text-black">
                      <div className="block text-[15px] leading-[1.35] text-black! [&_a]:border-b [&_a]:border-transparent [&_a]:text-[#007aff] [&_a]:no-underline [&_a]:transition-colors [&_a:hover]:border-[#007aff] [&_p]:mb-4! max-md:[&_p]:mb-3! [&_strong]:font-semibold">
                        <Paragraph size="sm" className="mb-4!">
                          To get your {stateName} driver&apos;s license, you must pass three official tests: a
                          vision exam, a written knowledge test, and a road skills test. If you&apos;re under 18
                          (and not married or head of household), you must first earn an instruction permit. The
                          vision and knowledge tests are also required for the permit. If you&apos;re 18 or
                          older, an instruction permit is optional – useful for supervised driving practice.
                        </Paragraph>
                        {quiz && (
                          <Paragraph size="sm" className="mb-4!">
                            {categoryTitle && (
                              <>
                                This test is part of our <strong>{categoryTitle}</strong> question set
                                {" "}
                              </>
                            )}
                            {typeof totalQuestions === "number" && (
                              <>
                                and has <strong>{totalQuestions} questions</strong>
                                {typeof passingScore === "number" ? (
                                  <>
                                    {" "}
                                    — you need at least <strong>{passingScore}% correct</strong> to pass
                                  </>
                                ) : null}
                                .{" "}
                              </>
                            )}
                            All questions are based on the official {stateName} Driver Handbook.
                          </Paragraph>
                        )}
                        <Paragraph size="sm" className="mb-4!">
                          Our AI Assistant can give hints and explanations to speed up your learning. We also
                          offer an {stateName} DMV Permit Test Study Guide with document checklists, fees, and
                          frequently missed questions.
                        </Paragraph>
                      </div>
                    </div>
                  </div>
                  <div
                    id="btnStartWrp"
                    className="absolute bottom-[-30px] left-1/2 flex w-[calc(100vw-80px)] max-w-[904px] -translate-x-1/2 flex-nowrap items-center justify-center gap-2 max-md:fixed max-md:static max-md:inset-x-0 max-md:bottom-0 max-md:z-[1000] max-md:m-0 max-md:w-full max-md:translate-x-0 max-md:flex-col max-md:border-0 max-md:bg-white max-md:px-4 max-md:py-[13px] max-md:shadow-none max-md:transition-all max-md:duration-300"
                  >
                    <Button
                      id="atBtnStart"
                      href={quizHref}
                      size="lg"
                      className="h-15.5 w-full max-w-139 min-w-100"
                      disabled={!quiz}
                    >
                      <span id="spnTestStart">Start free {stateCode} permit practice test</span>
                    </Button>
                    <Button id="atBtnPremium" variant="outline" size="lg" className="h-15.5 max-w-139" href="/pricing">
                      Get Full {stateName} Exam Prep
                    </Button>
                  </div>
                </div>
                <div id="sideDescr" className="relative ml-[30px] flex w-[340px] flex-none flex-col max-lg:mt-5 max-lg:ml-0 max-lg:w-[250px] max-md:w-full">
                  <div id="testThumbnail" className="relative h-36 w-[340px] overflow-hidden rounded-xl bg-cover max-md:m-0 max-md:ml-[-20px] max-md:h-[130px] max-md:w-screen max-md:rounded-none">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={quiz?.cover_image_url ?? "/driving-tests.jpg"}
                      alt={quiz?.title ?? `Written test practice for ${stateName}`}
                      className="h-full w-full object-cover"
                      style={{ objectPosition: "center center" }}
                    />
                  </div>
                  <div id="params" className="mt-[15px] flex max-w-full flex-wrap items-center justify-end gap-2 max-md:justify-start">
                    {quiz?.is_premium && (
                      <div className="inline-flex h-[25px] items-center gap-1 rounded-lg bg-[#fef3c7] px-1.5 text-sm leading-none whitespace-nowrap text-black">
                        Premium
                      </div>
                    )}
                    {duration && (
                      <div className="inline-flex h-[25px] items-center gap-1 rounded-lg bg-[#f2f7ff] px-1.5 text-sm leading-none whitespace-nowrap text-black">
                        {duration}
                      </div>
                    )}
                  </div>
                  <div id="prtnrs" className="mt-[25px] flex items-center justify-center gap-[25px] max-md:mb-5 max-md:gap-4 max-md:rounded-[20px] max-md:bg-[#f2f7ff] max-md:px-5 max-md:py-[30px]" data-nosnippet="">
                    {["/partner_gray_1.svg", "/partner_gray_2.svg", "/partner_gray_3.svg"].map((src) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={src} src={src} loading="lazy" className="block h-auto w-full max-w-[480px] max-md:h-[10vw]" alt="" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            </div>

            <Paragraph size="sm" color="muted" className="text-center">
              More {stateCode} question sets:{" "}
              <Link href={`/${stateSlug}`} className="font-semibold text-blue-500 no-underline">
                back to {stateName} practice tests
              </Link>
              , and{" "}
              <Link href={`/quizzes?state=${stateCode}`} className="font-semibold text-blue-500 no-underline">
                browse all {stateName} practice tests
              </Link>
            </Paragraph>

            <section id="qotdPreinitSignup" className="mx-auto mt-3 mb-8.5 max-md:mx-0 max-md:my-2 max-md:w-auto max-md:rounded-[14px] max-md:p-0 md:max-lg:mt-2.5 md:max-lg:max-w-none">
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(430px,520px)] items-center gap-[22px] rounded-[18px] border border-[#007aff]/[0.18] bg-white/[0.78] px-[18px] py-4 max-md:rounded-[14px] max-md:p-3.5 md:max-lg:grid-cols-1 md:max-lg:gap-3">
                <div className="grid min-w-0 gap-1">
                  <Paragraph size="xs" color="primary" className="m-0! font-bold tracking-[0.02em] uppercase">
                    Daily email practice
                  </Paragraph>
                  <Paragraph color="dark" className="leading-tight font-semibold">
                    Get a free permit question by email each morning
                  </Paragraph>
                  <Paragraph size="xs">
                    Not ready for a full test right now? Use a 2-minute daily habit to keep permit rules fresh and
                    spot exam-like patterns before test day.
                  </Paragraph>
                </div>
                <form
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2.5 max-md:grid-cols-1"
                  onSubmit={(e) => e.preventDefault()}
                >
                  <label className="sr-only absolute m-[-1px] h-px w-px overflow-hidden border-0 p-0 whitespace-nowrap" htmlFor="qotdPreinitEmail-car-3346">
                    Email address
                  </label>
                  <input
                    id="qotdPreinitEmail-car-3346"
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    className="box-border h-11 w-full rounded-[10px] border border-[#cbd5e1] bg-white px-3.5 text-sm text-[#111827] outline-none placeholder:text-[#94a3b8] focus:border-[#007aff] focus:shadow-[0_0_0_3px_rgba(0,122,255,0.16)] max-md:w-full"
                  />
                  <Button type="submit" variant="outline" size="sm" className="h-11 w-full bg-blue-50! whitespace-nowrap max-md:w-full">
                    Get the daily question
                  </Button>
                  <div className="col-[1/-1] flex flex-wrap gap-x-3 gap-y-1.5 text-[11px] text-[#64748b]">
                    <span>Unsubscribe anytime.</span>
                  </div>
                </form>
              </div>
            </section>

            <div id="carSiblingEnrich" className="mb-14 w-full text-[#0b0f16] max-md:mx-auto max-md:mb-[38px] max-md:w-full max-md:px-4">
              <section className="mb-11 scroll-mt-24" id="carSiblingFacts">
                <Heading as="h2" size="2xs" className="mb-2">
                  {stateName} written test practice: quick facts
                </Heading>
                <Paragraph size="md" color="muted" className="mb-5">
                  What&apos;s actually in this test pool.
                </Paragraph>
                <div className="grid grid-cols-2 overflow-hidden rounded-[20px] border border-[#e3e5eb] bg-white max-md:grid-cols-1">
                  {[
                    { label: "Questions", value: typeof totalQuestions === "number" ? `${totalQuestions} questions` : "—" },
                    {
                      label: "Passing score",
                      value: typeof passingScore === "number" ? `${passingScore}% correct` : "Not set for this test",
                    },
                    { label: "Typical time", value: duration ?? "—" },
                    { label: "Source", value: `${stateName} driver handbook` },
                    { label: "Category", value: categoryTitle ?? "—" },
                    { label: "Access", value: quiz?.is_premium ? "Premium" : "Free" },
                  ].map((fact) => (
                    <div key={fact.label} className="min-h-24 border-r border-b border-[#e3e5eb] p-5 px-6 max-md:min-h-0 max-md:border-r-0">
                      <div className="mb-2 text-xs font-extrabold tracking-[0.04em] text-[#848894] uppercase">{fact.label}</div>
                      <div className="text-base leading-[1.35] font-semibold text-black">{fact.value}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="mb-11 scroll-mt-24" id="carSiblingIntent">
                <div className="rounded-[20px] border border-[#e3e5eb] bg-white px-[30px] py-7 max-md:px-[18px] max-md:py-[22px]">
                  <Heading as="h2" size="2xs" className="mb-2.5">
                    Can you take the {stateName} written driving test online?
                  </Heading>
                  <Paragraph size="md" className="m-0!">
                    This page is online practice, not the official DMV exam. Use it to build confidence with the
                    real question format, then confirm the current {stateCode} testing option with your local{" "}
                    {agencyName} office before relying on an at-home exam.
                  </Paragraph>
                </div>
              </section>
            </div>

            <div id="another_state" className="mb-10" data-nosnippet="">
              <Heading as="h2" size="2xs" className="m-0 mb-3">
                Are you in another state?
              </Heading>
              <ul className="m-0 grid grid-cols-6 gap-1 rounded-2xl bg-[#f2f7ff] p-4 text-sm max-md:grid-cols-2 [&_a]:text-[#4e4e59] [&_a]:no-underline [&_a:hover]:text-[#007aff] [&_li]:p-1">
                {usStates.map((s) =>
                  s === stateName ? (
                    <li key={s}>
                      <span className="text-nowrap">{s}</span>
                    </li>
                  ) : (
                    <li key={s}>
                      <Link href={otherStateLinks[s]} className="text-nowrap">
                        {s}
                      </Link>
                    </li>
                  ),
                )}
              </ul>
            </div>

            <div id="partners" className="mx-auto mb-15 flex items-center justify-between gap-4 rounded-[20px] bg-[#f2f7ff] px-6 py-5" data-nosnippet="">
              <div className="w-full max-w-160 flex-1">
                <Heading as="h4" size="2xs" className="m-0 mb-2">
                  An official &amp; trusted partner in driver education
                </Heading>
                <Paragraph size="lg" color="muted">
                  We are an officially recognized FMCSA Entry-Level Driver Training provider and a proud partner to
                  over 2,500 libraries. We work with safety organizations like GHSA and the National Safety Council
                  to help create safer roads for everyone.
                </Paragraph>
              </div>
              <div className="flex max-w-[430px] flex-wrap justify-around gap-x-10 gap-y-4">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={n} src={`/partner_gray_${n}.svg`} loading="lazy" alt="" />
                ))}
              </div>
            </div>

            <div id="smarterWay" className="mb-10" data-nosnippet="">
              <Heading as="h4" size="2xs" className="m-0 mb-5">
                A smarter way to study for the permit test
              </Heading>
              <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
                {[
                  {
                    title: "Weak Spots",
                    text: "Coming soon: automatically retest yourself on the questions you miss, until you've mastered the material.",
                    Icon: RotateCcw,
                  },
                  {
                    title: "AI-powered feedback",
                    text: "Get smarter as you study. Our AI-powered feedback provides detailed, question-level insights to help you understand the why behind each answer.",
                    Icon: Sparkles,
                  },
                  {
                    title: "Real driver handbook",
                    text: "Every question in this test is sourced from the official state driver handbook, not a generic question bank.",
                    Icon: BookOpen,
                  },
                ].map((card) => (
                  <div key={card.title} className="space-y-5 rounded-2xl border bg-white p-5">
                    <div className="flex h-[55px] w-[55px] items-center justify-center rounded-[20px] bg-[#f2f7ff]">
                      <card.Icon className="h-6 w-6 text-[#007aff]" />
                    </div>
                    <div>
                      <Heading as="h5" size="2xs" className="m-0 mb-2">
                        {card.title}
                      </Heading>
                      <Paragraph size="sm" className="m-0!">
                        {card.text}
                      </Paragraph>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <section>
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(300px,360px)] items-center gap-8 rounded-3xl bg-[#0b1220] px-10 py-10 max-md:grid-cols-1 max-md:gap-6 max-md:rounded-2xl max-md:px-6 max-md:py-8">
                <div className="grid min-w-0 gap-3">
                  <Heading as="h2" size="2xs" color="white" className="m-0!">
                    Get a free DMV question every morning
                  </Heading>
                  <Paragraph size="sm" className="m-0! text-gray-400!">
                    One DMV-style permit question, answer, and plain-English rationale in your inbox. Use it as a
                    quick daily warm-up before the test.
                  </Paragraph>
                </div>
                <form
                  className="flex flex-col gap-3"
                  onSubmit={(e) => e.preventDefault()}
                >
                  <label className="sr-only" htmlFor="qotdGlobalEmail-car">
                    Email address
                  </label>
                  <input
                    id="qotdGlobalEmail-car"
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    className="box-border h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-gray-500 focus:border-[#f97316]/60 focus:bg-white/10"
                  />
                  <Button type="submit" size="md">
                    Send me the daily question
                  </Button>
                  <Paragraph size="xs" color="muted">
                    Unsubscribe anytime.
                  </Paragraph>
                </form>
              </div>
            </section>
          </div>
      </main>

      <Footer />
    </div>
  );
}
