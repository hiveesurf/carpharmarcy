import { PART_IMAGES } from '../content/partImages.js'

/**
 * Hardcoded demo catalog. `totalStock` = units in warehouse (shown as “in stock”).
 * “Left” in UI = totalStock − quantity already in cart (cannot go below 0).
 */
/** Long-form copy for part detail pages (demo). */
export const PART_LONG_COPY = {
  'brk-front-001':
    'Ceramic compound for quieter stops and less dust on your wheels. Thermal-stable under hard braking; shimmed for rattle-free fit. Pair covers both front corners — verify pad shape against your caliper before install.',
  'oil-syn-5w30':
    'Full synthetic 5W-30 meeting common OEM viscosity specs for petrol engines. Ideal for extended drain intervals where the manual allows. One 4L jug typical for many compact and mid-size sumps — check dipstick level after fill.',
  'flt-air-001':
    'OEM-style pleated media with proper sealing lip for the airbox. Keeps fine dust out of the intake tract without starving flow. Replace per service schedule or sooner in dusty conditions.',
  'led-h7-kit':
    'Drop-in H7 LED modules with controlled beam pattern to reduce glare. Includes drivers and thermal management for stable output. Confirm headlamp projector/reflector compatibility and local regulations before road use.',
  'wpr-24':
    'Graphite-coated rubber with stainless spline for hook or pin arms (verify clip type). Set includes 24" and 16" blades common on hatches and sedans in this size class.',
  'cool-1l':
    'Ethylene-glycol long-life coolant prediluted or concentrate per label — read before topping up. Mix only with compatible coolant chemistry already in the system.',
  'spk-ngk-4':
    'Iridium centre electrode set of four, gapped for listed applications. Torque to spec; use anti-seize only if the manual permits. Ideal refresh with coils and filters on a tune-up.',
  'tire-195-55':
    'All-season tread pattern in 195/55R16 — check load/speed index on sidewall matches placard. Price is per tyre; align and balance recommended on install.',
  'alt-120a':
    'Remanufactured 120A alternator, bench-tested. Pulley and plug style must match your engine harness. Core exchange may apply in a live storefront — here it is demo-only.',
  'clutch-kit':
    'Friction disc, pressure plate, and release bearing set for listed manual gearboxes. Flywheel skim or replacement may be advised once exposed — budget labour accordingly.',
  'shock-front':
    'Gas-charged front strut pair, tuned for OE-like ride height and damping. Always replace in pairs; alignment after install is strongly recommended.',
  'belt-serp':
    'Serpentine belt for accessory drive — length and rib count must match pulley stack. Inspect tensioner and idlers while the belt is off.',
  'mir-rh-pwr':
    'Right-hand power mirror assembly with actuator. Paint-to-match cap may ship primed — confirm connector pins vs your door harness.',
  'bat-60ah':
    'AGM 60Ah battery suitable for start-stop and high electrical load vehicles. Terminal layout and BCI group size must match your tray and cables.',
}

