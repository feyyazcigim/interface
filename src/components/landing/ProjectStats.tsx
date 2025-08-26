import useIsMobile from "@/hooks/display/useIsMobile";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/Button";
import ContributorMessage from "./ContributorMessage";
import ContributorProfiles from "./ContributorProfiles";
import ImageCarousel from "./ImageCarousel";
import LandingVolume from "./LandingVolume";
import ProtocolUpgrades from "./ProtocolUpgrades";

type ActiveButton = "upgrades" | "contributors" | "years" | "volume" | null;

interface StatContentProps {
  activeButton: ActiveButton;
}

function StatContent({ activeButton }: StatContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);
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
        height: activeButton ? height : 0,
        opacity: activeButton ? 1 : 0,
        y: activeButton ? 0 : -20,
      }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
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
              <ProtocolUpgrades activeButton={activeButton} />
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
          className={`text-pinto-gray-5 text-2xl sm:text-4xl font-thin h-[3rem] sm:h-[4rem] cursor-pointer transition-all hover:animate-[pulse-glow_3s_ease-in-out_infinite] hover:shadow-[0_0_30px_rgba(25,25,25,0.6)] duration-300 ${getElementOpacity(activeButton === "upgrades")}`}
          onClick={() => setActiveButton(activeButton === "upgrades" ? null : "upgrades")}
          glow
          glowOnHover
          glowColor="rgba(156, 156, 156, 0.6)" // pinto-gray-4
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
    const isMobile = useIsMobile();
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
                initial={{ opacity: 0, y: isMobile ? -10 : 20 }}
                animate={{ opacity: 1, y: isMobile ? -30 : 0 }}
                exit={{ opacity: 0, y: isMobile ? -10 : 20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="absolute -left-[4.5rem] sm:left-24 -top-20"
              >
                <ContributorProfiles />
              </motion.div>
            )}
          </AnimatePresence>
          <Button
            variant="outline-rounded"
            className={`text-pinto-gray-5 text-2xl sm:text-4xl font-thin h-[3rem] sm:h-[4rem] cursor-pointer transition-all duration-300 ${getElementOpacity(activeButton === "contributors")}`}
            onClick={() => setActiveButton(activeButton === "contributors" ? null : "contributors")}
            glow
            glowOnHover
            glowColor="rgba(156, 156, 156, 0.6)" // pinto-gray-4
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
          5+
        </span>
        <Button
          variant={"outline-rounded"}
          className={`text-pinto-gray-5 text-2xl sm:text-4xl font-thin h-[3rem] sm:h-[4rem] cursor-pointer transition-all duration-300 ${getElementOpacity(activeButton === "years")}`}
          onClick={() => setActiveButton(activeButton === "years" ? null : "years")}
          glow
          glowOnHover
          glowColor="rgba(156, 156, 156, 0.6)" // pinto-gray-4
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
            $1b+
          </span>
        </span>
        <Button
          variant={"outline-rounded"}
          className={`text-pinto-gray-5 text-2xl sm:text-4xl font-thin h-[3rem] sm:h-[4rem] cursor-pointer transition-all duration-300 ${getElementOpacity(activeButton === "volume")}`}
          onClick={() => setActiveButton(activeButton === "volume" ? null : "volume")}
          glow
          glowOnHover
          glowColor="rgba(156, 156, 156, 0.6)" // pinto-gray-4
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
