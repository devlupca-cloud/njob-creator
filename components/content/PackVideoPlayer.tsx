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
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          maxWidth: '100%',
          maxHeight: '100%',
          width: 'min(90vw, 720px)',
        }}
      >
        <video
          ref={videoRef}
          src={src}
          controls
          autoPlay
          playsInline
          style={{ width: '100%', maxHeight: '80vh', borderRadius: 8, background: '#000' }}
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          style={{
            position: 'absolute',
            top: -12,
            right: -12,
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: 'none',
            background: 'var(--color-surface-2)',
            color: 'var(--color-text)',
            cursor: 'pointer',
            fontSize: 20,
            lineHeight: 1,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          ×
        </button>
      </div>
    </div>
  )
}
