import PropertyLowVolatility from "@/assets/misc/Property_Low_Volatility.svg";
import PropertyMediumOfExchange from "@/assets/misc/Property_Medium_of_Exchange.svg";
import PropertyScalable from "@/assets/misc/Property_Scalable.svg";
import PropertyUnitOfAccount from "@/assets/misc/Property_Unit_of_Account.svg";
import ValueCensorshipResistance from "@/assets/misc/Value_Censorship_Resistance.svg";
import ValueCommunityRun from "@/assets/misc/Value_Community_Run.svg";
import ValueFairness from "@/assets/misc/Value_Fairness.svg";
import ValueOpenSource from "@/assets/misc/Value_Open_Source.svg";
import ValuePermissionless from "@/assets/misc/Value_Permissionlessness.svg";
import ValueTrustless from "@/assets/misc/Value_Trustlessness.svg";
import ImmunefiLogo from "@/assets/misc/immunefi-logo.png";
import PintoLogo from "@/assets/protocol/PintoLogo.svg";
import PintoLogoText from "@/assets/protocol/PintoLogoText.svg";
import DaiLogo from "@/assets/tokens/DAI.png";
import PintoTokenLogo from "@/assets/tokens/PINTO.png";
import Usd0Logo from "@/assets/tokens/USD0.png";
import UsdcLogo from "@/assets/tokens/USDC.png";
import UsdeLogo from "@/assets/tokens/USDE.png";
import UsdtLogo from "@/assets/tokens/USDT.png";
import LandingChart from "@/components/LandingChart";
import MinimalistConcentricCircles from "@/components/MinimalistConcentricCircles";
import { navLinks } from "@/components/nav/nav/Navbar";
import { useAverageBDVWeightedSiloAPYs } from "@/state/useSiloAPYs";
import { formatPct } from "@/utils/format";
import NumberFlow from "@number-flow/react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { div, threshold } from "three/webgpu";
import { Button } from "../components/ui/Button";

