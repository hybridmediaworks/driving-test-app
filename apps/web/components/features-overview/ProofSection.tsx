import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import { Star } from "lucide-react";
import { Breadcrumb, BreadcrumbItem } from "../ui/breadcrumb";

const avatars = [
  { initials: "AR", color: "bg-blue-400" },
  { initials: "JT", color: "bg-blue-600" },
  { initials: "MK", color: "bg-blue-800" },
  { initials: "DL", color: "bg-blue-900" },
  { initials: "SO", color: "bg-blue-500" },
];

const stats = [
  {
    value: "96%",
    label: "pass on the first attempt after hitting a 90% readiness score.",
  },
  {
    value: "11 hrs",
    label: "average total study time to test-ready — start to license.",
  },
  {
    value: "47",
    label: "states covered, each mapped to its current official handbook.",
  },
];

export default function ProofSection() {
  return (
    <section className="px-5 py-10  lg:py-30 bg-[#F2F1EC]">
      <div className="mx-auto max-w-container space-y-8 flex flex-col lg:flex-row justify-between items-center">
        <div className="lg:max-w-147.5 space-y-4">
          <Paragraph
            className="border-b border-blue-50 px-3.5 py-1.25 font-bold tracking-[1.2px] uppercase max-w-fit"
            size="xs"
            color="primary"
          >
            ✦ Proof
          </Paragraph>
          <div className="flex gap-1 justify-start">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star
                key={index}
                className="h-4 w-4 fill-blue-500 text-blue-500"
              />
            ))}
          </div>
          <Heading as="h2">Built with 4.8M+ drivers, in 47 states</Heading>
          <Paragraph>
            The tools change per state and per test. The result doesn't: people
            walk in calm and walk out with the card.
          </Paragraph>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-3">
              {avatars.map((avatar) => (
                <div
                  key={avatar.initials}
                  className={`flex h-11 w-11 items-center justify-center rounded-full text-xs font-bold text-white ring-2 ring-white ${avatar.color}`}
                >
                  {avatar.initials}
                </div>
              ))}
            </div>
            <Paragraph size="sm" color="dark">
              <strong>4.8M+ drivers </strong>have studied on DriveLane since
              2021.
            </Paragraph>
          </div>
        </div>
        <div className="grid md:gap-6 gap-4 grid-cols-1 md:grid-cols-3 lg:max-w-168.5">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white border px-6 py-12 rounded-xl space-y-4"
            >
              <Heading as="h3" size="lg" color="primary">
                {stat.value}
              </Heading>
              <Paragraph size="sm">{stat.label}</Paragraph>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
