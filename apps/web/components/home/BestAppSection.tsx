import { Check, X } from "lucide-react";
import Image from "next/image";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";

/**
 * "The best Driver's Ed App in USA" — an iPad quiz mockup over a Drivelane-vs-
 * traditional comparison: a green "96.6% pass rate" column with pro checks on the
 * left, a driver photo in the centre, and a red "32.8% failure rate" column with
 * con crosses on the right. Matched to Figma (file QOJ34F4OPHkJ5LFrJt9eCA, the
 * floating comparison band between "Everything you need to ace it" and "Every
 * tool built"). iPad + driver imagery exported from Figma.
 */
const PROS = [
  "Updated Curriculum for 2026",
  "State-Specific Questions",
  "Science-Backed Learning Path",
  "Permit-to-License Path",
];

const CONS = ["Box-Ticking Content", "100-Page Manuals", "Outdated Quizzes"];

const UNDERLINE_PATH =
  "M397.324 9.57165C382.141 9.57165 366.958 9.68155 351.775 9.54168C339.6 9.43178 327.425 8.84232 315.233 8.77238C304.695 8.71244 294.087 8.73241 283.621 9.35185C261.638 10.6407 239.762 12.549 217.762 13.7579C207.171 14.3374 196.812 13.3682 186.488 11.0703C169.65 7.32368 152.188 9.13203 135.047 11.0903C125.044 12.2292 115.13 13.598 105.126 14.6671C96.2442 15.6162 88.3411 14.727 81.1323 11.1402C73.87 7.5235 64.5074 8.42268 56.106 9.53168C43.8955 11.1302 31.952 13.3782 19.9373 15.4364C12.408 16.7252 5.60858 15.876 1.01628 12.1393C-0.496688 10.9104 -0.12289 8.5126 0.856089 6.94401C1.26548 6.28461 6.14254 5.71511 7.8869 6.24463C13.4582 7.93311 18.3353 6.78417 23.515 5.92494C38.7514 3.39722 54.0235 0.689665 70.1678 1.45897C75.4009 1.70875 81.3459 2.38814 85.4042 4.05663C93.6454 7.45357 102.118 6.81412 110.929 5.96489C126.112 4.49621 141.224 2.7678 156.46 1.52892C167.799 0.609745 178.941 1.39902 189.835 3.76689C203.487 6.72422 217.816 5.96491 231.895 5.05573C255.426 3.5371 278.833 1.20919 302.417 0.140154C315.446 -0.449315 328.725 0.999367 341.914 1.1892C359.536 1.43897 377.175 1.2991 394.815 1.43897C403.91 1.50891 413.059 1.61882 422.084 2.19829C424.611 2.35815 428.296 4.05662 428.83 5.38542C429.916 8.06301 425.59 8.25285 421.995 8.36275C413.789 8.6325 405.584 8.92222 397.378 9.21196C397.378 9.33185 397.36 9.45175 397.342 9.56165L397.324 9.57165Z";

function Stat({ value, color }: { value: string; color: string }) {
  return (
    <span className="relative mr-1.5 inline-block whitespace-nowrap">
      {value}
      <svg
        aria-hidden="true"
        viewBox="0 0 429 16"
        preserveAspectRatio="none"
        fill="none"
        className="pointer-events-none absolute bottom-[-0.06em] left-0 h-[0.2em] w-full"
      >
        <path d={UNDERLINE_PATH} fill={color} />
      </svg>
    </span>
  );
}

export default function BestAppSection() {
  return (
    <section
      className="px-5 pb-16 lg:pb-0"
      style={{
        // Split backdrop: the tan (section-above) colour on top and the lighter
        // section colour below, with the hard boundary falling behind the iPad's
        // middle — matching the Figma composition where the device straddles it.
        backgroundImage:
          "linear-gradient(to bottom, #f2f1ec 0px, #f2f1ec 385px, #fafaf7 385px)",
      }}
    >
      <div className="mx-auto max-w-container">
        {/* iPad quiz mockup — pulled up so it straddles the section boundary and
            bleeds into the section above, matching the Figma composition. */}
        <div className="-mt-4 flex justify-center lg:-mt-14">
          <Image
            src="/bestapp/ipad-cut.png"
            alt="A DriveLane practice question shown on an iPad"
            width={1003}
            height={791}
            quality={92}
            sizes="(max-width: 1024px) 100vw, 980px"
            className="h-auto w-full max-w-[980px]"
          />
        </div>

        {/* Heading */}
        <div className="mt-6 flex flex-col items-center gap-4 text-center">
          <Heading as="h2" className="text-center">
            The best Driver&rsquo;s Ed App in USA
          </Heading>
          <Paragraph size="xl" className="text-center">
            See why millions of students choose Drivelane over traditional courses
          </Paragraph>
        </div>

        {/* Comparison — on desktop the driver is absolutely centred and BLEEDS
            over/behind the two text columns (Figma composition, node 1980:9392 at
            527×559, bottom edge = the next section's top). The columns sit at their
            Figma vertical offsets. On mobile everything stacks. */}
        <div className="relative mt-10 flex flex-col items-center gap-10 lg:mt-8 lg:block lg:h-[560px]">
          {/* Driver — absolute centre (desktop) / in-flow (mobile) */}
          <div className="order-2 lg:pointer-events-none lg:absolute lg:bottom-0 lg:left-1/2 lg:z-0 lg:-translate-x-1/2">
            <Image
              src="/bestapp/driver-node.png"
              alt="A DriveLane student holding their new driver license"
              width={527}
              height={559}
              quality={92}
              sizes="527px"
              className="h-auto w-[360px] sm:w-[440px] lg:w-[527px]"
            />
          </div>

          {/* Left — Drivelane pros */}
          <div className="order-1 lg:absolute lg:bottom-[120px] lg:left-0 lg:z-10 lg:w-[460px]">
            <h3 className="font-sora text-[30px] leading-[1.15] font-semibold tracking-[-0.96px] text-neutral-900 sm:text-[36px] lg:text-[40px]">
              <Stat value="96.6%" color="#22C55E" /> pass rate of Drivelane&rsquo;s
              students
            </h3>
            <p className="mt-4 max-w-[400px] text-base leading-6 text-neutral-500">
              38.3% of first-time written test-takers fail. Not because they
              didn&rsquo;t study. Because the tools they used were never built for
              learning.
            </p>
            <ul className="mt-6 flex flex-col gap-3">
              {PROS.map((pro) => (
                <li key={pro} className="flex items-center gap-3">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded bg-green-500">
                    <Check className="size-3.5 text-white" strokeWidth={3} />
                  </span>
                  <span className="text-lg font-semibold text-neutral-900">
                    {pro}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right — traditional-course cons */}
          <div className="order-3 lg:absolute lg:right-0 lg:bottom-[120px] lg:z-10 lg:w-[400px]">
            <h3 className="font-sora text-[30px] leading-[1.15] font-semibold tracking-[-0.96px] text-neutral-900 sm:text-[36px] lg:text-[40px]">
              <Stat value="32.8%" color="#EF4444" /> Failure rate of traditional
              courses
            </h3>
            <ul className="mt-6 flex flex-col gap-3">
              {CONS.map((con) => (
                <li key={con} className="flex items-center gap-3">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded bg-red-500">
                    <X className="size-3.5 text-white" strokeWidth={3} />
                  </span>
                  <span className="text-lg font-semibold text-neutral-900">
                    {con}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
