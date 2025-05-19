import ImmunefiLogo from "@/assets/misc/immunefi-logo.png";
import PintoLogo from "@/assets/protocol/PintoLogo.svg";
import PintoLogoText from "@/assets/protocol/PintoLogoText.svg";
import DaiLogo from "@/assets/tokens/DAI.png";
import PintoTokenLogo from "@/assets/tokens/PINTO.png";
import Usd0Logo from "@/assets/tokens/USD0.png";
import UsdcLogo from "@/assets/tokens/USDC.png";
import UsdeLogo from "@/assets/tokens/USDE.png";
import UsdtLogo from "@/assets/tokens/USDT.png";
import MinimalistConcentricCircles from "@/components/MinimalistConcentricCircles";
import { navLinks } from "@/components/nav/nav/Navbar";
import { useAverageBDVWeightedSiloAPYs } from "@/state/useSiloAPYs";
import { formatPct } from "@/utils/format";
import NumberFlow from "@number-flow/react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";

function MainCTA() {
  return (
    <div className="flex flex-col gap-8 max-w-[32rem]">
      <div className="flex flex-col items-start gap-4 self-stretch">
        <div className="flex flex-row gap-6">
          <img src={PintoLogo} alt={"Pinto Logo"} />
          <img src={PintoLogoText} alt={"Pinto Logo"} />
        </div>
        <h2 className="pinto-h2 text-black">Fair Fiat Money</h2>
        <span className="pinto-body-light text-pinto-gray-4">
          Prints for the people. Founded on decentralized credit.
        </span>
      </div>
      <div className="flex flex-row gap-4">
        <Link to={navLinks.overview}>
          <Button rounded="full">Get Started</Button>
        </Link>
        <Link to={navLinks.docs} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" rounded="full" className="shadow-none text-pinto-gray-4">
            Read Docs
          </Button>
        </Link>
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
  function MarqueeLogos({ hideFromScreenReaders = false }: { hideFromScreenReaders?: boolean }) {
    return (
      <div className="flex flex-row pl-20 gap-20 flex-shrink-0" aria-hidden={hideFromScreenReaders}>
        <Link to={"https://cantina.xyz/"} target="_blank" rel="noopener noreferrer">
          <img
            src="cantina.svg"
            className="h-10 flex-shrink-0 opacity-40 hover:opacity-100 transition-opacity"
            alt="cantina"
          />
        </Link>
        <Link to={"https://codehawks.cyfrin.io/"} target="_blank" rel="noopener noreferrer">
          <img
            src="codehawks.svg"
            className="h-10 flex-shrink-0 opacity-40 hover:opacity-100 transition-opacity"
            alt="codehawks"
          />
        </Link>
        <Link to={"https://www.cyfrin.io/"} target="_blank" rel="noopener noreferrer">
          <img
            src="cyfrin.svg"
            className="h-10 flex-shrink-0 opacity-40 hover:opacity-100 transition-opacity"
            alt="cyfrin"
          />
        </Link>
        <Link to={"https://www.trailofbits.com/"} target="_blank" rel="noopener noreferrer">
          <img
            src="trail-of-bits.png"
            className="h-10 flex-shrink-0 opacity-40 hover:opacity-100 transition-opacity"
            alt="trail of bits"
          />
        </Link>
        <Link to={"https://www.egissec.com/"} target="_blank" rel="noopener noreferrer">
          <img
            src="egis.png"
            className="h-10 flex-shrink-0 opacity-40 hover:opacity-100 transition-opacity"
            alt="egis security"
          />
        </Link>
        <Link to={"https://www.halborn.com/"} target="_blank" rel="noopener noreferrer">
          <img
            src="halborn.png"
            className="h-10 flex-shrink-0 opacity-40 hover:opacity-100 transition-opacity"
            alt="halborn"
          />
        </Link>
        <Link to={"https://immunefi.com/"} target="_blank" rel="noopener noreferrer">
          <img
            src={ImmunefiLogo}
            alt={"ImmuneFi"}
            className="h-10 flex-shrink-0 opacity-40 hover:opacity-100 transition-opacity"
          />
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-9">
      <div className="mx-auto mt-[4.5rem] text-pinto-gray-4 text-[1.5rem] font-light">25 audits to date by</div>
      <div className="flex flex-row animate-marquee hover:[animation-play-state:paused]">
        <MarqueeLogos />
        <MarqueeLogos hideFromScreenReaders />
        <MarqueeLogos hideFromScreenReaders />
        <MarqueeLogos hideFromScreenReaders />
        <MarqueeLogos hideFromScreenReaders />
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
        <Link to={navLinks.overview}>
          <Button rounded="full">Get Started</Button>
        </Link>
        <Link to={"https://immunefi.com/bug-bounty/pinto/information/"} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" rounded="full" className="shadow-none text-pinto-gray-4">
            Read about the Bug Bounty Program
          </Button>
        </Link>
      </div>
    </div>
  );
}

function SecondaryCTA() {
  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex flex-row border-y border-pinto-gray-2 basis-[40rem]">
        <div className="flex flex-col items-start place-content-center px-12 border-r border-pinto-gray-2 bg-pinto-off-white basis-5/12">
          <h2 className="pinto-h2 text-5xl leading-[1.1] text-black flex flex-row gap-4 items-center">
            <span>Not a Stablecoin</span>
            <div className="flex flex-row gap-2 items-center">
              <img src={UsdcLogo} alt={"USDC"} className="h-6 w-6 min-h-6 min-w-6" />
              <img src={DaiLogo} alt={"DAI"} className="h-6 w-6 min-h-6 min-w-6" />
              <img src={UsdtLogo} alt={"USDT"} className="h-6 w-6 min-h-6 min-w-6" />
              <img src={UsdeLogo} alt={"USDE"} className="h-6 w-6 min-h-6 min-w-6" />
              <img src={Usd0Logo} alt={"USD0"} className="h-6 w-6 min-h-6 min-w-6" />
            </div>
          </h2>
          <span className="pinto-body-light text-[2rem] leading-[1.1] text-pinto-gray-4 mt-2 mb-5">
            Stablecoins are not good enough.
          </span>
          <span className="pinto-body-light text-[2rem] leading-[1.1] text-pinto-gray-4">
            Trustlessness and capital efficiency at scale are requisite to build the onchain economy.
          </span>
          <div className="flex flex-row gap-4 mt-8">
            <Link to={"/overview"}>
              <Button rounded="full">Get Started</Button>
            </Link>
            <Link to={`${navLinks.docs}/advanced/stablecoin-overview`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" rounded="full" className="shadow-none text-pinto-gray-4">
                Read Docs
              </Button>
            </Link>
          </div>
        </div>
        <div className="overflow-hidden shrink-0 relative basis-7/12 bg-double-fade">
          <img
            src="landing-2.png"
            className="absolute inset-0 w-full h-full object-cover object-center mix-blend-overlay"
            alt="landing 2"
          />
        </div>
      </div>
      <div className="flex flex-col basis-[27rem]">
        <div className="flex flex-row items-center justify-between px-12 border-b border-pinto-gray-2 bg-white basis-1/3">
          <span className="pinto-body-light text-[2rem] leading-[1.1] text-black">Scalable</span>
          <div className="flex flex-row gap-4">
            <span className="pinto-lg text-pinto-gray-4">
              Pinto is credit based, allowing it to scale without limits
            </span>
            <Link
              to={`${navLinks.docs}/advanced/economics`}
              target="_blank"
              rel="noopener noreferrer"
              className="pinto-body-light text-pinto-green-4 hover:underline transition-all"
            >
              Learn More →
            </Link>
          </div>
        </div>
        <div className="flex flex-row items-center justify-between px-12 border-b border-pinto-gray-2 bg-white basis-1/3">
          <span className="pinto-body-light text-[2rem] leading-[1.1] text-black">Trustless</span>
          <div className="flex flex-row gap-4">
            <span className="pinto-lg text-pinto-gray-4">Censorship resistant and decentralized governance</span>
            <Link
              to={`${navLinks.docs}/advanced/economics`}
              target="_blank"
              rel="noopener noreferrer"
              className="pinto-body-light text-pinto-green-4 hover:underline transition-all"
            >
              Learn More →
            </Link>
          </div>
        </div>
        <div className="flex flex-row items-center justify-between px-12 border-b border-pinto-gray-2 bg-white basis-1/3">
          <span className="pinto-body-light text-[2rem] leading-[1.1] text-black">Capital efficient</span>
          <div className="flex flex-row gap-4">
            <span className="pinto-lg text-pinto-gray-4">
              No collateral, no interest paid by depositors, no value lockups, and no liquidations
            </span>
            <Link
              to={`${navLinks.docs}/advanced/economics`}
              target="_blank"
              rel="noopener noreferrer"
              className="pinto-body-light text-pinto-green-4 hover:underline transition-all"
            >
              Learn More →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function FarmToTable({ height = 1600 }: { height: number }) {
  const [beginAnimation, setBeginAnimation] = useState(false);
  const sloganRef = useRef(null);

  useEffect(() => {
    if (!sloganRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setBeginAnimation(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(sloganRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center relative w-full h-screen overflow-hidden">
      {/* Background expanding rings centered properly */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-full h-auto opacity-10">
          <MinimalistConcentricCircles canvasHeight={height} beginAnimation={beginAnimation} />
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 z-10">
        <h2 className="pinto-h2 text-5xl leading-[1.1] text-black">Farm to Table</h2>
        <span ref={sloganRef} className="pinto-body-light font-thin text-pinto-gray-4">
          No investors. Community first.
        </span>
        <div className="flex flex-row gap-4">
          <Link to={"/overview"}>
            <Button rounded="full">Get Started</Button>
          </Link>
          <Link to={`${navLinks.docs}/advanced/economics`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" rounded="full" className="shadow-none text-pinto-gray-4">
              Read Docs
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function Resources() {
  return (
    <div className="flex flex-col items-center self-stretch gap-12 mx-auto">
      <h2 className="text-4xl leading-same-h2 font-light text-black">Resources</h2>
      <div className="flex flex-row gap-8">
        <div className="border border-pinto-gray-2 rounded-[1.25rem] w-[36rem] flex flex-col gap-8 overflow-clip bg-white">
          <div className="overflow-hidden relative">
            <img
              src="documentation.png"
              className="w-full h-full object-cover object-top relative z-0"
              alt="landing 2"
            />
            {/* Horizontal gradient overlay */}
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/50 via-transparent to-white/50 z-10 pointer-events-none" />

            {/* Vertical gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-transparent to-white/100 z-10 pointer-events-none" />
          </div>
          <div className="flex flex-col gap-4 mx-6">
            <span className="text-[2rem] font-light text-black">Documentation</span>
            <span className="text-[1.5rem] font-light text-pinto-gray-4">
              Learn more about protocol economics, mechanisms, and implementation of the protocol smart contracts.
            </span>
            <Link to={navLinks.docs} target="_blank" rel="noopener noreferrer">
              <Button
                variant="outline-white"
                className="w-full flex p-4 justify-center h-auto items-center gap-2.5 flex-1 mb-6"
              >
                <img src="gitbook.png" className="w-8 h-8" alt="documentation" />
                <span className="w-full text-start">Read Documentation</span>
                <span>→</span>
              </Button>
            </Link>
          </div>
        </div>
        <div className="border border-pinto-gray-2 rounded-[1.25rem] w-[36rem] flex flex-col gap-8 overflow-clip bg-white">
          <div className="overflow-hidden relative">
            <img src="blog.png" className="w-full h-full object-cover object-top relative z-0" alt="landing 2" />
            {/* Horizontal gradient overlay */}
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/50 via-transparent to-white/50 z-10 pointer-events-none" />

            {/* Vertical gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-transparent to-white/100 z-10 pointer-events-none" />
          </div>
          <div className="flex flex-col gap-4 mx-6">
            <span className="text-[2rem] font-light text-black">Blog</span>
            <span className="text-[1.5rem] font-light text-pinto-gray-4">
              Find guides on protocol usage, detail about protocol upgrades, and more from core contributors.
            </span>
            <Link to={navLinks.blog} target="_blank" rel="noopener noreferrer">
              <Button
                variant="outline-white"
                className="w-full flex p-4 h-auto justify-center items-center gap-2.5 flex-1 mb-6"
              >
                <img src="mirror.png" className="w-8 h-8 min-w-8 min-h-8" alt="documentation" />
                <span className="w-full text-start">Pinto Community Blog</span>
                <span>→</span>
              </Button>
            </Link>
          </div>
        </div>
        <div className="border border-pinto-gray-2 rounded-[1.25rem] w-[36rem] flex flex-col gap-8 overflow-clip bg-white">
          <div className="overflow-hidden relative">
            <img src="community.png" className="w-full h-full object-cover object-top relative z-0" alt="landing 2" />
            {/* Horizontal gradient overlay */}
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/50 via-transparent to-white/50 z-10 pointer-events-none" />

            {/* Vertical gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-transparent to-white/100 z-10 pointer-events-none" />
          </div>
          <div className="flex flex-col gap-4 mx-6">
            <span className="text-[2rem] font-light text-black">Community</span>
            <span className="text-[1.5rem] font-light text-pinto-gray-4">
              Ask questions about the protocol, participate in discussion about improvements and connect with other
              Pinto enjoyers.
            </span>
            <div className="flex flex-row gap-4">
              <Link to={navLinks.discord} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button
                  variant="outline-white"
                  className="w-full flex p-4 justify-center items-center gap-2.5 h-[3.125rem]"
                >
                  <img src="discord.png" className="w-8 h-6 min-w-8 min-h-6" alt="documentation" />
                  <span className="w-full text-start">Discord</span>
                  <span>→</span>
                </Button>
              </Link>
              <Link to={navLinks.twitter} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button
                  variant="outline-white"
                  className="w-full flex p-4 justify-center items-center gap-2.5 h-[3.125rem]"
                >
                  <img src="twitter.png" className="w-8 h-8 min-w-8 min-h-8" alt="documentation" />
                  <span className="w-full text-start">@pintodotmoney</span>
                  <span>→</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const [initialHeightRem, setInitialHeightRem] = useState(100);
  const [initialHeightPx, setInitialHeightPx] = useState(1600);
  const [navBarHeightRem, setNavBarHeightRem] = useState(3.125);

  useEffect(() => {
    const calculateHeight = () => {
      // Get the current rem value based on root font size
      const remSize = parseFloat(getComputedStyle(document.documentElement).fontSize);

      const elem = document.getElementById("pinto-navbar");
      if (!elem) return;

      const windowHeight = window.screen.availHeight - (window.outerHeight - window.innerHeight);
      const headerOffset = elem.getBoundingClientRect().height;
      const newHeight = windowHeight - headerOffset;

      // Convert pixel values to rem
      setInitialHeightRem(newHeight / remSize);
      setInitialHeightPx(newHeight);
      setNavBarHeightRem(headerOffset / remSize);
    };

    calculateHeight();

    window.addEventListener("resize", calculateHeight);
    return () => {
      window.removeEventListener("resize", calculateHeight);
    };
  }, []);

  return (
    <div className="flex flex-col">
      <div className="flex flex-col" style={{ height: `${initialHeightRem}rem` }}>
        <div className="my-auto ml-[4.5rem]">
          <MainCTA />
        </div>
        <APYBar />
      </div>
      <div className="flex flex-col gap-12" style={{ height: `${initialHeightRem}rem` }}>
        <SecondaryCTA />
      </div>
      <div className="flex flex-col gap-12 overflow-clip" style={{ height: `${initialHeightRem}rem` }}>
        <FarmToTable height={initialHeightPx} />
      </div>
      <div className="flex flex-col gap-12" style={{ height: `${initialHeightRem}rem` }}>
        <AuditMarquee />
        <BugBounty />
      </div>
      <div className="flex flex-col gap-12" style={{ height: `${initialHeightRem + navBarHeightRem / 3}rem` }}>
        <Resources />
      </div>
    </div>
  );
}