function MainCTA() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 self-stretch items-center">
        <h2 className="text-[4rem] leading-[1.1] font-thin text-black">Fair Fiat Money</h2>
        <span className="text-2xl leading-[1.4] font-thin text-pinto-gray-4">
          Printed directly to the people. Founded on decentralized credit.
        </span>
      </div>
      <div className="flex flex-row gap-4 mx-auto">
        <Link to={navLinks.overview}>
          <Button rounded="full">Come Seed the Trustless Economy →</Button>
        </Link>
        <Link to={navLinks.docs} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" rounded="full" className="shadow-none text-pinto-gray-4">
            Read the Docs
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
  const logos = [
    {
      url: "https://cantina.xyz/",
      src: "cantina.svg",
      alt: "cantina",
      className: "col-span-4",
      height: "h-10",
    },
    {
      url: "https://www.halborn.com/",
      src: "halborn.png",
      alt: "halborn",
      className: "col-span-3",
      height: "h-10",
    },
    {
      url: "https://codehawks.cyfrin.io/",
      src: "codehawks.svg",
      alt: "codehawks",
      className: "col-span-3",
      height: "h-10",
    },
    {
      url: "https://www.cyfrin.io/",
      src: "cyfrin.svg",
      alt: "cyfrin",
      className: "col-span-2",
      height: "h-10",
    },
    {
      url: "https://www.egissec.com/",
      src: "egis.png",
      alt: "egis security",
      className: "col-span-5",
      height: "h-10",
    },
    {
      url: "https://www.trailofbits.com/",
      src: "trail-of-bits.png",
      alt: "trail of bits",
      className: "col-span-2 row-span-2",
      height: "h-20",
      imgClassName: "row-span-2",
    },
    /* {
      url: "https://immunefi.com/",
      src: ImmunefiLogo,
      alt: "ImmuneFi",
      className: "col-span-4",
      height: "h-10",
    },*/
  ];

  /*
  return (
    <div className="flex flex-col gap-9">
      <div className="mx-auto mt-[4.5rem] text-pinto-gray-4 text-[1.5rem] font-light">25 audits to date by</div>
      <div className="max-w-[100%]">
        <div
          className="grid grid-cols-[repeat(24,1fr)] auto-rows-[2.5rem] justify-items-center gap-2"
          style={{ gridAutoFlow: "dense" }}
        >
          {Array(6)
            .fill(logos)
            .flat()
            .map((logo, index) => (
              <Link
                key={`${logo.alt}-${index}`}
                to={logo.url}
                target="_blank"
                rel="noopener noreferrer"
                className={logo.className}
              >
                <img
                  src={logo.src}
                  className={`${logo.height} w-full object-fill opacity-40 hover:opacity-100 transition-opacity ${logo.imgClassName || ""}`}
                  alt={logo.alt}
                />
              </Link>
            ))}
        </div>
      </div>
    </div>
  );*/
  return (
    <div className="relative">
      <img src="sec-bg.png" className="mix-blend-multiply z-0 absolute top-0" />
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

function SecondaryCTA() {
  return (
    <div className="flex flex-col items-start place-content-center px-12 gap-6 w-[48rem]">
      <h2 className="pinto-h2 text-5xl leading-[1.1] text-black flex flex-row gap-4 items-center">
        <span>Combining The Values of BTC with the properties of USD</span>
      </h2>
      <span className="text-lg leading-[1.1] text-pinto-gray-4">
        Pinto prioritizes trustlessness and scalability to power the leviathan-free economy.
      </span>
      <div className="flex flex-row gap-4">
        <Link to={"/overview"}>
          <Button rounded="full">Learn More About Properties</Button>
        </Link>
      </div>
    </div>
  );
}

function SecondaryCTAValues() {
  const data = [
    {
      logo: ValueCensorshipResistance,
      title: "Censorship Resistance",
      description: "Pinto is designed to be maximally resistant to any censorship.",
    },
    {
      logo: ValueTrustless,
      title: "Trustlessness",
      description: "The monetary policy of Pinto is deterministic, eliminating any need for trust.",
    },
    {
      logo: ValuePermissionless,
      title: "Permissionless",
      description: "Anyone with an Ethereum wallet can participate in Pinto.",
    },
    {
      logo: ValueFairness,
      title: "Fairness",
      description: "Pinto strives to fairly incentivize all participants.",
    },
    {
      logo: ValueOpenSource,
      title: "Open-source",
      description: "All code is deployed on Base and publicly viewable by any participant.",
    },
    {
      logo: ValueCommunityRun,
      title: "Community-run",
      description: "Pinto is maintained by a decentralized group of contributors and run by it’s community.",
    },
  ];

  return (
    <div className="flex flex-col items-start w-[25.625rem] animate-vertical-marquee-reverse">
      {Array(2)
        .fill(data)
        .flat()
        .map((info, index) => (
          <div key={`dataInfo1_${info.title}_${index}`} className="p-6 border rounded-2xl bg-pinto-off-white mb-12">
            <div className="h-[18.75rem] flex flex-col gap-6">
              <img src={info.logo} className="w-24 flex-shrink-0 h-auto" alt={info.title} />
              <div className="flex flex-col gap-4">
                <div className="text-lg leading-[1.1] font-thin text-black">{info.title}</div>
                <div className="text-xl leading-[1.1] font-thin text-pinto-gray-4">{info.description}</div>
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}

function SecondaryCTAProperties() {
  const data = [
    {
      logo: PropertyScalable,
      title: "Scalable",
      description: "Pinto can scale to meet market demand for trustless currency in DeFi. ",
    },
    {
      logo: PropertyLowVolatility,
      title: "Low Volatility",
      description: "Pinto seeks to minimize volatility in it’s value through thoughtful incentives.",
    },
    {
      logo: PropertyMediumOfExchange,
      title: "Medium of Exchange",
      description: "Pinto can facilitate seamless transactions between users.",
    },
    {
      logo: PropertyUnitOfAccount,
      title: "Unit of Account",
      description: "Pinto is a low-volatility value source onchain, which can be used to measure arbitrary value.",
    },
  ];

  return (
    <div className="flex flex-col items-start w-[25.625rem] animate-vertical-marquee">
      {Array(2)
        .fill(data)
        .flat()
        .map((info, index) => (
          <div key={`dataInfo2_${info.title}_${index}`} className="p-6 border rounded-2xl bg-pinto-off-white mb-12">
            <div className="h-[18.75rem] flex flex-col gap-6">
              <img src={info.logo} className="w-24 flex-shrink-0 h-auto" alt={info.title} />
              <div className="flex flex-col gap-4">
                <div className="text-lg leading-[1.1] font-thin text-black">{info.title}</div>
                <div className="text-xl leading-[1.1] font-thin text-pinto-gray-4">{info.description}</div>
              </div>
            </div>
          </div>
        ))}
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
        <h2 className="pinto-h2 text-5xl leading-[1.1] text-black items-center flex flex-col">
          <span>Pinto incentivizes coordination between</span>
          <span>farmers to create new money</span>
        </h2>
        <span ref={sloganRef} className="pinto-body-light font-thin text-pinto-gray-4">
          100% community backed
        </span>
        <div className="flex flex-row gap-4">
          <Link to={`${navLinks.docs}advanced/economics`} target="_blank" rel="noopener noreferrer">
            <Button rounded="full">Learn How →</Button>
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
      <div className="flex flex-col gap-20 mt-12 overflow-clip" style={{ height: `${initialHeightRem}rem` }}>
        <div className="mx-auto">
          <MainCTA />
        </div>
        <div className="my-auto">
          <LandingChart />
        </div>
      </div>
      <div className="flex flex-row overflow-clip" style={{ height: `${initialHeightRem}rem` }}>
        <div className="my-auto">
          <SecondaryCTA />
        </div>
        <div className="flex flex-row gap-12 ml-auto mr-12">
          <SecondaryCTAProperties />
          <SecondaryCTAValues />
        </div>
      </div>
      <div className="flex flex-col gap-12 overflow-clip" style={{ height: `${initialHeightRem}rem` }}>
        <FarmToTable height={initialHeightPx} />
      </div>
      <div className="flex flex-col gap-12 overflow-clip" style={{ height: `${initialHeightRem}rem` }}>
        <AuditMarquee />
        <BugBounty />
      </div>
      <div className="flex flex-col gap-12" style={{ height: `${initialHeightRem + navBarHeightRem / 3}rem` }}>
        <Resources />
      </div>
    </div>
  );
}
