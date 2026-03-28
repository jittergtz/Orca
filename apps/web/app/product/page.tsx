import Navbar from '@/components/Landing/Navbar'
import { main } from 'framer-motion/client'
import Image from 'next/image'
import React from 'react'

function page() {
  return (
    <main min-h-screen >
        <Navbar/>
       
        <Image
        priority
        src={"/product/jungle.jpg"}
        fill
        
        className='object-cover'
        alt='Desktop Desert background'/>
    </main>
  )
}

export default page