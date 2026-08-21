"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import Paragraph from "@/components/ui/Paragraph";
import { stateToSlug } from "@/lib/usStates";
import { useWebLayout } from "@/lib/web-layout-context";

const socialLinks = [
  {
    label: "Facebook",
    href: "#",
    paths: [
      "M11.9993 1.33301H9.99935C9.11529 1.33301 8.26745 1.6842 7.64233 2.30932C7.01721 2.93444 6.66602 3.78229 6.66602 4.66634V6.66634H4.66602V9.33301H6.66602V14.6663H9.33268V9.33301H11.3327L11.9993 6.66634H9.33268V4.66634C9.33268 4.48953 9.40292 4.31996 9.52794 4.19494C9.65297 4.06991 9.82254 3.99967 9.99935 3.99967H11.9993V1.33301Z",
    ],
  },
  {
    label: "Twitter",
    href: "#",
    paths: [
      "M14.6673 2.66636C14.6673 2.66636 14.2007 4.06636 13.334 4.93302C14.4007 11.5997 7.06732 16.4664 1.33398 12.6664C2.80065 12.733 4.26732 12.2664 5.33398 11.333C2.00065 10.333 0.333984 6.39969 2.00065 3.33302C3.46732 5.06636 5.73398 6.06636 8.00065 5.99969C7.40065 3.19969 10.6673 1.59969 12.6673 3.46636C13.4007 3.46636 14.6673 2.66636 14.6673 2.66636Z",
    ],
  },
  {
    label: "Instagram",
    href: "#",
    paths: [
      "M11.334 1.33301H4.66732C2.82637 1.33301 1.33398 2.82539 1.33398 4.66634V11.333C1.33398 13.174 2.82637 14.6663 4.66732 14.6663H11.334C13.1749 14.6663 14.6673 13.174 14.6673 11.333V4.66634C14.6673 2.82539 13.1749 1.33301 11.334 1.33301Z",
      "M10.6658 7.5802C10.7481 8.13503 10.6533 8.70168 10.395 9.19954C10.1367 9.69741 9.72792 10.1011 9.2269 10.3533C8.72589 10.6055 8.15812 10.6933 7.60434 10.6042C7.05057 10.515 6.53899 10.2536 6.14238 9.85698C5.74577 9.46036 5.48431 8.94878 5.3952 8.39501C5.30609 7.84124 5.39386 7.27346 5.64604 6.77245C5.89821 6.27144 6.30194 5.86269 6.79981 5.60436C7.29768 5.34603 7.86432 5.25126 8.41915 5.33353C8.9851 5.41746 9.50905 5.68118 9.91362 6.08574C10.3182 6.4903 10.5819 7.01425 10.6658 7.5802Z",
      "M11.666 4.33301H11.6727",
    ],
  },
  {
    label: "LinkedIn",
    href: "#",
    paths: [
      "M10.666 5.33301C11.7269 5.33301 12.7443 5.75444 13.4944 6.50458C14.2446 7.25473 14.666 8.27214 14.666 9.33301V13.9997H11.9993V9.33301C11.9993 8.97939 11.8589 8.64025 11.6088 8.3902C11.3588 8.14015 11.0196 7.99967 10.666 7.99967C10.3124 7.99967 9.97326 8.14015 9.72321 8.3902C9.47316 8.64025 9.33268 8.97939 9.33268 9.33301V13.9997H6.66602V9.33301C6.66602 8.27214 7.08744 7.25473 7.83759 6.50458C8.58773 5.75444 9.60515 5.33301 10.666 5.33301Z",
      "M4.00065 6H1.33398V14H4.00065V6Z",
      "M2.66732 3.99967C3.4037 3.99967 4.00065 3.40272 4.00065 2.66634C4.00065 1.92996 3.4037 1.33301 2.66732 1.33301C1.93094 1.33301 1.33398 1.92996 1.33398 2.66634C1.33398 3.40272 1.93094 3.99967 2.66732 3.99967Z",
    ],
  },
];

