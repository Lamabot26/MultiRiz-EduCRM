'use client'

import { MORAL_VALUE_THEMES } from '@/lib/school-data'

export function ValuesMarquee() {
  const items = [...MORAL_VALUE_THEMES, ...MORAL_VALUE_THEMES]
  return (
    <div className="relative overflow-hidden border-y border-border bg-white py-3">
      <div className="flex w-max marquee-anim gap-1">
        {items.map((value, i) => (
          <span key={i} className="flex items-center gap-1 px-4 whitespace-nowrap">
            <span className="text-accent-foreground">◆</span>
            <span className="text-sm font-semibold text-foreground/80">{value}</span>
          </span>
        ))}
      </div>
    </div>
  )
}