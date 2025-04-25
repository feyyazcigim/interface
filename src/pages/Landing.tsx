import ImmunefiLogo from "@/assets/misc/immunefi-logo.png";
import PintoLogo from "@/assets/protocol/PintoLogo.svg";
import PintoLogoText from "@/assets/protocol/PintoLogoText.svg";
import PintoTokenLogo from "@/assets/tokens/PINTO.png";
import { useAverageBDVWeightedSiloAPYs } from "@/state/useSiloAPYs";
import NumberFlow, { continuous } from "@number-flow/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "../components/ui/Button";

function MainCTA() {
  return (
    <div className="flex flex-col gap-8 max-w-[32rem]">
      <div className="flex flex-col items-start gap-4 self-stretch">
        <div className="flex flex-row gap-6">
          <img src={PintoLogo} alt={"Pinto Logo"} />
          <img src={PintoLogoText} alt={"Pinto Logo"} />
        </div>
        <h2 className="pinto-h2 text-black">A Low Volatility Money Protocol</h2>
        <span className="pinto-body-light text-pinto-gray-4">
          Pinto has a $1 price target, but tolerates volatility <br /> for capital efficiency, trustlessness, and
          scalability.
        </span>
      </div>
      <div className="flex flex-row gap-4">
        <Button rounded="full">Get Started</Button>
        <Button variant="outline" rounded="full" className="shadow-none text-pinto-gray-4">
          Read Docs
        </Button>
      </div>
    </div>
  );
}

function APYBar() {
  const { data: avgSiloYields } = useAverageBDVWeightedSiloAPYs();

  return (
    <div className="flex flex-row gap-7 mb-5 mx-auto">
      <div className="pinto-h4 leading-[150%] text-pinto-gray-4">
        1D Silo APY:
        {avgSiloYields?.ema24 ? <span className="text-pinto-green-4">{avgSiloYields?.ema24}</span> : <span>-</span>}
      </div>
      <div className="pinto-h4 leading-[150%] text-pinto-gray-4">
        7D Silo APY:
        {avgSiloYields?.ema168 ? <span className="text-pinto-green-4">{avgSiloYields?.ema168}</span> : <span>-</span>}
      </div>
      <div className="pinto-h4 leading-[150%] text-pinto-gray-4">
        30D Silo APY:
        {avgSiloYields?.ema720 ? <span className="text-pinto-green-4">{avgSiloYields?.ema720}</span> : <span>-</span>}
      </div>
      <div className="pinto-h4 leading-[150%] text-pinto-gray-4">
        90D Silo APY:
        {avgSiloYields?.ema2160 ? <span className="text-pinto-green-4">{avgSiloYields?.ema2160}</span> : <span>-</span>}
      </div>
    </div>
  );
}

function AuditMarquee() {
  return (
    <div className="flex flex-col gap-9">
      <div className="mx-auto mt-[4.5rem] text-black pinto-h2 font-light">27 audits to date by</div>
      <div className="flex flex-row gap-20 min-w-fit max-w-fit animate-marquee">
        <div>auditooor</div>
        <div>auditooor</div>
        <div>auditooor</div>
        <div>auditooor</div>
        <div>auditooor</div>
        <div>auditooor</div>
        <div>auditooor</div>
        <div>auditooor</div>
        <div>auditooor</div>
        <div>auditooor</div>
        <div>auditooor</div>
        <div>auditooor</div>
        <div>auditooor</div>
        <div>auditooor</div>
        <div>auditooor</div>
        <div>auditooor</div>
        <div>auditooor</div>
        <div>auditooor</div>
        <div>auditooor</div>
        <div>auditooor</div>
        <div>auditooor</div>
        <div>auditooor</div>
        <div>auditooor</div>
        <div>auditooor</div>
        <div>auditooor</div>
        <div>auditooor</div>
        <div>auditooor</div>
      </div>
    </div>
  );
}

function BugBounty() {
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
    <div className="flex flex-col items-center">
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
        <Button rounded="full">Get Started</Button>
        <Button variant="outline" rounded="full" className="shadow-none text-pinto-gray-4">
          Read about the Bug Bounty Program
        </Button>
      </div>
    </div>
  );
}

export default function Landing() {
  const [initialHeight, setInitialHeight] = useState(1600);

  useEffect(() => {
    const calculateHeight = () => {
      const elem = document.getElementById("pinto-navbar");
      if (!elem) return;
      const windowHeight = window.innerHeight;
      const headerOffset = elem.getBoundingClientRect().height;
      const newHeight = windowHeight - headerOffset;
      setInitialHeight(newHeight);
    };

    calculateHeight();

    window.addEventListener("resize", calculateHeight);
    return () => {
      window.removeEventListener("resize", calculateHeight);
    };
  }, []);

  return (
    <div className="flex flex-col">
      <div className="flex flex-col" style={{ height: initialHeight }}>
        <div className="my-auto ml-[4.5rem]">
          <MainCTA />
        </div>
        <APYBar />
      </div>
      <div className="flex flex-col gap-12" style={{ height: initialHeight }}>
        <AuditMarquee />
        <BugBounty />
      </div>
    </div>
  );
}
