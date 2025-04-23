import PintoLogo from "@/assets/protocol/PintoLogo.svg";
import PintoLogoText from "@/assets/protocol/PintoLogoText.svg";
import PintoTokenLogo from "@/assets/tokens/PINTO.png";
import { useAverageBDVWeightedSiloAPYs } from "@/state/useSiloAPYs";
import NumberFlow from "@number-flow/react";
import { useEffect, useState } from "react";
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
  return (
    <div className="flex flex-row gap-4">
      <img src={PintoTokenLogo} alt={"Pinto Token Icon"} />
      <NumberFlow value={1200000} format={{ style: "currency", currency: "USD", trailingZeroDisplay: "auto" }} />
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
