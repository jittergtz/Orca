import BlogSection from '@/components/Landing/BlogSection'
import Navbar from '@/components/Landing/Navbar'
import React from 'react'

function page() {
  return (
    <div className='min-h-screen w-full flex flex-col items-center p-4 bg-neutral-50'>
        <Navbar/>
      <BlogSection />
    </div>
  )
}

export default page