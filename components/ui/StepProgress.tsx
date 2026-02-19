'use client'

interface StepProgressProps {
  currentStep: number
  totalSteps: number
}

export default function StepProgress({ currentStep, totalSteps }: StepProgressProps) {
  const percent = ((currentStep + 1) / totalSteps) * 100

  return (
    <div className="flex flex-col gap-2 mb-6">
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>
          Etapa {currentStep + 1} de {totalSteps}
        </span>
        <span className="text-xs font-medium" style={{ color: 'var(--color-primary)' }}>
          {Math.round(percent)}%
        </span>
      </div>
      <div
        className="w-full h-1.5 rounded-full overflow-hidden"
        style={{ background: 'var(--color-border)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500 ease-out bg-gradient-primary"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
