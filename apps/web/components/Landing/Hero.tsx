import Image from 'next/image'
import React from 'react'

function Hero() {
  return (
    <main className='w-full relative shadow-md shadow-black/20  overflow-hidden rounded-[60px] max-w-7xl h-full max-h-[650px] bg-neutral-900'>
       <Image
       src={"/high.webp"}
       width={3024}
       height={1964}
       priority
       quality={100}
       className=' '
       alt='Hero Background Orca'/>

       <h1 className='absolute top-10 left-1/2 -translate-x-1/2 text-[48px] md:text-[80px] md:mt-20 text-center w-full font-serif italic'>
       Stay Informed
     </h1>


    </main>
  )
}

export default Hero