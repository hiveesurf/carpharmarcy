import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import { Button } from '../ui/Button'
import { getAccessToken } from '../../lib/authTokens.js'
import { resolveSessionRole } from '../../lib/jwtPayload.js'

function normalizeMobileInput(value) {
  const digits = String(value ?? '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.length <= 10) return digits
  return digits.slice(-10)
}

export function AuthModals() {
  const navigate = useNavigate()
  const { modalOpen, closeAuth, sendOtp, verifyOtp } = useAuth()
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState('phone')
  const [message, setMessage] = useState('')

  const reset = () => {
    setPhone('')
    setOtp('')
    setStep('phone')
    setMessage('')
  }

  const handleClose = () => {
    reset()
    closeAuth()
  }

  const onSendOtp = async (e) => {
    e.preventDefault()
    setMessage('')
    const r = await sendOtp(phone)
    if (!r.ok) setMessage(r.message)
    else {
      if (import.meta.env.DEV && r?.data?.demoOtp) {
        // LOCAL DEV ONLY - remove before production
        setMessage(`Demo OTP: ${r.data.demoOtp}`)
      }
      setStep('otp')
    }
  }

  const onVerify = async (e) => {
    e.preventDefault()
    setMessage('')
    const r = await verifyOtp(phone, otp)
    if (!r.ok) setMessage(r.message)
    else {
      reset()
      const role = resolveSessionRole(r.user, getAccessToken())
      if (role === 'admin') {
        navigate('/admin', { replace: true })
      }
    }
  }

  return (
    <AnimatePresence>
      {modalOpen && (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[85] bg-ink/75 backdrop-blur-sm"
            aria-label="Close"
            onClick={handleClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-title"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="fixed left-1/2 top-1/2 z-[95] max-h-[min(92vh,640px)] w-[min(100%,420px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto border border-fog/15 bg-graphite p-6 shadow-2xl clip-chamfer sm:p-8"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 id="auth-title" className="font-display text-2xl font-bold uppercase tracking-wide text-fog">
                  Sign in
                </h2>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-mist">
                  Phone OTP · demo code 123456
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="flex h-10 w-10 shrink-0 items-center justify-center border border-fog/15 text-fog"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {message && (
              <p className="mb-6 rounded border border-flare/40 bg-flare-muted px-3 py-2 text-sm text-fog">{message}</p>
            )}

            {step === 'phone' ? (
              <form onSubmit={onSendOtp} className="space-y-4">
                <div>
                  <label htmlFor="auth-phone" className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-hud">
                    Mobile number
                  </label>
                  <input
                    id="auth-phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(normalizeMobileInput(e.target.value))}
                    maxLength={10}
                    className="w-full border border-fog/15 bg-ink/50 px-3 py-2.5 font-sans text-fog outline-none focus:border-accent/50"
                    placeholder="9876543210"
                  />
                </div>
                <Button variant="primary" size="md" className="w-full" type="submit">
                  Send OTP
                </Button>
              </form>
            ) : (
              <form onSubmit={onVerify} className="space-y-4">
                <p className="font-sans text-sm text-mist">
                  Code sent to <span className="font-semibold text-fog">{phone}</span>
                </p>
                <div>
                  <label htmlFor="auth-otp" className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-hud">
                    Enter OTP
                  </label>
                  <input
                    id="auth-otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full border border-fog/15 bg-ink/50 px-3 py-2.5 font-sans text-fog outline-none focus:border-accent/50 tracking-[0.3em]"
                    placeholder="123456"
                  />
                </div>
                <Button variant="primary" size="md" className="w-full" type="submit">
                  Verify & continue
                </Button>
                <button
                  type="button"
                  className="w-full font-sans text-sm text-accent underline-offset-2 hover:underline"
                  onClick={() => {
                    setStep('phone')
                    setOtp('')
                    setMessage('')
                  }}
                >
                  Change number
                </button>
              </form>
            )}

            <p className="mt-8 border-t border-fog/10 pt-6 text-center text-[11px] text-mist">
              Access token stays in memory; refresh token is an httpOnly cookie when Spring Boot is running on{' '}
              <code className="text-accent">:8080</code> (Vite proxies <code className="text-accent">/api</code> in dev).
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
