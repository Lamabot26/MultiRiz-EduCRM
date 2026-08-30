'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SCHOOL, CAMPUSES, CAMPUS_STATS } from '@/lib/school-data'
import { Building2, MapPin, Phone, Mail, Shield, Database, Users } from 'lucide-react'

export function SettingsView() {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* School Info */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            School Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>School Name</Label>
              <div className="text-sm font-medium text-foreground mt-1">{SCHOOL.name}</div>
            </div>
            <div>
              <Label>City</Label>
              <div className="text-sm font-medium text-foreground mt-1">{SCHOOL.city}</div>
            </div>
            <div>
              <Label>Tagline</Label>
              <div className="text-sm font-medium text-foreground mt-1">{SCHOOL.tagline}</div>
            </div>
            <div>
              <Label>Email</Label>
              <div className="text-sm font-medium text-foreground mt-1">{SCHOOL.email}</div>
            </div>
            <div>
              <Label>Phone Numbers</Label>
              <div className="text-sm font-medium text-foreground mt-1">{SCHOOL.phones.join(', ')}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campuses */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Campuses
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {CAMPUSES.map((campus) => (
            <div key={campus.name} className="p-4 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-foreground">{campus.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-accent/15 text-accent-foreground">{campus.type}</span>
              </div>
              <div className="text-sm text-muted-foreground">{campus.address}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Campus Stats */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            Campus Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {CAMPUS_STATS.map((stat) => (
              <div key={stat.label} className="p-3 rounded-lg bg-muted/30 text-center">
                <div className="text-xl font-bold text-primary">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Info */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <Label>Framework</Label>
              <div className="text-foreground mt-1">Next.js 16 (App Router)</div>
            </div>
            <div>
              <Label>Database</Label>
              <div className="text-foreground mt-1">SQLite (Prisma ORM)</div>
            </div>
            <div>
              <Label>Authentication</Label>
              <div className="text-foreground mt-1">DB-based (bcryptjs + sessions)</div>
            </div>
            <div>
              <Label>Academic Year</Label>
              <div className="text-foreground mt-1">2026-27</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-xs text-muted-foreground font-medium">{children}</span>
}
