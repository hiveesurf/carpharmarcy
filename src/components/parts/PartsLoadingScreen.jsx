import { DotLottieWc } from '../ui/DotLottieWc'

const DOTLOTTIE_SRC =
  'https://lottie.host/1ffc224b-7c9e-4391-b7e3-a49a72b03f36/trV13DyWxs.lottie'

/**
 * Loader for parts grid boot and listing overlay — DotLottie animation.
 */
export function PartsLoadingScreen({ label = 'Loading inventory', hint = 'Fetching SKUs and stock levels…' }) {
  return (
    <div
      className="flex min-h-[min(420px,55vh)] flex-col items-center justify-center gap-8 py-16"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <DotLottieWc src={DOTLOTTIE_SRC} width={300} height={300} className="mx-auto" />
      <div className="text-center">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.4em] text-hud">{label}</p>
        {hint ? <p className="mt-2 font-sans text-sm text-mist">{hint}</p> : null}
      </div>
    </div>
  )
}
