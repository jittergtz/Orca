import React from 'react'

function Learn() {
  return (
    <div className='my-20 rounded-[40px] flex justify-center p-4 bg-neutral-200 w-full h-[40vh]'>
        <div className='w-full max-w-5xl felx flex-col' >
            <h1 className='text-4xl text-black mt-7 sm:mt-10 mb-7'>Orca Learn</h1>
            <p className='text-black sm:w-1/2'>Learn is a feature we implemented internally for staying not only uptodate but quickly get into a new topic with understanding a broad picture od current situations.</p>
            </div>
        </div>
  )
}

export default Learn


export function Table() {
  return (
    <div className='my-20 rounded-[40px] flex justify-center p-4 bg-neutral-200 w-full min-h-[40vh]'>
        <div className='w-full max-w-5xl justify-center items-center flex-col md:flex-row flex gap-5' >
            
            <div className='border-x flex flex-col items-center justify-center   rounded-[40px] h-full w-64'>
                <h3 className='font-serif italic text-4xl text-black mb-2'>Super Search</h3>
                <p className='text-orange-600 text-xl'>4000+</p>
             </div>

               <div className='border-x flex flex-col items-center justify-center   rounded-[40px] h-full w-64'>
                <h3 className='font-serif italic text-4xl text-black mb-2'>Turbo</h3>
                <p className='text-orange-600 text-xl'>4000+</p>
             </div>

               <div className='border-x flex flex-col items-center justify-center   rounded-[40px] h-full w-64'>
                <h3 className='font-serif italic text-4xl text-black mb-2'>Voices</h3>
                <p className='text-orange-600 text-xl'>30</p>
             </div>

              <div className='border-x flex flex-col items-center justify-center   rounded-[40px] h-full w-64'>
                <h3 className='font-serif italic text-4xl text-black mb-2'>Sources</h3>
                <p className='text-orange-600 text-xl'>200+</p>
             </div>
        </div>
        </div>
  )
}