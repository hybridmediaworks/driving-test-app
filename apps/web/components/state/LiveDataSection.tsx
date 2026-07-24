"use client";

import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import Subheading from "../ui/Subheading";
import StudentChart from "./StudentChart";
import { Calendar, Clock, Star, TrendingUp } from "lucide-react";

export default function LiveDataSection() {
  return (
    <section className="px-5 pt-0 pb-10 lg:pt-30 lg:pb-15">
      <div className="mx-auto max-w-container space-y-5.5">
        <div className="max-w-170 space-y-4">
          <Subheading text="Live Data" />
          <Heading as="h2">How West Virginia students are practicing</Heading>
          <Paragraph>
            A live snapshot of West Virginia learners on DriveLane over the last
            30 days.
          </Paragraph>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="bg-white p-6 border rounded-xl flex items-center justify-between">
            <div className="space-y-3">
              <Paragraph className="font-medium">Students practiced</Paragraph>
              <Heading size="lg">14200</Heading>
              <Paragraph
                className="flex items-center gap-1.5 text-green-600!"
                size="sm"
              >
                <TrendingUp className="text-green-600 w-3.75 h-3.75" /> +12% vs
                last month
              </Paragraph>
            </div>
            <StudentChart />
          </div>
          <div className="bg-white p-6 border rounded-xl flex items-center justify-between">
            <div className="space-y-3">
              <Paragraph className="font-medium">Questions answered</Paragraph>
              <Heading size="lg">1.2M</Heading>
              <Paragraph
                className="flex items-center gap-1.5 text-green-600!"
                size="sm"
              >
                <TrendingUp className="text-green-600 w-3.75 h-3.75" /> +8% vs
                last month
              </Paragraph>
            </div>
            <StudentChart />
          </div>
          <div className="bg-white p-6 border rounded-xl flex items-center justify-between">
            <div className="space-y-3">
              <Paragraph className="font-medium">Avg. session length</Paragraph>
              <Heading size="lg">18 min</Heading>
              <Paragraph
                className="flex items-center gap-1.5 text-green-600!"
                size="sm"
              >
                <TrendingUp className="text-green-600 w-3.75 h-3.75" /> +3 min
                vs last month
              </Paragraph>
            </div>
            <StudentChart />
          </div>
          <div className="bg-[#FAFAFA] p-6 border rounded-xl gap-4 flex items-center justify-between">
            <Calendar className="bg-blue-100 p-3.5 rounded-[11px] min-w-15 min-h-15 text-blue-700" />
            <div className="w-full">
              <Heading size="xs">4,930 days</Heading>
              <Paragraph size="sm">Combined practice this month</Paragraph>
            </div>
          </div>
          <div className="bg-[#FAFAFA] p-6 border rounded-xl gap-4 flex items-center justify-between">
            <Clock className="bg-blue-100 p-3.5 rounded-[11px] min-w-15 min-h-15 text-blue-700" />
            <div className="w-full">
              <Heading size="xs">7–9 PM</Heading>
              <Paragraph size="sm">Peak practice time</Paragraph>
            </div>
          </div>
          <div className="bg-[#FAFAFA] p-6 border rounded-xl gap-4 flex items-center justify-between">
            <Star className="bg-blue-100 p-3.5 rounded-[11px] min-w-15 min-h-15 text-blue-700" />
            <div className="w-full">
              <Heading size="xs">#12 nationwide</Heading>
              <Paragraph size="sm">Study-intensity rank</Paragraph>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
