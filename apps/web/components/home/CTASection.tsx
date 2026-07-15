import { ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";

export default function CTASection() {
  return (
    <section className="px-5 py-10 lg:py-20" style={{ backgroundImage: "url('/bottom-sec.webp')" }}>
      <div className="mx-auto max-w-4xl space-y-3 text-center">
        <div className="mx-auto mb-6 flex max-w-fit items-center gap-2 rounded-full bg-blue-100 py-1.5 ps-2 pe-4">
          <span className="rounded-full bg-blue-500 px-4 py-1.5 text-[11px] font-bold tracking-[1.2px] text-white uppercase">
            START TODAY
          </span>
          <Paragraph size="sm" color="muted">
            Free, no credit card required
          </Paragraph>
        </div>
        <Heading as="h2">Your license is 15 minutes away</Heading>
        <Paragraph>
          Join 4.8 million drivers who prepared smarter, not harder. Your first practice test is
          completely free.
        </Paragraph>
        <div className="mx-auto lg:-mb-5!">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/3licences.png"
            alt="Texas CDL, California and Arizona Motorcycle driver licenses"
            className="mx-auto w-full object-contain drop-shadow-xl"
          />
        </div>

        <Button size="lg" icon={ArrowRight} iconPosition="right">
          Start Free West Virginia Practice Test
        </Button>
      </div>
    </section>
  );
}
