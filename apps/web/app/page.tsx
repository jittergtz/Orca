import Hero from "@/components/Landing/Hero";
import TrustedBy from "@/components/Landing/TrustedBy";
import CarouselSection from "@/components/Landing/CarouselSection";
import Navbar from "@/components/Landing/Navbar";
import Blocks from "@/components/Landing/Blocks";
import OrcaPreview from "@/components/Landing/OrcaPreview";
import ContainerPreview from "@/components/Landing/ContainerPreview";
import Search from "@/components/Landing/Search";
import AuthRedirect from "@/components/Auth/AuthRedirect";

export default function Page() {
  return (
  <div className="flex min-h-screen px-4 flex-col bg-neutral-50  items-center ">
     <AuthRedirect />
     <Navbar/>
     <div className=" pt-10 md:pt-20">

<Hero text="Stay Informed in a busy World" ImgClassName=" hue-rotate-10 contrast-200 opacity-90 " />
</div>

      <TrustedBy/>
 
      <CarouselSection />

  
  
     <Blocks />

         <Search/>

     <ContainerPreview/>
     
       <CarouselSection title="Whats Important to you" cards={[
        {
          label: "Sources",
          bgColor: "#5C2D30",
          badge: "2026 Start",
          imageSrc: "/carousel/whitedome.jpg",
          imageAlt: "Indoor garden waterfall",
        },
          {
          label: "Speed",
          bgColor: "#5C2D30",
          badge: "2026 Start",
          imageSrc: "/carousel/track.jpg",
          imageAlt: "Indoor garden waterfall",
        
        },

          {
          label: "Science",
          bgColor: "#5C2D30",
          badge: "2026 Start",
          imageSrc: "/carousel/Science.jpg",
          imageAlt: "Indoor garden waterfall",
        },
          {
          label: "Ocosystem",
          bgColor: "#5C2D30",
          badge: "2026 Start",
          imageSrc: "/carousel/nature.jpg",
          imageAlt: "Indoor garden waterfall",
        },
          {
          label: "Endurance",
          bgColor: "#5C2D30",
          badge: "2026 Start",
          imageSrc: "/carousel/tennis.jpg",
          imageAlt: "Indoor garden waterfall",
        },
          {
          label: "Sport",
          bgColor: "#5C2D30",
          badge: "2026 Start",
          imageSrc: "/carousel/season2.jpg",
          imageAlt: "Indoor garden waterfall",
        },

        ]} />
  </div>
  )}