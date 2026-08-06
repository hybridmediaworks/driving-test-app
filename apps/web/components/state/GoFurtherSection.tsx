"use client";

import { ArrowRight, BookMarked, Layers, ListChecks } from "lucide-react";
import Button from "@/components/ui/Button";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import Subheading from "@/components/ui/Subheading";
import { stateAbbreviations } from "@/lib/usStates";
import { useWebLayout } from "@/lib/web-layout-context";

const vehicleSlugs: Record<string, string> = {
  Car: "car",
  Motorcycle: "motorcycle",
  CDL: "cdl",
};

/**
 * Real replacement for the old car/motorcycle GoFurtherSection.tsx pair — both hardcoded "WV"
 * regardless of the selected state (the same bug class this whole effort exists to fix), claimed
 * a fake audio handbook, and had zero working links on any of their 5 resource cards. Only links
 * to content confirmed to actually exist for every state/vehicle combination: cheat sheets (2 per
 * combo, real), the universal road-sign flashcard deck (6 real cards, federally standardized so
 * genuinely state-agnostic), and the real quizzes browse page.
 */
export default function GoFurtherSection() {
  const { selectedState, selectedVehicle, selectedTestType } = useWebLayout();
  const stateCode = stateAbbreviations[selectedState];
  const vehicleType = vehicleSlugs[selectedVehicle] ?? "car";
  const query = `state=${stateCode}&vehicle_type=${vehicleType}`;

  const resourceCards = [
    {
      icon: BookMarked,
      title: "Cheat Sheets",
      description: `Condensed study guides for the ${selectedState} test — download and keep for quick reference.`,
      buttonText: "Browse cheat sheets",
      href: `/cheat-sheets?${query}`,
    },
    {
      icon: Layers,
      title: "Road Sign Flashcards",
      description: "Quick-recall practice for the road signs you'll see on the test.",
      buttonText: "Study flashcards",
      href: `/flashcards?${query}`,
    },
    {
      icon: ListChecks,
      title: "More Practice Tests",
      description: `Browse every ${selectedState} practice test in one place.`,
      buttonText: "Browse tests",
      href: `/quizzes?${query}&test_track=${selectedTestType}`,
    },
  ];

  return (
    <section className="pb-15 md:space-y-15 lg:pb-30 px-5">
      <div className="mx-auto max-w-container space-y-12">
        <div className="space-y-4">
          <Subheading text="Go further" />
          <Heading as="h2">Helpful resources</Heading>
          <Paragraph size="xl" color="muted">
            Small tools that clear the path from &quot;thinking about it&quot; to &quot;license in hand.&quot;
          </Paragraph>
        </div>
        <div className="grid xl:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-4">
          {resourceCards.map(({ icon: Icon, title, description, buttonText, href }) => (
            <div key={title} className="p-6 bg-neutral-50 border rounded-lg space-y-4.5 flex flex-col justify-between gap-4">
              <div className="space-y-4">
                <Icon className="bg-blue-100 py-3 rounded-[11px] min-w-12.5 min-h-12.5 text-blue-700" />
                <Paragraph size="lg" className="font-semibold" color="dark">
                  {title}
                </Paragraph>
                <Paragraph color="muted" size="sm">
                  {description}
                </Paragraph>
              </div>
              <Button variant="ghost" className="p-0! max-w-fit" size="sm" href={href}>
                {buttonText} <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
