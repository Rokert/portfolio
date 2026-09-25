import { Hero } from "@/components/layout/Hero";
import { AboutSection } from "@/components/layout/AboutSection";
import { ExperienceSection } from "@/components/layout/ExperienceSection";
import { ProjectsGrid } from "@/components/layout/ProjectsGrid";
import { OtherProjectsSection } from "@/components/layout/OtherProjectsSection";
import { CapabilitiesSection } from "@/components/layout/CapabilitiesSection";
import { ClientsStrip } from "@/components/layout/ClientsStrip";
import { CtaSection } from "@/components/layout/CtaSection";
import { Footer } from "@/components/layout/Footer";

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen">
      <Hero />
      <AboutSection />
      <ExperienceSection />
      <ProjectsGrid />
      <OtherProjectsSection />
      <CapabilitiesSection />
      <ClientsStrip />
      <CtaSection />
      <Footer />
    </main>
  );
}
