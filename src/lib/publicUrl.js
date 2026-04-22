/**
 * URL for files served from Vite `public/` (honours `base`, e.g. GitHub Pages subpath).
 * @param {string} path - e.g. `images/engine.jpg` or `/images/engine.jpg`
 * @returns {string}
 */
export function publicUrl(path) {
  const normalized = path.startsWith('/') ? path.slice(1) : path
  return `${import.meta.env.BASE_URL}${normalized}`
}
