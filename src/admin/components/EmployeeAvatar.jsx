import { useState } from 'react'
import { employeeInitials, employeePhotoDisplayUrl } from '../../lib/adminEmployeeAssets.js'

/**
 * @param {{
 *   employee: Record<string, unknown> | null | undefined,
 *   className?: string,
 *   textClass?: string,
 *   ringClass?: string,
 * }} props
 */
export function EmployeeAvatar({
  employee,
  className = 'h-9 w-9 shrink-0',
  textClass = 'text-sm',
  ringClass = 'ring-1 ring-steel/50',
}) {
  const [broken, setBroken] = useState(false)
  const src = employeePhotoDisplayUrl(employee)
  const initials = employeeInitials(employee)
  const alt = employee?.name ? String(employee.name) : 'Employee'

  if (!src || broken) {
    return (
      <span
        className={`flex items-center justify-center rounded-full bg-gradient-to-br from-steel/50 to-ink/60 font-display font-bold text-fog ${ringClass} ${className} ${textClass}`}
        aria-hidden
      >
        {initials}
      </span>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setBroken(true)}
      className={`rounded-full border border-steel/60 object-cover bg-ink/20 ${className}`}
    />
  )
}
