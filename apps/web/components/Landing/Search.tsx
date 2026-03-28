"user client"
import Image from 'next/image'
import React from 'react'

function Search() {
  return (
    <div className='md:py-40 text-white py-20 w-full flex flex-col items-center  '>
        <h1 className='md:text-4xl text-3xl  tracking-tight   mb-4  md:mb-8 pl-5  max-w-6xl w-full text-neutral-600'>Qualtiy tailored to you</h1>

        <div className='h-72 overflow-hidden relative rounded-[50px] w-full max-w-6xl bg-neutral-900'>
          <Image
            src="/bub.png"
            fill
            alt="cover background"
            className="object-cover "
          />


           <h3 className='absolute top-28 md:top-1/2 -translate-y-1/2 right-4 md:right-10 font-medium tracking-tighter text-[25px] lg:text-[38px]'>
           Informed on whats important
           </h3>

             <div className='absolute flex items-center bg-white/40 h-12 border border-white/30 shadow-md shadow-black/40  backdrop-blur-xl  w-72 lg:w-96 rounded-full px-5 bottom-20 md:top-1/2 -translate-y-1/2 left-4 md:left-20 '>
             <h1 className=' text-[20px]'>
               Search
            </h1>
           </div>

        </div>

    </div>
  )
}

export default Search