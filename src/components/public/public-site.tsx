'use client'

import { SiteHeader } from './site-header'
import { HeroSection } from './hero-section'
import { StatsSection } from './stats-section'
import { AboutSection } from './about-section'
import { AcademicsSection } from './academics-section'
import { FacilitiesSection } from './facilities-section'
import { CoreTeamSection } from './core-team-section'
import { VirtualTourSection } from './virtual-tour-section'
import { GallerySection } from './gallery-section'
import { AdmissionsTimelineSection } from './admissions-timeline-section'
import { ContactSection } from './contact-section'
import { SiteFooter } from './site-footer'
import { EnquiryDialog } from './enquiry-dialog'
import { AdminLoginDialog } from './admin-login-dialog'
import { VirtualTourDialog } from './virtual-tour-dialog'

export function PublicSite() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <HeroSection />
        <StatsSection />
        <AboutSection />
        <AcademicsSection />
        <FacilitiesSection />
        <CoreTeamSection />
        <VirtualTourSection />
        <GallerySection />
        <AdmissionsTimelineSection />
        <ContactSection />
      </main>
      <SiteFooter />

      {/* Modals */}
      <EnquiryDialog />
      <AdminLoginDialog />
      <VirtualTourDialog />
    </div>
  )
}
