import { Hero } from "@/components/layout/Hero";
import { ProjectsGrid } from "@/components/layout/ProjectsGrid";
import { Footer } from "@/components/layout/Footer";

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen">
      <Hero />
      <ProjectsGrid />
      <Footer />
    </main>
  );
}
