import Hero from "@/components/Landing/Hero";
import TrustedBy from "@/components/Landing/TrustedBy";
import CarouselSection from "@/components/Landing/CarouselSection";
import Navbar from "@/components/Landing/Navbar";

export default function Page() {
  return (
  <div className="flex min-h-screen px-4 flex-col  items-center ">
     <Navbar/>
     <div className=" pt-10 md:pt-20">
      <Hero/>
      </div>
      <TrustedBy/>
      <CarouselSection />

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