import Image from 'next/image'
import React from 'react'

function OrangeSection() {
  return (
    <div className='min-h-screen p-10 bg-[#FF5927] w-full rounded-[40px] shadow-xl shadow-black/10'>
        <div className='flex  justify-center  '>
            <div className='flex w-full max-w-5xl gap-28'>
        <div className='flex flex-col w-full max-w-xl gap-10 '>
            <h1 className='text-[50px] text-black font-serif italic'>Our Principles</h1>


        <div aria-label='Our Principle paragraph 1' className='   '>
            <h2 className='text-[28px] font-serif italic text-black mb-2'>Quality </h2>
            <p className='text-[18px] font-light text-black '>Lorem ipsum dolor sit amet consectetur, adipisicing elit. Molestiae repellat iure minus eligendi maxime accusamus vitae suscipit nobis mollitia veritatis! Vero sapiente distinctio adipisci doloribus inventore dolorem, totam veniam provident.</p>
        </div>

            <div aria-label='Our Principle paragraph 1' className=' '>
            <h2 className='text-[28px] font-serif italic text-black mb-2'>De Noise </h2>
            <p className='text-[18px] font-light text-black '>Lorem ipsum dolor sit amet consectetur, adipisicing elit. Molestiae repellat iure minus eligendi maxime accusamus vitae suscipit nobis mollitia veritatis! Vero sapiente distinctio adipisci doloribus inventore dolorem, totam veniam provident.</p>
        </div>


            <div aria-label='Our Principle paragraph 1' className=' '>
            <h2 className='text-[28px] font-serif italic text-black mb-2'>Time Scale </h2>
            <p className='text-[18px] font-light text-black '>Lorem ipsum dolor sit amet consectetur, adipisicing elit. Molestiae repellat iure minus eligendi maxime accusamus vitae suscipit nobis mollitia veritatis! Vero sapiente distinctio adipisci doloribus inventore dolorem, totam veniam provident.</p>
        </div>

       </div> 
           

<div className='hidden mt-12 lg:grid w-full  grid-cols-2 gap-4'>
    <Image 
        src={"/mission/Office.webp"}
        width={1920}
        height={1080}
        quality={80}
        className='size-64 object-cover rounded-3xl'
        alt='Principles Images'/>
    <Image 
        src={"/mission/paper2.jpg"}
        width={1920}
        height={1080}
        quality={80}
        className='size-48 object-cover rounded-3xl'
        alt='Principles Images'/>
  
            <Image 
            src={"/mission/paper.jpg"}
            width={1920}
            height={1080}
            quality={80}
            className=' size-64 object-cover rounded-3xl'
            alt='Principles Images'/>


             <Image 
            src={"/mission/grass.webp"}
            width={1920}
            height={1080}
            quality={80}
            className=' size-48 object-cover rounded-3xl'
            alt='Principles Images'/>

              <div></div>

              <Image 
            src={"/mission/OfficeOutside.jpg"}
            width={1920}
            height={1080}
            quality={80}
            className=' size-48 object-cover rounded-3xl'
            alt='Principles Images'/>


            </div>

        </div>
        
      </div>
       
       
         <div className=' lg:!hidden mt-12 grid w-full  grid-cols-2 gap-4'>
    <Image 
        src={"/mission/Office.webp"}
        width={1920}
        height={1080}
        quality={80}
        className='size-64 object-cover rounded-3xl'
        alt='Principles Images'/>
    <Image 
        src={"/mission/paper2.jpg"}
        width={1920}
        height={1080}
        quality={80}
        className='size-48 object-cover rounded-3xl'
        alt='Principles Images'/>
  
            <Image 
            src={"/mission/paper.jpg"}
            width={1920}
            height={1080}
            quality={80}
            className=' size-64 object-cover rounded-3xl'
            alt='Principles Images'/>


             <Image 
            src={"/mission/grass.webp"}
            width={1920}
            height={1080}
            quality={80}
            className=' size-48 object-cover rounded-3xl'
            alt='Principles Images'/>

              <div></div>

              <Image 
            src={"/mission/OfficeOutside.jpg"}
            width={1920}
            height={1080}
            quality={80}
            className=' size-48 object-cover rounded-3xl'
            alt='Principles Images'/>


            </div>
    </div>
  )
}

export default OrangeSection