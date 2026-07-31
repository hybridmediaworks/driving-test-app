"use client";

import { Gem } from "lucide-react";
import Button from "@/components/ui/Button";
import Paragraph from "@/components/ui/Paragraph";
import type { DrivingTestCard as DrivingTestCardData } from "@/data/drivingTestMockData";

export default function DrivingTestCard({
  card,
  cardType,
}: {
  card: DrivingTestCardData;
  cardType: string;
}) {
  return (
    <div className="group">
      {(card.image ||
        card.type === "premium" ||
        card.status === "next" ||
        card.type === "free") && (
        <div className="relative overflow-hidden md:rounded-xl rounded-md md:max-w-full">
          {card.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={card.image}
              alt=""
              className="md:h-32 h-18 w-full md:rounded-xl rounded-md object-cover transition-all duration-300"
            />
          )}
          {(card.type === "premium" || card.status === "next") && (
            <div
              className={`absolute inset-0 flex items-center justify-center md:rounded-xl rounded-md ${
                card.type === "premium" && card.status !== "next"
                  ? "bg-white/60 backdrop-blur-[2px] group-hover:bg-linear-to-r group-hover:from-blue-500 group-hover:to-blue-700"
                  : ""
              }`}
            >
              {card.type === "premium" && card.status !== "next" && (
                <>
                  <div className="flex h-8 w-8 items-center justify-center rounded-4xl group-hover:hidden">
                    <Gem className="text-blue-600 w-8 h-8 " />
                  </div>
                  <div className="hidden group-hover:flex px-2">
                    <Button
                      variant="outline"
                      className="w-full md:w-fit bg-yellow-500! border-yellow-500!"
                      size="sm"
                      href="/pricing"
                    >
                      <Gem /> Upgrade to Premium
                    </Button>
                  </div>
                </>
              )}
              {card.status === "next" && (
                <Paragraph
                  size="sm"
                  color="primary"
                  className="rounded-full bg-white px-3 py-0.5 font-semibold"
                >
                  Next
                </Paragraph>
              )}
            </div>
          )}
          {card.type === "free" && (
            <Paragraph
              color="white"
              size="xs"
              className="absolute md:top-2 top-0.5 rounded-sm px-1.75 md:py-0.5 font-semibold md:tracking-wide uppercase md:right-2 right-0.5 bg-green-500"
            >
              Free
            </Paragraph>
          )}
        </div>
      )}
      {(card.title || card.total || card.total) && (
        <div className="md:p-4 px-3 md:space-y-2">
          {card.title && (
            <Paragraph color="dark" className="font-semibold">
              {card.title}
            </Paragraph>
          )}
          {(card.total || card.duration) && (
            <Paragraph color="primary" size="sm" className="font-semibold">
              {card.total && `${card.total} ${cardType}`}
              {card.duration && `${card.duration}`}
            </Paragraph>
          )}
        </div>
      )}
    </div>
  );
}
