import type { Metadata } from "next";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import BestAppSection from "@/components/home/BestAppSection";
import CTASection from "@/components/home/CTASection";
import FAQSection from "@/components/home/FAQSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import HeroSection from "@/components/home/HeroSection";
import JourneySection from "@/components/home/JourneySection";
import LearnSection from "@/components/home/LearnSection";
import MapSection from "@/components/home/MapSection";
import SuccessStories from "@/components/home/SuccessStories";
import ToolkitSection from "@/components/home/ToolkitSection";
import WhyChooseSection from "@/components/home/WhyChooseSection";
import { WebLayoutProvider } from "@/lib/web-layout-context";

export const metadata: Metadata = {
  title: "Ace Your DMV Driving Test",
  description:
    "Stop wasting hours on the manual. DriveLane adapts to how you learn with smart practice tests, AI explanations, and a guaranteed path to your license. Free to start, 4.8M+ drivers prepared.",
  openGraph: {
    title: "DriveLane — Ace Your DMV Driving Test",
    description:
      "Smart practice tests, AI explanations, and a guaranteed path to your license. Join 4.8 million drivers who prepared smarter, not harder.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DriveLane — Ace Your DMV Driving Test",
    description:
      "Smart practice tests, AI explanations, and a guaranteed path to your license. Free to start.",
  },
};

export default function Home() {
  return (
    <WebLayoutProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="home" />
        <main className="flex-1">
          {/* Order matches Figma "Final Design" (file QOJ34F4OPHkJ5LFrJt9eCA,
              node 1897:1799), top to bottom. */}
          <HeroSection />
          <WhyChooseSection />
          <BestAppSection />
          <FeaturesSection />
          <MapSection />
          <ToolkitSection />
          <LearnSection />
          <SuccessStories />
          <JourneySection />
          <FAQSection />
          <CTASection />
        </main>
        <Footer />
      </div>
    </WebLayoutProvider>
  );
}
