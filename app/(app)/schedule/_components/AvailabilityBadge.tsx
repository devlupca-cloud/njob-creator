'use client'

import Link from 'next/link'
import { Video, Pencil } from 'lucide-react'

interface AvailabilitySlots {
  total: number
  available: number
  purchased: number
  past: number
}

interface AvailabilityBadgeProps {
  slots: AvailabilitySlots
  selectedDateStr: string
  filterType: 'all' | 'live' | 'call'
  tSlotsAvailable: string
  tSlotsPurchased: string
  tSlotsExpired: string
  tAwaitingBookings: string
}

export function AvailabilityBadge({
  slots,
  selectedDateStr,
  filterType,
  tSlotsAvailable,
  tSlotsPurchased,
  tSlotsExpired,
  tAwaitingBookings,
}: AvailabilityBadgeProps) {
  if (slots.total === 0) return null
  if (filterType !== 'all' && filterType !== 'call') return null

  return (
    <Link
      href={`/schedule/availability?date=${selectedDateStr}`}
      className="flex items-center gap-[10px] px-[14px] py-3 mb-4 rounded-xl bg-[rgba(255,223,110,0.08)] border border-[rgba(255,223,110,0.2)] no-underline transition-colors"
    >
      <span className="flex items-center justify-center w-9 h-9 rounded-full bg-[rgba(255,223,110,0.15)] text-[#FFDF6E] shrink-0">
        <Video size={18} />
      </span>
      <div className="flex-1">
        <span className="text-[13px] font-semibold text-[var(--color-foreground)]">
          {slots.available} {tSlotsAvailable}
        </span>
        {slots.purchased > 0 && (
          <span className="block text-[var(--color-muted)] text-[11px] mt-[2px]">
            {slots.purchased} {tSlotsPurchased}
          </span>
        )}
        {slots.past > 0 && (
          <span className="block text-[var(--color-muted)] text-[11px] mt-[2px]">
            {slots.past} {tSlotsExpired}
          </span>
        )}
        <span className="block text-[var(--color-muted)] text-[11px] mt-[2px]">
          {tAwaitingBookings}
        </span>
      </div>
      <Pencil size={16} className="text-[var(--color-primary)]" />
    </Link>
  )
}
