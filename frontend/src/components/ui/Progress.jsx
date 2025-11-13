import { forwardRef } from 'react'

const Progress = forwardRef(({ value = 0, max = 100, size = 'default', className = '', ...props }, ref) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  const sizeClasses = {
    sm: 'h-2',
    default: 'h-3',
    lg: 'h-4'
  }

  return (
    <div
      ref={ref}
      className={`w-full bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden ${sizeClasses[size]} ${className}`}
      {...props}
    >
      <div
        className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-300 ease-out rounded-full"
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
})

Progress.displayName = 'Progress'

export default Progress
