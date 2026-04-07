'use client'

import { Gallery, type GalleryItem } from "@/components/ui/gallery";

// Professional kitchen utensils product catalog
const kitchenUtensilsItems: GalleryItem[] = [
  {
    id: 1,
    image:
      "https://kitchen-utensils.s3.ap-southeast-1.amazonaws.com/thumbnail_7_N5_A3501_126cb7b45c.jpg?updatedAt=2025-12-01T14%3A11%3A02.949Z",
    title: "1",
    alt: "1",
  },
  {
    id: 2,
    image:
      "https://kitchen-utensils.s3.ap-southeast-1.amazonaws.com/thumbnail_Conveyor_Toaster_db79a17b10.jpg?updatedAt=2025-12-01T14%3A10%3A54.700Z",
    title: "2",
    alt: "2",
  },
  {
    id: 3,
    image:
      "https://kitchen-utensils.s3.ap-southeast-1.amazonaws.com/thumbnail_Waffle_Maker_671f56fecc.jpg?updatedAt=2025-12-01T14%3A10%3A44.902Z",
    title: "3",
    alt: "3",
  },
  {
    id: 4,
    image:
      "https://kitchen-utensils.s3.ap-southeast-1.amazonaws.com/thumbnail_Slice_Toaster_3a68b7c746.jpg?updatedAt=2025-12-01T14%3A10%3A31.937Z",
    title: "4",
    alt: "4",
  },
  {
    id: 5,
    image:
      "https://kitchen-utensils.s3.ap-southeast-1.amazonaws.com/thumbnail_Robertshaw_ecdcca4c7b.jpg?updatedAt=2025-12-01T14%3A10%3A28.092Z",
    title: "5",
    alt: "5",
  },
  {
    id: 6,
    image:
      "https://kitchen-utensils.s3.ap-southeast-1.amazonaws.com/thumbnail_Robertshaw_ecdcca4c7b.jpg?updatedAt=2025-12-01T14%3A10%3A28.092Z",
    title: "5",
    alt: "5",
  },
  {
    id: 7,
    image:
      "https://kitchen-utensils.s3.ap-southeast-1.amazonaws.com/thumbnail_Slice_Toaster_3a68b7c746.jpg?updatedAt=2025-12-01T14%3A10%3A31.937Z",
    title: "4",
    alt: "4",
  },
  {
    id: 8,
    image:
      "https://kitchen-utensils.s3.ap-southeast-1.amazonaws.com/thumbnail_Waffle_Maker_671f56fecc.jpg?updatedAt=2025-12-01T14%3A10%3A44.902Z",
    title: "3",
    alt: "3",
  },
  {
    id: 9,
    image:
      "https://kitchen-utensils.s3.ap-southeast-1.amazonaws.com/thumbnail_Conveyor_Toaster_db79a17b10.jpg?updatedAt=2025-12-01T14%3A10%3A54.700Z",
    title: "2",
    alt: "2",
  },
  {
    id: 10,
    image:
      "https://kitchen-utensils.s3.ap-southeast-1.amazonaws.com/thumbnail_7_N5_A3501_126cb7b45c.jpg?updatedAt=2025-12-01T14%3A11%3A02.949Z",
    title: "1",
    alt: "1",
  },
];

const GalleryBlock = () => {
  return (
    <section className="w-full py-8 sm:py-12 md:py-16 lg:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-3 sm:mb-4">
            Product Catalog
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg md:text-xl max-w-2xl mx-auto px-4">
            Comprehensive range of professional-grade kitchen utensils available
            for bulk orders, custom branding, and wholesale distribution
          </p>
        </div>
        <Gallery
          items={kitchenUtensilsItems}
          speed={40}
          gap="0.75rem"
          itemWidth="240px"
          itemHeight="180px"
          className="max-w-7xl mx-auto [--item-width:240px] [--item-height:180px] sm:[--item-width:260px] sm:[--item-height:195px] md:[--item-width:280px] md:[--item-height:200px] lg:[--item-width:300px] lg:[--item-height:225px] [--gap:0.75rem] sm:[--gap:1rem] md:[--gap:1.25rem] lg:[--gap:1.5rem]"
        />
      </div>
    </section>
  );
};

export default GalleryBlock;
