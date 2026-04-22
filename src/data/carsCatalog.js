/**
 * Demo vehicle listings — local only, no backend.
 * Images: Unsplash automotive (fm=jpg) + local /public shots where noted.
 */
import { publicUrl } from '../lib/publicUrl'

const u = (id, w = 1200) => `https://images.unsplash.com/${id}?w=${w}&q=82&fm=jpg`
const local = (path) => publicUrl(path)

/** @typedef {'first-hand' | 'second-hand'} CarCondition */

export const CONDITION_LABEL = {
  'first-hand': 'First hand',
  'second-hand': '2nd hand',
}

/**
 * @type {Array<{
 *   id: string
 *   title: string
 *   year: number
 *   price: number
 *   condition: CarCondition
 *   km: number
 *   fuel: string
 *   transmission: string
 *   location: string
 *   image: string
 *   imageAlt: string
 *   gallery: { src: string; alt: string }[]
 *   description: string
 * }>}
 */
export const CARS_CATALOG = [
  {
    id: 'veh-creta-23',
    title: 'Hyundai Creta SX (Petrol)',
    year: 2023,
    price: 1425000,
    condition: 'second-hand',
    km: 18500,
    fuel: 'Petrol',
    transmission: 'Automatic',
    location: 'Bangalore',
    image: u('photo-1503376780353-7e6692767b70', 1400),
    imageAlt: 'White SUV on coastal road',
    gallery: [
      { src: u('photo-1503376780353-7e6692767b70', 1000), alt: 'Exterior front three-quarter' },
      { src: u('photo-1492144534655-ae79c964c9d7', 1000), alt: 'Sports car studio detail' },
      { src: local('images/mirror.jpg'), alt: 'Vehicle profile and mirror' },
    ],
    description:
      'Single-owner city use, full agency service history. Tyres at ~70% tread; insurance valid. PPI report available on request.',
  },
  {
    id: 'veh-nexon-ev-24',
    title: 'Tata Nexon EV Max',
    year: 2024,
    price: 1680000,
    condition: 'first-hand',
    km: 4200,
    fuel: 'Electric',
    transmission: 'Automatic',
    location: 'Mumbai',
    image: u('photo-1568605117036-5fe5e7bab0b7', 1400),
    imageAlt: 'Modern EV crossover exterior',
    gallery: [
      { src: u('photo-1568605117036-5fe5e7bab0b7', 1000), alt: 'EV exterior' },
      { src: u('photo-1617814076367-b759cf79957e', 1000), alt: 'Service and charging context' },
      { src: local('images/electrical.jpg'), alt: 'Electrical bay — inspection' },
    ],
    description:
      'Demo drive mileage only; registered first owner. Extended battery warranty intact through OEM program. Home charger bundle optional.',
  },
  {
    id: 'veh-slavia-22',
    title: 'Škoda Slavia Style TSI',
    year: 2022,
    price: 1189000,
    condition: 'second-hand',
    km: 34200,
    fuel: 'Petrol',
    transmission: 'Manual',
    location: 'Delhi NCR',
    image: u('photo-1552519507-da3b142c6e3d', 1400),
    imageAlt: 'Sedan with premium wheels',
    gallery: [
      { src: u('photo-1552519507-da3b142c6e3d', 1000), alt: 'Sedan wheel arch' },
      { src: local('images/suspension.jpg'), alt: 'Chassis and wheel detail' },
      { src: u('photo-1449965408869-ebd3bac13764', 1000), alt: 'Keys and vehicle handover' },
    ],
    description:
      'Highway-mileage log; clutch and brakes inspected at our bay. Two small paint touch-ups documented; no structural work.',
  },
  {
    id: 'veh-city-21',
    title: 'Honda City ZX CVT',
    year: 2021,
    price: 1295000,
    condition: 'second-hand',
    km: 45800,
    fuel: 'Petrol',
    transmission: 'CVT',
    location: 'Hyderabad',
    image: u('photo-1489824904134-9abaeb61134c', 1400),
    imageAlt: 'Silver sedan in urban setting',
    gallery: [
      { src: u('photo-1489824904134-9abaeb61134c', 1000), alt: 'City sedan' },
      { src: local('images/engine.jpg'), alt: 'Engine bay reference' },
      { src: u('photo-1580273916550-e323be2ae537', 1000), alt: 'Wheel motion detail' },
    ],
    description:
      'Corporate lease return with stamped service booklet. CVT fluid changed at 40k km; battery replaced 2025.',
  },
  {
    id: 'veh-thar-24',
    title: 'Mahindra Thar LX Diesel 4x4',
    year: 2024,
    price: 1520000,
    condition: 'first-hand',
    km: 8900,
    fuel: 'Diesel',
    transmission: 'Manual',
    location: 'Pune',
    image: u('photo-153347335933a-381c84afb79d', 1400),
    imageAlt: '4x4 SUV outdoor',
    gallery: [
      { src: u('photo-153347335933a-381c84afb79d', 1000), alt: 'Thar-style 4x4' },
      { src: local('images/tyres.jpg'), alt: 'Tyre and alloy detail' },
      { src: u('photo-1469533778471-269a23466fd0', 1000), alt: 'Off-road capable SUV' },
    ],
    description:
      'Accessory pack includes hard top and mats. No off-road competition use; largely weekend highway trips.',
  },
  {
    id: 'veh-virtus-23',
    title: 'Volkswagen Virtus GT Plus',
    year: 2023,
    price: 1365000,
    condition: 'second-hand',
    km: 22100,
    fuel: 'Petrol',
    transmission: 'DSG',
    location: 'Chennai',
    image: u('photo-1606664515524-ed2f786a0bd6', 1400),
    imageAlt: 'Contemporary sedan exterior',
    gallery: [
      { src: u('photo-1606664515524-ed2f786a0bd6', 1000), alt: 'Virtus-class sedan' },
      { src: local('images/spark.jpg'), alt: 'Performance reference — ignition' },
      { src: u('photo-1503736334956-4c8f8e92946d', 1000), alt: 'Performance car angle' },
    ],
    description:
      'DSG service done at authorised workshop; mechatronics warranty note on file. Sport trim with sunroof.',
  },
]

export const CARS_FEATURED_HOME = 4

export function getCarById(id) {
  return CARS_CATALOG.find((c) => c.id === id) ?? null
}

export function openCarEnquiry(car) {
  if (!car) return
  const subject = encodeURIComponent(`Enquiry: ${car.title} (${car.year})`)
  const body = encodeURIComponent(
    `Hi carpharmacy,\n\nI'm interested in this vehicle:\n\n` +
      `Listing: ${car.title}\n` +
      `Year: ${car.year}\n` +
      `ID: ${car.id}\n` +
      `Asking: ₹${car.price.toLocaleString('en-IN')}\n` +
      `Location: ${car.location}\n\n` +
      `Please contact me with next steps.\n`,
  )
  window.location.href = `mailto:help@carnalysys.com?subject=${subject}&body=${body}`
}
