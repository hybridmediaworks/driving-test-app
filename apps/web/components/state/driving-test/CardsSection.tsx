"use client";

import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import type { DrivingTestSection as DrivingTestSectionData } from "@/data/drivingTestMockData";
import StepCard from "@/components/state/StepCard";

export default function CardsSection({
  section,
}: {
  section: DrivingTestSectionData;
}) {
  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <Paragraph color="primary" className="font-semibold">
          {section.header.countLabel} {section.cardType}s
        </Paragraph>
        <Heading as="h2">{section.header.title}</Heading>
        <Paragraph color="muted" className="pt-1">
          {section.header.description}
        </Paragraph>
      </div>
      {section.groups.map((group, groupIndex) => (
        <div className="space-y-4" key={group.title ?? groupIndex}>
          {group.title && (
            <Paragraph size="2xl" className="font-semibold" color="dark">
              {group.title}
            </Paragraph>
          )}
          <div className="grid lg:grid-cols-4 md:grid-cols-3 grid-cols-1 gap-6">
            {group.cards.map((card, cardIndex) => (
              <StepCard
                key={cardIndex}
                step={card}
                cardType={section.cardType}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
