'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from '@/lib/i18n'

const PULL_THRESHOLD = 72
const PULL_RESISTANCE = 0.45
const MAX_PULL = 120

interface PullToRefreshProps {
  children: React.ReactNode
  className?: string
}

export default function PullToRefresh({ children, className = '' }: PullToRefreshProps) {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const touchStartY = useRef(0)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    setIsMobile(mq.matches)
    const handler = () => setIsMobile(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const doRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await queryClient.invalidateQueries()
    } finally {
      setIsRefreshing(false)
      setPullDistance(0)
    }
  }, [queryClient])

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile) return
    touchStartY.current = e.touches[0].clientY
  }, [isMobile])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isMobile || isRefreshing) return
    const el = scrollRef.current
    if (!el) return
    if (el.scrollTop > 0) {
      setPullDistance(0)
      return
    }
    const currentY = e.touches[0].clientY
    const diff = currentY - touchStartY.current
    if (diff <= 0) return
    const distance = Math.min(MAX_PULL, diff * PULL_RESISTANCE)
    setPullDistance(distance)
  }, [isMobile, isRefreshing])

  const onTouchEnd = useCallback(() => {
    if (!isMobile) return
    if (isRefreshing) return
    if (pullDistance >= PULL_THRESHOLD) {
      doRefresh()
    } else {
      setPullDistance(0)
    }
  }, [isMobile, isRefreshing, pullDistance, doRefresh])

  return (
    <div
      ref={scrollRef}
      className={`min-h-0 overflow-x-hidden relative ${className}`.trim()}
      style={{
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch', /* dynamic value - cannot be Tailwind */
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Indicator: only visible on mobile when pulling or refreshing */}
      {isMobile && (pullDistance > 0 || isRefreshing) && (
        <div
          className="flex items-center justify-center bg-[var(--color-background)] shrink-0"
          style={{
            height: isRefreshing ? PULL_THRESHOLD : Math.min(MAX_PULL, pullDistance), /* dynamic value - cannot be Tailwind */
            minHeight: isRefreshing ? PULL_THRESHOLD : 0, /* dynamic value - cannot be Tailwind */
            transition: isRefreshing ? 'none' : 'height 0.15s ease', /* dynamic value - cannot be Tailwind */
          }}
        >
          {isRefreshing ? (
            <div
              className="size-7 rounded-full border-[3px] border-[var(--color-border)] border-t-[var(--color-primary)] animate-spin"
            />
          ) : (
            <span
              className="text-[13px] text-[var(--color-muted)]"
              style={{ opacity: Math.min(1, pullDistance / PULL_THRESHOLD) }} /* dynamic value - cannot be Tailwind */
            >
              {pullDistance >= PULL_THRESHOLD ? t('ui.releaseToRefresh') : t('ui.pullToRefresh')}
            </span>
          )}
        </div>
      )}
      <style>{`
        @keyframes pull-refresh-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      {children}
    </div>
  )
}
