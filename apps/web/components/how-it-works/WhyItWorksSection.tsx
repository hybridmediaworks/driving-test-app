import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import { Separator } from "@/components/ui/separator";
import { BrainCircuit, Database, ShieldCheck } from "lucide-react";

export default function WhyItWorksSection() {
  return (
    <section className="py-15 md:space-y-15 lg:py-30">
      <div className="mx-auto max-w-container space-y-12 px-5">
        <div className="space-y-4 max-w-205">
          <Paragraph
            className="mb-2 border-b border-blue-50 px-3.5 py-1.25 font-bold tracking-[1.2px] uppercase"
            size="xs"
            color="primary"
          >
            ✦ What makes it work
          </Paragraph>
          <Heading as="h2">
            Three steps is easy to say. Here's why ours holds up.
          </Heading>
          <Paragraph>
            Most people fail the written test for one of two reasons: they
            studied the wrong material, or they studied it the wrong way. We
            fixed both — then put our money behind it.
          </Paragraph>
        </div>
        <div className="grid gap-5 grid-cols-1 lg:grid-cols-2">
          <div className="relative rounded-2xl border bg-white p-5 lg:p-8 space-y-6 shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]">
            <BrainCircuit className="bg-blue-50 p-3.5 rounded-[11px] w-13.5 h-13.5 text-blue-600" />
            <Heading size="sm" className="mb-3">
              Adaptive AI, not a fixed deck
            </Heading>
            <Paragraph>
              The engine watches which topics you miss and reweights every
              session around them. Right-of-way keeps tripping you up? You'll
              see it again tomorrow, and the day after, until it doesn't.
            </Paragraph>
            <Separator />
            <Paragraph size="sm" color="muted" className="max-w-109.5">
              Learners reach test-ready ~40% faster than with a static practice
              set. [Dummy data — CLIENT TO CONFIRM]
            </Paragraph>
          </div>
          <div className="relative rounded-2xl border bg-white p-5 lg:p-8 space-y-6 shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]">
            <Database className="bg-blue-50 p-3.5 rounded-[11px] w-13.5 h-13.5 text-blue-600" />
            <Heading size="sm" className="mb-3">
              Adaptive AI, not a fixed deck
            </Heading>
            <Paragraph>
              The engine watches which topics you miss and reweights every
              session around them. Right-of-way keeps tripping you up? You'll
              see it again tomorrow, and the day after, until it doesn't.
            </Paragraph>
            <Separator />
            <Paragraph size="sm" color="muted" className="max-w-109.5">
              Learners reach test-ready ~40% faster than with a static practice
              set. [Dummy data — CLIENT TO CONFIRM]
            </Paragraph>
          </div>
        </div>
        <div className="bg-linear-to-r from-blue-900 to-blue-600 rounded-2xl justify-between border border-white/10 px-5 lg:px-8 grid grid-cols-1 lg:grid-cols-2 items-center gap-0 md:gap-2">
          <div className="space-y-6 py-5 lg:py-8 max-w-147">
            <ShieldCheck className="bg-white/8 p-3.5 rounded-[11px] w-13.5 h-13.5 text-blue-300" />
            <Heading size="sm" className="mb-3" color="white">
              Pass, or you don't pay
            </Heading>
            <Paragraph className="text-neutral-300! pb-3 border-b border-white/15">
              Finish your plan, hit 90% readiness, and if you still don't pass
              your written test on the first try, we refund you in full. The
              guarantee is how we keep ourselves honest about steps one and two.
            </Paragraph>
            <Paragraph
              size="sm"
              color="muted"
              className="max-w-109.5 text-white/60!"
            >
              Applies to the written knowledge test. Requires a completed study
              plan and 90%+ readiness. Full terms on the Guarantee page. [CLIENT
              TO CONFIRM]
            </Paragraph>
          </div>
          <div className="max-w-152">
            <img
              src="/pass-license-img.png"
              className="lg:-mb-17.5 w-full relative rounded-[34px] shadow-[inset_0_1.836px_0_0_rgba(255,255,255,0.22),inset_0_0_0_1.836px_rgba(255,255,255,0.09),0_44.072px_91.818px_-40.4px_rgba(8,9,12,0.55),0_14.691px_36.727px_-22.036px_rgba(8,9,12,0.45)]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
