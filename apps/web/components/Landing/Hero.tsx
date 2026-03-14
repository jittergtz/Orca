import Image from 'next/image'
import React from 'react'
import OrcaPreview from './OrcaPreview'

function Hero({ImgClassName, text}: {ImgClassName?: string, text: string}) {
  return (
    <main className='w-full    relative shadow-md shadow-black/20  overflow-hidden rounded-[50px] max-w-6xl h-full max-h-[550px] bg-neutral-900'>


       <Image
       src={"/HeroBackground.png"}
       width={1512}
       height={982}
       priority
       quality={100}
       className={(`select-none pointer-events-none  ${ImgClassName}`)}
       alt='Hero Background Orca'/>



       <h1 className='absolute top-5 left-1/2 -translate-x-1/2 text-[48px] md:text-[80px] md:mt-10 text-center w-full font-serif italic'>
      {text}
     </h1>

       <div className='absolute w-full sm:-bottom-40 -bottom-[350px]   left-1/2 -translate-x-1/2 '>
       <OrcaPreview/>
       </div>



    </main>
  )
}

export default Hero