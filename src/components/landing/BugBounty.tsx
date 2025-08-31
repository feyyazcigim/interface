import ImmunefiLogo from "@/assets/misc/immunefi-logo.png";
import PintoTokenLogo from "@/assets/tokens/PINTO.png";
import useIsMobile from "@/hooks/display/useIsMobile";
import NumberFlow from "@number-flow/react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { PintoRightArrow } from "../Icons";
import { Button } from "../ui/Button";

export default function BugBounty() {
  const [value, setValue] = useState(0o7);
  const componentRef = useRef(null);
  const valueChanged = useRef(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Create Intersection Observer to detect when component is visible
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Check if component is intersecting (visible) and animation hasn't started yet
        if (entry.isIntersecting && !valueChanged.current) {
          // Mark animation as started to prevent repeating
          valueChanged.current = true;

          setValue(1200000);
        }
      },
      {
        root: null, // Use viewport as root
        threshold: 0.1, // Trigger when at least 10% of component is visible
      },
    );

    if (componentRef.current) {
      observer.observe(componentRef.current);
    }

    return () => {
      if (componentRef.current) {
        observer.unobserve(componentRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center sm:mx-auto sm:my-auto">
      <div className="flex flex-row gap-2 sm:gap-8 items-center" ref={componentRef}>
        <img src={PintoTokenLogo} alt={"Pinto Token Icon"} className="h-12 w-12 sm:w-32 sm:h-32" />
        <NumberFlow
          value={value}
          respectMotionPreference={false}
          trend={+1}
          format={{ style: "decimal", minimumFractionDigits: 2, maximumFractionDigits: 2, trailingZeroDisplay: "auto" }}
          className="text-black font-thin text-[3rem] sm:text-[8rem]"
        />
      </div>
      <div className="pinto-body sm:pinto-h2 font-light pt-3 sm:pt-6 flex flex-row gap-2 sm:gap-4 items-center">
        <span>Bug Bounty through</span>
        <img src={ImmunefiLogo} alt={"ImmuneFi"} className="h-6 sm:h-12" />
      </div>
      <div className="flex flex-row gap-2 sm:gap-4 pt-6 sm:pt-9">
        <Link to={"https://immunefi.com/bug-bounty/pinto/information/"} target="_blank" rel="noopener noreferrer">
          <Button
            variant="outline"
            size={isMobile ? "md" : "default"}
            rounded="full"
            className="shadow-none text-pinto-gray-4"
          >
            Read about the Bug Bounty Program
          </Button>
        </Link>
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-center px-4 py-2 w-full font-light text-base sm:text-2xl mt-[2rem] sm:mt-[4.5rem]">
        <div className="text-pinto-gray-4">{`25 audits to date`}</div>
        <Link
          to={"https://docs.pinto.money/resources/audits"}
          target="_blank"
          rel="noopener noreferrer"
          className="text-pinto-green-4 flex flex-row gap-2 items-center hover:underline"
        >
          <span>Learn More about Audits</span>
          <PintoRightArrow width={"1rem"} height={"1rem"} color="currentColor" />
        </Link>
      </div>
    </div>
  );
}
