'use client'

import { SiteHeader } from './site-header'
import { HeroSection } from './hero-section'
import { ValuesMarquee } from './values-marquee'
import { StatsSection } from './stats-section'
import { AboutSection } from './about-section'
import { DevelopmentPillars } from './development-pillars'
import { HeritageSection } from './heritage-section'
import { CoreTeamSection } from './core-team-section'
import { VirtualTourSection } from './virtual-tour-section'
import { TestimonialsSection } from './testimonials-section'
import { AdmissionsTimelineSection } from './admissions-timeline-section'
import { SiteFooter } from './site-footer'
import { EnquiryDialog } from './enquiry-dialog'

export function PublicHome() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <HeroSection />
        <ValuesMarquee />
        <StatsSection />
        <AboutSection />
        <DevelopmentPillars />
        <HeritageSection />
        <CoreTeamSection />
        <VirtualTourSection />
        <TestimonialsSection />
        <AdmissionsTimelineSection />
      </main>
      <SiteFooter />
      <EnquiryDialog />
    </div>
  )
}