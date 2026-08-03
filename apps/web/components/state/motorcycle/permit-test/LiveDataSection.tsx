"use client";

import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import Subheading from "@/components/ui/Subheading";
import StudentChart from "@/components/state/StudentChart";
import { Calendar, Clock, Star, TrendingUp } from "lucide-react";
import { useWebLayout } from "@/lib/web-layout-context";

export default function LiveDataSection() {
  const { selectedState } = useWebLayout();
  return (
    <section className="px-5 pt-15 pb-15 lg:pt-30 lg:pb-15">
      <div className="mx-auto max-w-container space-y-5.5">
        <div className="max-w-170 space-y-4">
          <Subheading text="Live Data" />
          <Heading as="h2">How {selectedState} riders are practicing</Heading>
          <Paragraph>
            A live snapshot of {selectedState} motorcycle learners on
            DriveLane over the last 30 days.
          </Paragraph>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="bg-white p-6 border rounded-xl flex items-center justify-between xl:flex-nowrap lg:flex-wrap flex-nowrap">
            <div className="space-y-3 min-w-fit">
              <Paragraph className="font-medium">Riders practiced</Paragraph>
              <Heading size="lg">6800</Heading>
              <Paragraph
                className="flex items-center gap-1.5 text-green-600!"
                size="sm"
              >
                <TrendingUp className="text-green-600 w-3.75 h-3.75" /> +9% vs
                last month
              </Paragraph>
            </div>
            <StudentChart />
          </div>
          <div className="bg-white p-6 border rounded-xl flex items-center justify-between xl:flex-nowrap lg:flex-wrap flex-nowrap">
            <div className="space-y-3 min-w-fit">
              <Paragraph className="font-medium">Questions answered</Paragraph>
              <Heading size="lg">480K</Heading>
              <Paragraph
                className="flex items-center gap-1.5 text-green-600!"
                size="sm"
              >
                <TrendingUp className="text-green-600 w-3.75 h-3.75" /> +6% vs
                last month
              </Paragraph>
            </div>
            <StudentChart />
          </div>
          <div className="bg-white p-6 border rounded-xl flex items-center justify-between xl:flex-nowrap lg:flex-wrap flex-nowrap">
            <div className="space-y-3 min-w-fit">
              <Paragraph className="font-medium">Avg. session length</Paragraph>
              <Heading size="lg">15 min</Heading>
              <Paragraph
                className="flex items-center gap-1.5 text-green-600!"
                size="sm"
              >
                <TrendingUp className="text-green-600 w-3.75 h-3.75" /> +2 min
                vs last month
              </Paragraph>
            </div>
            <StudentChart />
          </div>
          <div className="bg-neutral-50 p-6 border rounded-xl gap-4 flex items-center justify-between">
            <Calendar className="bg-blue-100 p-3.5 rounded-[11px] min-w-15 min-h-15 text-blue-700" />
            <div className="w-full">
              <Heading size="xs">2,140 days</Heading>
              <Paragraph size="sm">Combined practice this month</Paragraph>
            </div>
          </div>
          <div className="bg-neutral-50 p-6 border rounded-xl gap-4 flex items-center justify-between">
            <Clock className="bg-blue-100 p-3.5 rounded-[11px] min-w-15 min-h-15 text-blue-700" />
            <div className="w-full">
              <Heading size="xs">6–8 PM</Heading>
              <Paragraph size="sm">Peak practice time</Paragraph>
            </div>
          </div>
          <div className="bg-neutral-50 p-6 border rounded-xl gap-4 flex items-center justify-between">
            <Star className="bg-blue-100 p-3.5 rounded-[11px] min-w-15 min-h-15 text-blue-700" />
            <div className="w-full">
              <Heading size="xs">#18 nationwide</Heading>
              <Paragraph size="sm">Study-intensity rank</Paragraph>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
