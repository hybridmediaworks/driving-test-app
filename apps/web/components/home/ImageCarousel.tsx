"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

const CENTER_SLOT = 4;

type ImageCarouselProps = {
  images: string[];
  gap?: number;
  height?: number;
  speed?: number;
  widths?: number[];
  heights?: number[];
  opacities?: number[];
};

export default function ImageCarousel({
  images,
  gap = 10,
  height = 273,
  speed = 3000,
  widths = [64, 102, 150, 194, 213, 194, 150, 102, 64],
  heights = [188, 210, 236, 260, 273, 260, 236, 210, 188],
  opacities = [0.5, 0.7, 1, 1, 1, 1, 1, 0.7, 0.5],
}: ImageCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const autoplayTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  function getSlot(slideIndex: number, current: number): number {
    const total = images.length;
    let distance = slideIndex - current;
    const half = Math.floor(total / 2);
    if (distance > half) distance -= total;
    if (distance < -half) distance += total;
    return distance + CENTER_SLOT;
  }

  const slotPositions = useMemo(() => {
    const positions: number[] = new Array(widths.length);
    positions[CENTER_SLOT] = containerWidth / 2 - widths[CENTER_SLOT] / 2;
    for (let s = CENTER_SLOT - 1; s >= 0; s--) {
      positions[s] = positions[s + 1] - gap - widths[s];
    }
    for (let s = CENTER_SLOT + 1; s < widths.length; s++) {
      positions[s] = positions[s - 1] + widths[s - 1] + gap;
    }
    return positions;
  }, [containerWidth, widths, gap]);

  function getSlideStyle(index: number): CSSProperties {
    const slot = getSlot(index, currentSlide);
    if (slot < 0 || slot >= widths.length) return { display: "none" };

    return {
      position: "absolute",
      left: slotPositions[slot] + "px",
      bottom: "0",
      width: widths[slot] + "px",
      height: heights[slot] + "px",
      opacity: opacities[slot],
      zIndex: CENTER_SLOT - Math.abs(slot - CENTER_SLOT),
      transition: "left 0.3s ease, width 0.3s ease, height 0.3s ease, opacity 0.3s ease",
    };
  }

  function next() {
    setCurrentSlide((c) => (c + 1) % images.length);
  }

  function startAutoplay() {
    stopAutoplay();
    autoplayTimer.current = setInterval(next, speed);
  }

  function stopAutoplay() {
    if (autoplayTimer.current) {
      clearInterval(autoplayTimer.current);
      autoplayTimer.current = null;
    }
  }

  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      setContainerWidth(el.offsetWidth);
      const observer = new ResizeObserver(([entry]) => {
        setContainerWidth(entry.contentRect.width);
      });
      observer.observe(el);
      requestAnimationFrame(() => setIsReady(true));
      startAutoplay();

      return () => {
        stopAutoplay();
        observer.disconnect();
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        height: height + "px",
        opacity: isReady ? 1 : 0,
        transition: "opacity 0.4s ease",
      }}
      onMouseEnter={stopAutoplay}
      onMouseLeave={startAutoplay}
    >
      {images.map((image, index) => (
        <div key={index} style={getSlideStyle(index)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt="carousel"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: "16px",
              border: "5px solid #fff",
              background: "#e9ebf1",
              boxShadow: "0 26px 50px 0 rgba(20, 60, 120, 0.3)",
            }}
          />
        </div>
      ))}
    </div>
  );
}
