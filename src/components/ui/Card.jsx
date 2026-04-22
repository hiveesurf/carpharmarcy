import { motion } from 'framer-motion'

export function Card({ children, className = '', ...motionProps }) {
  return (
    <motion.div
      className={`clip-chamfer-sm relative border border-fog/10 bg-gradient-to-br from-steel/50 via-graphite/30 to-transparent p-6 backdrop-blur-sm before:pointer-events-none before:absolute before:inset-0 before:bg-[linear-gradient(135deg,rgba(232,255,90,0.03)_0%,transparent_45%)] md:p-8 ${className}`}
      {...motionProps}
    >
      {children}
    </motion.div>
  )
}
