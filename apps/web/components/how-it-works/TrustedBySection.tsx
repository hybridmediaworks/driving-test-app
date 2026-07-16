import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import { Star } from "lucide-react";

const avatars = [
  { initials: "AR", color: "bg-blue-400" },
  { initials: "JT", color: "bg-blue-600" },
  { initials: "MK", color: "bg-blue-800" },
  { initials: "DL", color: "bg-blue-900" },
  { initials: "SO", color: "bg-blue-500" },
];

const stats = [
  { value: "96%", label: "Pass on the first try" },
  { value: "9 days", label: "Average time to test-ready" },
  { value: "15 min", label: "Typical daily session" },
];

export default function TrustedBySection() {
  return (
    <section className="py-15 lg:py-24">
      <div className="mx-auto max-w-container grid grid-cols-1 lg:grid-cols-2 items-center gap-8 md:gap-2 px-5">
        <div className="flex items-center flex-wrap md:flex-nowrap justify-center xl:justify-start gap-6">
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
          <div className="space-y-2 max-w-118.5">
            <div className="flex gap-1 justify-center md:justify-start">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  className="h-4 w-4 fill-blue-500 text-blue-500"
                />
              ))}
            </div>
            <Heading
              as="h3"
              size="sm"
              className="leading-tight text-center md:text-left"
            >
              Trusted by <span className="text-blue-600">4.8M+ drivers</span>{" "}
              across 47 states
            </Heading>
          </div>
        </div>
        <div className="flex flex-wrap justify-center xl:justify-between  gap-5 max-w-157 w-full">
          {stats.map((stat) => (
            <div key={stat.label} className="space-y-1">
              <Heading as="h3" size="lg" className="text-center md:text-left">
                {stat.value}
              </Heading>
              <Paragraph className="text-center md:text-left">
                {stat.label}
              </Paragraph>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
