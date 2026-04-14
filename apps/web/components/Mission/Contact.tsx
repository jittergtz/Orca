import React from 'react'

function Contact() {
  return (
    <div className='w-full flex justify-center py-20'>
        <div className='h-64 flex flex-col p-12 items-center shadow-xl  bg-[#a2a2a20b] w-full max-w-7xl rounded-[50px]'>
            <h1 className='text-6xl font-serif italic text-[#1a1a1a]'>Contact</h1>
            <div className='mt-5 rounded-full text-neutral-700 cursor-pointer hover:text-neutral-900 font-light px-20 p-2 bg-neutral-700/10'>
                support@orca-labs.app
            </div>
        </div>
    </div>
  )
}

export default Contact