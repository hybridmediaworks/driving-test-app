import type { Metadata } from "next";
import { ChevronRight, ChevronRightIcon, Play, ShieldCheck } from "lucide-react";
import Button from "@/components/ui/Button";
import ChallangeBankBanner from "@/components/cdl/ChallangeBankBanner";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import HandbookBanner from "@/components/cdl/HandbookBanner";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import PremiumBanner from "@/components/cdl/PremiumBanner";
import TestSteps from "@/components/cdl/TestSteps";
import { slugToStateName, stateAbbreviations, usStates } from "@/lib/usStates";
import { WebLayoutProvider } from "@/lib/web-layout-context";

function resolveStateName(stateSlug: string): string {
  const name = stateSlug ? slugToStateName(stateSlug) : "";
  return (usStates as string[]).includes(name) ? name : "Alabama";
}

type Step = {
  title: string;
  questions: number;
  type: "free" | "premium";
  locked?: boolean;
  image: string;
  status?: "next";
};

type TopicSection = {
  key: string;
  badge?: string;
  header: {
    headerSequence: string;
    headerTitle: string;
    headerDesc: string;
    totalQuestions: string;
  };
  steps: Step[];
  video?: {
    title: string;
    points: string[];
  };
};

function freeStep(title: string, questions: number, status?: "next"): Step {
  return { title, questions, type: "free", image: "/driving-tests.jpg", status };
}

function premiumStep(title: string, questions: number): Step {
  return { title, questions, type: "premium", locked: true, image: "/driving-tests.jpg" };
}

