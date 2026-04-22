import { AboutStrip } from '../components/sections/AboutStrip'
import { CTABanner } from '../components/sections/CTABanner'
import { Hero } from '../components/sections/Hero'
import { HowItWorks } from '../components/sections/HowItWorks'
import { PopularBrands } from '../components/sections/PopularBrands'
import { Services } from '../components/sections/Services'
import { ShopByCategories } from '../components/sections/ShopByCategories'
import { Testimonials } from '../components/sections/Testimonials'
import { WhyChooseUs } from '../components/sections/WhyChooseUs'
import { PartsHub } from '../components/parts/PartsHub'

export function HomePage() {
  return (
    <>
      <Hero />
      <ShopByCategories />
      <PartsHub />
      <Services />
      <PopularBrands />
      <AboutStrip />
      <HowItWorks />
      <WhyChooseUs />
      <Testimonials />
      <CTABanner />
    </>
  )
}
