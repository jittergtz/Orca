import CarouselSection from '@/components/Landing/CarouselSection'
import Hero, { MissionHero } from '@/components/Landing/Hero'
import Navbar from '@/components/Landing/Navbar'
import Contact from '@/components/Mission/Contact'
import BlankBlock from '@/components/Mission/Learn'
import Learn, { Table } from '@/components/Mission/Learn'
import OrangeSection from '@/components/Mission/OrangeSection'
import React from 'react'

function page() {
  return (
     <div className="flex min-h-screen px-4 flex-col bg-neutral-50  items-center ">
     <Navbar/>
     <div className=" pt-10 md:pt-20">
      <MissionHero text='What Matters to us ' ImgClassName="mix-blend-luminosity "/>
      </div>
      
  
     
       <CarouselSection title="Whats Important to you" cards={[
        {
          label: "Sport",
          bgColor: "#5C2D30",
          badge: "2026 Start",
          imageSrc: "/mock-singapore.png",
          imageAlt: "Indoor garden waterfall",
        },
        { label: "Podcasts",    bgColor: "#452D5C" },
        { label: "Politics",   bgColor: "#2D505C", darkText: false },
        { label: "Technology", bgColor: "#b3c4d8", darkText: true },
  
        ]} />

         <BlankBlock 
            Headline="Orca Learn"
            text="Learn is a feature we implemented internally for staying not only uptodate but quickly get into a new topic with understanding a broad picture od current situations."/>

              <OrangeSection/>
              
              <Table/>

              <Contact/>
  </div>
  )
}

export default page