function buildTopicSections(code: string): TopicSection[] {
  return [
    {
      key: "general-knowledge",
      header: {
        headerSequence: "1",
        headerTitle: "General Knowledge",
        headerDesc: "Core rules every CDL applicant must pass, no matter which class or endorsement you need.",
        totalQuestions: "350",
      },
      steps: [
        freeStep(`${code} CDL Diagnostic Test`, 15),
        freeStep(`${code} General Knowledge Test 1`, 25, "next"),
        freeStep(`${code} General Knowledge Test 2`, 25),
        premiumStep(`${code} General Knowledge Test 3`, 25),
        premiumStep(`${code} General Knowledge Test 4`, 25),
        premiumStep(`${code} General Knowledge Test 5`, 25),
        premiumStep(`${code} General Knowledge Test 6`, 25),
        premiumStep(`${code} General Knowledge Test 7`, 25),
        premiumStep("General Knowledge Simulator", 50),
      ],
      video: {
        title: "Class A/B ELDT Video Course",
        points: [
          "Orientation",
          "Control Systems and Dashboard",
          "Backing and Docking",
          "Basic Operating Procedures",
          "Visual Search",
          "Communication",
          "Shifting and Operating Systems",
          "Speed Management",
          "Hours of Service",
          "Fatigue and Wellness",
          "Advanced Operating Procedures",
          "Hazard Perception",
          "Skid Control and Recovery",
          "Extreme Driving Conditions",
        ],
      },
    },
    {
      key: "hazmat",
      badge: "NEW",
      header: {
        headerSequence: "2",
        headerTitle: "Hazardous Materials (HazMat)",
        headerDesc: "Required for drivers who transport placarded hazardous materials.",
        totalQuestions: "112",
      },
      steps: [
        freeStep(`${code} HazMat Test 1`, 20),
        freeStep(`${code} HazMat Test 2`, 20, "next"),
        premiumStep(`${code} HazMat Test 3`, 20),
        premiumStep("HazMat Placards", 15),
        premiumStep("HazMat Attention Points", 15),
        premiumStep("2024 Emergency Response Guidebook", 10),
        premiumStep("HazMat Loading and Handling", 12),
      ],
      video: {
        title: "HazMat ELDT Video Course",
        points: [
          "HazMat Regulations",
          "HazMat Communications",
          "Loading and Unloading",
          "Bulk and Non-Bulk Packaging",
          "Route Selection and Emergency Response",
          "Attacks and Security Awareness",
        ],
      },
    },
    {
      key: "school-bus",
      badge: "NEW",
      header: {
        headerSequence: "3",
        headerTitle: "School Bus",
        headerDesc: "For drivers who transport students to and from school.",
        totalQuestions: "100",
      },
      steps: [
        freeStep(`${code} School Bus Test 1`, 20),
        freeStep(`${code} School Bus Test 2`, 20, "next"),
        premiumStep(`${code} School Bus Test 3`, 20),
        premiumStep("School Bus Danger Zone", 10),
        premiumStep("School Bus Evacuation Procedures", 10),
        premiumStep("Safe Turning Procedures for School Bus Drivers", 10),
        premiumStep("Test Along Video Questions", 10),
      ],
      video: {
        title: "School Bus ELDT Video Course",
        points: [
          "Who can drive a school bus",
          "Types of school buses",
          "Danger zones",
          "Safe backing and loading",
          "Approaching the bus stop",
          "Evacuation procedures",
          "Railroad crossings",
          "Serious behavior issues",
          "Post-trip inspection",
        ],
      },
    },
    {
      key: "passenger",
      badge: "NEW",
      header: {
        headerSequence: "4",
        headerTitle: "Passenger Vehicles",
        headerDesc: "For drivers who carry 16 or more passengers, including the driver.",
        totalQuestions: "100",
      },
      steps: [
        freeStep(`${code} Passenger Test 1`, 20),
        freeStep(`${code} Passenger Vehicles Test 2`, 20, "next"),
        premiumStep(`${code} Passenger Vehicles Test 3`, 20),
        premiumStep(`${code} Passenger Vehicles Test 4`, 20),
        premiumStep("Passenger Vehicles Test 5", 20),
      ],
      video: {
        title: "Passenger ELDT Video Course",
        points: [
          "Who must have the endorsement",
          "Vehicle inspections",
          "Loading and unloading passengers",
          "Emergency exits and evacuations",
          "Prohibited practices",
          "Use of the brake-door interlock",
        ],
      },
    },
    {
      key: "air-brakes",
      header: {
        headerSequence: "5",
        headerTitle: "Air Brakes",
        headerDesc: "Required unless you take the air brake restriction on your CDL.",
        totalQuestions: "120",
      },
      steps: [
        freeStep(`${code} Air Brakes Test 1`, 25),
        freeStep(`${code} Air Brakes Test 2`, 25, "next"),
        premiumStep(`${code} Air Brakes Test 3`, 25),
        premiumStep(`${code} Air Brakes Miscellaneous`, 15),
        premiumStep("Air Brakes Simulator", 30),
      ],
    },
    {
      key: "combination-vehicles",
      header: {
        headerSequence: "6",
        headerTitle: "Combination Vehicles",
        headerDesc: "Coupling, uncoupling, and handling tractor-trailer rigs.",
        totalQuestions: "110",
      },
      steps: [
        freeStep(`${code} Combination Vehicles Test 1`, 20),
        freeStep(`${code} Combination Vehicles Test 2`, 20, "next"),
        premiumStep(`${code} Combination Vehicles Test 3`, 20),
        premiumStep(`${code} Combination Vehicles Test 4`, 20),
        premiumStep("Combination Vehicles Simulator", 30),
      ],
    },
    {
      key: "double-triple-trailers",
      header: {
        headerSequence: "7",
        headerTitle: "Double/Triple Trailers",
        headerDesc: "Required for the T endorsement.",
        totalQuestions: "85",
      },
      steps: [
        freeStep(`${code} Doubles/Triples Trailers Test 1`, 20),
        freeStep(`${code} Doubles/Triples Trailers Test 2`, 20, "next"),
        premiumStep(`${code} Doubles/Triples Trailers Test 3`, 20),
        premiumStep("Doubles/Triples Trailers Simulator", 25),
      ],
    },
    {
      key: "tanker-vehicles",
      header: {
        headerSequence: "8",
        headerTitle: "Tanker Vehicles",
        headerDesc: "Required for the N endorsement.",
        totalQuestions: "85",
      },
      steps: [
        freeStep(`${code} Tanker Vehicles Test 1`, 20),
        freeStep(`${code} Tanker Vehicles Test 2`, 20, "next"),
        premiumStep(`${code} Tanker Vehicles Test 3`, 20),
        premiumStep("Tanker Vehicles Simulator", 25),
      ],
    },
    {
      key: "pre-trip-inspection",
      header: {
        headerSequence: "9",
        headerTitle: "Pre-Trip Inspection",
        headerDesc: "The walk-around inspection you must perform correctly on your skills test.",
        totalQuestions: "115",
      },
      steps: [
        freeStep(`${code} Pre-Trip Inspection Test 1`, 20),
        freeStep("How to Perform a CDL Class A Pre-Trip Inspection", 0, "next"),
        premiumStep("Full Extended Vehicle Inspection Test", 25),
        premiumStep(`${code} Pre-Trip Inspection Test 2`, 20),
        premiumStep("Air Brakes Test on Combination Vehicle", 20),
        premiumStep("Pre-Trip Inspection by Class Video", 15),
      ],
    },
  ];
}

