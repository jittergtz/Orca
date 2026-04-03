import Image from 'next/image'
import React from 'react'
import OrcaPreview from './OrcaPreview'

function Hero({ImgClassName, text}: {ImgClassName?: string, text: string}) {
  return (
    <main className='w-full    relative shadow-md shadow-black/20  overflow-hidden rounded-[40px] max-w-6xl h-full max-h-[650px] bg-[#222222]'>


       <Image
       src={"/HeroBackground.png"}
       width={1512}
       height={982}
       priority
       quality={100}
       className={(`select-none h-96 md:h-full object-cover pointer-events-none  ${ImgClassName}`)}
       alt='Hero Background Orca'/>



       <h1 className='absolute text-white hidden lg:block top-5 left-1/2 -translate-x-1/2 text-[48px] md:text-[72px] md:mt-20 text-center w-full font-serif italic'>
      {text}
     </h1>

       <h1 className='absolute text-white  lg:hidden top-10 left-1/2 -translate-x-1/2 text-[48px] md:text-[72px] md:mt-20 text-center w-full font-serif italic'>
     Stay Informed
     </h1>

       <div className='absolute hidden lg:flex w-full sm:-bottom-32 -bottom-[350px]   left-1/2 -translate-x-1/2 '>
       <OrcaPreview/>
       </div>

       <div>
        <Image
        src={"/Prev2.png"}
        width={700}
        height={400}
        alt='Orca Preview Image'
        className='absolute bottom-16 w-72 sm:w-96 md:w-[600px] lg:hidden object-cover rounded-xl left-1/2 -translate-x-1/2'/>
       </div>



    </main>
  )
}

export default Hero




export function MissionHero({ImgClassName, text}: {ImgClassName?: string, text: string}) {
  return (
    <main className='w-full    relative shadow-md shadow-black/20  overflow-hidden rounded-[50px] max-w-6xl h-full max-h-[650px]  bg-gradient-to-tl from-[#0a1384] to-[#000000]'>


       <Image
       src={"/HeroBackground.png"}
       width={1512}
       height={982}
       priority
       quality={100} 
       className={(`select-none h-96 md:h-full object-cover pointer-events-none  ${ImgClassName}`)}
       alt='Hero Background Orca'/>



       <h1 className='absolute text-white left-4 top-10 md:top-20 md:left-20 text-[43px] md:text-[80px] md:mt-10 w-full font-serif italic'>
      {text}
     </h1>

        <h1 className='absolute text-white right-10 bottom-10 md:bottom-20 md:right-20 text-[43px] md:text-[80px] md:mt-10  font-serif italic'>
       Is Quality
     </h1>

       <div className='absolute w-full sm:-bottom-40 -bottom-[350px]   left-1/2 -translate-x-1/2 '>
   
       </div>



    </main>
  )
}