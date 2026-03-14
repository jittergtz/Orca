import Hero from "@/components/Landing/Hero";
import TrustedBy from "@/components/Landing/TrustedBy";
import CarouselSection from "@/components/Landing/CarouselSection";

export default function Page() {
  return (
  <div className="flex min-h-screen p-4 flex-col mt-20 items-center ">
      <Hero/>
      <TrustedBy/>
      <CarouselSection />
  </div>
  )}