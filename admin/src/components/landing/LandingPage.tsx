import { AboutSection } from './AboutSection';
import { AnimatedBackground } from './AnimatedBackground';
import { ContactSection } from './ContactSection';
import { FAQSection } from './FAQSection';
import { FeaturesSection } from './FeaturesSection';
import { Footer } from './Footer';
import { HeroSection } from './HeroSection';
import { HowItWorksSection } from './HowItWorksSection';
import { LandingNav } from './LandingNav';
import { ProceduresSection } from './ProceduresSection';
import { ResidentBenefitsSection } from './ResidentBenefitsSection';
import { ScreenshotsSection } from './ScreenshotsSection';

export function LandingPage() {
  return (
    <div className="landing-page relative min-h-screen overflow-x-hidden bg-[#080d18] text-white">
      <AnimatedBackground />
      <LandingNav />
      <main className="relative z-10">
        <HeroSection />
        <AboutSection />
        <FeaturesSection />
        <HowItWorksSection />
        <ProceduresSection />
        <ScreenshotsSection />
        <ResidentBenefitsSection />
        <ContactSection />
        <FAQSection />
      </main>
      <Footer />
    </div>
  );
}