const linkClass = "text-base text-neutral-700 hover:text-neutral-900";

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <Paragraph size="xl" color="dark" className="font-semibold">
        {title}
      </Paragraph>
      {children}
    </div>
  );
}

function LinkList({ links }: { links: { label: string; href: string }[] }) {
  return (
    <div className="grid grid-cols-1 gap-4">
      {links.map((l) => (
        <Link key={l.label} href={l.href} className={linkClass}>
          {l.label}
        </Link>
      ))}
    </div>
  );
}

export default function Footer() {
  const { selectedState } = useWebLayout();
  const stateSlug = selectedState ? stateToSlug(selectedState) : "";

  const carBikeLinks = [
    { label: "Beginner Driver's Guide", href: "/how-it-works" },
    { label: "Driving Simulator", href: "/exam-simulator" },
    { label: "VIN Decoder", href: "/vin-decoder" },
    { label: "Permit Test Cheat Sheet", href: "/cheat-sheets" },
    { label: "Driver's Handbook", href: "/handbook" },
  ];
  const cdlPrimary = [
    { label: "CDL Class A", href: "/cdl/class-a" },
    { label: "CDL Class B", href: "/cdl/class-b" },
    {
      label: "CDL Practice Test",
      href: stateSlug ? `/${stateSlug}/cdl` : "/quizzes?vehicle_type=cdl",
    },
    { label: "CDL License FAQ", href: "/cdl/faq" },
    { label: "CDL Handbooks", href: "/cdl/handbooks" },
    { label: "Combinations", href: "/cdl/combinations" },
  ];
  const cdlEndorsements = [
    { label: "Hazmat", href: "/cdl/hazmat" },
    { label: "Tanker", href: "/cdl/tanker" },
    { label: "Passenger", href: "/cdl/passenger" },
    { label: "Air Brakes", href: "/cdl/air-brakes" },
    { label: "School Bus", href: "/cdl/school-bus" },
    { label: "Doubles/Triples", href: "/cdl/doubles-triples" },
  ];
  const aboutLinks = [
    { label: "About Us", href: "/about" },
    { label: "Contact Us", href: "/contact" },
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms of Use", href: "/terms" },
  ];

  return (
    <footer className="bg-background2 px-6 pt-6 pb-10 lg:pt-8 lg:pb-14">
      <div className="mx-auto max-w-container space-y-6 lg:space-y-8">
        <Image
          src="/driving-test-logo.png"
          alt="Driving Test"
          width={529}
          height={198}
          className="h-[100px] w-auto"
        />

        <div className="flex flex-wrap justify-between gap-x-8 gap-y-10">
          <FooterColumn title="Car">
            <LinkList links={carBikeLinks} />
          </FooterColumn>

          {/* CDL spans two link columns (primary + endorsements), like the Figma */}
          <FooterColumn title="CDL">
            <div className="flex gap-x-10 lg:gap-x-16">
              <LinkList links={cdlPrimary} />
              <LinkList links={cdlEndorsements} />
            </div>
          </FooterColumn>

          <FooterColumn title="Bike">
            <LinkList links={carBikeLinks} />
          </FooterColumn>

          <FooterColumn title="About">
            <LinkList links={aboutLinks} />
          </FooterColumn>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-8">
            <a href="#" aria-label="Download on the App Store">
              <Image src="/appstore.svg" alt="Download on the App Store" width={135} height={40} className="h-10 w-auto" />
            </a>
            <a href="#" aria-label="Get it on Google Play">
              <Image src="/googleplay.svg" alt="Get it on Google Play" width={135} height={40} className="h-10 w-auto" />
            </a>
          </div>

          <div className="flex items-center gap-3">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="flex size-9 items-center justify-center rounded-[14px] bg-neutral-100 text-blue-500 transition-colors hover:bg-blue-50"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="size-4"
                  aria-hidden="true"
                >
                  {social.paths.map((d) => (
                    <path
                      key={d}
                      d={d}
                      stroke="currentColor"
                      strokeWidth="1.33333"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ))}
                </svg>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