export const PARTS_CATALOG = [
  {
    id: 'brk-front-001',
    sku: 'BRK-F-001',
    name: 'Ceramic Brake Pads (Front)',
    category: 'Brakes',
    price: 4299,
    totalStock: 48,
    imageKey: 'brakes',
    compatibleCars: ['Hyundai i20', 'Hyundai Creta', 'Maruti Swift', 'Honda Amaze'],
  },
  {
    id: 'oil-syn-5w30',
    sku: 'OIL-5W30-4L',
    name: 'Synthetic 5W-30 Engine Oil (4L)',
    category: 'Fluids',
    price: 2149,
    totalStock: 120,
    imageKey: 'oil',
    compatibleCars: ['All vehicles'],
  },
  {
    id: 'flt-air-001',
    sku: 'FLT-AIR-88',
    name: 'OEM Air Filter Assembly',
    category: 'Filters',
    price: 899,
    totalStock: 64,
    imageKey: 'filter',
    compatibleCars: ['Honda City', 'Honda Amaze', 'Maruti Baleno'],
  },
  {
    id: 'led-h7-kit',
    sku: 'LED-H7-KIT',
    name: 'LED Headlamp Kit — H7',
    category: 'Lighting',
    price: 6499,
    totalStock: 22,
    imageKey: 'led',
    compatibleCars: ['VW Taigun', 'Hyundai Creta', 'Tata Nexon'],
  },
  {
    id: 'wpr-24',
    sku: 'WPR-24-U',
    name: 'Premium Wiper Blade Set (24"+16")',
    category: 'Body',
    price: 1299,
    totalStock: 75,
    imageKey: 'wipers',
    compatibleCars: ['Hyundai i20', 'Maruti Swift', 'Honda City'],
  },
  {
    id: 'cool-1l',
    sku: 'COOL-1L',
    name: 'Long-life Coolant (1L)',
    category: 'Fluids',
    price: 449,
    totalStock: 200,
    imageKey: 'coolant',
    compatibleCars: ['All vehicles'],
  },
  {
    id: 'spk-ngk-4',
    sku: 'SPK-NGK-4',
    name: 'NGK Iridium Spark Plugs (Set of 4)',
    category: 'Ignition',
    price: 1899,
    totalStock: 36,
    imageKey: 'spark',
    compatibleCars: ['Honda City', 'Maruti Baleno', 'Hyundai i20'],
  },
  {
    id: 'tire-195-55',
    sku: 'TIR-195-55R16',
    name: 'All-season Tire 195/55 R16',
    category: 'Wheels',
    price: 5299,
    totalStock: 16,
    imageKey: 'tire',
    compatibleCars: ['Hyundai i20', 'Honda Amaze', 'Maruti Swift'],
  },
  {
    id: 'alt-120a',
    sku: 'ALT-120A',
    name: '120A Alternator (Reman)',
    category: 'Electrical',
    price: 12499,
    totalStock: 8,
    imageKey: 'alternator',
    compatibleCars: ['Mahindra XUV700', 'Tata Nexon', 'Hyundai Creta'],
  },
  {
    id: 'clutch-kit',
    sku: 'CLU-MNL-001',
    name: 'Clutch Kit — Manual',
    category: 'Transmission',
    price: 8999,
    totalStock: 11,
    imageKey: 'clutch',
    compatibleCars: ['Honda City', 'Maruti Swift', 'Hyundai i20'],
  },
  {
    id: 'shock-front',
    sku: 'SUS-FR-01',
    name: 'Front Shock Absorber Pair',
    category: 'Suspension',
    price: 6799,
    totalStock: 14,
    imageKey: 'suspension',
    compatibleCars: ['VW Taigun', 'Hyundai Creta', 'Tata Nexon'],
  },
  {
    id: 'belt-serp',
    sku: 'BLT-SRP-6K',
    name: 'Serpentine Drive Belt',
    category: 'Engine',
    price: 1599,
    totalStock: 42,
    imageKey: 'belt',
    compatibleCars: ['All vehicles'],
  },
  {
    id: 'mir-rh-pwr',
    sku: 'MIR-RH-PWR',
    name: 'Power Side Mirror — RH',
    category: 'Body',
    price: 3499,
    totalStock: 19,
    imageKey: 'mirror',
    compatibleCars: ['Maruti Baleno', 'Hyundai i20', 'Honda Amaze'],
  },
  {
    id: 'bat-60ah',
    sku: 'BAT-60AH-AGM',
    name: 'AGM Battery 60Ah',
    category: 'Electrical',
    price: 7899,
    totalStock: 27,
    imageKey: 'alternator',
    compatibleCars: ['Honda City', 'VW Taigun', 'Mahindra XUV700', 'All vehicles'],
  },
]

export function getPartImage(imageKey) {
  const block = PART_IMAGES[imageKey]
  return block || PART_IMAGES.brakes
}

const PART_KEYS_ORDER = Object.keys(PART_IMAGES)

function galleryKeysForPart(part) {
  const primary = part.imageKey
  const keys = [primary]
  for (const k of PART_KEYS_ORDER) {
    if (keys.length >= 3) break
    if (k !== primary) keys.push(k)
  }
  while (keys.length < 3) keys.push(primary)
  return keys.slice(0, 3)
}

function defaultDescription(part) {
  const cars = part.compatibleCars || []
  const fits =
    cars.length > 0
      ? `${cars.slice(0, 3).join(', ')}${cars.length > 3 ? ', and more' : ''}`
      : 'see listing details'
  return `${part.name} — traceable SKU ${part.sku} in category ${part.category}. Fits: ${fits}. Demo listing; specifications shown are illustrative.`
}

/** Rich fields for detail view: description, 3 gallery keys, 360 viewer key. */
export function augmentPart(part) {
  const hasGalleryUrls = Array.isArray(part.galleryUrls) && part.galleryUrls.length > 0
  const desc = part.apiDescription ?? PART_LONG_COPY[part.id] ?? defaultDescription(part)
  if (hasGalleryUrls) {
    return {
      ...part,
      description: desc,
      galleryKeys: [],
      galleryUrls: part.galleryUrls,
      viewer360Key: part.imageKey,
    }
  }
  return {
    ...part,
    description: desc,
    galleryKeys: galleryKeysForPart(part),
    viewer360Key: part.imageKey,
  }
}

export function getPartById(id) {
  return PARTS_CATALOG.find((p) => p.id === id) ?? null
}

/** Same category first, then rest of catalog. */
export function getSuggestedParts(part, limit = 4) {
  if (!part) return []
  const others = PARTS_CATALOG.filter((p) => p.id !== part.id)
  const same = others.filter((p) => p.category === part.category)
  const diff = others.filter((p) => p.category !== part.category)
  return [...same, ...diff].slice(0, limit)
}

const carSet = new Set()
PARTS_CATALOG.forEach((p) => p.compatibleCars.forEach((c) => carSet.add(c)))
export const CAR_MODEL_OPTIONS = ['All vehicles', ...[...carSet].filter((c) => c !== 'All vehicles').sort()]

const categorySet = new Set()
PARTS_CATALOG.forEach((p) => categorySet.add(p.category))
export const PART_CATEGORY_OPTIONS = ['All categories', ...[...categorySet].sort()]

/** How many part cards to show on the home page before “Load more”. */
export const PARTS_HOME_PREVIEW_LIMIT = 6

export function formatInr(n) {
  return `₹${Number(n).toLocaleString('en-IN')}`
}
