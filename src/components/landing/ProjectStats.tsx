import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
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
  return (
    <motion.div
      animate={{
        opacity: activeButton ? 1 : 0,
        y: activeButton ? 0 : -20,
        height: activeButton ? "auto" : 0,
      }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
    >
      <AnimatePresence mode="popLayout">
        {activeButton && (
          <motion.div
            key={activeButton}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {activeButton === "upgrades" && <ProtocolUpgrades activeButton={activeButton} />}
            {activeButton === "years" && <ImageCarousel />}
            {activeButton === "volume" && <LandingVolume />}
            {activeButton === "contributors" && <ContributorMessage />}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ProjectStats() {
  const [activeButton, setActiveButton] = useState<ActiveButton>(null);

  const getElementOpacity = (isActive: boolean) => {
    if (activeButton === null) return "opacity-100";
    return isActive ? "opacity-100" : "opacity-50";
  };

  return (
    <motion.div
      className="flex flex-col items-center mx-auto my-auto text-4xl font-thin text-pinto-gray-4 transform-gpu transition-all relative"
      transition={{ duration: 0.4, ease: "easeInOut" }}
    >
      <span className="flex flex-row gap-6 items-center">
        <span
          className={`text-[4rem] leading-[1.4] text-black transition-opacity duration-300 ${getElementOpacity(activeButton === "upgrades")}`}
        >
          89
        </span>
        <Button
          variant="outline-rounded"
          className={`text-pinto-gray-5 text-4xl font-thin h-[4rem] cursor-pointer hover:bg-gray-50 transition-opacity duration-300 ${getElementOpacity(activeButton === "upgrades")}`}
          onClick={() => setActiveButton(activeButton === "upgrades" ? null : "upgrades")}
        >
          🔨 protocol upgrades
        </Button>
        <span className={`transition-opacity duration-300 ${getElementOpacity(false)}`}>from</span>
        <span
          className={`text-[4rem] leading-[1.4] text-black transition-opacity duration-300 ${getElementOpacity(activeButton === "contributors")}`}
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
                className="absolute left-24 -top-20"
              >
                <ContributorProfiles />
              </motion.div>
            )}
          </AnimatePresence>
          <Button
            variant="outline-rounded"
            className={`text-pinto-gray-5 text-4xl font-thin h-[4rem] cursor-pointer hover:bg-gray-50 transition-opacity duration-300 ${getElementOpacity(activeButton === "contributors")}`}
            onClick={() => setActiveButton(activeButton === "contributors" ? null : "contributors")}
          >
            🧑‍🌾 contributors
          </Button>
        </span>
        <span className={`transition-opacity duration-300 ${getElementOpacity(false)}`}>over</span>
      </span>
      <span className="flex flex-row gap-6 items-center">
        <span
          className={`text-[4rem] leading-[1.4] text-black transition-opacity duration-300 ${getElementOpacity(activeButton === "years")}`}
        >
          5+
        </span>
        <Button
          variant="outline-rounded"
          className={`text-pinto-gray-5 text-4xl font-thin h-[4rem] cursor-pointer hover:bg-gray-50 transition-opacity duration-300 ${getElementOpacity(activeButton === "years")}`}
          onClick={() => setActiveButton(activeButton === "years" ? null : "years")}
        >
          📝 years
        </Button>
        <span className={`transition-opacity duration-300 ${getElementOpacity(false)}`}>to facilitate</span>
        <span
          className={`text-[4rem] leading-[1.4] text-black transition-opacity duration-300 ${getElementOpacity(activeButton === "volume")}`}
        >
          $1b+
        </span>
        <Button
          variant="outline-rounded"
          className={`text-pinto-gray-5 text-4xl font-thin h-[4rem] cursor-pointer hover:bg-gray-50 transition-opacity duration-300 ${getElementOpacity(activeButton === "volume")}`}
          onClick={() => setActiveButton(activeButton === "volume" ? null : "volume")}
        >
          📈 in cumulative volume
        </Button>
      </span>
      <StatContent activeButton={activeButton} />
    </motion.div>
  );
}
