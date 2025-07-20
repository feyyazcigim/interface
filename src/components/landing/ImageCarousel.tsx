import { AnimatePresence, Variants, motion } from "framer-motion";
import { useState } from "react";

interface CarouselItem {
  src: string;
  alt: string;
  href: string;
}

const POSITIONS = ["leftmost", "left", "center", "right", "rightmost"] as const;
type Position = (typeof POSITIONS)[number];

// Configuration constants
const CAROUSEL_CONFIG = {
  VISIBLE_ITEMS: 5,
  ENTER_EXIT_OFFSET: 50,
} as const;

const POSITION_CONFIGS: Variants = {
  leftmost: {
    scale: 0.6,
    opacity: 0,
    zIndex: 1,
    rotateY: 45,
    transformPerspective: 600,
    y: 50,
    maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 90%)",
    WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 90%)",
  },
  left: {
    scale: 0.8,
    opacity: 0.5,
    zIndex: 2,
    rotateY: 25,
    transformPerspective: 600,
    y: 50,
    maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 90%)",
    WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 90%)",
  },
  center: {
    scale: 1.25,
    opacity: 1,
    zIndex: 5,
    rotateY: 0,
    transformPerspective: 600,
    y: 100,
    maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 90%)",
    WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 90%)",
  },
  right: {
    scale: 0.8,
    opacity: 0.5,
    zIndex: 2,
    rotateY: -25,
    transformPerspective: 600,
    y: 50,
    maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 90%)",
    WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 90%)",
  },
  rightmost: {
    scale: 0.6,
    opacity: 0,
    zIndex: 1,
    rotateY: -45,
    transformPerspective: 600,
    y: 50,
    maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 90%)",
    WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 90%)",
  },
};

const wallpaperImages: CarouselItem[] = [
  { src: "/wp_multiflow.png", alt: "Multi Flow Pump Whitepaper", href: "https://basin.exchange/multi-flow-pump.pdf" },
  { src: "/wp_basin.png", alt: "Basin Whitepaper", href: "https://basin.exchange/basin.pdf" },
  { src: "/wp_bean.png", alt: "Beanstalk Whitepaper", href: "https://bean.money/beanstalk.pdf" },
  { src: "/wp_pinto.png", alt: "Pinto Whitepaper", href: "https://pinto.money/pinto.pdf" },
  { src: "/wp_pipeline.png", alt: "Pipeline Whitepaper", href: "https://evmpipeline.org/pipeline.pdf" },
];

export default function ImageCarousel() {
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const indexInArrayScope = ((activeIndex % wallpaperImages.length) + wallpaperImages.length) % wallpaperImages.length;

  const visibleItems = [...wallpaperImages, ...wallpaperImages].slice(
    indexInArrayScope,
    indexInArrayScope + CAROUSEL_CONFIG.VISIBLE_ITEMS,
  );

  const getItemPosition = (item: CarouselItem): Position => {
    const index = visibleItems.indexOf(item);
    return POSITIONS[index] || "center";
  };

  const handleClick = (item: CarouselItem): void => {
    const position = getItemPosition(item);
    if (position === "leftmost" || position === "left") {
      setActiveIndex((prevIndex) => prevIndex - 1);
    } else if (position === "rightmost" || position === "right") {
      setActiveIndex((prevIndex) => prevIndex + 1);
    }
  };

  return (
    <div className="flex flex-col items-center w-[133%] place-self-center">
      <div className="flex">
        <AnimatePresence mode="popLayout" initial={false}>
          {visibleItems.map((item) => {
            const position = getItemPosition(item);
            const isCenter = position === "center";

            return (
              <a
                href={isCenter ? item.href : undefined}
                target={isCenter ? "_blank" : undefined}
                rel={isCenter ? "noopener noreferrer" : undefined}
                key={item.alt}
                className="block"
                onClick={
                  !isCenter
                    ? (e) => {
                        e.preventDefault();
                        handleClick(item);
                      }
                    : undefined
                }
              >
                <motion.img
                  className="w-full mx-auto border-t border-x rounded-md"
                  src={item.src}
                  alt={item.alt}
                  layout
                  variants={POSITION_CONFIGS}
                  animate={position}
                  transition={{ type: "spring", stiffness: 100, damping: 20 }}
                />
              </a>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
