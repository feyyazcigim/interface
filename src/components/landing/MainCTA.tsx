import PintoLogo from "@/assets/protocol/PintoLogo.svg";
import PintoLogoText from "@/assets/protocol/PintoLogoText.svg";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { navLinks } from "../nav/nav/Navbar";
import { Button } from "../ui/Button";

export default function MainCTA() {
  const revealAnimation = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 self-stretch items-center">
        <motion.h2
          className="text-[4rem] leading-[1.1] font-thin text-black"
          transition={{ duration: 0.5, ease: "easeInOut", delay: 1 }}
          {...revealAnimation}
        >
          <div className="flex flex-row gap-4 items-center">
            <img src={PintoLogo} alt="Pinto Logo" className="h-20" />
            <img src={PintoLogoText} alt="Pinto Logo" className="h-20" />
          </div>
        </motion.h2>
        <motion.span
          className="text-2xl leading-[1.4] font-thin text-pinto-gray-4"
          transition={{ duration: 0.5, ease: "easeInOut", delay: 1.25 }}
          {...revealAnimation}
        >
          An Algorithmic Stablecoin Balanced by Farmers like you.
        </motion.span>
      </div>
      <motion.div
        className="flex flex-row gap-4 mx-auto"
        transition={{ duration: 0.5, ease: "easeInOut", delay: 1.5 }}
        {...revealAnimation}
      >
        <Link to={navLinks.overview}>
          <Button rounded="full">Come Seed the Trustless Economy →</Button>
        </Link>
        <Link to={navLinks.docs} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" rounded="full" className="shadow-none text-pinto-gray-4">
            Read the Docs
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
