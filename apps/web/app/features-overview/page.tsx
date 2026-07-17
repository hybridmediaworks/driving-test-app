import HeroSection from "@/components/features-overview/HeroSection";
import OnePlatformSection from "@/components/features-overview/OnePlatformSection";
import TheToolkitSection from "@/components/features-overview/TheToolkitSection";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import CTASection from "@/components/home/CTASection";
import SuccessStories from "@/components/home/SuccessStories";
import { WebLayoutProvider } from "@/lib/web-layout-context";

export default function FeaturesOverview() {
  return (
    <WebLayoutProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="home" />
        <main className="flex-1">
          <HeroSection />
          <TheToolkitSection />
          <OnePlatformSection />
          <SuccessStories />
          <CTASection />
        </main>
        <Footer />
      </div>
    </WebLayoutProvider>
  );
}
