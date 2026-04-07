'use client'

import * as React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

const Hero = () => {
  const autoplayPlugin = React.useMemo(
    () =>
      Autoplay({
        delay: 3000,
        stopOnInteraction: false,
        stopOnMouseEnter: false,
        stopOnFocusIn: false,
      }),
    []
  );

  const carouselImages = [
    {
      id: 1,
      url: "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=1200&h=800&fit=crop",
      alt: "Kitchen utensils display 1",
    },
    {
      id: 2,
      url: "https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=1200&h=800&fit=crop",
      alt: "Kitchen utensils display 2",
    },
    {
      id: 3,
      url: "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=1200&h=800&fit=crop",
      alt: "Kitchen utensils display 3",
    },
    {
      id: 4,
      url: "https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=1200&h=800&fit=crop",
      alt: "Kitchen utensils display 4",
    },
  ];

  return (
    <section className="relative min-h-[60vh] sm:min-h-[70vh] md:min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Carousel */}
      <Carousel
        opts={{
          loop: true,
          align: "center",
          skipSnaps: false,
          dragFree: false,
        }}
        plugins={[autoplayPlugin]}
        className="w-full h-full absolute inset-0"
      >
        <CarouselContent>
          {carouselImages.map((image) => (
            <CarouselItem key={image.id}>
              <div className="relative h-[60vh] sm:h-[70vh] md:h-screen w-full">
                {/* Overlay for better text readability */}
                <div className="absolute inset-0 bg-black/40 z-10" />
                <img
                  src={image.url}
                  alt={image.alt}
                  className="w-full h-full object-cover"
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-2 sm:left-4 md:left-6 lg:left-8 z-30 h-10 w-10 md:h-11 md:w-11 lg:h-12 lg:w-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm border-white/20 text-white" />
        <CarouselNext className="right-2 sm:right-4 md:right-6 lg:right-8 z-30 h-10 w-10 md:h-11 md:w-11 lg:h-12 lg:w-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm border-white/20 text-white" />
      </Carousel>

      {/* Content Overlay */}
      <div className="relative z-20 mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 text-center">
        <div className="space-y-2 sm:space-y-4 md:space-y-6 lg:space-y-8">
          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-white text-balance px-1 sm:px-4 md:px-6">
            Premium Manufacturing
            <br />
            <span className="bg-linear-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Reliable Supply Partner
            </span>
          </h1>

          {/* Description */}
          <p className="mx-auto max-w-2xl text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 text-balance px-4 sm:px-6 md:px-8">
            Professional-grade kitchen utensils manufactured to exacting
            standards. Trusted by restaurants, hotels, and retailers worldwide.
            Customizable solutions with flexible MOQ and competitive pricing for
            your business.
          </p>

          {/* Features */}
          <div className="pt-4 sm:pt-8 md:pt-12 lg:pt-20 grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 lg:gap-10 px-2 sm:px-4 md:px-6 lg:px-8">
            <div className="flex flex-col items-center">
              <div className="rounded-full bg-white/10 backdrop-blur-sm p-2 sm:p-3 md:p-4 lg:p-5 mb-1 sm:mb-2 border border-white/20">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-white font-semibold text-xs sm:text-sm md:text-base lg:text-xl mb-0.5 sm:mb-1">
                Bulk Orders
              </h3>
              <p className="text-white/80 text-[10px] sm:text-xs md:text-sm lg:text-base text-center max-w-[90px] sm:max-w-[150px] md:max-w-[200px] lg:max-w-[250px] leading-tight">
                Flexible MOQ and volume pricing
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="rounded-full bg-white/10 backdrop-blur-sm p-2 sm:p-3 md:p-4 lg:p-5 mb-1 sm:mb-2 border border-white/20">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-white font-semibold text-xs sm:text-sm md:text-base lg:text-xl mb-0.5 sm:mb-1">
                Custom Solutions
              </h3>
              <p className="text-white/80 text-[10px] sm:text-xs md:text-sm lg:text-base text-center max-w-[90px] sm:max-w-[150px] md:max-w-[200px] lg:max-w-[250px] leading-tight">
                OEM/ODM capabilities available
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="rounded-full bg-white/10 backdrop-blur-sm p-2 sm:p-3 md:p-4 lg:p-5 mb-1 sm:mb-2 border border-white/20">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                  />
                </svg>
              </div>
              <h3 className="text-white font-semibold text-xs sm:text-sm md:text-base lg:text-xl mb-0.5 sm:mb-1">
                Quality Assurance
              </h3>
              <p className="text-white/80 text-[10px] sm:text-xs md:text-sm lg:text-base text-center max-w-[90px] sm:max-w-[150px] md:max-w-[200px] lg:max-w-[250px] leading-tight">
                Consistent quality, reliable supply
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-linear-to-t from-background to-transparent z-10" />
    </section>
  );
};

export default Hero;
