"use client";

import { ArrowLeft, ArrowRight, CircleCheck } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";

const testimonials = [
  {
    id: 1,
    name: "Ted Kay",
    location: "California",
    quote: '"Aced California DMV test in 24 hours"',
    text: "This site definitely works. I practiced their questions for 24 hours. Went through each practice test then jumped into a bus to Santa Monica, California DMV. I passed the drivers test the first time; while the majority walked out with their faces down.",
    image: "/carousel/testi1.png",
    avatar: "/carousel/testi1-avatar.png",
  },
  {
    id: 2,
    name: "James Miller",
    location: "New York",
    quote: '"Passed my road test on the very first attempt"',
    text: "After just two weeks of practice on this app, I walked into the DMV feeling completely confident. The questions were nearly identical to what showed up on the actual test.",
    image: "/carousel/testi2.png",
    avatar: "/carousel/testi1-avatar.png",
  },
  {
    id: 3,
    name: "Sarah Johnson",
    location: "Texas",
    quote: '"Best driving test prep app out there"',
    text: "I tried three other prep apps before finding this one. Nothing comes close. The detailed explanations helped me understand why answers are correct, not just memorize them.",
    image: "/carousel/testi3.png",
    avatar: "/carousel/testi1-avatar.png",
  },
  {
    id: 4,
    name: "Michael Chen",
    location: "Washington",
    quote: '"Scored 95% on my very first DMV attempt"',
    text: "As someone new to this country, I was worried about understanding traffic laws. This app broke everything down so clearly. I scored 95% on my first attempt at the DMV.",
    image: "/carousel/testi4.png",
    avatar: "/carousel/testi1-avatar.png",
  },
  {
    id: 5,
    name: "Emily Rodriguez",
    location: "Florida",
    quote: '"Got a perfect score at just 16 years old!"',
    text: "I studied for one week using this app and got a perfect score! My parents could not believe it. The practice tests really nailed the format of the real exam.",
    image: "/carousel/testi5.png",
    avatar: "/carousel/testi1-avatar.png",
  },
  {
    id: 6,
    name: "David Thompson",
    location: "Ohio",
    quote: '"Renewed my license without any stress"',
    text: "Hadn't taken a driving test in 20 years. Used this app to refresh my knowledge and sailed through the renewal test. The interface is clean and very easy to navigate.",
    image: "/carousel/testi4.png",
    avatar: "/carousel/testi1-avatar.png",
  },
];

const WIDTHS = [220, 320, 448, 320, 220];
const HEIGHTS = [230, 363, 473, 363, 230];
const OPACITIES = [0.3, 0.5, 1.0, 0.5, 0.3];
const GRAYSCALE = [true, true, false, true, true];
const ZINDICES = [1, 2, 3, 2, 1];
const ROUNDED = [true, true, false, true, true];
const LEFT_OFFSETS = [-632, -460, -224, 140, 412];
const CENTER_IDX = 2;

export default function TestimonialCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setContainerWidth(el.offsetWidth);
    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function getSlideStyle(personIndex: number): CSSProperties {
    const total = testimonials.length;
    let distance = personIndex - currentIndex;
    const half = Math.floor(total / 2);
    if (distance > half) distance -= total;
    if (distance < -half) distance += total;

    const slotIdx = distance + CENTER_IDX;
    const cw = containerWidth;

    if (slotIdx < 0 || slotIdx >= WIDTHS.length) return { display: "none" };

    return {
      position: "absolute",
      bottom: "0",
      left: `${cw / 2 + LEFT_OFFSETS[slotIdx]}px`,
      width: `${WIDTHS[slotIdx]}px`,
      height: `${HEIGHTS[slotIdx]}px`,
      opacity: OPACITIES[slotIdx],
      filter: GRAYSCALE[slotIdx] ? "grayscale(1)" : "none",
      zIndex: ZINDICES[slotIdx],
      overflow: "hidden",
      borderRadius: ROUNDED[slotIdx] ? "0.75rem" : "0",
      transition:
        "left 0.45s ease, width 0.45s ease, height 0.45s ease, opacity 0.45s ease, filter 0.45s ease",
    };
  }

  const total = testimonials.length;
  function goTo(offset: number) {
    setCurrentIndex((c) => (c + offset + total) % total);
  }
  function getItemAt(offset: number) {
    return testimonials[(currentIndex + offset + total) % total];
  }

  const active = getItemAt(0);

  return (
    <div className="relative">
      <button
        onClick={() => goTo(-1)}
        aria-label="Previous testimonial"
        className="absolute top-65.5 left-0 z-50 flex h-13 w-21 items-center justify-center rounded-2xl border border-white bg-[#F2F1EC]"
      >
        <ArrowLeft className="h-8 w-8 text-neutral-500" />
      </button>

      <div ref={containerRef} className="relative h-118.25 overflow-hidden">
        <div className="absolute top-0 left-0 z-10 h-full w-20 bg-linear-to-r from-[#fafaf7] to-transparent md:w-40 lg:w-111" />

        {testimonials.map((item, index) => (
          <div key={item.id} style={getSlideStyle(index)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.image} alt={item.name} className="h-full w-full object-cover object-top" />
          </div>
        ))}

        <div className="absolute top-0 right-0 z-10 h-full w-20 bg-linear-to-r from-transparent to-[#fafaf7] md:w-40 lg:w-111" />
      </div>

      <div className="relative z-10 mx-auto -mt-10 max-w-142.25">
        <div
          className="space-y-3 rounded-2xl bg-white p-8 text-center"
          style={{
            boxShadow: "0 20px 24px -4px rgba(20, 60, 120, 0.08), 0 8px 8px -4px rgba(20, 60, 120, 0.03)",
          }}
        >
          <Heading as="h5" color="primary" className="font-bold!">
            {active.quote}
          </Heading>
          <Paragraph color="muted">{active.text}</Paragraph>
          <div className="flex items-center justify-center gap-3 pt-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={active.avatar} alt={active.name} className="h-10 w-10 rounded-full object-cover" />
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <Paragraph className="font-bold" color="dark">
                  {active.name}
                </Paragraph>
                <CircleCheck className="h-5 w-5 fill-green-500 text-white" />
              </div>
              <Paragraph size="xs">{active.location}</Paragraph>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => goTo(1)}
        aria-label="Next testimonial"
        className="absolute top-65.5 right-0 z-50 flex h-13 w-21 items-center justify-center rounded-2xl border border-white bg-[#F2F1EC]"
      >
        <ArrowRight className="h-8 w-8 text-neutral-500" />
      </button>
    </div>
  );
}
