import React from 'react'

function Contact() {
  return (
    <div className='w-full flex justify-center py-20'>
        <div className='h-64 flex flex-col p-12 items-center shadow-xl  bg-[#353535] w-full max-w-7xl rounded-[50px]'>
            <h1 className='text-6xl font-serif italic text-[#ff5927]'>Contact</h1>
            <div className='mt-5 rounded-full text-neutral-300 cursor-pointer hover:text-neutral-100 font-light px-20 p-2 bg-neutral-700'>
                support@orca.com
            </div>
        </div>
    </div>
  )
}

export default Contact