"use client";

import { useState, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import { Input } from "@/components/ui/Input";
import { useWebLayout } from "@/lib/web-layout-context";
import { Mail, Sparkles } from "lucide-react";
import Subheading from "../ui/Subheading";

export default function EmailCaptureSection() {
  const { selectedState } = useWebLayout();
  const [email, setEmail] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
  }

  return (
    <section className="py-15 md:space-y-15 lg:py-30 px-5 bg-[linear-gradient(115deg,#1E3A8A_0%,var(--color-blue-1000)_70%)]">
      <div className="mx-auto max-w-container  flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 xl:gap-4">
        <div className="space-y-4 max-w-206">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-800 px-3.5 py-1.5 text-blue-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> Daily habit
          </div>

          <Heading as="h2" color="white">
            Get a free DMV question every morning
          </Heading>
          <Paragraph size="lg" className="text-neutral-300!">
            One {selectedState} practice question in your inbox daily. Two
            minutes, done before coffee.
          </Paragraph>
        </div>
        <form
          onSubmit={handleSubmit}
          className="w-full xl:w-fit space-y-2.5 shrink-0"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              type="email"
              required
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-auto min-w-70 rounded-full bg-white px-4.5 py-3 text-neutral-900 border-transparent"
            />
            <Button type="submit" className="w-full sm:w-fit text-nowrap">
              Send me questions
            </Button>
          </div>
          <Paragraph
            size="sm"
            className="flex items-center gap-1.5 text-neutral-400!"
          >
            <Mail className="w-3.5 h-3.5" /> Unsubscribe anytime · no spam, ever
          </Paragraph>
        </form>
      </div>
    </section>
  );
}
