import Hero from "@/components/Landing/Hero";
import TrustedBy from "@/components/Landing/TrustedBy";
import CarouselSection from "@/components/Landing/CarouselSection";
import Navbar from "@/components/Landing/Navbar";
import Blocks from "@/components/Landing/Blocks";
import OrcaPreview from "@/components/Landing/OrcaPreview";
import ContainerPreview from "@/components/Landing/ContainerPreview";

export default function Page() {
  return (
  <div className="flex min-h-screen px-4 flex-col bg-neutral-50  items-center ">
     <Navbar/>
     <div className=" pt-10 md:pt-20">

<Hero text="Stay Informed" ImgClassName=" hue-rotate-10 contrast-200 opacity-90 " />
</div>

      <TrustedBy/>
 
      <CarouselSection />
     <Blocks />

     < ContainerPreview/>
     
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
  </div>
  )}