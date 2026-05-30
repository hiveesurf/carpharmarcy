export function digitsOnlyPhone(phone) {
  if (!phone) return ''
  return String(phone).replace(/\D/g, '')
}

export function telHref(phone) {
  const digits = digitsOnlyPhone(phone)
  if (!digits) return null
  return `tel:+${digits.startsWith('91') ? digits : `91${digits}`}`
}

export function whatsAppHref(phone, text) {
  const digits = digitsOnlyPhone(phone)
  if (!digits) return null
  const normalized = digits.startsWith('91') ? digits : `91${digits}`
  const q = text ? `?text=${encodeURIComponent(text)}` : ''
  return `https://wa.me/${normalized}${q}`
}

export function formatAddressForMaps(addr) {
  if (!addr || typeof addr !== 'object') return ''
  return [addr.line1, addr.line2, addr.city, addr.state, addr.pincode, addr.country]
    .filter(Boolean)
    .map(String)
    .join(', ')
}

export function googleMapsDirectionsHref(addr) {
  const query = formatAddressForMaps(addr)
  if (!query.trim()) return null
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`
}
