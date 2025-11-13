import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

const toastTypes = {
  success: {
    icon: CheckCircle,
    bgColor: 'bg-success-50',
    borderColor: 'border-success-200',
    textColor: 'text-success-800',
    iconColor: 'text-success-600',
  },
  error: {
    icon: XCircle,
    bgColor: 'bg-error-50',
    borderColor: 'border-error-200',
    textColor: 'text-error-800',
    iconColor: 'text-error-600',
  },
  warning: {
    icon: AlertCircle,
    bgColor: 'bg-warning-50',
    borderColor: 'border-warning-200',
    textColor: 'text-warning-800',
    iconColor: 'text-warning-600',
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-800',
    iconColor: 'text-blue-600',
  },
}

const Toast = ({ message, type = 'info', onClose, duration = 5000 }) => {
  const [isVisible, setIsVisible] = useState(true)
  const config = toastTypes[type]
  const Icon = config.icon

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(onClose, 300) // Wait for exit animation
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 300)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`flex items-center p-4 rounded-lg border shadow-medium ${config.bgColor} ${config.borderColor} ${config.textColor}`}
          initial={{ opacity: 0, x: 300, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 300, scale: 0.8 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          <Icon className={`w-5 h-5 mr-3 ${config.iconColor}`} />
          <p className="flex-1 text-sm font-medium">{message}</p>
          <button
            onClick={handleClose}
            className={`ml-3 p-1 rounded hover:bg-black/10 transition-colors ${config.iconColor}`}
            aria-label="Close toast"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default Toast
