import Navbar from '@/components/Landing/Navbar'
import PricingHero from '@/components/Pricing/PricingHero'
import React from 'react'

function page() {
  return (
    <div className='min-h-screen p-2 bg-neutral-50 flex-col flex items-center'>
        <Navbar/>
        <PricingHero/>
    </div>
  )
}

export default page