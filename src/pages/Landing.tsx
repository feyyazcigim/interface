import ImmunefiLogo from "@/assets/misc/immunefi-logo.png";
import PintoLogo from "@/assets/protocol/PintoLogo.svg";
import PintoLogoText from "@/assets/protocol/PintoLogoText.svg";
import PintoTokenLogo from "@/assets/tokens/PINTO.png";
import { useAverageBDVWeightedSiloAPYs } from "@/state/useSiloAPYs";
import { formatPct } from "@/utils/format";
import NumberFlow, { continuous } from "@number-flow/react";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { div } from "three/webgpu";
import { Button } from "../components/ui/Button";

function MainCTA() {
  return (
    <div className="flex flex-col gap-8 max-w-[32rem]">
      <div className="flex flex-col items-start gap-4 self-stretch">
        <div className="flex flex-row gap-6">
          <img src={PintoLogo} alt={"Pinto Logo"} className="drop-shadow-sm" />
          <img src={PintoLogoText} alt={"Pinto Logo"} className="drop-shadow-sm" />
        </div>
        <h2 className="pinto-h2 text-black drop-shadow-sm">A Low Volatility Money Protocol</h2>
        <span className="pinto-body-light text-pinto-gray-4 drop-shadow-sm">
          Pinto has a $1 price target, but tolerates volatility <br /> for capital efficiency, trustlessness, and
          scalability.
        </span>
      </div>
      <div className="flex flex-row gap-4">
        <Button rounded="full" className="drop-shadow-sm">
          Get Started
        </Button>
        <Button variant="outline" rounded="full" className="shadow-none text-pinto-gray-4 drop-shadow-sm">
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
      {avgSiloYields?.ema24 !== undefined && avgSiloYields.ema24 > 0 && (
        <div className="pinto-h4 leading-[150%] text-pinto-gray-4">
          1D Silo APY:
          <span className="text-pinto-green-4">{formatPct(avgSiloYields.ema24)}</span>
        </div>
      )}
      {avgSiloYields?.ema168 !== undefined && avgSiloYields.ema168 > 0 && (
        <div className="pinto-h4 leading-[150%] text-pinto-gray-4">
          7D Silo APY:
          <span className="text-pinto-green-4">{formatPct(avgSiloYields.ema168)}</span>
        </div>
      )}
      {avgSiloYields?.ema720 !== undefined && avgSiloYields.ema720 > 0 && (
        <div className="pinto-h4 leading-[150%] text-pinto-gray-4">
          30D Silo APY:
          <span className="text-pinto-green-4">{formatPct(avgSiloYields.ema720)}</span>
        </div>
      )}
      {avgSiloYields?.ema2160 !== undefined && avgSiloYields.ema2160 > 0 && (
        <div className="pinto-h4 leading-[150%] text-pinto-gray-4">
          90D Silo APY:
          <span className="text-pinto-green-4">{formatPct(avgSiloYields.ema2160)}</span>
        </div>
      )}
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

function SecondaryCTA() {
  return (
    <div className="grid grid-flow-row grid-rows-[64%_1fr] w-full h-full">
      <div className="grid grid-flow-col grid-cols-[43%_1fr] border-y border-pinto-gray-2">
        <div className="flex flex-col items-start self-stretch my-auto px-12 border-r border-pinto-gray-2 bg-pinto-off-white">
          <h2 className="pinto-h2 text-5xl leading-[1.1] text-black">Not a Stablecoin</h2>
          <span className="pinto-body-light text-[2rem] leading-[1.1] text-pinto-gray-4 mt-2 mb-5">
            Stablecoins are not good enough.
          </span>
          <span className="pinto-body-light text-[2rem] leading-[1.1] text-pinto-gray-4">
            Trustlessness and capital efficiency at scale are requisite to build the onchain economy.
          </span>
          <div className="flex flex-row gap-4 mt-8">
            <Button rounded="full" className="drop-shadow-sm">
              Get Started
            </Button>
            <Button variant="outline" rounded="full" className="shadow-none text-pinto-gray-4 drop-shadow-sm">
              Read Docs
            </Button>
          </div>
        </div>
        <div className="overflow-hidden w-full h-full relative">
          <img src="landing-2.png" className="w-full h-full object-cover object-top relative z-0" alt="landing 2" />
          {/* Horizontal gradient overlay */}
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/50 via-transparent to-white/50 z-10 pointer-events-none" />

          {/* Vertical gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-transparent to-white/50 z-10 pointer-events-none" />
        </div>
      </div>
      <div className="grid grid-flow-row grid-rows-3">
        <div className="flex flex-row items-center justify-between px-12 border-b border-pinto-gray-2 bg-white">
          <span className="pinto-body-light text-[2rem] leading-[1.1] text-black">Scalable</span>
          <div className="flex flex-row gap-4">
            <span className="pinto-lg text-pinto-gray-4">
              Pinto is credit based, allowing it to scale without limits
            </span>
            <span className="pinto-body-light text-pinto-green-4">Learn More</span>
          </div>
        </div>
        <div className="flex flex-row items-center justify-between px-12 border-b border-pinto-gray-2 bg-white">
          <span className="pinto-body-light text-[2rem] leading-[1.1] text-black">Trustless</span>
          <div className="flex flex-row gap-4">
            <span className="pinto-lg text-pinto-gray-4">Censorship resistant and decentralized governance</span>
            <span className="pinto-body-light text-pinto-green-4">Learn More</span>
          </div>
        </div>
        <div className="flex flex-row items-center justify-between px-12 border-b border-pinto-gray-2 bg-white">
          <span className="pinto-body-light text-[2rem] leading-[1.1] text-black">Capital efficient</span>
          <div className="flex flex-row gap-4">
            <span className="pinto-lg text-pinto-gray-4">
              No collateral, no interest paid by depositors, no value lockups, and no liquidations
            </span>
            <span className="pinto-body-light text-pinto-green-4">Learn More</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const [initialHeight, setInitialHeight] = useState(1600);
  const [navBarHeight, setNavBarHeight] = useState(50);

  useEffect(() => {
    const calculateHeight = () => {
      const elem = document.getElementById("pinto-navbar");
      if (!elem) return;
      const windowHeight = window.innerHeight;
      const headerOffset = elem.getBoundingClientRect().height;
      const newHeight = windowHeight - headerOffset;
      setInitialHeight(newHeight);
      setNavBarHeight(headerOffset);
    };

    calculateHeight();

    window.addEventListener("resize", calculateHeight);
    return () => {
      window.removeEventListener("resize", calculateHeight);
    };
  }, []);

  return (
    <div className="flex flex-col">
      <div className="w-screen h-screen absolute -z-[1]" style={{ top: navBarHeight * -1 }}>
        <div className="bg-gradient-light w-screen h-screen absolute" />
        <img src={"BG4.png"} className="w-screen h-screen absolute mix-blend-multiply" />
      </div>
      <div className="flex flex-col" style={{ height: initialHeight }}>
        <div className="my-auto ml-[4.5rem]">
          <MainCTA />
        </div>
        <APYBar />
      </div>
      <div className="flex flex-col gap-12" style={{ height: initialHeight }}>
        <SecondaryCTA />
      </div>
      <div className="flex flex-col gap-12" style={{ height: initialHeight }}>
        <AuditMarquee />
        <BugBounty />
      </div>
    </div>
  );
}
