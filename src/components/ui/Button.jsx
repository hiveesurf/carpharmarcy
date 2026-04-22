import { motion } from 'framer-motion'

const variants = {
  primary:
    'bg-accent text-[var(--color-on-accent)] font-semibold shadow-[0_10px_32px_-8px_rgba(255,107,53,0.45)] hover:brightness-[1.03]',
  secondary:
    'border border-steel/80 bg-slate/80 text-fog backdrop-blur-sm hover:border-hud/45 hover:bg-hud/5',
  flare:
    'bg-flare text-[var(--color-on-accent)] font-semibold shadow-[0_8px_28px_-8px_rgba(232,93,44,0.45)] hover:brightness-105',
  ghost: 'text-mist hover:text-fog border border-transparent hover:border-steel/80',
}

const sizes = {
  md: 'px-6 py-2.5 text-sm rounded-xl',
  lg: 'px-8 py-3.5 text-[0.95rem] rounded-xl',
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  as: Component = motion.button,
  ...props
}) {
  return (
    <Component
      type={Component === motion.button ? 'button' : undefined}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 420, damping: 26 }}
      className={`font-mono uppercase tracking-wider inline-flex cursor-pointer items-center justify-center transition-colors duration-300 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </Component>
  )
}
