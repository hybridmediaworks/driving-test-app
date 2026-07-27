"use client";

import Button from "@/components/ui/Button";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import { useWebLayout } from "@/lib/web-layout-context";
import {
  ArrowRight,
  Clock,
  Lightbulb,
  Map,
  MessagesSquare,
  Play,
  Volume1,
} from "lucide-react";
import Subheading from "@/components/ui/Subheading";

export default function GoFurtherSection() {
  const { selectedState } = useWebLayout();

  const resourceCards = [
    {
      icon: Clock,
      title: "60-Second WV Permit Plan",
      description:
        "A quick study plan sized to your test date — what to do today, this week, and the night before.",
      buttonText: "Get my plan",
    },
    {
      icon: Volume1,
      title: "Audio Handbook",
      description: `Listen to the full ${selectedState} handbook on your commute — 3h 12m, chaptered.`,
      buttonText: "Read the handbook",
    },
    {
      icon: Map,
      title: "Find WV DMV Offices",
      description:
        "Locations, hours, and what to bring for your written and road tests near you.",
      buttonText: "Find offices",
    },
    {
      icon: Lightbulb,
      title: "Exam-Anxiety Mini-Course",
      description:
        "Five short lessons to steady your nerves so knowledge shows up on test day.",
      buttonText: "Start the course",
    },
    {
      icon: MessagesSquare,
      title: "Ask the AI Tutor",
      description:
        "Stuck on a rule? Ask in plain English and get an answer cited to the WV handbook.",
      buttonText: "Ask a question",
    },
  ];

  return (
    <section className="pb-15 md:space-y-15 lg:pb-30 px-5">
      <div className="mx-auto max-w-container space-y-12">
        <div className="space-y-4">
          <Subheading text="Go further" />
          <Heading as="h2">Helpful resources</Heading>
          <Paragraph size="xl" color="muted">
            Small tools that clear the path from "thinking about it" to "license
            in hand."
          </Paragraph>
        </div>
        <div className="grid xl:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-4">
          <div className="p-6 bg-[#FAFAFA] border rounded-lg flex flex-col justify-between gap-4">
            <div className="space-y-4">
              <div className="aspect-video flex items-center justify-center rounded-lg shadow-[0_4px_6px_-2px_rgba(0,0,0,0.03),0_12px_16px_-4px_rgba(0,0,0,0.08)] bg-[linear-gradient(157deg,#1E3A8A_0%,#0D142C_100%)]">
                <Play className="text-white" />
              </div>
              <Paragraph size="lg" className="font-semibold" color="dark">
                Personalized Permit Checklist
              </Paragraph>
              <Paragraph color="muted" size="sm">
                Answer 3 questions, get the exact steps and documents you need
                for {selectedState}.
              </Paragraph>
            </div>
          </div>
          {resourceCards.map(
            ({ icon: Icon, title, description, buttonText }) => (
              <div
                key={title}
                className="p-6 bg-[#FAFAFA] border rounded-lg space-y-4.5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-4">
                  <Icon className="bg-blue-100 py-3 rounded-[11px] min-w-12.5 min-h-12.5 text-blue-700" />
                  <Paragraph size="lg" className="font-semibold" color="dark">
                    {title}
                  </Paragraph>
                  <Paragraph color="muted" size="sm">
                    {description}
                  </Paragraph>
                </div>
                <Button variant="ghost" className="p-0! max-w-fit" size="sm">
                  {buttonText} <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
