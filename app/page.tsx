import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { Features } from "@/components/features"
import { SimulationDashboard } from "@/components/simulation-dashboard"
import { TechnicalSpecs } from "@/components/technical-specs"
import { Roadmap } from "@/components/roadmap"
import { GlitchMarquee } from "@/components/glitch-marquee"
import { Footer } from "@/components/footer"

export default function Page() {
  return (
    <div className="min-h-screen dot-grid-bg">
      <Navbar />
      <main>
        <HeroSection />
        <Features />
        <SimulationDashboard />
        <TechnicalSpecs />
        <Roadmap />
        <GlitchMarquee />
      </main>
      <Footer />
    </div>
  )
}
