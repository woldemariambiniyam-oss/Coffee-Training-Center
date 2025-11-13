import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import Toast from './Toast'

let toastId = 0

const ToastContainer = () => {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    const handleToast = (event) => {
      const { message, type, duration } = event.detail
      const id = ++toastId

      setToasts(prev => [...prev, { id, message, type, duration }])

      // Auto remove after duration + animation time
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== id))
      }, (duration || 5000) + 300)
    }

    window.addEventListener('show-toast', handleToast)

    return () => {
      window.removeEventListener('show-toast', handleToast)
    }
  }, [])

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

export const showToast = (message, type = 'info', duration = 5000) => {
  const event = new CustomEvent('show-toast', {
    detail: { message, type, duration },
  })
  window.dispatchEvent(event)
}

export default ToastContainer
