import ImmunefiLogo from "@/assets/misc/immunefi-logo.png";
import { truncateAddress } from "@/utils/string";
import { Separator } from "@radix-ui/react-separator";
import { Link } from "react-router-dom";
import { DiagonalRightArrowIcon } from "../Icons";

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

export default function AuditsList() {
  return (
    <div className="my-auto mx-auto flex flex-col gap-6">
      <div className="flex flex-row justify-between px-4 py-2">
        <div>{`${audits.length} audits to date`}</div>
        <Link to={"Idk"} target="_blank" rel="noopener noreferrer">
          Learn More about Audits
        </Link>
      </div>
      <div className="h-auto overflow-hidden">
        <div className="flex flex-col gap-4">
          {audits.map(
            (auditData, index) =>
              index <= 3 && (
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
              ),
          )}
        </div>
      </div>
    </div>
  );
}
