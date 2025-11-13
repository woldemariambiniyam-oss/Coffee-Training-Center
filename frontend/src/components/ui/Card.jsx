import { forwardRef } from 'react'
import { motion } from 'framer-motion'

const Card = forwardRef(({
  children,
  className = '',
  padding = 'normal',
  hover = true,
  onClick,
  ...props
}, ref) => {
  const paddingClasses = {
    none: '',
    small: 'p-4',
    normal: 'p-6',
    large: 'p-8',
  }

  const baseClasses = 'card'
  const classes = `${baseClasses} ${paddingClasses[padding]} ${className}`

  if (onClick) {
    return (
      <motion.div
        ref={ref}
        className={`${classes} cursor-pointer`}
        onClick={onClick}
        whileHover={hover ? { y: -2 } : {}}
        whileTap={{ y: 0 }}
        {...props}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <motion.div
      ref={ref}
      className={classes}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      {...props}
    >
      {children}
    </motion.div>
  )
})

Card.displayName = 'Card'

export default Card
