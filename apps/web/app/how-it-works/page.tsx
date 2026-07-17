import Footer from "@/components/Footer";
import Header from "@/components/Header";
import CTASection from "@/components/home/CTASection";
import HeroSection from "@/components/how-it-works/HeroSection";
import StepsSection from "@/components/how-it-works/StepsSection";
import TrustedBySection from "@/components/how-it-works/TrustedBySection";
import WhyItWorksSection from "@/components/how-it-works/WhyItWorksSection";
import { WebLayoutProvider } from "@/lib/web-layout-context";

export default function HowItWorks() {
  return (
    <WebLayoutProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="home" />
        <main className="flex-1">
          <HeroSection />
          <StepsSection />
          <WhyItWorksSection />
          <TrustedBySection />
          <CTASection />
        </main>
        <Footer />
      </div>
    </WebLayoutProvider>
  );
}
