import { Hero } from "@/components/layout/Hero";
import { AboutSection } from "@/components/layout/AboutSection";
import { ProjectsGrid } from "@/components/layout/ProjectsGrid";
import { CapabilitiesSection } from "@/components/layout/CapabilitiesSection";
import { ClientsStrip } from "@/components/layout/ClientsStrip";
import { ExperienceSection } from "@/components/layout/ExperienceSection";
import { CtaSection } from "@/components/layout/CtaSection";
import { Footer } from "@/components/layout/Footer";

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen">
      <Hero />
      <AboutSection />
      <ProjectsGrid />
      <CapabilitiesSection />
      <ClientsStrip />
      <ExperienceSection />
      <CtaSection />
      <Footer />
    </main>
  );
}
