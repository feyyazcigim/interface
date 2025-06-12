import ImmunefiLogo from "@/assets/misc/immunefi-logo.png";
import PintoTokenLogo from "@/assets/tokens/PINTO.png";
import NumberFlow from "@number-flow/react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../ui/Button";

export default function BugBounty() {
  const [value, setValue] = useState(0o7);
  const componentRef = useRef(null);
  const valueChanged = useRef(false);

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
    <div className="flex flex-col items-center mx-auto my-auto">
      <div className="flex flex-row gap-8 items-center" ref={componentRef}>
        <img src={PintoTokenLogo} alt={"Pinto Token Icon"} className="w-32 h-32" />
        <NumberFlow
          value={value}
          respectMotionPreference={false}
          trend={+1}
          format={{ style: "decimal", minimumFractionDigits: 2, maximumFractionDigits: 2, trailingZeroDisplay: "auto" }}
          className="text-black font-thin text-[8rem]"
        />
      </div>
      <div className="pinto-h2 font-light pt-6 flex flex-row gap-4 items-center">
        <span>Bug Bounty through</span>
        <img src={ImmunefiLogo} alt={"ImmuneFi"} className="h-12" />
      </div>
      <div className="flex flex-row gap-4 pt-9">
        <Link to={"https://immunefi.com/bug-bounty/pinto/information/"} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" rounded="full" className="shadow-none text-pinto-gray-4">
            Read about the Bug Bounty Program
          </Button>
        </Link>
      </div>
    </div>
  );
}