const cdlGoals = [
  "Get Class A CDL",
  "Get Class B CDL",
  "Get Class C CDL",
  "Get HazMat endorsement",
  "Get Passenger endorsement",
  "Get School Bus endorsement",
];

const premiumInfo = {
  title: "Unlock all CDL exam-like questions",
  subtitle: "1000+ questions covering all 50 states and endorsements. Instant PDF handbook access.",
  features: ["CDL bundle", "PDF handbook", "Exam simulator"],
  rating: { star: "4.9", students: "12,400" },
};

const videoTopicGroups = [
  {
    title: "Basic Operations",
    items: [
      "Orientation",
      "Control Systems and Dashboards",
      "Pre- and Post-Trip Inspection",
      "Basic Operations",
      "Shifting and Transmissions",
      "Backing and Docking",
    ],
  },
  {
    title: "Safe Operating Practices",
    items: ["Visual search", "Communication", "Distraction", "Speed management", "Space management", "Night operation", "Extreme conditions"],
  },
  {
    title: "Advanced Operating Procedures",
    items: ["Hazard Perception", "Skid Control", "Railroad-Highway Grade Crossing"],
  },
  {
    title: "Vehicle Systems",
    items: ["Identification and diagnosis of malfunctions", "Roadside inspections", "Maintenance"],
  },
  {
    title: "Non-Driving Operations",
    items: [
      "Handling and documenting cargo",
      "Environmental compliance",
      "Hours of Service",
      "Fatigue and wellness awareness",
      "Post-crash procedures",
    ],
  },
  {
    title: "",
    items: ["External communication", "Whistleblower and coercion", "Trip planning", "Drugs and alcohol", "Medical requirements"],
  },
];

