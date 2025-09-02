import useIsMobile from "@/hooks/display/useIsMobile";
import { AnimatePresence, motion } from "framer-motion";
import { atom, useAtom } from "jotai";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/Button";
import ContributorMessage from "./ContributorMessage";
import ContributorProfiles from "./ContributorProfiles";
import ImageCarousel from "./ImageCarousel";
import LandingVolume from "./LandingVolume";
import ProtocolUpgrades from "./ProtocolUpgrades";

type ActiveButton = "upgrades" | "contributors" | "years" | "volume" | null;

// Create isAutoCycling atom
export const isAutoCyclingAtom = atom(true);

interface StatContentProps {
  activeButton: ActiveButton;
}

function StatContent({ activeButton }: StatContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [height, setHeight] = useState<number>(0);

  useEffect(() => {
    if (contentRef.current) {
      const resizeObserver = new ResizeObserver(() => {
        if (contentRef.current) {
          setHeight(contentRef.current.scrollHeight);
        }
      });

      resizeObserver.observe(contentRef.current);
      setHeight(contentRef.current.scrollHeight);

      return () => resizeObserver.disconnect();
    }
  }, [activeButton]);

  return (
    <motion.div
      animate={{
        height: activeButton ? (isMobile ? 300 : 400) : 0,
        opacity: activeButton ? 1 : 0,
        y: activeButton ? 0 : -20,
      }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="flex items-center"
    >
      <div ref={contentRef}>
        <AnimatePresence mode="wait" initial={false}>
          {activeButton === "upgrades" && (
            <motion.div
              key="upgrades"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <ProtocolUpgrades />
            </motion.div>
          )}
          {activeButton === "years" && (
            <motion.div
              key="years"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <ImageCarousel />
            </motion.div>
          )}
          {activeButton === "volume" && (
            <motion.div
              key="volume"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <LandingVolume />
            </motion.div>
          )}
          {activeButton === "contributors" && (
            <motion.div
              key="contributors"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <ContributorMessage />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function ProjectStats() {
  const [activeButton, setActiveButton] = useState<ActiveButton>(null);
  const [isAutoCycling, setIsAutoCycling] = useAtom(isAutoCyclingAtom);
  const [manuallySelected, setManuallySelected] = useState(false);

  // Array of buttons to cycle through
  const buttons: ActiveButton[] = ["upgrades", "contributors", "years", "volume"];

  // Auto-cycling effect
  useEffect(() => {
    if (!isAutoCycling || manuallySelected) return;

    const interval = setInterval(() => {
      setActiveButton((current) => {
        if (current === null) {
          return buttons[0];
        }
        const currentIndex = buttons.indexOf(current);
        const nextIndex = (currentIndex + 1) % buttons.length;
        return buttons[nextIndex];
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoCycling, manuallySelected]);

  // Handle manual button selection
  const handleButtonClick = (buttonType: ActiveButton) => {
    setManuallySelected(true);
    setIsAutoCycling(false);
    setActiveButton(buttonType);
  };

  const handleProfileSelection = () => {
    setManuallySelected(true);
    setIsAutoCycling(false);
  };

  const getElementOpacity = (isActive: boolean) => {
    if (activeButton === null) return "opacity-100";
    return isActive ? "opacity-100" : "opacity-50";
  };

  function Upgrades() {
    return (
      <span className="flex flex-row gap-3 sm:gap-6 items-center">
        <span
          className={`text-[2rem] sm:text-[4rem] leading-[1.4] text-black transition-all duration-300 ${getElementOpacity(activeButton === "upgrades")}`}
        >
          89
        </span>
        <Button
          variant={"outline-rounded"}
          className={`text-pinto-gray-5 text-2xl sm:text-4xl font-thin h-[3rem] sm:h-[4rem] cursor-pointer transition-all duration-300 ${getElementOpacity(activeButton === "upgrades")}`}
          onClick={() => handleButtonClick("upgrades")}
          glow={activeButton === "upgrades"}
          shimmer={!activeButton || activeButton === "upgrades"}
          shimmerColor="rgba(156, 156, 156, 0.2)" // pinto-gray-4
          glowColor="rgba(156, 156, 156, 0.5)" // pinto-gray-4
        >
          <span className="flex items-center gap-2">
            <img src="/hammer.png" alt="hammer" className="w-6 h-6 sm:w-8 sm:h-8" />
            protocol upgrades
          </span>
        </Button>
      </span>
    );
  }

  function Contributors() {
    return (
      <span className="flex flex-row gap-3 sm:gap-6 items-center">
        <span className={`transition-all duration-300 ${getElementOpacity(false)}`}>from</span>
        <span
          className={`text-[2rem] sm:text-[4rem] leading-[1.4] text-black transition-all duration-300 ${getElementOpacity(activeButton === "contributors")}`}
        >
          51
        </span>
        {/* Contributors floating above the button */}
        <span className="relative">
          <AnimatePresence>
            {activeButton === "contributors" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="absolute -left-[4.5rem] sm:left-24 sm:-top-20 -top-40"
                onClick={() => handleProfileSelection()}
              >
                <ContributorProfiles />
              </motion.div>
            )}
          </AnimatePresence>
          <Button
            variant="outline-rounded"
            className={`text-pinto-gray-5 text-2xl sm:text-4xl font-thin h-[3rem] sm:h-[4rem] cursor-pointer transition-all duration-300 ${getElementOpacity(activeButton === "contributors")}`}
            onClick={() => handleButtonClick("contributors")}
            glow={activeButton === "contributors"}
            shimmer={!activeButton || activeButton === "contributors"}
            shimmerColor="rgba(156, 156, 156, 0.2)" // pinto-gray-4
            glowColor="rgba(156, 156, 156, 0.5)" // pinto-gray-4
          >
            <span className="flex items-center gap-2">
              <img src="/farmer_1.png" alt="farmer" className="w-6 h-6 sm:w-8 sm:h-8" />
              contributors
            </span>
          </Button>
        </span>
        <span className={`transition-all duration-300 ${getElementOpacity(false)} max-sm:hidden`}>over</span>
      </span>
    );
  }

  function Years() {
    return (
      <span className="flex flex-row gap-3 sm:gap-6 items-center">
        <span className={`transition-all duration-300 ${getElementOpacity(false)} sm:hidden`}>over</span>
        <span
          className={`text-[2rem] sm:text-[4rem] leading-[1.4] text-black transition-all duration-300 ${getElementOpacity(activeButton === "years")}`}
        >
          4+
        </span>
        <Button
          variant={"outline-rounded"}
          className={`text-pinto-gray-5 text-2xl sm:text-4xl font-thin h-[3rem] sm:h-[4rem] cursor-pointer transition-all duration-300 ${getElementOpacity(activeButton === "years")}`}
          onClick={() => handleButtonClick("years")}
          glow={activeButton === "years"}
          shimmer={!activeButton || activeButton === "years"}
          shimmerColor="rgba(156, 156, 156, 0.2)" // pinto-gray-4
          glowColor="rgba(156, 156, 156, 0.5)" // pinto-gray-4
        >
          <span className="flex items-center gap-2">
            <img src="/memo.png" alt="memo" className="w-6 h-6 sm:w-8 sm:h-8" />
            years
          </span>
        </Button>
      </span>
    );
  }

  function Volume() {
    return (
      <span className="flex flex-col sm:flex-row gap-3 sm:gap-6 items-center">
        <span className="flex flex-row gap-3 sm:gap-6 items-center">
          <span className={`transition-all duration-300 whitespace-nowrap ${getElementOpacity(false)}`}>
            to facilitate
          </span>
          <span
            className={`text-[2rem] sm:text-[4rem] leading-[1.4] text-black transition-all duration-300 ${getElementOpacity(activeButton === "volume")}`}
          >
            $1B+
          </span>
        </span>
        <Button
          variant={"outline-rounded"}
          className={`text-pinto-gray-5 text-2xl sm:text-4xl font-thin h-[3rem] sm:h-[4rem] cursor-pointer transition-all duration-300 ${getElementOpacity(activeButton === "volume")}`}
          onClick={() => handleButtonClick("volume")}
          glow={activeButton === "volume"}
          shimmer={!activeButton || activeButton === "volume"}
          shimmerColor="rgba(156, 156, 156, 0.2)" // pinto-gray-4
          glowColor="rgba(156, 156, 156, 0.5)" // pinto-gray-4
        >
          <span className="flex items-center gap-2">
            <img src="/chart-increasing.png" alt="chart" className="w-6 h-6 sm:w-8 sm:h-8" />
            in cumulative volume
          </span>
        </Button>
      </span>
    );
  }

  return (
    <div>
      <motion.div
        className="flex flex-col max-sm:gap-3 max-[850px]:scale-90 items-center sm:mx-auto sm:my-auto text-2xl sm:text-4xl font-thin text-pinto-gray-4 transform-gpu transition-all relative"
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        <span className="flex flex-col sm:flex-row gap-3 sm:gap-6 items-center">
          <Upgrades />
          <Contributors />
        </span>
        <span className="flex flex-col sm:flex-row gap-3 sm:gap-6 items-center">
          <Years />
          <Volume />
        </span>
        <StatContent activeButton={activeButton} />
      </motion.div>
    </div>
  );
}
