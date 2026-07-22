"use client";

import { BookOpen, ChevronRight, RotateCcw, Sparkles, Star } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import { stateAbbreviations, stateToSlug, usStates } from "@/lib/usStates";
import { otherStateLinks } from "@/lib/otherStateLinks";

function slugToStateName(slug: string): string {
  return slug
    .split("-")
    .map((word) => (word === "of" ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(" ");
}

const studySections = ["carSiblingFacts", "carSiblingIntent", "carSiblingTopics", "carSiblingPath"];

export default function WrittenTestContent({ state, testSlug }: { state: string; testSlug: string }) {
  const stateName = usStates.includes(slugToStateName(state)) ? slugToStateName(state) : "Alaska";
  const stateCode = stateAbbreviations[stateName] ?? "";
  const stateSlug = stateToSlug(stateName);
  const quizHref = `/${stateSlug}/${testSlug}/quiz`;

  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [activeStudySection, setActiveStudySection] = useState(studySections[0]);

  useEffect(() => {
    function updateActiveStudySection() {
      const scrollPosition = window.scrollY + 140;
      let current = studySections[0];
      for (const id of studySections) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= scrollPosition) current = id;
      }
      setActiveStudySection(current);
    }
    window.addEventListener("scroll", updateActiveStudySection, { passive: true });
    updateActiveStudySection();
    return () => window.removeEventListener("scroll", updateActiveStudySection);
  }, []);

  function navLinkClass(id: string) {
    const base =
      "inline-flex min-h-9.5 items-center rounded-full px-5.5 text-[15px] leading-none font-semibold no-underline shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-[transform,box-shadow,background,color] duration-[180ms] max-md:min-h-[36px] max-md:flex-none max-md:px-4 max-md:text-sm";
    return `${base} ${
      activeStudySection === id
        ? "border border-[#42424d] bg-[#42424d] text-white"
        : "border border-[#d9dce5] bg-white text-[#3d4050] hover:border-[#42424d] hover:bg-[#42424d] hover:text-white"
    }`;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header variant="states" hideNav />

      <main className="flex-1">
        <div id="atWrap" className="relative mx-auto block max-w-container" role="main">
            <nav id="breadcrumbs" className="text-sm text-[#888]" data-nosnippet="">
              <div id="bcrumbs" className="mx-auto box-border py-2.5 max-md:py-0 max-md:pb-2">
                <Paragraph className="flex items-center gap-0.5" color="muted" size="sm">
                  <a href="https://driving-tests.org/">Home</a>
                  <ChevronRight className="w-4" />
                  <Link href={`/${stateSlug}`}>{stateName}</Link>
                  <ChevronRight className="w-4" />
                  <span>Online DMV Written Test Practice for {stateName} (2026)</span>
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
                  Expert-reviewed by S. Litvintchouk, M.S. (MIT), Chief Educational Researcher
                </span>
              </div>

            <div id="wrpAtDescr" className="relative mb-20 rounded-b-[20px] bg-white p-5 pb-15 max-md:m-0 max-md:rounded-none max-md:bg-inherit max-md:p-0">
              <div id="atDescr" className="flex flex-nowrap items-start gap-8 text-black max-lg:flex-col max-md:mt-0! max-md:flex-col-reverse">
                <div id="mainDescr" className="flex w-full flex-1 flex-col overflow-hidden pb-5 max-md:m-0 max-md:overflow-visible max-md:p-0">
                  <Heading id="pgTitle" as="h1" size="lg" className="mb-2 max-md:-order-2 max-md:mt-5">
                    Free Online DMV Written Test Practice for {stateName} (2026)
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
                      <div
                        id="atDescrTop"
                        className={`group relative pb-2.5 ${descriptionExpanded ? "active" : ""} [&:not(.active)]:max-h-[290px]! max-md:[&:not(.active)]:max-h-none!`}
                      >
                        <div className="block text-[15px] leading-[1.35] text-black! [&_a]:border-b [&_a]:border-transparent [&_a]:text-[#007aff] [&_a]:no-underline [&_a]:transition-colors [&_a:hover]:border-[#007aff] [&_p]:mb-4! max-md:[&_p]:mb-3! [&_strong]:font-semibold">
                          <div>
                            <Paragraph size="sm" className="mb-4!">
                              To get your {stateName} driver&apos;s license, you must pass three official tests: a
                              vision exam, a written knowledge test, and a road skills test. If you&apos;re under 18
                              (and not married or head of household), you must first earn an instruction permit. The
                              vision and knowledge tests are also required for the permit. If you&apos;re 18 or
                              older, an instruction permit is optional – useful for supervised driving practice.
                            </Paragraph>
                            <Paragraph size="sm" className="mb-4!">
                              The {stateName} DMV written test has <strong>30 questions</strong> covering {stateName}{" "}
                              traffic laws, road signs, and rules of safe driving. To pass, you need at least{" "}
                              <strong>24 correct (80%)</strong>. All questions are based on the official driver&apos;s
                              manual (
                              <a
                                href={`https://driving-tests.org/${stateSlug}/${stateCode.toLowerCase()}-dmv-drivers-handbook-manual/`}
                                title={`${stateName} DMV Handbook (${stateCode} Driver's Manual) 2026`}
                              >
                                {stateName} DMV Handbook ({stateCode} Driver&apos;s Manual) 2026
                              </a>
                              ). In 2020-2023, about <strong>49.1% of applicants failed</strong> the test on their
                              first attempt – reading the manual alone often isn&apos;t enough.
                            </Paragraph>
                            <Paragraph size="sm" className="mb-4!">
                              This is the second of our six {stateName} Permit Practice Tests, current for July 2026
                              and based on the official driver&apos;s manual. Choose the best or most complete answer
                              for each question.
                            </Paragraph>
                            <Paragraph size="sm" className="mb-4!">
                              Our AI Assistant can give hints and explanations to speed up your learning. We also
                              offer an {stateName} DMV Permit Test Study Guide with document checklists, fees, and
                              frequently missed questions.
                            </Paragraph>
                          </div>
                        </div>
                        <div
                          onClick={() => setDescriptionExpanded((v) => !v)}
                          className="absolute right-0 bottom-0 left-0 flex cursor-pointer items-center justify-start gap-0.5 bg-[linear-gradient(to_bottom,rgba(255,255,255,0)_0%,rgba(255,255,255,0)_20%,rgba(255,255,255,1)_60%,rgba(255,255,255,1)_100%)] pt-[50px] text-sm leading-[1.35] text-[#007aff] group-[.active]:bg-none group-[.active]:pt-0 before:content-['Show_more'] group-[.active]:before:content-['Show_less'] max-md:hidden!"
                        />
                      </div>
                    </div>
                  </div>
                  <div
                    id="btnStartWrp"
                    className="absolute bottom-[-30px] left-1/2 flex w-[calc(100vw-80px)] max-w-[904px] -translate-x-1/2 flex-nowrap items-center justify-center gap-2 max-md:fixed max-md:static max-md:inset-x-0 max-md:bottom-0 max-md:z-[1000] max-md:m-0 max-md:w-full max-md:translate-x-0 max-md:flex-col max-md:border-0 max-md:bg-white max-md:px-4 max-md:py-[13px] max-md:shadow-none max-md:transition-all max-md:duration-300"
                  >
                    <Button id="atBtnStart" href={quizHref} size="lg" className="h-15.5 w-full max-w-139 min-w-100">
                      <span id="spnTestStart">Start free {stateCode} permit practice test</span>
                    </Button>
                    <Button id="atBtnPremium" variant="outline" size="lg" className="h-15.5 max-w-139">
                      Get Full {stateName} Exam Prep
                    </Button>
                  </div>
                  <div id="based" className="order-[-1] mr-auto mb-2 max-md:absolute max-md:bottom-[-8px] max-md:m-0">
                    <span className="inline-block w-auto rounded-lg bg-[#dcfde4] px-1.5 py-[3px] text-sm leading-[1.35] text-black max-md:mt-0.5">
                      Last verified: <strong className="font-semibold">June 28, 2026</strong>
                    </span>
                  </div>
                </div>
                <div id="sideDescr" className="relative ml-[30px] flex w-[340px] flex-none flex-col max-lg:mt-5 max-lg:ml-0 max-lg:w-[250px] max-md:w-full">
                  <div id="testThumbnail" className="relative h-36 w-[340px] overflow-hidden rounded-xl bg-cover max-md:m-0 max-md:ml-[-20px] max-md:h-[130px] max-md:w-screen max-md:rounded-none">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://driving-tests.org/cdn-cgi/image/format=auto,quality=85,width=340/img/cover/test/202003151744407638.jpg"
                      srcSet="https://driving-tests.org/cdn-cgi/image/format=auto,quality=85,width=680/img/cover/test/202003151744407638.jpg 2x, https://driving-tests.org/cdn-cgi/image/format=auto,quality=85,width=1020/img/cover/test/202003151744407638.jpg 3x"
                      alt={`Free Online DMV Written Test Practice for ${stateName} (2026)`}
                      className="h-full w-full object-cover"
                      style={{ objectPosition: "center center" }}
                    />
                  </div>
                  <span id="imgLicenseWrp" className="relative block">
                    <span id="imgLicense" className="inline-block w-[220px] max-md:mt-[5px] max-md:w-[130px] max-md:shadow-[0_4px_15px_0_rgba(133,133,149,0.15)] md:max-lg:w-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="https://driving-tests.org/cdn-cgi/image/format=auto,quality=85,width=220/img/license/alabama-drivers-license.jpg"
                        srcSet="https://driving-tests.org/cdn-cgi/image/format=auto,quality=85,width=440/img/license/alabama-drivers-license.jpg 2x, https://driving-tests.org/cdn-cgi/image/format=auto,quality=85,width=660/img/license/alabama-drivers-license.jpg 3x"
                        alt={`${stateCode} DMV driver's license`}
                        itemProp="thumbnailUrl"
                        className="mt-[-45px] ml-[-30px] h-auto w-full rounded-lg border border-[#ddd] shadow-[0_4px_25px_0_rgba(133,133,149,0.3)] max-md:m-0 max-md:border-2 max-md:border-white max-md:shadow-none"
                      />
                    </span>
                  </span>
                  <div id="params" className="order-[-1] mt-[-3px] mb-[15px] flex max-w-full items-center justify-end gap-2 max-md:justify-start">
                    <div
                      className="group relative inline-flex h-[25px] cursor-pointer items-center gap-1 rounded-lg bg-[#f2f7ff] px-1.5 text-sm leading-none whitespace-nowrap text-black"
                      data-average="47%"
                      data-value="44%"
                      data-window-days="365"
                    >
                      <div className="tooltip invisible absolute top-[calc(100%+5px)] left-1/2 z-[9999] w-[173px] -translate-x-1/2 rounded-lg bg-black/80 p-2 text-sm leading-[1.35] whitespace-normal text-white opacity-0 transition-opacity delay-200 duration-300 group-hover:visible group-hover:opacity-100 before:absolute before:-top-[7px] before:left-1/2 before:-ml-[7px] before:block before:w-0 before:border-x-[7px] before:border-b-[7px] before:border-solid before:border-x-transparent before:border-b-black/80 before:content-[''] max-md:left-0 max-md:translate-x-0 max-md:before:left-[20%] [&_data]:font-semibold [&_table]:font-semibold">
                        <div>
                          Avg. pass rate on our {stateCode} tests: <data id="average_pass_rate" value="47">47%.</data>
                        </div>
                        <div>
                          Average pass rate for this test: <data id="test_pass_rate" value="44">44%.</data>
                        </div>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M2.79935 12.833H1.86602C1.68036 12.833 1.50232 12.7639 1.37104 12.6408C1.23977 12.5177 1.16602 12.3508 1.16602 12.1768V8.23926C1.16602 8.06521 1.23977 7.89829 1.37104 7.77522C1.50232 7.65215 1.68036 7.58301 1.86602 7.58301H2.79935C2.985 7.58301 3.16305 7.65215 3.29432 7.77522C3.4256 7.89829 3.49935 8.06521 3.49935 8.23926V12.1768C3.49935 12.3508 3.4256 12.5177 3.29432 12.6408C3.16305 12.7639 2.985 12.833 2.79935 12.833Z"
                          fill="black"
                        />
                        <path
                          opacity="1"
                          d="M7.13333 12.8333H6.2C6.01435 12.8333 5.8363 12.7668 5.70503 12.6482C5.57375 12.5297 5.5 12.369 5.5 12.2014V5.88194C5.5 5.71434 5.57375 5.5536 5.70503 5.43509C5.8363 5.31658 6.01435 5.25 6.2 5.25H7.13333C7.31898 5.25 7.49703 5.31658 7.62831 5.43509C7.75958 5.5536 7.83333 5.71434 7.83333 5.88194V12.2014C7.83333 12.369 7.75958 12.5297 7.62831 12.6482C7.49703 12.7668 7.31898 12.8333 7.13333 12.8333Z"
                          fill="black"
                        />
                        <path
                          opacity="0.2"
                          d="M11.4654 12.833H10.532C10.3464 12.833 10.1683 12.7666 10.0371 12.6485C9.90578 12.5303 9.83203 12.3701 9.83203 12.203V2.96301C9.83203 2.79592 9.90578 2.63568 10.0371 2.51753C10.1683 2.39938 10.3464 2.33301 10.532 2.33301H11.4654C11.651 2.33301 11.8291 2.39938 11.9603 2.51753C12.0916 2.63568 12.1654 2.79592 12.1654 2.96301V12.203C12.1654 12.3701 12.0916 12.5303 11.9603 12.6485C11.8291 12.7666 11.651 12.833 11.4654 12.833Z"
                          fill="black"
                        />
                      </svg>
                      Moderate
                    </div>
                    <div className="inline-flex h-[25px] items-center gap-1 rounded-lg bg-[#f2f7ff] px-1.5 text-sm leading-none whitespace-nowrap text-black">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M8.04567 1.33506C8.325 1.37455 8.35012 1.45608 8.41572 1.54737C8.6397 1.85968 8.39214 2.35711 7.96213 2.35968C7.94983 2.35968 7.93804 2.36019 7.92574 2.36019C5.77671 2.39403 3.74966 3.73147 2.86811 5.65148C1.93889 7.67456 2.35199 10.2417 3.89111 11.8761C5.74852 13.8489 9.07996 14.2258 11.3469 12.5505C12.866 11.4274 13.7578 9.50482 13.6287 7.61917C13.4816 5.46225 12.0198 3.46993 9.93332 2.70173C9.93332 2.70173 9.5643 2.47711 9.60069 2.16121C9.63913 1.82685 10.0189 1.63506 10.3782 1.77198C10.4899 1.81506 10.6006 1.8607 10.7098 1.90891C12.926 2.89506 14.5143 5.18173 14.6568 7.61404C14.8059 10.1648 13.3591 12.7387 11.0701 13.9299C9.11174 14.9494 6.64544 14.91 4.71475 13.8141C3.00598 12.8443 1.76104 11.0858 1.42636 9.14533C1.06349 7.03609 1.78565 4.76737 3.31144 3.25916C4.54151 2.04327 6.2467 1.33865 7.99698 1.33301C8.01339 1.33352 8.02979 1.33455 8.04567 1.33506ZM12.1029 8.51917H7.99852C7.90524 8.51661 7.8791 8.50789 7.82939 8.49046C7.62848 8.4202 7.49317 8.26174 7.48599 8.00584V3.89968C7.48856 3.80583 7.49727 3.77968 7.51469 3.72993C7.58491 3.52891 7.74328 3.39352 7.99852 3.38634C8.00826 3.38634 8.018 3.38686 8.02774 3.38686C8.12102 3.39506 8.14613 3.40532 8.19533 3.42532C8.38241 3.50327 8.5049 3.65352 8.51156 3.89968V7.49302H12.1029C12.1059 7.49353 12.7076 7.66276 12.6031 8.1202C12.5518 8.34533 12.3371 8.51302 12.1029 8.51917Z"
                          fill="black"
                          stroke="black"
                          strokeWidth="0.4"
                        />
                      </svg>
                      6 min
                    </div>
                    <div
                      className="group relative inline-flex h-[25px] cursor-pointer items-center gap-1 rounded-lg bg-[#f2f7ff] px-1.5 text-sm leading-none whitespace-nowrap text-black"
                      data-window-days="365"
                      data-average="65"
                      data-nosnippet=""
                    >
                      <div className="tooltip invisible absolute top-[calc(100%+5px)] left-1/2 z-[9999] w-[173px] -translate-x-1/2 rounded-lg bg-black/80 p-2 text-sm leading-[1.35] whitespace-normal text-white opacity-0 transition-opacity delay-200 duration-300 group-hover:visible group-hover:opacity-100 before:absolute before:-top-[7px] before:left-1/2 before:-ml-[7px] before:block before:w-0 before:border-x-[7px] before:border-b-[7px] before:border-solid before:border-x-transparent before:border-b-black/80 before:content-[''] max-md:left-0 max-md:translate-x-0 max-md:before:left-[20%] [&_data]:font-semibold [&_table]:font-semibold">
                        <div>Score distribution:</div>
                        <table>
                          <tbody>
                            <tr>
                              <td>90-100</td>
                              <td>=&gt;</td>
                              <td>
                                <data value="9">9%</data>
                              </td>
                            </tr>
                            <tr>
                              <td>80-89</td>
                              <td>=&gt;</td>
                              <td>
                                <data value="15">15%</data>
                              </td>
                            </tr>
                            <tr>
                              <td>70-79</td>
                              <td>=&gt;</td>
                              <td>
                                <data value="23">23%</data>
                              </td>
                            </tr>
                            <tr>
                              <td>60-69</td>
                              <td>=&gt;</td>
                              <td>
                                <data value="24">24%</data>
                              </td>
                            </tr>
                            <tr>
                              <td>&lt;60%</td>
                              <td>=&gt;</td>
                              <td>
                                <data value="29">29%</data>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div>Avg. first-try score: 65%</div>
                    </div>
                  </div>
                  <div id="prtnrs" className="mt-[25px] flex items-center justify-center gap-[25px] max-md:mb-5 max-md:gap-4 max-md:rounded-[20px] max-md:bg-[#f2f7ff] max-md:px-5 max-md:py-[30px]" data-nosnippet="">
                    {["/partner_gray_1.svg", "/partner_gray_2.svg", "/partner_gray_3.svg"].map((src) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={src} src={src} loading="lazy" className="block h-auto w-full max-w-[480px] max-md:h-[10vw]" alt="" />
                    ))}
                  </div>
                  <div id="chips" className="mt-5 flex flex-col gap-2 max-md:order-0 max-md:mt-0 max-md:mb-2.5 max-md:gap-1.5">
                    <div className="title text-[15px] leading-[1.35] font-semibold text-black max-md:text-sm">
                      Tricky exam topics covered here:
                    </div>
                    <div className="chips flex flex-wrap items-center gap-1 text-black max-md:mx-[-20px] max-md:max-w-none max-md:flex-nowrap max-md:overflow-x-auto max-md:px-5 max-md:pb-1.5">
                      {["AL move over law", "Skidding & Braking", "Emergency Vehicles", "Traffic Lights"].map((t) => (
                        <div
                          key={t}
                          className="inline-flex h-[25px] items-center gap-1 rounded-lg bg-[#f2f7ff] px-1.5 text-sm leading-none whitespace-nowrap text-black"
                        >
                          {t}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <Paragraph size="sm" color="muted" className="flex items-center justify-center gap-1.5">
                <span className="inline-block h-[9px] w-[9px] animate-pulse rounded-full bg-[#14b32f]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 9 9" fill="none">
                    <circle cx="4.5" cy="4.5" r="4.5" fill="#14B32F" />
                  </svg>
                </span>
                <span>
                  <strong className="font-semibold text-neutral-950">6</strong> {stateCode} students practicing right
                  now
                </span>
                •<strong className="font-semibold text-neutral-950">170</strong> tests completed today statewide
              </Paragraph>
            </div>
            </div>

            <Paragraph size="sm" color="muted" className="text-center">
              More {stateCode} question sets:{" "}
              <Link href={`/${stateSlug}`} className="font-semibold text-blue-500 no-underline">
                Practice Test 1: permit test basics
              </Link>
              , and{" "}
              <a
                href={`https://driving-tests.org/${stateSlug}/${stateSlug}-permit-practice-test-3/`}
                className="font-semibold text-blue-500 no-underline"
              >
                Practice Test 3: fresh permit questions
              </a>
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
              <nav
                className="sticky top-0 mx-auto mb-10 flex flex-wrap justify-center gap-3 pt-1 max-md:mb-7 max-md:justify-start max-md:gap-2 max-md:overflow-x-auto max-md:py-0.5 max-md:pb-2"
                aria-label="Practice test study sections"
              >
                <a href="#carSiblingFacts" className={navLinkClass("carSiblingFacts")}>
                  Quick Facts
                </a>
                <a href="#carSiblingIntent" className={navLinkClass("carSiblingIntent")}>
                  Online Test
                </a>
                <a href="#carSiblingTopics" className={navLinkClass("carSiblingTopics")}>
                  Topics
                </a>
                <a href="#carSiblingPath" className={navLinkClass("carSiblingPath")}>
                  Next Step
                </a>
              </nav>

              <section className="mb-11 scroll-mt-24" id="carSiblingFacts">
                <Heading as="h2" size="2xs" className="mb-2">
                  {stateName} written test practice: quick facts
                </Heading>
                <Paragraph size="md" color="muted" className="mb-5">
                  Use this second set to check sharing the road plus vehicle equipment after the first permit
                  practice test
                </Paragraph>
                <div className="grid grid-cols-2 overflow-hidden rounded-[20px] border border-[#e3e5eb] bg-white max-md:grid-cols-1">
                  {[
                    { label: "Questions", value: "30 questions" },
                    { label: "Passing score", value: "24 correct (80%)" },
                    { label: "Typical time", value: "6 min" },
                    { label: "Source", value: `${stateCode} driver handbook` },
                    { label: "Best for", value: "A second pass after Practice Test 1, especially for sharing the road plus vehicle equipment" },
                    { label: "Best next step", value: "Review sharing the road plus vehicle equipment, then use Practice Test 3 to see if the misses disappear." },
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
                    This page is online practice, not the official DMV exam. Use it to check sharing the road plus
                    vehicle equipment, then confirm the current {stateCode} testing option before relying on an
                    at-home exam.
                  </Paragraph>
                </div>
              </section>

              <section className="mb-11 scroll-mt-24" id="carSiblingTopics">
                <Heading as="h2" size="2xs" className="mb-2">
                  {stateName} Test 2 question mix: Sharing the Road, Vehicle Equipment, and Adverse Conditions
                </Heading>
                <Paragraph size="md" color="muted" className="mb-5">
                  Based on the categories assigned to this second practice test pool.
                </Paragraph>
                <div className="grid gap-3 rounded-[20px] border border-[#e3e5eb] bg-white px-[30px] py-7 max-md:px-[18px] max-md:py-[22px]">
                  {[
                    { name: "Sharing the Road", text: "3 questions in this test pool cover this area. Broader topic: Safety & Hazards." },
                    { name: "Vehicle Equipment", text: "3 questions in this test pool cover this area. Broader topic: Emergencies." },
                    { name: "Adverse Conditions", text: "2 questions in this test pool cover this area. Broader topic: Safety & Hazards." },
                  ].map((topic) => (
                    <div
                      key={topic.name}
                      className="grid grid-cols-[200px_minmax(0,1fr)] gap-[22px] border-b border-[#eff1f5] py-4 last:border-b-0 last:pb-0 max-md:grid-cols-1 max-md:gap-2"
                    >
                      <div className="font-semibold">{topic.name}</div>
                      <div className="leading-[1.5] text-[#4d5260]">{topic.text}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="mb-11 scroll-mt-24" id="carSiblingPath">
                <Heading as="h2" size="2xs" className="mb-2">
                  How to use {stateName} Test 2
                </Heading>
                <Paragraph size="md" color="muted" className="mb-5">
                  Treat this as a second read, not a repeat of the first practice test.
                </Paragraph>
                <div className="grid grid-cols-3 gap-3.5 max-md:grid-cols-1">
                  {[
                    { title: "Start with Sharing the Road", text: "This is one of the main areas in this test pool, so review the rule before another scored attempt." },
                    { title: `Use fresh wording for ${stateCode} rules`, text: "Test 2 changes the question mix so you can separate understanding from memorized answers." },
                    { title: "Move to Test 3 after repeat misses drop", text: "Use Test 3 to confirm that sharing the road plus vehicle equipment no longer pull your score down." },
                  ].map((step, index) => (
                    <article key={step.title} className="rounded-[20px] border border-[#e3e5eb] bg-white p-[22px]">
                      <span className="mb-[18px] inline-flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[#f0f7ff] text-[13px] font-black text-[#1183ef]">
                        {index + 1}
                      </span>
                      <Heading as="h3" size="2xs" className="mt-0 mb-2.5">
                        {step.title}
                      </Heading>
                      <Paragraph size="sm" className="m-0!">
                        {step.text}
                      </Paragraph>
                    </article>
                  ))}
                </div>
              </section>
            </div>

            <div id="experts" className="mb-10 grid grid-cols-2 gap-4 max-md:grid-cols-1" data-nosnippet="">
              {[
                {
                  id: "steven-litvintchouk",
                  href: "https://driving-tests.org/experts/steven-litvintchouk/",
                  img: "/reviewedby_steven.webp",
                  title: "Reviewed for legal and handbook accuracy",
                  name: "Steven Litvintchouk",
                  sub: "M.S. (MIT, Columbia), Chief Educational Researcher. ACES member (Society for Editing). Verifies all 50 state tests against official handbooks weekly.",
                },
                {
                  id: "andrei-zakhareuski",
                  href: "https://driving-tests.org/experts/andrei-zakhareuski/",
                  img: "/andrei4.webp",
                  title: "Test design and learning experience oversight",
                  name: "Andrei Zakhareuski",
                  sub: "Co-founder & CEO, Driving-Tests.org",
                },
              ].map((expert) => (
                <div key={expert.name} id={expert.id} className="flex flex-1 bg-transparent p-0">
                  <div className="flex w-full gap-5 rounded-[20px] bg-white px-5 pt-5 pb-3.5">
                    <div className="shrink-0">
                      <a href={expert.href} target="_blank" rel="noopener noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={expert.img} alt={expert.name} className="h-auto w-16 rounded-full" />
                      </a>
                    </div>
                    <div>
                      <Heading as="h3" size="2xs" className="m-0!">
                        {expert.title}
                      </Heading>
                      <Paragraph size="sm" className="mt-1 mb-0! [&_a]:text-[#007aff] [&_a]:no-underline">
                        <a href={expert.href} target="_blank" rel="noopener noreferrer">
                          <strong>{expert.name}</strong>
                        </a>
                      </Paragraph>
                      <Paragraph size="sm" className="mt-1 mb-0!">
                        {expert.sub}
                      </Paragraph>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div id="process" className="mb-10 text-sm leading-[1.5] text-[#7c7c91] [&_a]:text-[#007aff] [&_a]:no-underline" data-nosnippet="">
              Questions are created and maintained by the Driving-Tests.org content team following our multi-layer
              editorial process and updated whenever the {stateName} DMV changes its handbook or website
              information.{" "}
              <span id="helpful-links">
                <span className="font-semibold">Official sources we check:&nbsp;</span>
                <a
                  href={`https://driving-tests.org/${stateSlug}/${stateCode.toLowerCase()}-dmv-drivers-handbook-manual/`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {stateName} Driver Handbook (2026 edition)
                </a>
                ,&nbsp;
                <a href="https://www.revenue.alabama.gov/division/motor-vehicle/" target="_blank" rel="noopener noreferrer">
                  {stateName} DMV website
                </a>
                .
              </span>
            </div>

            <div id="reviews" className="mb-10">
              <Heading as="h3" size="2xs" className="m-0 mb-1">
                Real users who passed the exam first try
              </Heading>
              <Paragraph size="sm" color="muted" className="m-0 mb-4!">
                Verified student reviews • Shared with permission
              </Paragraph>
              <div className="grid grid-cols-4 gap-3 max-md:grid-cols-2">
                {[
                  "https://driving-tests.org/cdn-cgi/image/format=auto,quality=85,width=310/wp-content/uploads/2025/10/Shamel_NY_CDL.jpg",
                  "https://driving-tests.org/cdn-cgi/image/format=auto,quality=85,width=310/img/wall-of-fame/Louvenia.jpg",
                  "https://driving-tests.org/cdn-cgi/image/format=auto,quality=85,width=310/img/wall-of-fame/Tony.jpg",
                  "https://driving-tests.org/cdn-cgi/image/format=auto,quality=85,width=310/img/wall-of-fame/Paul.jpg",
                ].map((src) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={src} src={src} loading="lazy" alt="" className="aspect-square w-full rounded-xl object-cover" />
                ))}
              </div>
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

            <div id="weKnow" className="mb-10 grid grid-cols-2 items-center gap-6 max-md:grid-cols-1" data-nosnippet="">
              <div>
                <Heading as="h3" size="2xs" className="m-0!">
                  We know what it takes to pass. And we&apos;ve got the proof.
                </Heading>
              </div>
              <div>
                <Paragraph
                  size="md"
                  className="[&_label]:mr-1 [&_label]:inline-block [&_label]:rounded-full [&_label]:bg-[#fee2e2] [&_label]:px-2 [&_label]:py-0.5 [&_label]:text-xs [&_label]:font-semibold [&_label]:text-[#dc2626]"
                >
                  Driver&apos;s Ed is <label>scary,</label> <label>boring,</label> <label>confusing</label> - nobody
                  wants to set foot inside the DMV. That&apos;s why millions of learners trust us for simple, visual,
                  effective prep.
                </Paragraph>
              </div>
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
                    title: "Challenge Bank™",
                    text: "Our trademarked system automatically saves questions you miss, creating personalized tests that target your weak spots until you've mastered the material.",
                    Icon: RotateCcw,
                  },
                  {
                    title: "AI-powered feedback",
                    text: "Get smarter as you study. Our new AI-powered feedback provides detailed, question-level insights to help you understand the why behind each answer.",
                    Icon: Sparkles,
                  },
                  {
                    title: "Interactive handbook",
                    text: "Go beyond the boring black-and-white manual. Our interactive handbook lets you read, listen with an MP3 audio version, or even chat with it to find the information you need, faster.",
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

            <div
              id="ratingContainer"
              className="mb-10 flex flex-col items-center gap-2 border-b border-gray-100 pb-8"
              data-nosnippet=""
            >
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex items-center gap-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-gray-800">4.28</span>
                    <span className="text-sm text-gray-400">/5</span>
                  </div>
                  <div className="text-sm text-gray-400">
                    <span>763</span> votes
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} className={`h-6 w-6 ${n <= 4 ? "fill-yellow-400 text-yellow-400" : "fill-transparent text-gray-300"}`} />
                  ))}
                </div>
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
