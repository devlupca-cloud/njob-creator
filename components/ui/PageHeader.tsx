'use client'

import { useRouter } from 'next/navigation'
import { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  onBack?: () => void
  showBack?: boolean
  action?: ReactNode
}

const BackArrow = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m15 18-6-6 6-6" />
  </svg>
)

export default function PageHeader({
  title,
  onBack,
  showBack = true,
  action,
}: PageHeaderProps) {
  const router = useRouter()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      router.back()
    }
  }

  return (
    <div
      className="flex items-center gap-3 py-4 px-1"
      style={{ borderBottom: '1px solid var(--color-border)' }}
    >
      {showBack && (
        <button
          onClick={handleBack}
          className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors hover:bg-surface-2"
          style={{ color: 'var(--color-foreground)' }}
          aria-label="Go back"
        >
          <BackArrow />
        </button>
      )}

      <h1
        className="flex-1 text-center text-base font-semibold"
        style={{ color: 'var(--color-foreground)' }}
      >
        {title}
      </h1>

      {/* Spacer to keep title centered when back button is visible */}
      {showBack && (
        <div className="w-9">{action}</div>
      )}
      {!showBack && action && <div>{action}</div>}
    </div>
  )
}
