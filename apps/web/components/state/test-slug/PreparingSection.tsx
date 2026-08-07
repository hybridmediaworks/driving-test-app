"use client";

import Button from "@/components/ui/Button";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import Subheading from "@/components/ui/Subheading";
import { stateAbbreviations } from "@/lib/usStates";
import { useWebLayout } from "@/lib/web-layout-context";

export default function PreparingSection() {
  const { selectedState } = useWebLayout();
  const stateCode = stateAbbreviations[selectedState] ?? "";
  return (
    <section className="py-15 lg:py-30 px-5 bg-background2">
      <div className="max-w-container mx-auto flex flex-col lg:flex-row gap-5 items-center justify-between">
        <div className="max-w-167.5 space-y-6">
          <Subheading text="WHAT YOU’RE PREPARING FOR" />
          <Heading>The {stateCode} permit test in one paragraph</Heading>
          <Paragraph size="lg">
            {selectedState}'s knowledge test is 46 multiple-choice questions
            drawn from the current Driver Handbook. You need 38 correct — 83% —
            and you get 30 minutes. Applicants under 18 sit a different
            46-question version and must also complete driver education before
            the road test.
          </Paragraph>
          <Paragraph size="lg">
            Bring proof of identity, a Social Security number, and proof of
            {selectedState} residency; the application fee is $41 and covers
            three attempts within twelve months. Fail, and you wait 7 days
            before retaking — the clock starts the day you test, not the day you
            book.
          </Paragraph>
          <Paragraph size="lg">
            Under {selectedState}'s graduated licensing rules, a provisional
            permit holder must log 50 supervised hours (10 of them at night) and
            hold the permit six months before the driving test. For the first
            twelve months of licensure, no passengers under 20 and no driving
            between 11 p.m. and 5 a.m. without a listed exception.
          </Paragraph>
          <Paragraph size="lg">
            DriveLane is an independent study platform. Figures shown are dummy
            data for design review and are not official {selectedState} DMV
            requirements.
          </Paragraph>
          <Button size="lg" variant="ghost" className="p-0!">
            See sources and methodology
          </Button>
        </div>
        <div className="max-w-149.25">
          <img
            src="/what-you-prepare.svg"
            alt="what-you-prepare"
            className="w-full"
          />
        </div>
      </div>
    </section>
  );
}
