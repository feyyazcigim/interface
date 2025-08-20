import wpBasin from "@/assets/landing/wp_basin.png";
import wpBean from "@/assets/landing/wp_bean.png";
import wpMultiflow from "@/assets/landing/wp_multiflow.png";
import wpPinto from "@/assets/landing/wp_pinto.png";
import wpPipeline from "@/assets/landing/wp_pipeline.png";
import { AnimatePresence, Variants, motion } from "framer-motion";
import { useCallback, useRef, useState } from "react";

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

// Position configurations
const POSITION_CONFIGS: Variants = {
  leftmost: {
    scale: 0.6,
    opacity: 0,
    zIndex: 1,
    y: 50,
    maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 90%)",
  },
  left: {
    scale: 0.8,
    opacity: 0.5,
    zIndex: 2,
    y: 50,
    maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 90%)",
  },
  center: {
    scale: 1.25,
    opacity: 1,
    zIndex: 5,
    y: 100,
    maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 90%)",
  },
  right: {
    scale: 0.8,
    opacity: 0.5,
    zIndex: 2,
    y: 50,
    maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 90%)",
  },
  rightmost: {
    scale: 0.6,
    opacity: 0,
    zIndex: 1,
    y: 50,
    maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 90%)",
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

  // Touch/swipe state
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  // Throttle for scroll events
  const scrollThrottle = useRef<boolean>(false);

  const VISIBLE_ITEMS = CAROUSEL_CONFIG.VISIBLE_ITEMS;

  // Convert any activeIndex (including negatives) to valid array index (0 to length-1)
  // Formula handles negative numbers: (-2 % 5 + 5) % 5 = 3
  const indexInArrayScope = ((activeIndex % wallpaperImages.length) + wallpaperImages.length) % wallpaperImages.length;

  // Create infinite loop by doubling the array and slicing consecutive items
  // 5 items (leftmost, left, center, right, rightmost)
  const visibleItems = [...wallpaperImages, ...wallpaperImages].slice(
    indexInArrayScope,
    indexInArrayScope + VISIBLE_ITEMS,
  );

  // Determine position for desktop layout
  const getItemPosition = (item: CarouselItem): Position => {
    const index = visibleItems.indexOf(item);
    // 5 items (leftmost=0, left=1, center=2, right=3, rightmost=4)
    return POSITIONS[index] || "center";
  };

  // Navigation functions
  const navigateLeft = useCallback(() => {
    setActiveIndex((prevIndex) => prevIndex - 1);
  }, []);

  const navigateRight = useCallback(() => {
    setActiveIndex((prevIndex) => prevIndex + 1);
  }, []);

  // Handle click interactions: center item opens PDF, side items navigate carousel
  const handleClick = (item: CarouselItem): void => {
    const position = getItemPosition(item);
    // Click left side items to move carousel left (decrease activeIndex)
    if (position === "leftmost" || position === "left") {
      navigateLeft();
      // Click right side items to move carousel right (increase activeIndex)
    } else if (position === "rightmost" || position === "right") {
      navigateRight();
    }
    // Center item clicks are handled by the <a> tag href (opens PDF)
  };

  // Handle wheel scroll
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (scrollThrottle.current) return;

      scrollThrottle.current = true;
      setTimeout(() => {
        scrollThrottle.current = false;
      }, 300);

      if (e.deltaY > 0) {
        navigateRight();
      } else {
        navigateLeft();
      }
    },
    [navigateLeft, navigateRight],
  );

  // Handle touch start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].screenX;
  }, []);

  // Handle touch end
  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      touchEndX.current = e.changedTouches[0].screenX;

      const swipeThreshold = 50;
      const swipeDistance = touchStartX.current - touchEndX.current;

      if (Math.abs(swipeDistance) > swipeThreshold) {
        if (swipeDistance > 0) {
          navigateRight(); // Swipe left -> go right
        } else {
          navigateLeft(); // Swipe right -> go left
        }
      }
    },
    [navigateLeft, navigateRight],
  );

  return (
    <div
      className="flex gap-4 flex-shrink-0 min-w-[1920px] sm:w-[1920px] justify-center overflow-x-clip"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
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
                className="w-[15rem] min-[400px]:w-[16rem] min-[500px]:w-[20rem] sm:w-[24rem] border-t border-x rounded-md"
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
  );
}
