export function normalizeEmployeePhone(value) {
  const digits = String(value ?? '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.length <= 10) return digits
  return digits.slice(-10)
}

/**
 * @param {{ phone?: string, name?: string, role?: string }} fields
 * @returns {{ errors: Record<string, string>, values: { phone: string, name: string, role: string } | null }}
 */
export function validateEmployeeForm(fields) {
  const errors = {}
  const phone = normalizeEmployeePhone(fields.phone)
  const name = String(fields.name ?? '').trim()
  const role = String(fields.role ?? '').trim().toLowerCase()

  if (!phone) {
    errors.phone = 'Phone is required'
  } else if (phone.length !== 10) {
    errors.phone = 'Phone must be 10 digits'
  }

  if (!name) {
    errors.name = 'Name is required'
  }

  if (!role) {
    errors.role = 'Role is required'
  } else if (role !== 'sales' && role !== 'delivery') {
    errors.role = 'Role must be sales or delivery'
  }

  if (Object.keys(errors).length > 0) {
    return { errors, values: null }
  }

  return { errors, values: { phone, name, role } }
}
