import useIsMobile from "@/hooks/display/useIsMobile";
import clsx from "clsx";
import { useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { navLinks } from "../nav/nav/Navbar";
import { Button } from "../ui/Button";
import GameOfLife from "./GameOfLife";

const resourceCards = [
  {
    title: "Learn",
    description: "Learn more about the incentives that coordinate the farm.",
    pattern: "pufferfishCompanion",
    initialScale: 2.4,
    finalScale: 1.1,
    buttons: [
      {
        href: navLinks.docs,
        icon: "gitbook.png",
        label: "Docs",
      },
      {
        href: navLinks.blog,
        icon: "mirror.png",
        label: "Blog",
      },
    ],
  },
  {
    title: "Engage",
    description: "Ask questions, participate in discussion about protocol improvements and connect with other farmers.",
    pattern: "trafficCircle",
    initialScale: 1.5,
    finalScale: 1.5,
    buttons: [
      {
        href: navLinks.twitter,
        icon: "twitter.png",
        label: "@pintodotmoney",
      },
      {
        href: navLinks.discord,
        icon: "discord.png",
        label: "Discord",
      },
    ],
  },
  {
    title: "Participate",
    description: "Plant your own crops and join the movement.",
    pattern: "tenCell",
    initialScale: 6,
    finalScale: 1.1,
    buttons: [
      {
        href: navLinks.overview,
        label: "Dashboard",
      },
    ],
  },
];

const cardStyles = clsx(
  "border border-pinto-gray-2 rounded-[1.25rem] flex flex-col gap-2 sm:gap-8 overflow-clip bg-white",
  "w-[95%] flex-shrink-0 snap-center sm:w-full sm:max-w-[32rem] sm:flex-shrink sm:snap-align-none",
);
const buttonStyles = clsx(
  "w-full flex p-2 pr-3 sm:p-4 sm:pr-4 justify-center items-center gap-2.5 h-[3.125rem] text-sm font-normal",
);

export default function Resources() {
  const touchStartRef = useRef({ x: 0, y: 0 });
  const isScrollingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    isScrollingRef.current = false;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isScrollingRef.current) return;

    const deltaX = Math.abs(e.touches[0].clientX - touchStartRef.current.x);
    const deltaY = Math.abs(e.touches[0].clientY - touchStartRef.current.y);

    // Only act if there's significant movement
    if (deltaX > 20 || deltaY > 20) {
      isScrollingRef.current = true;

      // If vertical movement is dominant, pass the event to the parent
      if (deltaY > deltaX) {
        // Get the main scroll container
        const mainScrollContainer = document.querySelector('[data-scroll-container="true"]') as HTMLElement;
        if (mainScrollContainer) {
          const scrollDirection = e.touches[0].clientY > touchStartRef.current.y ? -1 : 1;
          const scrollAmount = deltaY * scrollDirection * 2;
          mainScrollContainer.scrollBy({ top: scrollAmount, behavior: "smooth" });
        }
      }
      // For horizontal movement, let the container handle it naturally
    }
  }, []);

  return (
    <div className="flex flex-col items-center self-stretch gap-8 sm:gap-12 max-sm:mt-16 mb-24 sm:mb-28">
      <h2 className="text-2xl sm:text-4xl leading-same-h2 font-light text-black">Resources</h2>
      <div
        ref={containerRef}
        className="flex flex-row w-full overflow-x-auto scrollbar-none snap-x snap-mandatory sm:flex-row sm:justify-center sm:overflow-x-visible sm:snap-none gap-2 lg:gap-8 max-2xl:px-4 sm:max-2xl:px-4"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        {resourceCards.map((card, index) => (
          <div key={index} className={cardStyles}>
            <div className="overflow-hidden relative h-[16rem] sm:h-[24rem] flex justify-center items-center">
              <div
                className={`flex transition-transform duration-1000 ease-in-out transform-gpu`}
                style={{
                  transform: `scale(${card.initialScale})`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = `scale(${card.finalScale})`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = `scale(${card.initialScale})`;
                }}
              >
                <GameOfLife startingPattern={card.pattern} />
              </div>
            </div>
            <div className="flex flex-col justify-between flex-1 gap-4 sm:gap-8 mx-4 mb-4 sm:mx-6 sm:mb-6">
              <div className="flex flex-col gap-4">
                <span className="text-[1.5rem] sm:text-[2rem] font-light text-black">{card.title}</span>
                <span className="text-[1rem] sm:text-[1.5rem] font-light text-pinto-gray-4 h-fit">
                  {card.description}
                </span>
              </div>
              <div className={`flex flex-col min-[1200px]:flex-row gap-4`}>
                {card.buttons.map((button, buttonIndex) => (
                  <Link key={buttonIndex} to={button.href} target="_blank" rel="noopener noreferrer" className="flex-1">
                    <Button variant="outline-white" className={buttonStyles}>
                      {button.icon && (
                        <img
                          src={button.icon}
                          className="w-6 h-6 min-w-6 min-h-6 sm:w-8 sm:h-8 sm:min-w-8 sm:min-h-8"
                          alt={button.label}
                        />
                      )}
                      <span className="w-full text-start">{button.label}</span>
                      <span>→</span>
                    </Button>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
