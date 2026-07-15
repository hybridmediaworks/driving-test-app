import { Star } from "lucide-react";
import ImageCarousel from "@/components/home/ImageCarousel";
import Paragraph from "@/components/ui/Paragraph";
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from "@/components/ui/Avatar";

const carouselImages = [
  "/carousel/license1.png",
  "/carousel/license2.png",
  "/carousel/license3.png",
  "/carousel/license4.png",
  "/carousel/license5.png",
  "/carousel/license6.png",
  "/carousel/license7.png",
  "/carousel/license8.png",
  "/carousel/license9.png",
  "/carousel/license10.png",
  "/carousel/license11.png",
];

const avatars = [
  { src: "/Avatar.png", alt: "User", fallback: "U1" },
  { src: "/Avatar2.png", alt: "Max", fallback: "ML" },
  { src: "/Avatar3.png", alt: "ER", fallback: "ER" },
  { src: "/Avatar4.png", alt: "ER", fallback: "ER" },
  { src: "/Avatar5.png", alt: "ER", fallback: "ER" },
  { src: "/Avatar6.png", alt: "ER", fallback: "ER" },
  { src: "/Avatar7.png", alt: "ER", fallback: "ER" },
  { src: "/Avatar8.png", alt: "ER", fallback: "ER" },
  { src: "/Avatar9.png", alt: "ER", fallback: "ER" },
  { src: "/Avatar10.png", alt: "ER", fallback: "ER" },
];

export default function SocialProof() {
  return (
    <section className="px-5">
      <div className="relative mx-auto max-w-container space-y-7.5 overflow-hidden pt-11">
        <div className="absolute top-0 left-0 z-10 h-full w-20 bg-linear-to-r from-[#fafaf7] to-transparent md:w-40 lg:w-111" />
        <ImageCarousel images={carouselImages} gap={20} />

        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-6 fill-yellow-400 stroke-yellow-400" />
            ))}
          </div>
          <AvatarGroup className="*:-ml-2 [&>*:first-child]:ml-0">
            {avatars.map((a, i) => (
              <Avatar key={i}>
                <AvatarImage src={a.src} alt={a.alt} />
                <AvatarFallback>{a.fallback}</AvatarFallback>
              </Avatar>
            ))}
          </AvatarGroup>
          <Paragraph>
            <strong className="text-neutral-900">4.8M+ drivers</strong> prepared ·{" "}
            <strong className="text-neutral-900">97%</strong> pass first try
          </Paragraph>
          <div className="absolute top-0 right-0 z-10 h-full w-20 bg-linear-to-r from-transparent to-[#fafaf7] md:w-40 lg:w-111" />
        </div>
      </div>
    </section>
  );
}