export async function generateMetadata({ params }: { params: Promise<{ state: string }> }): Promise<Metadata> {
  const { state } = await params;
  const stateName = resolveStateName(state);

  const title = `${stateName} CDL Practice Tests - All Endorsements`;
  const description =
    "Practice the exact question formats your DMV uses. Pass, get your CDL, and start earning $60K+ within weeks - not months.";

  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function CdlPage({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params;
  const stateName = resolveStateName(state);
  const stateCode = stateAbbreviations[stateName] ?? "";
  const topicSections = buildTopicSections(stateCode);

  return (
    <WebLayoutProvider stateSlug={state}>
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="states" />
        <main className="flex-1">
          <div className="mx-auto max-w-container px-3.5" role="main">
            <section className="py-6">
              <div className="flex gap-4 pb-10">
                <div className="w-3/5 space-y-3">
                  <Heading size="lg">{stateName} CDL Practice Tests - All Endorsements</Heading>
                  <h1 className="text-[44px] leading-tight font-bold" />
                  <Paragraph>
                    Practice the exact question formats your DMV uses. When you sit down for the real test,
                    you&apos;ll know the answer before you finish reading the question. Pass, get your CDL, and start
                    earning $60K+ within weeks - not months.
                  </Paragraph>
                  <div className="flex items-center justify-start gap-2">
                    <span className="max-w-34 text-sm font-bold text-neutral-900">
                      FMCSA-Registered ELDT Provider
                    </span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/tpr_logo_blue.svg" alt="" />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/fmcsa_logo_blue.svg" alt="" />
                    <span className="max-w-34 text-[9px] font-bold text-neutral-900">
                      Federal Motor Carrier Safety Administration Provider
                    </span>
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
                      <span className="rounded-full bg-green-400/30 px-2 py-1 text-xs font-semibold text-green-500">
                        LIVE
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <Paragraph>
                Whether it&apos;s crab legs or crude oil you want to haul through America&apos;s 49th state, you must
                obtain an Alaska commercial driver&apos;s license (CDL). If you want to drive a tank vehicle across
                ice roads or apply to drive a school bus in Fairbanks, we&apos;ve got you covered. With practice
                tests that simulate the actual exams, as well as all varieties of endorsements, including passenger
                and school busses, doubles/triples, tank vehicles, hazardous materials, or air brake restriction
                removal, you&apos;ll be sure to pass the first time.
              </Paragraph>
            </section>

            <section className="mb-8">
              <Heading as="h2" size="2xs" className="mb-4">
                What&apos;s your {stateCode} CDL goal?
              </Heading>
              <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
                {cdlGoals.map((goal) => (
                  <div
                    key={goal}
                    className="flex cursor-pointer gap-3 rounded-xl border bg-white px-4 py-3.5 shadow-md hover:border-blue-400 hover:bg-blue-50"
                  >
                    <Paragraph
                      size="xs"
                      color="white"
                      className="mt-1.25 flex h-7 w-7 items-center justify-center rounded-full bg-neutral-600"
                    >
                      A
                    </Paragraph>
                    <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                      <Paragraph color="dark" className="font-semibold">
                        {goal}
                      </Paragraph>
                      <Paragraph color="muted" size="sm">
                        Tractor-trailers, semis, 18-wheelers
                      </Paragraph>
                    </div>
                    <ChevronRightIcon className="mt-1 text-neutral-400" />
                  </div>
                ))}
              </div>
            </section>

            <section className="mb-10">
              <PremiumBanner premiumInfo={premiumInfo} />
            </section>

            {topicSections.map((section) => (
              <div key={section.key}>
                <section className="mb-12 space-y-4">
                  <div className="relative flex items-center justify-between gap-2">
                    <Heading as="h2" size="xs">
                      {section.header.headerTitle}
                    </Heading>
                    <Paragraph size="sm" color="muted">
                      {section.header.totalQuestions} questions + Marathon
                    </Paragraph>
                  </div>
                  <TestSteps steps={section.steps} columns={5} />
                </section>

                {section.video && (
                  <section className="mb-12 grid grid-cols-[1fr_320px] gap-6 rounded-3xl bg-blue-50 p-6 max-lg:grid-cols-1">
                    <div className="space-y-2">
                      <Paragraph color="dark" className="font-sora font-semibold">
                        {section.video.title}
                      </Paragraph>
                      <div className="grid grid-cols-3 gap-x-5.5 gap-y-6 text-sm text-neutral-600">
                        {videoTopicGroups.map((group, index) => (
                          <div className="space-y-3" key={index}>
                            <Paragraph size="sm" color="dark" className="font-sora font-semibold">
                              {group.title || " "}
                            </Paragraph>
                            <ul className="list-disc pl-5">
                              {group.items.map((item) => (
                                <li key={item}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                      <Button variant="ghost" className="p-0!" size="sm">
                        Watch demo →
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/tpr_logo_blue.svg" alt="" />
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/fmcsa_logo_blue.svg" alt="" />
                        <span className="text-[9px] font-bold text-neutral-900">
                          Federal Motor Carrier Safety Administration Provider
                        </span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/daimond.svg" alt="" />
                      </div>
                      <div className="relative aspect-video overflow-hidden rounded-2xl bg-black/80">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/driving-tests.jpg"
                          className="h-full w-full object-cover opacity-70"
                          alt=""
                        />
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90">
                            <Play className="h-6 w-6 text-[#5b4bd6]" />
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Paragraph
                          size="xs"
                          color="primary"
                          className="rounded-md border border-blue-700 px-1.5 py-0.5 font-semibold"
                        >
                          Video
                        </Paragraph>
                        <Paragraph
                          size="xs"
                          color="primary"
                          className="rounded-md border border-blue-700 px-1.5 py-0.5 font-semibold"
                        >
                          Audio
                        </Paragraph>
                        <Paragraph
                          size="xs"
                          color="primary"
                          className="rounded-md border border-blue-700 px-1.5 py-0.5 font-semibold"
                        >
                          PDF
                        </Paragraph>
                      </div>
                    </div>
                  </section>
                )}
              </div>
            ))}

            <section className="mb-10">
              <ChallangeBankBanner />
            </section>

            <section className="mb-10">
              <HandbookBanner />
            </section>

            <section className="mb-10 flex items-center justify-between gap-15 rounded-3xl bg-blue-50 ps-5 pr-15 max-md:flex-col max-md:items-start">
              <div>
                <Heading as="h3" size="xs" className="mb-1 text-[22px]!">
                  10 Things You Should Do Before Your CDL Knowledge Exam
                </Heading>
                <Paragraph size="sm" color="muted" className="mb-2">
                  Many people arrive at the DMV overconfident and underprepared because they fail to do some of the
                  simple things that would allow them to pass easily. What follows are the 10 steps that every
                  aspiring commercial driver should take to prepare for his or her official CDL or CLP knowledge
                  exam.
                </Paragraph>
                <Button variant="ghost" className="p-0!" size="sm">
                  Open E-Book <ChevronRight className="w-4" />
                </Button>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/Oregon.avif" className="max-w-35.5 shrink-0 object-cover pt-5" alt="" />
            </section>

            <div id="experts" className="mb-12 grid grid-cols-2 gap-4 max-md:grid-cols-1" data-nosnippet="">
              <div className="expert flex flex-1 bg-transparent p-0">
                <div className="flex w-full gap-5 rounded-[20px] bg-white px-5 pt-5 pb-3.5">
                  <div className="image relative shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/reviewedby_steven.webp" alt="" className="h-auto w-16" />
                    <div className="absolute top-2/3 right-0 flex size-8 items-center justify-center rounded-full bg-green-400 text-white">
                      <ShieldCheck className="h-4" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-base font-bold">Reviewed for legal and handbook accuracy</h4>
                    <h5 className="text-sm font-bold text-blue-primary decoration-1 underline-offset-4 hover:underline">
                      Steven Litvintchouk
                    </h5>
                    <p className="text-sm text-grey">
                      M.S., Chief Educational Researcher (ACES member). Last verified for accuracy on {stateName} CDL
                      requirements.
                    </p>
                  </div>
                </div>
              </div>
              <div className="expert flex flex-1 bg-transparent p-0">
                <div className="flex w-full gap-5 rounded-[20px] bg-white px-5 pt-5 pb-3.5">
                  <div className="image relative shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/reviewedby_steven.webp" alt="" className="h-auto w-16" />
                    <div className="absolute top-2/3 right-0 flex size-8 items-center justify-center rounded-full bg-green-400 text-white">
                      <ShieldCheck className="h-4" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-base font-bold">Test design and learning experience oversight</h4>
                    <h5 className="text-sm font-bold text-blue-primary decoration-1 underline-offset-4 hover:underline">
                      Andrei Zakhareuski
                    </h5>
                    <p className="text-sm text-grey">Co-founder &amp; CEO, Driving-Tests.org</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </WebLayoutProvider>
  );
}
