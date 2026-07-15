import { ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import TestimonialCarousel from "@/components/home/TestimonialCarousel";

export default function SuccessStories() {
  return (
    <section className="overflow-x-hidden px-5 pt-10 pb-15 lg:pt-30">
      <div className="mx-auto max-w-container space-y-12">
        <div className="flex flex-wrap items-center justify-center gap-6 lg:justify-between">
          <div className="flex flex-col items-center justify-center gap-6 lg:max-w-170 lg:items-start">
            <Paragraph
              className="border-b border-blue-50 px-3.5 py-1.25 font-bold tracking-[1.2px] uppercase"
              size="xs"
              color="primary"
            >
              ✦ success stories
            </Paragraph>
            <Heading as="h2" size="lg" className="font-bold!">
              4.8 million passed and counting
            </Heading>
          </div>
          <Button className="self-start lg:self-auto">
            Start Free West Virginia Practice Test <ArrowRight />
          </Button>
        </div>
        <TestimonialCarousel />
      </div>
    </section>
  );
}
