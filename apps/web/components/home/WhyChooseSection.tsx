import CarAnimation from "@/components/home/CarAnimation";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";

export default function WhyChooseSection() {
  return (
    <section className="pt-15 pb-6 md:space-y-15 lg:pt-30 lg:pb-15">
      <div className="mx-auto max-w-container space-y-12 px-5">
        <div className="flex flex-col items-center justify-center gap-4">
          <Paragraph
            className="mb-2 border-b border-blue-50 px-3.5 py-1.25 font-bold tracking-[1.2px] uppercase"
            size="xs"
            color="primary"
          >
            ✦ Why Drivers Choose Drive lane
          </Paragraph>
          <Heading as="h2" className="text-center">
            Everything you need to ace it
          </Heading>
          <Paragraph className="max-w-161 text-center" size="xl">
            Designed by driving instructors and engineers to give you the exact preparation the DMV
            actually tests you on.
          </Paragraph>
        </div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="space-y-3 rounded-xl bg-white p-7 shadow-[0_24px_50px_-26px_rgba(11,11,13,0.35)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/car-icon.svg" alt="car-icon" />
            <Heading as="h3" size="sm" className="pt-3">
              Car
            </Heading>
            <Paragraph>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
              labore et dolore magna aliqua.
            </Paragraph>
          </div>
          <div className="space-y-3 rounded-xl p-7 hover:bg-white hover:shadow-[0_24px_50px_-26px_rgba(11,11,13,0.35)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/truck-icon.svg" alt="truck-icon" />
            <Heading as="h3" size="sm" className="pt-3">
              CDL
            </Heading>
            <Paragraph>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
              labore et dolore magna aliqua.
            </Paragraph>
          </div>
          <div className="space-y-3 rounded-xl p-7 hover:bg-white hover:shadow-[0_24px_50px_-26px_rgba(11,11,13,0.35)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/bike-icon.svg" alt="bike-icon" />
            <Heading as="h3" size="sm" className="pt-3">
              Bike
            </Heading>
            <Paragraph>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
              labore et dolore magna aliqua.
            </Paragraph>
          </div>
        </div>
      </div>
      <CarAnimation />
    </section>
  );
}
