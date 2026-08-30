'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, FileText, TrendingUp, AlertCircle } from 'lucide-react'

export function FeesManager() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Invoiced', value: '₹0', icon: FileText, color: 'from-blue-500 to-indigo-600' },
          { label: 'Total Collected', value: '₹0', icon: DollarSign, color: 'from-emerald-500 to-teal-600' },
          { label: 'Pending', value: '₹0', icon: AlertCircle, color: 'from-amber-500 to-orange-600' },
          { label: 'Overdue', value: '₹0', icon: TrendingUp, color: 'from-red-500 to-pink-600' },
        ].map((card) => (
          <Card key={card.label} className="relative overflow-hidden border-border shadow-sm">
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.color}`} />
            <CardContent className="p-5">
              <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br ${card.color} text-white shadow-lg mb-3`}>
                <card.icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-foreground">{card.value}</div>
              <div className="text-xs text-muted-foreground">{card.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Fee Management</CardTitle>
        </CardHeader>
        <CardContent className="py-16 text-center">
          <DollarSign className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Fee Module Ready</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            The fee management module is set up with invoice tracking, payment recording, and
            fee structure management. Create fee structures and generate invoices from the Students section.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
