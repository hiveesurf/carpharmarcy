/**
 * Resize and encode as JPEG to keep admin product payloads under server limits.
 * @param {File} file
 * @param {{ maxDim?: number, quality?: number }} [opts]
 * @returns {Promise<string>} data URL (image/jpeg)
 */
export async function imageFileToCompressedDataUrl(file, opts = {}) {
  const maxDim = opts.maxDim ?? 1600
  const quality = opts.quality ?? 0.86

  const bmp = await createImageBitmap(file)
  try {
    let { width, height } = bmp
    if (width > maxDim || height > maxDim) {
      if (width >= height) {
        height = Math.round((height / width) * maxDim)
        width = maxDim
      } else {
        width = Math.round((width / height) * maxDim)
        height = maxDim
      }
    }
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas not supported')
    ctx.drawImage(bmp, 0, 0, width, height)
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('JPEG encode failed'))), 'image/jpeg', quality)
    })
    return await new Promise((resolve, reject) => {
      const r = new FileReader()
      r.onload = () => resolve(String(r.result))
      r.onerror = () => reject(r.error || new Error('read failed'))
      r.readAsDataURL(blob)
    })
  } finally {
    bmp.close()
  }
}
