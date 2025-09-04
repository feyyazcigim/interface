import HypernativeLogo from "@/assets/misc/hypernative-logo.png";
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
    <div className="flex flex-col gap-0 sm:gap-4">
      <div className="flex flex-col items-center sm:mx-auto sm:my-auto px-4 sm:px-8 max-w-6xl w-full">
        {/* Title */}
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="pinto-body sm:pinto-h2 font-light text-black">
            Pinto is secured by repeated audits, a large bug bounty program and state of the art off-chain security
            measures.
          </h2>
        </div>
      </div>
      <div>
        {/* Three columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-16 w-[90%] mx-auto items-center">
          {/* Column 1: Audits */}
          <div className="flex flex-col items-center text-center">
            <div className="text-2xl sm:text-6xl font-light text-black mb-2 sm:mb-6">25</div>
            <div className="pinto-body sm:text-2xl font-light text-black mb-2 sm:mb-6">Audits to Date</div>
            <Link to={"https://docs.pinto.money/resources/audits"} target="_blank" rel="noopener noreferrer">
              <Button
                variant="outline"
                size={isMobile ? "sm" : "lg"}
                rounded="full"
                className="shadow-none text-pinto-gray-4"
              >
                Learn More
              </Button>
            </Link>
          </div>

          {/* Column 2: Bug Bounty */}
          <div className="flex flex-col items-center text-center" ref={componentRef}>
            <div className="flex flex-row gap-2 sm:gap-4 items-center mb-2 sm:mb-4">
              <img
                src={PintoTokenLogo}
                alt={"Pinto Token Icon"}
                className="h-8 w-8 min-w-8 min-h-8 sm:w-16 sm:h-16 sm:min-h-16 sm:min-w-16"
              />
              <NumberFlow
                value={value}
                respectMotionPreference={false}
                trend={+1}
                format={{
                  style: "decimal",
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                  trailingZeroDisplay: "auto",
                }}
                className="text-black font-thin text-2xl sm:text-6xl"
              />
            </div>
            <div className="pinto-body sm:text-2xl font-light flex flex-row gap-2 sm:gap-4 items-center mb-4 sm:mb-6">
              <span>Bug Bounty with</span>
              <img src={ImmunefiLogo} alt={"ImmuneFi"} className="h-4 sm:h-8" />
            </div>
            <Link to={"https://immunefi.com/bug-bounty/pinto/information/"} target="_blank" rel="noopener noreferrer">
              <Button
                variant="outline"
                size={isMobile ? "sm" : "lg"}
                rounded="full"
                className="shadow-none text-pinto-gray-4"
              >
                Learn More
              </Button>
            </Link>
          </div>

          {/* Column 3: Off-chain Monitoring */}
          <div className="flex flex-col items-center text-center gap-2 sm:gap-6">
            <img src={HypernativeLogo} alt={"Hypernative"} className="h-10 sm:h-16" />
            <div className="pinto-body sm:text-2xl font-light text-black">
              24/7 Real-time off-chain monitoring with Hypernative
            </div>
            <Link
              to={"https://www.hypernative.io/blog/pinto-extends-protocol-security-with-hypernative"}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="outline"
                size={isMobile ? "sm" : "lg"}
                rounded="full"
                className="shadow-none text-pinto-gray-4"
              >
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
