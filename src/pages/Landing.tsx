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
import { DiagonalRightArrowIcon } from "@/components/Icons";
import LandingChart from "@/components/LandingChart";
import MinimalistConcentricCircles from "@/components/MinimalistConcentricCircles";
import GameOfLife from "@/components/landing/GameOfLife";
import { navLinks } from "@/components/nav/nav/Navbar";
import { Separator } from "@/components/ui/Separator";
import { useAverageBDVWeightedSiloAPYs } from "@/state/useSiloAPYs";
import { formatPct } from "@/utils/format";
import { truncateAddress } from "@/utils/string";
import NumberFlow from "@number-flow/react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
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

function AuditsList() {
  const audits = [
    {
      name: "PI-9",
      description: "Helper Function Bug Fix",
      githubLink: "https://github.com/pinto-org/protocol/pull/54",
      hashLink: "",
      date: "April 18, 2025",
      auditHash: "",
      auditor: "cantina",
    },
    {
      name: "PI-8",
      description: "Misc. Efficiency Improvements",
      githubLink: "https://github.com/pinto-org/protocol/pull/54",
      hashLink: "",
      date: "April 17, 2025",
      auditHash: "",
      auditor: "cantina",
    },
    {
      name: "PI-7",
      description: "Convert Down Penalty",
      githubLink: "https://github.com/pinto-org/protocol/pull/33",
      hashLink: "",
      date: "March 25, 2025",
      auditHash: "",
      auditor: "cantina",
    },
    {
      name: "PI-6",
      description: "Soil Issuance Below Target, Crop Ratio Changes",
      githubLink: "https://github.com/pinto-org/protocol/pull/8",
      hashLink: "",
      date: "March 12, 2025",
      auditHash: "",
      auditor: "cantina",
    },
    {
      name: "PI-5",
      description: "Soil Issuance and Parameter Changes",
      githubLink: "https://github.com/pinto-org/protocol/pull/7",
      hashLink: "",
      date: "January 2, 2025",
      auditHash: "",
      auditor: "cantina",
    },
    {
      name: "PI-4",
      description: "Demand for Soil Adjustments",
      githubLink: "https://github.com/pinto-org/protocol/pull/5",
      hashLink: "",
      date: "December 8, 2024",
      auditHash: "",
      auditor: "cantina",
    },
    {
      name: "PI-3",
      description: "Bug Fixes and Parameter Changes",
      githubLink: "https://github.com/pinto-org/protocol/pull/4",
      hashLink: "",
      date: "December 4, 2024",
      auditHash: "",
      auditor: "cantina",
    },
    {
      name: "PI-2",
      description: "Remove Anti L2L Convert",
      githubLink: "https://github.com/pinto-org/protocol/pull/3",
      hashLink: "",
      date: "November 27, 2024",
      auditHash: "",
      auditor: "cantina",
    },
    {
      name: "PI-1",
      description: "Convert Earned Pinto, Misc. Fixes",
      githubLink: "https://github.com/pinto-org/protocol/pull/2",
      hashLink: "",
      date: "November 26, 2024",
      auditHash: "",
      auditor: "cantina",
    },
    {
      name: "PI-0",
      description: "Update Pump Parameters",
      githubLink: "https://github.com/pinto-org/protocol/pull/1",
      hashLink: "",
      date: "November 19, 2024",
      auditHash: "",
      auditor: "cantina",
    },
    {
      name: "BIP-50",
      description: "Reseed Beanstalk",
      githubLink:
        "https://github.com/BeanstalkFarms/Beanstalk-Audits/blob/main/beanstalk/08-09-24-bip-50-codehawks-report.md",
      hashLink: "https://github.com/Cyfrin/2024-05-beanstalk-the-finale/tree/4e0ad0b964f74a1b4880114f4dd5b339bc69cd3e",
      date: "August 9, 2024",
      auditHash: "4e0ad0b964f74a1b4880114f4dd5b339bc69cd3e",
      auditor: "codehawks",
    },
    {
      name: "BIP-49",
      description: "Misc. Improvements",
      githubLink:
        "https://github.com/BeanstalkFarms/Beanstalk-Audits/blob/main/beanstalk/05-30-24-bip-49-codehawks-report.md",
      hashLink: "https://github.com/Cyfrin/2024-05-Beanstalk-3/tree/0552609b63f76a69190015b7e2abfded60a30960",
      date: "May 30, 2024",
      auditHash: "0552609b63f76a69190015b7e2abfded60a30960",
      auditor: "codehawks",
    },
    {
      name: "BIP-48",
      description: "Whitelist BEANwstETH",
      githubLink:
        "https://github.com/BeanstalkFarms/Beanstalk-Audits/blob/main/beanstalk/05-04-24-bip-48-codehawks-report.md",
      hashLink: "https://github.com/Cyfrin/2024-04-beanstalk-2/tree/9b77984f43a1fd47f5617006502f28b8528962a3",
      date: "May 4, 2024",
      auditHash: "9b77984f43a1fd47f5617006502f28b8528962a3",
      auditor: "codehawks",
    },
    {
      name: "BIP-45",
      description: "Seed Gauge",
      githubLink:
        "https://github.com/BeanstalkFarms/Beanstalk-Audits/blob/main/beanstalk/04-06-24-bip-45-codehawks-report.md",
      hashLink: "https://github.com/Cyfrin/2024-02-Beanstalk-1/tree/a3658861af8f5126224718af494d02352fbb3ea5",
      date: "April 6, 2024",
      auditHash: "a3658861af8f5126224718af494d02352fbb3ea5",
      auditor: "codehawks",
    },
    {
      name: "BIP-38",
      description: "Unripe Migration",
      githubLink:
        "https://github.com/BeanstalkFarms/Beanstalk-Audits/blob/main/beanstalk/10-13-23-bip-38-cyfrin-report.pdf",
      hashLink: "https://github.com/BeanstalkFarms/Beanstalk/tree/76066733bcddb944b9af8f29acf150c02a5b8437",
      date: "October 13, 2023",
      auditHash: "76066733bcddb944b9af8f29acf150c02a5b8437",
      auditor: "cyfrin",
    },
    {
      name: "Cyfrin Complete Audit",
      description: "",
      githubLink: "https://github.com/BeanstalkFarms/Beanstalk-Audits/blob/main/beanstalk/09-12-23-cyfrin-report.pdf",
      hashLink: "https://github.com/BeanstalkFarms/Beanstalk/tree/c7a20e56a0a6659c09314a877b440198eff0cd81",
      date: "September 12, 2023",
      auditHash: "c7a20e56a0a6659c09314a877b440198eff0cd81",
      auditor: "cyfrin",
    },
    {
      name: "BIP-37",
      description: "Basin Integration",
      githubLink:
        "https://github.com/BeanstalkFarms/Beanstalk-Audits/blob/main/beanstalk/07-24-23-bip-37-halborn-report.pdf",
      hashLink: "https://github.com/BeanstalkFarms/Beanstalk/tree/78d7045a4e6900dfbdc5f1119b202b4f30ff6ab8",
      date: "July 24, 2023",
      auditHash: "78d7045a4e6900dfbdc5f1119b202b4f30ff6ab8",
      auditor: "halborn",
    },
    {
      name: "BIP-36",
      description: "Silo V3",
      githubLink:
        "https://github.com/BeanstalkFarms/Beanstalk-Audits/blob/main/beanstalk/06-30-23-bip-36-halborn-report.pdf",
      hashLink: "https://github.com/BeanstalkFarms/Beanstalk/tree/24bf3d33355f516648b02780b4b232181afde200",
      date: "June 30, 2023",
      auditHash: "24bf3d33355f516648b02780b4b232181afde200",
      auditor: "halborn",
    },
    {
      name: "BIP-34",
      description: "Sunrise Improvements",
      githubLink:
        "https://github.com/BeanstalkFarms/Beanstalk-Audits/blob/main/beanstalk/04-18-23-bip-34-halborn-report.pdf",
      hashLink: "https://github.com/BeanstalkFarms/Beanstalk/tree/f37cb42809fb8dfc9a0f2891db1ad96a1b848a4c",
      date: "April 18, 2023",
      auditHash: "f37cb42809fb8dfc9a0f2891db1ad96a1b848a4c",
      auditor: "halborn",
    },
    {
      name: "Beanstalk Halborn Report #2",
      description: "",
      githubLink: "https://github.com/BeanstalkFarms/Beanstalk-Audits/blob/main/beanstalk/12-13-22-halborn-report.pdf",
      hashLink: "https://github.com/BeanstalkFarms/Beanstalk/tree/6699e071626a17283facc67242536037989ecd91",
      date: "December 13, 2022",
      auditHash: "6699e071626a17283facc67242536037989ecd91",
      auditor: "halborn",
    },
    {
      name: "BIP-30",
      description: "Pipeline",
      githubLink:
        "https://github.com/BeanstalkFarms/Beanstalk-Audits/blob/main/beanstalk/12-01-22-bip-30-halborn-report.pdf",
      hashLink: "https://github.com/BeanstalkFarms/Beanstalk/tree/e193bdf747e804c13280453f3dbb52ebc797091b",
      date: "December 1, 2022",
      auditHash: "e193bdf747e804c13280453f3dbb52ebc797091b",
      auditor: "halborn",
    },
    {
      name: "BIP-29",
      description: "Pod Market Price Functions",
      githubLink:
        "https://github.com/BeanstalkFarms/Beanstalk-Audits/blob/main/beanstalk/11-04-22-bip-29-halborn-report.pdf",
      hashLink: "https://github.com/BeanstalkFarms/Beanstalk/tree/0bdd376263b0fe94af84aaf4adb6391b39fa80ab",
      date: "November 4, 2022",
      auditHash: "0bdd376263b0fe94af84aaf4adb6391b39fa80ab",
      auditor: "halborn",
    },
    {
      name: "BIP-24",
      description: "Fungible BDV Support",
      githubLink:
        "https://github.com/BeanstalkFarms/Beanstalk-Audits/blob/main/beanstalk/09-23-22-bip-24-halborn-report.pdf",
      hashLink: "https://github.com/BeanstalkFarms/Beanstalk/tree/6699e071626a17283facc67242536037989ecd91",
      date: "September 23, 2022",
      auditHash: "6699e071626a17283facc67242536037989ecd91",
      auditor: "halborn",
    },
    {
      name: "Trail Of Bits Fix Review",
      description: "",
      githubLink: "https://github.com/BeanstalkFarms/Beanstalk-Audits/blob/main/beanstalk/07-22-22-tob-fix-review.pdf",
      hashLink: "https://github.com/BeanstalkFarms/Beanstalk/tree/9422ad60cbb4ece7cfb4f0925c4586fb4582e7df",
      date: "July 22, 2022",
      auditHash: "9422ad60cbb4ece7cfb4f0925c4586fb4582e7df",
      auditor: "trailOfBits",
    },
    {
      name: "Trail Of Bits Report",
      description: "",
      githubLink: "https://github.com/BeanstalkFarms/Beanstalk-Audits/blob/main/beanstalk/07-22-22-tob-report.pdf",
      hashLink: "https://github.com/BeanstalkFarms/Beanstalk/tree/f501c25eb41e391c35a2926dacca7d9912e700f3",
      date: "July 22, 2022",
      auditHash: "f501c25eb41e391c35a2926dacca7d9912e700f3",
      auditor: "trailOfBits",
    },
    {
      name: "Halborn Audit",
      description: "",
      githubLink: "https://github.com/BeanstalkFarms/Beanstalk-Audits/blob/main/beanstalk/07-13-22-halborn-report.pdf",
      hashLink: "https://github.com/BeanstalkFarms/Beanstalk/tree/1447fa2c0d42c73345a38edb4f4dad076392f429",
      date: "July 13, 2022",
      auditHash: "1447fa2c0d42c73345a38edb4f4dad076392f429",
      auditor: "halborn",
    },
    {
      name: "Omniscia Audit",
      description: "",
      githubLink: "https://github.com/BeanstalkFarms/Beanstalk-Audits/blob/main/beanstalk/04-02-22-omniscia-report.md",
      hashLink: "https://github.com/BeanstalkFarms/Beanstalk/tree/ee4720cdb449d5b6ff2b789083792c4395628674",
      date: "April 2, 2022",
      auditHash: "ee4720cdb449d5b6ff2b789083792c4395628674",
      auditor: "omniscia",
    },
  ];

  const auditors = {
    cantina: {
      url: "https://cantina.xyz/",
      src: "cantina.svg",
      alt: "cantina",
      className: "",
      height: "h-5",
    },
    halborn: {
      url: "https://www.halborn.com/",
      src: "halborn.png",
      alt: "halborn",
      className: "",
      height: "h-9",
    },
    codehawks: {
      url: "https://codehawks.cyfrin.io/",
      src: "codehawks.svg",
      alt: "codehawks",
      className: "",
      height: "h-9",
    },
    cyfrin: {
      url: "https://www.cyfrin.io/",
      src: "cyfrin.svg",
      alt: "cyfrin",
      className: "",
      height: "h-9",
    },
    egis: {
      url: "https://www.egissec.com/",
      src: "egis.png",
      alt: "egis security",
      className: "col-span-5",
      height: "h-5",
    },
    trailOfBits: {
      url: "https://www.trailofbits.com/",
      src: "trail-of-bits.png",
      alt: "trail of bits",
      className: "",
      height: "h-16",
      imgClassName: "",
    },
    immunefi: {
      url: "https://immunefi.com/",
      src: ImmunefiLogo,
      alt: "ImmuneFi",
      className: "",
      height: "h-5",
    },
    omniscia: {
      url: "https://omniscia.io/",
      src: "omniscia.png",
      alt: "omniscia",
      className: "",
      height: "h-9",
      imgClassName: "",
    },
  };

  return (
    <div className="my-auto mx-auto flex flex-col gap-6">
      <div className="flex flex-row justify-between px-4 py-2">
        <div>{`${audits.length} audits to date`}</div>
        <Link to={"Idk"} target="_blank" rel="noopener noreferrer">
          Learn More about Audits
        </Link>
      </div>
      <div className="h-96 overflow-hidden">
        <div className="flex flex-col gap-4 animate-vertical-marquee-small">
          {Array(4)
            .fill(audits)
            .flat()
            .map((auditData, index) => (
              <div key={`audit_${auditData.name}_${index}`}>
                {auditData.name === "BIP-50" && (
                  <div className="flex flex-row gap-4 items-center mb-4">
                    <Separator className="flex-1" />
                    <div className="font-thin text-[1.5rem] text-pinto-gray-4 whitespace-nowrap">
                      Inherited security through Beanstalk
                    </div>
                    <Separator className="flex-1" />
                  </div>
                )}
                <div className="flex flex-row justify-between p-6 border rounded-[0.75rem] bg-pinto-off-white w-[62.5rem]">
                  <div className="flex flex-col gap-4 justify-between">
                    <div className="flex flex-row gap-2 text-[1.5rem] text-black items-center leading-normal">
                      <span className="font-normal">{auditData.name}</span>
                      <span className="font-thin">{auditData.description}</span>
                      <Link to={auditData.githubLink} target="_blank" rel="noopener noreferrer">
                        <img
                          src="github.svg"
                          alt="github"
                          className="opacity-30 hover:opacity-100 transition-opacity"
                        />
                      </Link>
                    </div>
                    <div className="flex flex-row gap-2 text-[1.25rem] text-pinto-gray-4 font-thin items-center">
                      <span>{auditData.date}</span>
                      {auditData.auditHash && auditData.hashLink && (
                        <>
                          <Separator orientation="vertical" className="h-5" />
                          <span>Audit Hash:</span>
                          <Link
                            to={auditData.hashLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-row gap-0.5 items-center text-pinto-green-4 hover:underline decoration-1"
                          >
                            <span>{truncateAddress(auditData.auditHash, { suffix: true, letters: 3 })}</span>
                            <DiagonalRightArrowIcon color="currentColor" />
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-4">
                    <span className="text-[1.25rem] text-pinto-gray-4 font-thin text-end">Audited by</span>
                    <Link
                      key={`${auditors[auditData.auditor].alt}-${index}`}
                      to={auditors[auditData.auditor].url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={auditors[auditData.auditor].className}
                    >
                      <img
                        src={auditors[auditData.auditor].src}
                        className={`${auditors[auditData.auditor].height} w-full object-fill opacity-40 hover:opacity-100 transition-opacity ${auditors[auditData.auditor].imgClassName || ""}`}
                        alt={auditors[auditData.auditor].alt}
                      />
                    </Link>
                  </div>
                </div>
                {auditData.name === "Omniscia Audit" && (
                  <div className="mt-4">
                    <Separator />
                  </div>
                )}
              </div>
            ))}
        </div>
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
  const resourceCards = [
    {
      title: "Learn",
      description: "Learn more about the incentives that coordinate the farm.",
      pattern: "tenCell",
      buttons: [
        {
          href: navLinks.docs,
          icon: "gitbook.png",
          label: "Docs",
        },
        {
          href: navLinks.blog,
          icon: "mirror.png",
          label: "Blog",
        },
      ],
    },
    {
      title: "Engage",
      description:
        "Ask questions, participate in discussion about protocol improvements and connect with other farmers.",
      pattern: "trafficCircle",
      buttons: [
        {
          href: navLinks.twitter,
          icon: "twitter.png",
          label: "@pintodotmoney",
        },
        {
          href: navLinks.discord,
          icon: "discord.png",
          label: "Discord",
        },
      ],
    },
    {
      title: "Participate",
      description: "Plant your own crops and join the movement.",
      pattern: "trafficCircle",
      buttons: [
        {
          href: navLinks.discord,
          label: "Dashboard",
        },
      ],
    },
  ];

  const cardStyles =
    "border border-pinto-gray-2 rounded-[1.25rem] w-[32rem] flex flex-col gap-8 overflow-clip bg-white";
  const buttonStyles = "w-full flex p-4 justify-center items-center gap-2.5 h-[3.125rem] text-sm font-normal";

  return (
    <div className="flex flex-col items-center self-stretch gap-12 mx-auto">
      <h2 className="text-4xl leading-same-h2 font-light text-black">Resources</h2>
      <div className="flex flex-row gap-8">
        {resourceCards.map((card, index) => (
          <div key={index} className={cardStyles}>
            <div className="overflow-hidden relative h-[24rem] flex justify-center items-center">
              <GameOfLife startingPattern={card.pattern} />
            </div>

            <div className="flex flex-col gap-8 mx-6 mb-6">
              <div className="flex flex-col gap-4">
                <span className="text-[2rem] font-light text-black">{card.title}</span>
                <span className="text-[1.5rem] font-light text-pinto-gray-4 h-24">{card.description}</span>
              </div>

              <div className={`flex flex-row gap-4 ${card.buttons.length === 1 ? "" : ""}`}>
                {card.buttons.map((button, buttonIndex) => (
                  <Link key={buttonIndex} to={button.href} target="_blank" rel="noopener noreferrer" className="flex-1">
                    <Button variant="outline-white" className={buttonStyles}>
                      {button.icon && <img src={button.icon} className="w-8 h-8 min-w-8 min-h-8" alt={button.label} />}
                      <span className="w-full text-start">{button.label}</span>
                      <span>→</span>
                    </Button>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ))}
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
      <div className="flex flex-col gap-4 overflow-clip" style={{ height: `${initialHeightRem}rem` }}>
        <BugBounty />
        <AuditsList />
      </div>
      <div className="flex flex-col gap-12" style={{ height: `${initialHeightRem + navBarHeightRem / 3}rem` }}>
        <Resources />
      </div>
    </div>
  );
}
