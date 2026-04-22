import { createElement } from 'react'

/**
 * DotLottie web component. Register via `import '@lottiefiles/dotlottie-wc'` in main.jsx
 * before React mounts. `src` must be set on first paint — not in an effect — or
 * connectedCallback runs with no animation URL.
 */
export function DotLottieWc({
  src,
  width = 300,
  height = 300,
  className = '',
  backgroundColor = '#00000000',
  style: styleProp = {},
}) {
  return createElement('dotlottie-wc', {
    key: src,
    src,
    autoplay: true,
    loop: true,
    className,
    backgroundColor,
    style: {
      display: 'block',
      width,
      height,
      ...styleProp,
    },
  })
}
