'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

const PULL_THRESHOLD = 72
const PULL_RESISTANCE = 0.45
const MAX_PULL = 120

interface PullToRefreshProps {
  children: React.ReactNode
  className?: string
}

export default function PullToRefresh({ children, className = '' }: PullToRefreshProps) {
  const queryClient = useQueryClient()
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
      className={`min-h-0 ${className}`.trim()}
      style={{
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        position: 'relative',
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Indicator: only visible on mobile when pulling or refreshing */}
      {isMobile && (pullDistance > 0 || isRefreshing) && (
        <div
          style={{
            height: isRefreshing ? PULL_THRESHOLD : Math.min(MAX_PULL, pullDistance),
            minHeight: isRefreshing ? PULL_THRESHOLD : 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--color-background)',
            flexShrink: 0,
            transition: isRefreshing ? 'none' : 'height 0.15s ease',
          }}
        >
          {isRefreshing ? (
            <div
              style={{
                width: 28,
                height: 28,
                border: '3px solid var(--color-border)',
                borderTopColor: 'var(--color-primary)',
                borderRadius: '50%',
                animation: 'pull-refresh-spin 0.7s linear infinite',
              }}
            />
          ) : (
            <span
              style={{
                fontSize: 13,
                color: 'var(--color-muted)',
                opacity: Math.min(1, pullDistance / PULL_THRESHOLD),
              }}
            >
              {pullDistance >= PULL_THRESHOLD ? 'Solte para atualizar' : 'Puxe para atualizar'}
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
