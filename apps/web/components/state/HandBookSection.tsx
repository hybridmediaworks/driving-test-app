"use client";

import Button from "@/components/ui/Button";
import Paragraph from "@/components/ui/Paragraph";
import { useWebLayout } from "@/lib/web-layout-context";
import {
  ArrowDownToLine,
  BookOpen,
  MessagesSquare,
  Volume1,
} from "lucide-react";

export default function HandBookSection() {
  const { selectedState } = useWebLayout();

  return (
    <div className="relative max-w-226 p-6 bg-white rounded-2xl flex flex-col lg:flex-row justify-between items-center xl:gap-4 gap-6">
      <div className="min-h-73.25 shadow-[0_4px_6px_-2px_rgba(0,0,0,0.03),0_12px_16px_-4px_rgba(0,0,0,0.08)] bg-[linear-gradient(157deg,#1E3A8A_0%,var(--color-blue-1000)_100%)] max-w-55 rounded-lg overflow-hidden flex items-stretch">
        <div className="bg-black/25 min-w-2.5" />
        <div className=" pt-6 ps-2.5 flex flex-col justify-between gap-5">
          <div className="space-y-5">
            <Paragraph size="sm" className="text-blue-200!">
              {selectedState}
            </Paragraph>
            <Paragraph
              size="xl"
              className="font-sora font-semibold"
              color="white"
            >
              Summarized Driver's Handbook
            </Paragraph>
          </div>
          <div className="flex items-center justify-between">
            <Paragraph size="xs" color="white">
              2026 edition
            </Paragraph>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="115"
              height="116"
              viewBox="0 0 115 116"
              fill="none"
            >
              <path
                d="M39.8325 60.9549C42.2993 51.7501 51.761 42.2884 60.9659 39.8216L118.353 24.4425C127.558 21.9757 133.02 27.4379 130.553 36.6427L115.174 94.0297C112.707 103.234 103.245 112.696 94.0406 115.163L36.6537 130.542C27.4489 133.009 21.9866 127.547 24.4534 118.342L39.8325 60.9549Z"
                fill="#3B82F6"
              />
              <path
                d="M16.8265 37.948C19.2933 28.7432 28.755 19.2815 37.9598 16.8147L95.3468 1.43562C104.552 -1.03117 110.014 4.43107 107.547 13.6359L92.168 71.0228C89.7012 80.2276 80.2395 89.6893 71.0347 92.1561L13.6477 107.535C4.44286 110.002 -1.01939 104.54 1.4474 95.335L16.8265 37.948Z"
                fill="#1D4ED8"
              />
            </svg>
          </div>
        </div>
      </div>
      <div className="flex-1 w-full grid md:grid-cols-2 grid-cols-1 gap-4">
        <div className="p-4 flex gap-4 bg-neutral-50 border rounded-lg">
          <BookOpen className="min-w-10.5 min-h-10.5 p-2.5 rounded-md border text-blue-700 " />
          <div>
            <Paragraph className="font-semibold" color="dark">
              Read Online
            </Paragraph>
            <Paragraph color="dark" size="sm">
              Full text, searchable
            </Paragraph>
          </div>
        </div>
        <div className="p-4 flex gap-4 bg-neutral-50 border rounded-lg">
          <Volume1 className="min-w-10.5 min-h-10.5 p-2.5 rounded-md border text-blue-700 " />
          <div>
            <Paragraph className="font-semibold" color="dark">
              Listen · MP3
            </Paragraph>
            <Paragraph color="dark" size="sm">
              3h 12m audio
            </Paragraph>
          </div>
        </div>
        <div className="p-4 flex gap-4 bg-neutral-50 border rounded-lg">
          <ArrowDownToLine className="min-w-10.5 min-h-10.5 p-2.5 rounded-md border text-blue-700 " />
          <div>
            <Paragraph className="font-semibold" color="dark">
              Download PDF
            </Paragraph>
            <Paragraph color="dark" size="sm">
              4.2 MB · offline
            </Paragraph>
          </div>
        </div>
        <div className="p-4 flex gap-4 bg-neutral-50 border rounded-lg">
          <MessagesSquare className="min-w-10.5 min-h-10.5 p-2.5 rounded-md border text-blue-700 " />
          <div>
            <Paragraph className="font-semibold" color="dark">
              Ask the handbook
            </Paragraph>
            <Paragraph color="dark" size="sm">
              AI answers, cited to pages
            </Paragraph>
          </div>
        </div>
        <div className="pt-3.5">
          <Button variant="outline">Open handbook</Button>
        </div>
      </div>
    </div>
  );
}
