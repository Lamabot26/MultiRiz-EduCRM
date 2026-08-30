'use client'

import { SiteHeader } from './site-header'
import { HeroSection } from './hero-section'
import { StatsSection } from './stats-section'
import { CoreTeamSection } from './core-team-section'
import { VirtualTourSection } from './virtual-tour-section'
import { AdmissionsTimelineSection } from './admissions-timeline-section'
import { SiteFooter } from './site-footer'
import { EnquiryDialog } from './enquiry-dialog'

export function PublicHome() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <HeroSection />
        <StatsSection />
        <CoreTeamSection />
        <VirtualTourSection />
        <AdmissionsTimelineSection />
      </main>
      <SiteFooter />
      <EnquiryDialog />
    </div>
  )
}
