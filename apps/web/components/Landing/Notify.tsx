"user client"
import Image from 'next/image'
import React from 'react'

function Notify() {
  return (
    <div className='md:py-40 text-white py-20 w-full flex flex-col items-center  '>
        <h1 className='md:text-4xl text-2xl  tracking-tight   mb-4  md:mb-8 pl-5  max-w-6xl w-full text-neutral-600'>Qualtiy tailored to you</h1>

        <div className='h-72 overflow-hidden relative rounded-3xl md:rounded-[50px] w-full max-w-6xl bg-neutral-900'>
          <Image
            src="/bub.png"
            fill
            alt="cover background"
            quality={40}
            className="object-cover pointer-events-none"
          />


           <h3 className='absolute top-28 md:top-1/2 -translate-y-1/2 right-4 md:right-10 font-medium tracking-tighter text-[25px] lg:text-[38px]'>
           Informed on whats important
           </h3>

             <div className='absolute flex items-center bg-[#85858532] h-10  border border-lime-200/40 shadow-md shadow-black/40  backdrop-blur-xl  w-72 lg:w-80 rounded-full px-5 bottom-20 md:top-1/2 -translate-y-1/2 left-4 md:left-20 '>
             <h1 className=' md:text-[19px] font-light text-[16px] text-lime-100'>
               Nvidia live press confrence 
            </h1>
            <div className='rounded-full size-2 mt-0.5 bg-lime-50 animate-pulse ml-5'></div>
           </div>

        </div>

    </div>
  )
}

export default Notify