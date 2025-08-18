import wpBasin from "@/assets/landing/wp_basin.png";
import wpBean from "@/assets/landing/wp_bean.png";
import wpMultiflow from "@/assets/landing/wp_multiflow.png";
import wpPinto from "@/assets/landing/wp_pinto.png";
import wpPipeline from "@/assets/landing/wp_pipeline.png";
import useIsMobile from "@/hooks/display/useIsMobile";
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
  VISIBLE_ITEMS_DESKTOP: 5,
  VISIBLE_ITEMS_MOBILE: 3,
  ENTER_EXIT_OFFSET: 50,
} as const;

// Desktop position configurations
const POSITION_CONFIGS_DESKTOP: Variants = {
  leftmost: {
    scale: 0.6,
    opacity: 0,
    zIndex: 1,
    rotateY: 45,
    transformPerspective: 600,
    y: 50,
    maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 90%)",
  },
  left: {
    scale: 0.8,
    opacity: 0.5,
    zIndex: 2,
    rotateY: 25,
    transformPerspective: 600,
    y: 50,
    maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 90%)",
  },
  center: {
    scale: 1.25,
    opacity: 1,
    zIndex: 5,
    rotateY: 0,
    transformPerspective: 600,
    y: 100,
    maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 90%)",
  },
  right: {
    scale: 0.8,
    opacity: 0.5,
    zIndex: 2,
    rotateY: -25,
    transformPerspective: 600,
    y: 50,
    maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 90%)",
  },
  rightmost: {
    scale: 0.6,
    opacity: 0,
    zIndex: 1,
    rotateY: -45,
    transformPerspective: 600,
    y: 50,
    maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 90%)",
  },
};

// Mobile position configurations (3 items: left, center, right with large center)
const POSITION_CONFIGS_MOBILE: Variants = {
  left: {
    scale: 0.5,
    opacity: 0.6,
    zIndex: 2,
    rotateY: 30,
    transformPerspective: 800,
    y: 50,
    x: -50,
    maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 85%)",
  },
  center: {
    scale: 2.2,
    opacity: 1,
    zIndex: 5,
    rotateY: 0,
    transformPerspective: 800,
    y: 60,
    x: 0,
    maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 85%)",
  },
  right: {
    scale: 0.5,
    opacity: 0.6,
    zIndex: 2,
    rotateY: -30,
    transformPerspective: 800,
    y: 50,
    x: 50,
    maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 85%)",
  },
};

const wallpaperImages: CarouselItem[] = [
  { src: wpMultiflow, alt: "Multi Flow Pump Whitepaper", href: "https://basin.exchange/multi-flow-pump.pdf" },
  { src: wpBasin, alt: "Basin Whitepaper", href: "https://basin.exchange/basin.pdf" },
  { src: wpBean, alt: "Beanstalk Whitepaper", href: "https://bean.money/beanstalk.pdf" },
  { src: wpPinto, alt: "Pinto Whitepaper", href: "https://pinto.money/pinto.pdf" },
  { src: wpPipeline, alt: "Pipeline Whitepaper", href: "https://evmpipeline.org/pipeline.pdf" },
];

export default function ImageCarousel() {
  // Track which item should be in the center position
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const isMobile = useIsMobile();

  // Use mobile or desktop configurations
  const POSITION_CONFIGS = isMobile ? POSITION_CONFIGS_MOBILE : POSITION_CONFIGS_DESKTOP;
  const VISIBLE_ITEMS = isMobile ? CAROUSEL_CONFIG.VISIBLE_ITEMS_MOBILE : CAROUSEL_CONFIG.VISIBLE_ITEMS_DESKTOP;

  // Convert any activeIndex (including negatives) to valid array index (0 to length-1)
  // Formula handles negative numbers: (-2 % 5 + 5) % 5 = 3
  const indexInArrayScope = ((activeIndex % wallpaperImages.length) + wallpaperImages.length) % wallpaperImages.length;

  // Create infinite loop by doubling the array and slicing consecutive items
  // Desktop: 5 items (leftmost, left, center, right, rightmost)
  // Mobile: 3 items (left, center, right)
  const visibleItems = [...wallpaperImages, ...wallpaperImages].slice(
    isMobile ? indexInArrayScope : indexInArrayScope,
    isMobile ? indexInArrayScope + VISIBLE_ITEMS : indexInArrayScope + VISIBLE_ITEMS,
  );

  // Determine position based on mobile or desktop layout
  const getItemPosition = (item: CarouselItem): Position => {
    const index = visibleItems.indexOf(item);
    if (isMobile) {
      // Mobile: 3 items (left=0, center=1, right=2)
      const mobilePositions: Position[] = ["left", "center", "right"];
      return mobilePositions[index] || "center";
    } else {
      // Desktop: 5 items (leftmost=0, left=1, center=2, right=3, rightmost=4)
      return POSITIONS[index] || "center";
    }
  };

  // Handle click interactions: center item opens PDF, side items navigate carousel
  const handleClick = (item: CarouselItem): void => {
    const position = getItemPosition(item);
    // Click left side items to move carousel left (decrease activeIndex)
    if (position === "leftmost" || position === "left") {
      setActiveIndex((prevIndex) => prevIndex - 1);
      // Click right side items to move carousel right (increase activeIndex)
    } else if (position === "rightmost" || position === "right") {
      setActiveIndex((prevIndex) => prevIndex + 1);
    }
    // Center item clicks are handled by the <a> tag href (opens PDF)
  };

  return (
    <div className="flex flex-col items-center sm:w-[133%] place-self-center">
      <div className="flex">
        {/* AnimatePresence handles smooth enter/exit animations when items change positions */}
        <AnimatePresence mode="popLayout" initial={false}>
          {visibleItems.map((item) => {
            const position = getItemPosition(item);
            const isCenter = position === "center";

            return (
              <a
                // Only center item is clickable link to PDF
                href={isCenter ? item.href : undefined}
                target={isCenter ? "_blank" : undefined}
                rel={isCenter ? "noopener noreferrer" : undefined}
                key={item.alt}
                className="block"
                onClick={
                  // Side items navigate carousel instead of opening link
                  !isCenter
                    ? (e) => {
                        e.preventDefault(); // Prevent link navigation
                        handleClick(item); // Trigger carousel navigation
                      }
                    : undefined
                }
              >
                {/* Animated image with position-based transformations */}
                <motion.img
                  className="w-full mx-auto border-t border-x rounded-md"
                  src={item.src}
                  alt={item.alt}
                  layout
                  variants={POSITION_CONFIGS} // Use predefined position animations
                  animate={position} // Animate to current position
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
