'use client'

import { useEffect, useRef } from 'react'

interface PackVideoPlayerProps {
  src: string
  onClose: () => void
}

/**
 * Modal video player for pack items (equivalent to Flutter VideoPlayerWidget).
 */
export default function PackVideoPlayer({ src, onClose }: PackVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Reproduzir vídeo"
      onClick={onClose}
      className="fixed inset-0 z-[9999] bg-black/85 flex items-center justify-center p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-full max-h-full w-[min(90vw,720px)]"
      >
        <video
          ref={videoRef}
          src={src}
          controls
          autoPlay
          playsInline
          className="w-full max-h-[80vh] rounded-lg bg-black"
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute -top-3 -right-3 size-9 rounded-full border-none bg-[var(--color-surface-2)] text-[var(--color-text)] cursor-pointer text-xl leading-none shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
        >
          ×
        </button>
      </div>
    </div>
  )
}
