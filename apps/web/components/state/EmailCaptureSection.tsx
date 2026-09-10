"use client";

import { useState, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import { Input } from "@/components/ui/Input";
import { useWebLayout } from "@/lib/web-layout-context";
import { api, ApiError } from "@/lib/api";
import { ArrowRight, CheckCircle2 } from "lucide-react";

type Status = "idle" | "loading" | "success" | "error";

/** Matches vehicle_types.name — same mapping used by lib/useResolvedQuiz.ts. */
const vehicleSlugs: Record<string, string> = {
  Car: "car",
  Motorcycle: "motorcycle",
  CDL: "cdl",
};

export default function EmailCaptureSection() {
  const { selectedState, selectedVehicle } = useWebLayout();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (status === "loading") return;

    setStatus("loading");
    setMessage("");

    try {
      const res = await api.post<{ message: string }>("/newsletter/subscribe", {
        email,
        state: selectedState || undefined,
        vehicle_type: vehicleSlugs[selectedVehicle] ?? "car",
        source: "home_hero",
      });
      setStatus("success");
      setMessage(res.message);
      setEmail("");
    } catch (err) {
      setStatus("error");
      setMessage(
        err instanceof ApiError
          ? (err.errors?.email?.[0] ?? err.message)
          : "Something went wrong. Please try again.",
      );
    }
  }

  return (
    // The card straddles the join with the footer in Figma — its top half sits on the page
    // background, its bottom half over the footer — so on wide screens the section keeps only its
    // top padding and the card hangs half its height past the bottom edge.
    <section className="px-5 py-15 lg:pt-30 lg:pb-0">
      <div className="mx-auto max-w-container">
        {/* One rounded navy plate with the photo bleeding off its right edge — the photo is
            positioned rather than laid out so the copy column keeps the full card width on
            narrow screens, where the image drops out entirely. */}
        <div className="relative isolate z-10 overflow-hidden rounded-[48px] bg-[linear-gradient(106deg,#0d142c_0%,#172554_100%)] lg:-mb-66.5 shadow-[0px_30px_64px_-28px_rgba(16,24,40,0.3),0px_8px_18px_0px_rgba(16,24,40,0.07)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/test-slug/daily-question.webp"
            alt=""
            className="pointer-events-none absolute inset-y-0 right-0 -z-10 hidden h-full w-[62%] object-cover object-left lg:block"
          />
          <div className="pointer-events-none absolute inset-0 -z-10 hidden bg-[linear-gradient(90deg,#0d142c_0%,#0d142c_38%,rgba(13,20,44,0.85)_46%,rgba(13,20,44,0)_62%)] lg:block" />

          {/* The padding lives on the outer box so `max-w` measures the text column itself — the
              headline is meant to break over two lines at the Figma width (672px), not three. */}
          <div className="px-6 py-15 sm:px-12 lg:px-24 lg:py-30">
            <div className="flex flex-col items-start gap-3 lg:max-w-168">
              <Heading as="h2" color="white">
                Get a free DMV question every morning
              </Heading>
              <Paragraph size="xl" className="text-neutral-300!">
                One {selectedState} DMV-style question, its answer, and a
                plain-English rationale in your inbox — a two-minute warm-up
                before test day.
              </Paragraph>

              <form
                onSubmit={handleSubmit}
                className="w-full space-y-2.5 pt-3.5"
              >
                {status === "success" ? (
                  <div className="flex min-w-70 items-center gap-2.5 rounded-full bg-white/10 px-5 py-3 text-white">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-green-400" />
                    <Paragraph size="sm" className="text-white!">
                      {message}
                    </Paragraph>
                  </div>
                ) : (
                  <>
                    <div className="flex w-full flex-col gap-3 rounded-[100px] bg-white p-px sm:flex-row sm:items-center sm:justify-between">
                      <Input
                        type="email"
                        required
                        disabled={status === "loading"}
                        placeholder="you@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-14.5 flex-1 rounded-full border-transparent bg-white px-4.5 text-neutral-900 shadow-none disabled:opacity-70 dark:bg-white dark:text-neutral-900"
                      />
                      <Button
                        type="submit"
                        disabled={status === "loading"}
                        className="w-full shrink-0 text-nowrap to-blue-800! sm:w-fit"
                      >
                        {status === "loading"
                          ? "Sending…"
                          : "Send me the daily question"}
                        <ArrowRight />
                      </Button>
                    </div>
                    {status === "error" && (
                      <Paragraph size="sm" className="text-red-400!">
                        {message}
                      </Paragraph>
                    )}
                  </>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
