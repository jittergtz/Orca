'use client'
import React from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

const GO_FEATURES = [
  '8 subscribed Topics',
  'Daily & Weekly Article',
  'TLDR for every Article',
  'Explainer',
  'Research Agent',
]

const PRO_FEATURES = [
  'Unlimited sub Topics',
  'Daily & Weekly Article',
  'TLDR for every Article',
  'Explainer',
  'Research Agent',
  'Live Audio',
  'Deep Dive',
]

function PlanCard({
  name,
  price,
  cta,
  img,
  onChoose,
}: {
  name: string
  price: string
  cta: string
  img: string
  onChoose: () => void
}) {
  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Card with gradient background and placeholder image */}
      <div className="relative rounded-2xl   overflow-hidden h-44 bg-gradient-to-br from-stone-200 via-stone-100 to-stone-300 shadow-inner">
        {/* Placeholder image — replace src with your real asset */}
        <Image
          src={img}
          alt={`${name} plan background`}
          fill
          className="object-cover transition-all duration-500 hover:scale-110"
        />
        {/* Plan name */}
        <span className="absolute top-4 left-5 font-sans text-lg font-medium text-stone-50">
          {name}
        </span>
        {/* Price */}
        <div className="absolute bottom-4 left-5 flex items-baseline gap-1">
          <span className="font-serif italic text-4xl text-stone-50">{price}</span>
          <span className="font-sans text-sm text-stone-100">per month</span>
        </div>
      </div>

      {/* CTA button */}
      <button onClick={onChoose} className="w-full rounded-full bg-black text-white font-sans text-sm font-medium py-3 hover:bg-stone-800 transition-colors">
        {cta}
      </button>
    </div>
  )
}

function FeatureList({ features }: { features: string[] }) {
  return (
    <ul className="w-full flex flex-col">
      {features.map((f) => (
        <li
          key={f}
          className="font-sans text-sm text-stone-700 py-3 border-b border-dashed border-stone-300 last:border-b-0"
        >
          {f}
        </li>
      ))}
    </ul>
  )
}

function PricingHero() {
  const router = useRouter()
  return (
    <section className="w-full flex justify-center min-h-screen bg-neutral-50 px-6 py-16 md:px-16 lg:px-24">
        <div className='w-full max-w-6xl flex flex-col'>
      {/* Header row */}
      <div className="flex flex-col  md:gap-6 mb-12">
        <h1 className="font-serif italic text-5xl md:text-7xl  text-stone-900 leading-none mb-6 md:mb-0 md:w-1/2">
          Simple Pricing
        </h1>

        <p className="font-sans text-sm md:text-md text-stone-400 leading-relaxed max-w-xs md:pt-2">
          Orca brings the best of an LMS, LXP, authoring tool, and virtual
          classroom into one AI-native learning platform.
        </p>
      </div>

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
        {/* Left col: description (hidden on mobile, shown on md+) */}
        <div className="hidden md:block" />

        {/* Go plan */}
        <div className="flex flex-col gap-0">
          <PlanCard img='/gra3.webp' name="Go" price="$9" cta="Choose Go" onChoose={() => router.push('/subscribe?plan=go')} />
          <FeatureList features={GO_FEATURES} />
        </div>

        {/* Pro plan */}
        <div className="flex flex-col gap-0">
          <PlanCard img='/gra2.webp' name="Pro" price="$17" cta="Choose Pro" onChoose={() => router.push('/subscribe?plan=pro')} />
          <FeatureList features={PRO_FEATURES} />
        </div>
      </div>
      </div>
    </section>
  )
}

export default PricingHero
