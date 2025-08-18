import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { DiagonalRightArrowIcon } from "../Icons";

type ActiveButton = "upgrades" | "contributors" | "years" | "volume" | null;

interface ProtocolUpgradesProps {
  activeButton: ActiveButton;
}

interface Audit {
  name: string;
  description: string;
  githubLink: string;
  hashLink: string;
  date: string;
  timestamp: number;
  auditHash: string;
  auditor: string;
  isYearMarker?: boolean;
  isCombined?: boolean;
  combinedHashes?: string[];
  combinedLinks?: string[];
  descriptions?: string[];
  customLines?: { before?: number; after?: number };
}

// Pinto Improvement Proposals
const piAudits: Audit[] = [
  {
    name: "PI-11",
    description: "Update Convert Down Penalty Gauge and Dewhitelist Pools",
    githubLink: "https://github.com/pinto-org/protocol/pull/136",
    hashLink: "",
    date: "July 31, 2025",
    timestamp: new Date("July 31, 2025").getTime(),
    auditHash: "",
    auditor: "cantina",
  },
  {
    name: "PI-10",
    description: "Fix Cultivation Gauge and Revise Parameters",
    githubLink: "https://github.com/pinto-org/protocol/pull/114",
    hashLink: "",
    date: "June 19, 2025",
    timestamp: new Date("June 19, 2025").getTime(),
    auditHash: "",
    auditor: "cantina",
  },
  {
    name: "PI-9",
    description: "Helper Function Bug Fix",
    githubLink: "https://github.com/pinto-org/protocol/pull/54",
    hashLink: "",
    date: "April 18, 2025",
    timestamp: new Date("April 18, 2025").getTime(),
    auditHash: "",
    auditor: "cantina",
  },
  {
    name: "PI-8",
    description: "Misc. Efficiency Improvements",
    githubLink: "https://github.com/pinto-org/protocol/pull/54",
    hashLink: "",
    date: "April 17, 2025",
    timestamp: new Date("April 17, 2025").getTime(),
    auditHash: "",
    auditor: "cantina",
  },
  {
    name: "PI-7",
    description: "Convert Down Penalty",
    githubLink: "https://github.com/pinto-org/protocol/pull/33",
    hashLink: "",
    date: "March 25, 2025",
    timestamp: new Date("March 25, 2025").getTime(),
    auditHash: "",
    auditor: "cantina",
  },
  {
    name: "PI-6",
    description: "Soil Issuance Below Target, Crop Ratio Changes",
    githubLink: "https://github.com/pinto-org/protocol/pull/8",
    hashLink: "",
    date: "March 12, 2025",
    timestamp: new Date("March 12, 2025").getTime(),
    auditHash: "",
    auditor: "cantina",
  },
  {
    name: "PI-5",
    description: "Soil Issuance and Parameter Changes",
    githubLink: "https://github.com/pinto-org/protocol/pull/7",
    hashLink: "",
    date: "January 2, 2025",
    timestamp: new Date("January 2, 2025").getTime(),
    auditHash: "",
    auditor: "cantina",
  },
  {
    name: "PI-4",
    description: "Demand for Soil Adjustments",
    githubLink: "https://github.com/pinto-org/protocol/pull/5",
    hashLink: "",
    date: "December 8, 2024",
    timestamp: new Date("December 8, 2024").getTime(),
    auditHash: "",
    auditor: "cantina",
  },
  {
    name: "PI-3",
    description: "Bug Fixes and Parameter Changes",
    githubLink: "https://github.com/pinto-org/protocol/pull/4",
    hashLink: "",
    date: "December 4, 2024",
    timestamp: new Date("December 4, 2024").getTime(),
    auditHash: "",
    auditor: "cantina",
  },
  {
    name: "PI-2",
    description: "Remove Anti L2L Convert",
    githubLink: "https://github.com/pinto-org/protocol/pull/3",
    hashLink: "",
    date: "November 27, 2024",
    timestamp: new Date("November 27, 2024").getTime(),
    auditHash: "",
    auditor: "cantina",
  },
  {
    name: "PI-1",
    description: "Convert Earned Pinto, Misc. Fixes",
    githubLink: "https://github.com/pinto-org/protocol/pull/2",
    hashLink: "",
    date: "November 26, 2024",
    timestamp: new Date("November 26, 2024").getTime(),
    auditHash: "",
    auditor: "cantina",
  },
  {
    name: "PI-0",
    description: "Update Pump Parameters",
    githubLink: "https://github.com/pinto-org/protocol/pull/1",
    hashLink: "",
    date: "November 19, 2024",
    timestamp: new Date("November 19, 2024").getTime(),
    auditHash: "",
    auditor: "cantina",
  },
];

// Bean Improvement Proposals
const bipAudits: Audit[] = [
  {
    name: "BIP-50",
    description: "Reseed Beanstalk",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/909",
    hashLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/909/commits/faa0ec60a455b0afdd20ad86f28f41cbc52c2e2d",
    date: "October 8, 2024",
    timestamp: new Date("October 8, 2024").getTime(),
    auditHash: "4e0ad0b964f74a1b4880114f4dd5b339bc69cd3e",
    auditor: "codehawks",
  },
  {
    name: "BIP-49",
    description: "Misc. Improvements",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/802",
    hashLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/802/commits/10c50916acdd1a2ea8c3699217779cbbe549389e",
    date: "August 5, 2024",
    timestamp: new Date("August 5, 2024").getTime(),
    auditHash: "0552609b63f76a69190015b7e2abfded60a30960",
    auditor: "codehawks",
  },
  {
    name: "BIP-48",
    description: "Whitelist BEANwstETH",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/758",
    hashLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/758/commits/45afeaf1f9c57bcdf506336aff63fa8805a1081f",
    date: "July 26, 2024",
    timestamp: new Date("July 26, 2024").getTime(),
    auditHash: "9b77984f43a1fd47f5617006502f28b8528962a3",
    auditor: "codehawks",
  },
  {
    name: "BIP-47",
    description: "Adjust Quorum",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/866",
    hashLink: "",
    date: "May 29, 2024",
    timestamp: new Date("May 29, 2024").getTime(),
    auditHash: "",
    auditor: "bean",
  },
  {
    name: "BIP-46",
    description: "Hypernative",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/842",
    hashLink: "",
    date: "May 21, 2024",
    timestamp: new Date("May 21, 2024").getTime(),
    auditHash: "",
    auditor: "bean",
  },
  {
    name: "BIP-45",
    description: "Seed Gauge",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/722",
    hashLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/722/commits/ac8e681c7daa7cb046c1e405b27e50e7e44c0504",
    date: "May 21, 2024",
    timestamp: new Date("May 21, 2024").getTime(),
    auditHash: "a3658861af8f5126224718af494d02352fbb3ea5",
    auditor: "codehawks",
  },
  {
    name: "BIP-44",
    description: "Seed Gauge",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/722",
    hashLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/722/commits/ac8e681c7daa7cb046c1e405b27e50e7e44c0504",
    date: "May 8, 2024",
    timestamp: new Date("May 8, 2024").getTime(),
    auditHash: "",
    auditor: "bean",
  },
  {
    name: "BIP-43",
    description: "Hypernative",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/842",
    hashLink: "",
    date: "May 8, 2024",
    timestamp: new Date("May 8, 2024").getTime(),
    auditHash: "",
    auditor: "bean",
  },
  {
    name: "BIP-41",
    description: "Immunefi Program Update",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/771",
    hashLink: "",
    date: "February 26, 2024",
    timestamp: new Date("February 26, 2024").getTime(),
    auditHash: "",
    auditor: "bean",
  },
  {
    name: "BIP-40",
    description: "Beanstalk Farms 2024 Development Budget",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/770",
    hashLink: "",
    date: "February 26, 2024",
    timestamp: new Date("February 26, 2024").getTime(),
    auditHash: "",
    auditor: "bean",
  },
  {
    name: "BIP-38",
    description: "Unripe Migration",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/655",
    hashLink: "https://github.com/BeanstalkFarms/Beanstalk/tree/76066733bcddb944b9af8f29acf150c02a5b8437",
    date: "October 20, 2023",
    timestamp: new Date("October 20, 2023").getTime(),
    auditHash: "76066733bcddb944b9af8f29acf150c02a5b8437",
    auditor: "cyfrin",
  },
  {
    name: "BIP-37",
    description: "Basin Integration",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/378",
    hashLink: "https://github.com/BeanstalkFarms/Beanstalk/tree/76a188233917afc1db103ca64b02dab8c5280b35",
    date: "August 30, 2023",
    timestamp: new Date("August 30, 2023").getTime(),
    auditHash: "78d7045a4e6900dfbdc5f1119b202b4f30ff6ab8",
    auditor: "halborn",
  },
  {
    name: "BIP-36",
    description: "Silo V3",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/410",
    hashLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/410/commits/9f286e1f1b1e67bc40d35aaf4b16e5c6d83ebdd9",
    date: "July 10, 2023",
    timestamp: new Date("July 10, 2023").getTime(),
    auditHash: "24bf3d33355f516648b02780b4b232181afde200",
    auditor: "halborn",
  },
  {
    name: "BIP-35",
    description: "Stalk Delegation and Process Amendments",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/401",
    hashLink: "",
    date: "May 3, 2023",
    timestamp: new Date("May 3, 2023").getTime(),
    auditHash: "",
    auditor: "bean",
  },
  {
    name: "BIP-34",
    description: "Sunrise Improvements",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/337",
    hashLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/337/commits/538b7a2a89760f6e7aab0fa3146551c030f388d1",
    date: "May 3, 2023",
    timestamp: new Date("May 3, 2023").getTime(),
    auditHash: "f37cb42809fb8dfc9a0f2891db1ad96a1b848a4c",
    auditor: "halborn",
  },
  {
    name: "BIP-33",
    description: "Beanstalk Farms H1 2023 Budget",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/175/commits/bac39bb8c51e8076c6fe9690ac2fd09c5bdbeeea",
    hashLink: "",
    date: "February 8, 2023",
    timestamp: new Date("February 8, 2023").getTime(),
    auditHash: "",
    auditor: "bean",
  },
  {
    name: "BIP-32",
    description: "Seraph",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/175",
    hashLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/175/commits/bac39bb8c51e8076c6fe9690ac2fd09c5bdbeeea",
    date: "January 7, 2023",
    timestamp: new Date("January 7, 2023").getTime(),
    auditHash: "",
    auditor: "bean",
  },
  {
    name: "BIP-31",
    description: "Beanstalk Farms Q1 2023 Budget",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/176",
    hashLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/176/commits/91554e8ebeb9237eb83ecbfa5451e170bdcc3c15",
    date: "January 7, 2023",
    timestamp: new Date("January 7, 2023").getTime(),
    auditHash: "",
    auditor: "bean",
  },
  {
    name: "BIP-30",
    description: "Pipeline",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/103",
    hashLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/103/commits/9029875262f83cf394b0ed048704133e16e969d4",
    date: "December 1, 2022",
    timestamp: new Date("December 1, 2022").getTime(),
    auditHash: "e193bdf747e804c13280453f3dbb52ebc797091b",
    auditor: "halborn",
  },
  {
    name: "BIP-29",
    description: "Pod Market Price Functions",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/87",
    hashLink: "https://github.com/BeanstalkFarms/Beanstalk/tree/0bdd376263b0fe94af84aaf4adb6391b39fa80ab",
    date: "November 11, 2022",
    timestamp: new Date("November 11, 2022").getTime(),
    auditHash: "0bdd376263b0fe94af84aaf4adb6391b39fa80ab",
    auditor: "halborn",
  },
  {
    name: "BIP-27",
    description: "Bean Sprout Q4 2022 Budget",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/101",
    hashLink: "",
    date: "October 6, 2022",
    timestamp: new Date("October 6, 2022").getTime(),
    auditHash: "",
    auditor: "bean",
  },
  {
    name: "BIP-26",
    description: "Immunefi Bug Bounty Program",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/100",
    hashLink: "",
    date: "October 6, 2022",
    timestamp: new Date("October 6, 2022").getTime(),
    auditHash: "",
    auditor: "bean",
  },
  {
    name: "BIP-25",
    description: "Beanstalk Farms Q4 2022 Budget",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/99",
    hashLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/99/commits/4e7a4a8417e743a8b4f3aec972ecbce9c267adc7",
    date: "October 5, 2022",
    timestamp: new Date("October 5, 2022").getTime(),
    auditHash: "",
    auditor: "bean",
  },
  {
    name: "BIP-24",
    description: "Fungible BDV Support",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/82",
    hashLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/82/commits/877224df1f6f98245a8693fa74fd37657bee13e2",
    date: "October 5, 2022",
    timestamp: new Date("October 5, 2022").getTime(),
    auditHash: "6699e071626a17283facc67242536037989ecd91",
    auditor: "halborn",
  },
  {
    name: "BIP-23",
    description: "Bean Sprout Q3 2022 Budget",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/79",
    hashLink: "https://github.com/BeanstalkFarms/Beanstalk/commit/42ebfdc80201361d7eb72c1c54dc3432fd9d3e4c",
    date: "August 16, 2022",
    timestamp: new Date("August 16, 2022").getTime(),
    auditHash: "",
    auditor: "bean",
  },
  {
    name: "BIP-22",
    description: "Beanstalk Farms Q3 2022 Budget",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/78",
    hashLink: "https://github.com/BeanstalkFarms/Beanstalk/commit/3b13177801b740d0f89918ea786f05f3f8d3cc0d",
    date: "August 16, 2022",
    timestamp: new Date("August 16, 2022").getTime(),
    auditHash: "",
    auditor: "bean",
  },
  {
    name: "BIP-21",
    description: "Replant Beanstalk",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/72",
    hashLink: "",
    date: "August 5, 2022",
    timestamp: new Date("August 5, 2022").getTime(),
    auditHash: "",
    auditor: "bean",
  },
  {
    name: "BIP-20",
    description: "Migration of Balances",
    githubLink: "https://bean.money/bip-20",
    hashLink: "",
    date: "June 21, 2022",
    timestamp: new Date("June 21, 2022").getTime(),
    auditHash: "",
    auditor: "bean",
  },
  {
    name: "Governance Exploit Response",
    description: "",
    githubLink: "",
    hashLink: "",
    date: "April 17, 2022",
    combinedLinks: ["https://bean.money/bip-18", "https://bean.money/bip-19"],
    combinedHashes: ["", ""],
    descriptions: ["BIP-18", "BIP-19"],
    timestamp: new Date("April 17, 2022").getTime(),
    auditHash: "",
    auditor: "bean",
    isCombined: true,
    customLines: { after: 12 },
  },
  {
    name: "BIP-17",
    description: "Bean Sprout Q2 2022 Budget",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/69",
    hashLink: "",
    date: "April 22, 2022",
    timestamp: new Date("April 22, 2022").getTime(),
    auditHash: "",
    auditor: "bean",
  },
  {
    name: "BIP-16",
    description: "Whitelist BEAN:LUSD Curve Pool",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/66",
    hashLink: "",
    date: "April 13, 2022",
    timestamp: new Date("April 13, 2022").getTime(),
    auditHash: "",
    auditor: "bean",
  },
  {
    name: "BIP-15",
    description: "Demand for Soil Improvement",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/62",
    hashLink: "",
    date: "April 11, 2022",
    timestamp: new Date("April 11, 2022").getTime(),
    auditHash: "",
    auditor: "bean",
  },
  {
    name: "BIP-14",
    description: "Beanstalk Farms Q2 2022 Budget",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/61",
    hashLink: "",
    date: "April 10, 2022",
    timestamp: new Date("April 10, 2022").getTime(),
    auditHash: "",
    auditor: "bean",
  },
  {
    name: "BIP-13",
    description: "Adjustment to Weather Changes",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/52",
    hashLink: "",
    date: "March 11, 2022",
    timestamp: new Date("March 11, 2022").getTime(),
    auditHash: "",
    auditor: "bean",
  },
  {
    name: "BIP-12",
    description: "Silo Generalization I",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/46",
    hashLink: "",
    date: "February 19, 2022",
    timestamp: new Date("February 19, 2022").getTime(),
    auditHash: "",
    auditor: "bean",
  },
  {
    name: "BIP-11",
    description: "Farmers Market",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/44",
    hashLink: "",
    date: "February 10, 2022",
    timestamp: new Date("February 10, 2022").getTime(),
    auditHash: "",
    auditor: "bean",
  },
  {
    name: "BIP-10",
    description: "Omniscia Retainer",
    githubLink:
      "https://github.com/BeanstalkFarms/Beanstalk-Governance-Proposals/blob/master/bip/bip-10-omniscia-retainer.md",
    hashLink: "",
    date: "February 3, 2022",
    timestamp: new Date("February 3, 2022").getTime(),
    auditHash: "",
    auditor: "bean",
  },
  {
    name: "BIP-9",
    description: "Various Efficiency Improvements",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/34",
    hashLink: "",
    date: "January 11, 2022",
    timestamp: new Date("January 11, 2022").getTime(),
    auditHash: "",
    auditor: "bean",
  },
  {
    name: "BIP-8",
    description: "Beanstalk Q1 Budget",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/34",
    hashLink: "",
    date: "January 6, 2022",
    timestamp: new Date("January 6, 2022").getTime(),
    auditHash: "",
    auditor: "bean",
  },
  {
    name: "BIP-7",
    description: "Expanded Convert",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/19",
    hashLink: "",
    date: "December 19, 2021",
    timestamp: new Date("December 19, 2021").getTime(),
    auditHash: "",
    auditor: "bean",
  },
  {
    name: "BIP-6",
    description: "Soil Efficiency",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/14",
    hashLink: "",
    date: "December 9, 2021",
    timestamp: new Date("December 9, 2021").getTime(),
    auditHash: "",
    auditor: "bean",
  },
  {
    name: "BIP-5",
    description: "Omniscia Audit",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/10",
    hashLink: "",
    date: "December 4, 2021",
    timestamp: new Date("December 4, 2021").getTime(),
    auditHash: "",
    auditor: "bean",
  },
  {
    name: "BIP-4",
    description: "Trail of Bits Audit and Fundraisers",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/9",
    hashLink: "",
    date: "December 4, 2021",
    timestamp: new Date("December 4, 2021").getTime(),
    auditHash: "",
    auditor: "bean",
  },
  {
    name: "BIP-3",
    description: "Beanstalk Farms Capital Formation Advisor Budget",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/6",
    hashLink: "",
    date: "November 25, 2021",
    timestamp: new Date("November 25, 2021").getTime(),
    auditHash: "",
    auditor: "bean",
  },
  {
    name: "BIP-2",
    description: "Capital Gains Tax Efficiency Improvement and Adjustment to Weather Changes",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/4",
    hashLink: "",
    date: "November 10, 2021",
    timestamp: new Date("November 10, 2021").getTime(),
    auditHash: "",
    auditor: "bean",
  },
  {
    name: "BIP-1",
    description: "Beanstalk Farms Q4 2021 Dev and Marketing Budget",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/3",
    hashLink: "",
    date: "October 20, 2021",
    timestamp: new Date("October 20, 2021").getTime(),
    auditHash: "",
    auditor: "bean",
  },
  {
    name: "BIP-0",
    description: "Silo Refactor",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/1",
    hashLink: "",
    date: "August 25, 2021",
    timestamp: new Date("August 25, 2021").getTime(),
    auditHash: "",
    auditor: "bean",
  },
];

// Emergency Bean Improvement Proposals
const ebipAudits: Audit[] = [
  {
    name: "EBIP-17",
    description: "Misc Bug Fixes",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/960",
    hashLink: "https://github.com/BeanstalkFarms/Beanstalk/tree/36b8574bdb96c1045a4d361ee0b2fe7e23e4cbcf",
    date: "July 16, 2024",
    timestamp: new Date("July 16, 2024").getTime(),
    auditHash: "",
    auditor: "bean",
  },
  {
    name: "EBIP-16",
    description: "Fix Germinating Earned Bean Deposits",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/914",
    hashLink: "https://github.com/BeanstalkFarms/Beanstalk/tree/52152aba368a99bedaface6f18ec432ee3bb9a0a",
    date: "June 2, 2024",
    timestamp: new Date("June 2, 2024").getTime(),
    auditHash: "",
    auditor: "bean",
  },
  {
    name: "EBIP-15",
    description: "Seed Gauge System Fixes",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/892",
    hashLink: "https://github.com/BeanstalkFarms/Beanstalk/tree/2315d3f4a5dc217140c3b95cfec9f48a1d9c35f7",
    date: "May 24, 2024",
    timestamp: new Date("May 24, 2024").getTime(),
    auditHash: "",
    auditor: "bean",
  },
  {
    name: "EBIP-14",
    description: "Remove Vesting Period",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/762",
    hashLink: "https://github.com/BeanstalkFarms/Beanstalk/tree/4f7f45832d2fd7b7d9e8ef81125f1392a307433c",
    date: "February 5, 2024",
    timestamp: new Date("February 5, 2024").getTime(),
    auditHash: "",
    auditor: "bean",
  },
  {
    name: "EBIP-13",
    description: "Re-Add Convert",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/682",
    hashLink: "https://github.com/BeanstalkFarms/Beanstalk/tree/77996e48e1979c493c94103c7b6f4876fa80e4dc",
    date: "November 9, 2023",
    timestamp: new Date("November 9, 2023").getTime(),
    auditHash: "",
    auditor: "bean",
  },
  {
    name: "EBIP-12",
    description: "Remove Convert",
    githubLink:
      "https://github.com/BeanstalkFarms/Beanstalk-Governance-Proposals/blob/master/bip/ebip/ebip-12-remove-convert.md",
    hashLink: "",
    date: "November 8, 2023",
    timestamp: new Date("November 8, 2023").getTime(),
    auditHash: "",
    auditor: "bean",
  },
  {
    name: "EBIP-11",
    description: "Upgrade Minting Oracle to 60 Minute TWA ETH/USD Price",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/676",
    hashLink: "https://github.com/BeanstalkFarms/Beanstalk/tree/82f980b8e94f97873fb3d1fc6e99930a01ad2c16",
    date: "October 30, 2023",
    timestamp: new Date("October 30, 2023").getTime(),
    auditHash: "",
    auditor: "bean",
  },
  {
    name: "EBIP-10",
    description: "Fix Bean to LP Well Convert",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/671",
    hashLink: "",
    date: "October 23, 2023",
    timestamp: new Date("October 23, 2023").getTime(),
    auditHash: "",
    auditor: "bean",
  },
  {
    name: "EBIP-9",
    description: "Temporarily Disable the Well Minting Oracle",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/669",
    hashLink: "",
    date: "October 20, 2023",
    timestamp: new Date("October 20, 2023").getTime(),
    auditHash: "",
    auditor: "bean",
  },
  {
    name: "EBIP-8",
    description: "Enroot BDV Rounding",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/389",
    hashLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/389/commits/c6425b4e5ea6597a97e41a934583a31f4bf807ee",
    date: "May 13, 2023",
    timestamp: new Date("May 13, 2023").getTime(),
    auditHash: "",
    auditor: "bean",
  },
  {
    name: "EBIP-7",
    description: "Enroot BDV Update",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/170",
    hashLink: "",
    date: "December 9, 2022",
    timestamp: new Date("December 9, 2022").getTime(),
    auditHash: "",
    auditor: "bean",
  },
  {
    name: "EBIP-6",
    description: "Resolve EBIP-4 and EBIP-5",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/146",
    hashLink: "",
    date: "November 15, 2022",
    timestamp: new Date("November 15, 2022").getTime(),
    auditHash: "",
    auditor: "bean",
  },
  {
    name: "EBIP-5",
    description: "Remove transferTokenFrom Function",
    githubLink:
      "https://github.com/BeanstalkFarms/Beanstalk-Governance-Proposals/blob/master/bip/ebip/ebip-05-remove-transfertokenfrom-function.md",
    hashLink: "",
    date: "November 14, 2022",
    timestamp: new Date("November 14, 2022").getTime(),
    auditHash: "",
    auditor: "bean",
  },
  {
    name: "EBIP-4",
    description: "Remove V1 Pod Order Functions",
    githubLink:
      "https://github.com/BeanstalkFarms/Beanstalk-Governance-Proposals/blob/master/bip/ebip/ebip-04-remove-v1-pod-order-functions.md",
    hashLink: "",
    date: " November 12, 2022",
    timestamp: new Date("November 12, 2022").getTime(),
    auditHash: "",
    auditor: "bean",
  },
  {
    name: "EBIP-3",
    description: "Pod Listing Cancellation",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/135",
    hashLink: "https://github.com/BeanstalkFarms/Beanstalk/commit/b2b7b6af2913dda868030fba4947575258583c69",
    date: "October 25, 2022",
    timestamp: new Date("October 25, 2022").getTime(),
    auditHash: "",
    auditor: "bean",
  },
  {
    name: "EBIP-2",
    description: "deltaB Cap",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/92",
    hashLink: "https://github.com/BeanstalkFarms/Beanstalk/commit/7168560db94426bbf736b4919a1ea4bccbdeab27",
    date: "September 13, 2022",
    timestamp: new Date("September 13, 2022").getTime(),
    auditHash: "",
    auditor: "bean",
  },
  {
    name: "EBIP-1",
    description: "Remove Chop",
    githubLink: "https://app.bean.money/#/governance/ebip-1",
    hashLink: "",
    date: "September 5, 2022",
    timestamp: new Date("September 5, 2022").getTime(),
    auditHash: "",
    auditor: "bean",
  },
  {
    name: "EBIP-0",
    description: "Earned Beans Forfeiture",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk/pull/80",
    hashLink: "https://github.com/BeanstalkFarms/Beanstalk/commit/fa8612e3698d932004f45cd3260c5ad71893b006",
    date: "August 10, 2022",
    timestamp: new Date("August 10, 2022").getTime(),
    auditHash: "",
    auditor: "bean",
  },
];

// Audits
const regularAudits: Audit[] = [
  {
    name: "Cyfrin Complete Audit",
    description: "",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk-Audits/blob/main/beanstalk/09-12-23-cyfrin-report.pdf",
    hashLink: "https://github.com/BeanstalkFarms/Beanstalk/tree/c7a20e56a0a6659c09314a877b440198eff0cd81",
    date: "September 12, 2023",
    timestamp: new Date("September 12, 2023").getTime(),
    auditHash: "c7a20e56a0a6659c09314a877b440198eff0cd81",
    auditor: "cyfrin",
  },
  {
    name: "Beanstalk Halborn Report #2",
    description: "",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk-Audits/blob/main/beanstalk/12-13-22-halborn-report.pdf",
    hashLink: "https://github.com/BeanstalkFarms/Beanstalk/tree/6699e071626a17283facc67242536037989ecd91",
    date: "December 13, 2022",
    timestamp: new Date("December 13, 2022").getTime(),
    auditHash: "6699e071626a17283facc67242536037989ecd91",
    auditor: "halborn",
    customLines: { before: 6, after: 10 },
  },
  {
    name: "Trail Of Bits Audit",
    description: "",
    githubLink: "",
    hashLink: "",
    date: "July 22, 2022",
    combinedLinks: [
      "https://github.com/BeanstalkFarms/Beanstalk-Audits/blob/main/beanstalk/07-22-22-tob-report.pdf",
      "https://github.com/BeanstalkFarms/Beanstalk-Audits/blob/main/beanstalk/07-22-22-tob-fix-review.pdf",
    ],
    combinedHashes: [
      "https://github.com/BeanstalkFarms/Beanstalk/tree/f501c25eb41e391c35a2926dacca7d9912e700f3",
      "https://github.com/BeanstalkFarms/Beanstalk/tree/9422ad60cbb4ece7cfb4f0925c4586fb4582e7df",
    ],
    descriptions: ["Report", "Fix Review"],
    timestamp: new Date("July 22, 2022").getTime(),
    auditHash: "",
    auditor: "trailOfBits",
    isCombined: true,
  },
  {
    name: "Omniscia Audit",
    description: "",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk-Audits/blob/main/beanstalk/04-02-22-omniscia-report.md",
    hashLink: "https://github.com/BeanstalkFarms/Beanstalk/tree/ee4720cdb449d5b6ff2b789083792c4395628674",
    date: "April 2, 2022",
    timestamp: new Date("April 2, 2022").getTime(),
    auditHash: "ee4720cdb449d5b6ff2b789083792c4395628674",
    auditor: "omniscia",
  },
  {
    name: "Halborn Audit",
    description: "",
    githubLink: "https://github.com/BeanstalkFarms/Beanstalk-Audits/blob/main/beanstalk/07-13-22-halborn-report.pdf",
    hashLink: "https://github.com/BeanstalkFarms/Beanstalk/tree/1447fa2c0d42c73345a38edb4f4dad076392f429",
    date: "July 13, 2022",
    timestamp: new Date("July 13, 2022").getTime(),
    auditHash: "1447fa2c0d42c73345a38edb4f4dad076392f429",
    auditor: "halborn",
  },
];

// Combine all audits and sort by timestamp (most recent first)
// If timestamps are equal, sort by audit number (lowest number first)
const audits: Audit[] = [...piAudits, ...bipAudits, ...ebipAudits, ...regularAudits].sort((a, b) => {
  // Primary sort: timestamp (most recent first)
  if (a.timestamp !== b.timestamp) {
    return b.timestamp - a.timestamp;
  }

  // Secondary sort: extract numbers from audit names for same timestamps
  const getAuditNumber = (name: string): number => {
    const match = name.match(/(?:BIP|PI|EBIP)-(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };

  const aNumber = getAuditNumber(a.name);
  const bNumber = getAuditNumber(b.name);

  // If both have numbers, sort by number (lowest first)
  if (aNumber && bNumber) {
    return aNumber - bNumber;
  }

  // Fallback to alphabetical sort
  return a.name.localeCompare(b.name);
});

export default function ProtocolUpgrades({ activeButton }: ProtocolUpgradesProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasScrolledRef = useRef(false);
  const [isVisible, setIsVisible] = useState(false);

  // Create year markers for each year between the first and last audit
  const createYearMarkers = () => {
    const sortedOriginalAudits = [...audits].sort((a, b) => a.timestamp - b.timestamp);
    const firstYear = new Date(sortedOriginalAudits[0].timestamp).getFullYear();
    const lastYear = new Date(sortedOriginalAudits[sortedOriginalAudits.length - 1].timestamp).getFullYear();

    const yearMarkers: Audit[] = [];
    for (let year = firstYear; year <= lastYear; year++) {
      yearMarkers.push({
        name: `${year}`,
        description: "",
        githubLink: "",
        hashLink: "",
        date: `January 1, ${year}`,
        timestamp: new Date(`January 1, ${year}`).getTime(),
        auditHash: "",
        auditor: "",
        isYearMarker: true,
      });
    }

    return [...sortedOriginalAudits, ...yearMarkers];
  };

  const sortedAudits = createYearMarkers().sort((a, b) => a.timestamp - b.timestamp);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const calculateConnectingLines = (index: number) => {
    const currentAudit = sortedAudits[index];
    const nextAudit = sortedAudits[index + 1];

    // Check if current audit has custom lines specified
    if (currentAudit.customLines) {
      const customBefore = currentAudit.customLines.before ?? 0;
      const customAfter = currentAudit.customLines.after ?? 10;

      // For first entry, use custom before value
      if (index === 0) return { before: customBefore, after: customAfter };

      // For last entry, use custom after value
      if (index === sortedAudits.length - 1) return { before: customBefore, after: customAfter };

      return { before: customBefore, after: customAfter };
    }

    // First entry: always 10 lines before
    if (index === 0) return { before: 10, after: 10 };

    // Last entry: always 10 lines after
    if (index === sortedAudits.length - 1) return { before: 0, after: 10 };

    // Calculate time difference in days between current and next audit
    const currentTimestamp = currentAudit.timestamp;
    const nextTimestamp = nextAudit.timestamp;
    const daysDifference = (nextTimestamp - currentTimestamp) / (1000 * 60 * 60 * 24);

    // Check if either current or next audit is a year marker
    const isCurrentYear = currentAudit.isYearMarker;
    const isNextYear = nextAudit.isYearMarker;
    const isCombined = nextAudit.isCombined;

    // If either is a year marker, minimum 3 lines
    const minimumLines = isCombined ? 14 : isCurrentYear || isNextYear ? 4 : 6;

    // Scale lines based on time difference (1 line per day, with minimum and maximum)
    const lines = Math.min(Math.max(Math.round(daysDifference / 1), minimumLines), 15);

    return { before: 0, after: lines };
  };

  // Scroll to the rightmost side when activeButton becomes "upgrades"
  useEffect(() => {
    if (activeButton === "upgrades" && !hasScrolledRef.current) {
      const scrollToEnd = () => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
          hasScrolledRef.current = true;
          setIsVisible(true);
        }
      };

      // Try after a short delay to ensure content is rendered
      const timeoutId = setTimeout(scrollToEnd, 150);

      return () => clearTimeout(timeoutId);
    }
  }, [activeButton]);

  // Add horizontal scroll wheel functionality and trackpad gestures
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleWheel = (e: WheelEvent) => {
      // Handle horizontal trackpad swipes (deltaX) and convert vertical scroll to horizontal (deltaY)
      if (e.deltaX !== 0) {
        // Direct horizontal scrolling from trackpad swipes
        e.preventDefault();
        scrollContainer.scrollLeft += e.deltaX;
      } else if (e.deltaY !== 0) {
        // Convert vertical scroll wheel to horizontal scroll
        e.preventDefault();
        scrollContainer.scrollLeft += e.deltaY;
      }
    };

    scrollContainer.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      scrollContainer.removeEventListener("wheel", handleWheel);
    };
  }, []);

  return (
    <div
      ref={scrollContainerRef}
      className={`relative w-screen overflow-x-auto p-0 sm:p-6 scrollbar-none ${isVisible ? "opacity-100" : "opacity-0"} transition-all transform-gpu`}
      style={{
        marginLeft: `calc(-50vw + 50%)`,
        marginRight: `calc(-50vw + 50%)`,
      }}
    >
      <div className="flex flex-row min-w-max items-center gap-3 sm:gap-4">
        {sortedAudits.map((audit, index) => {
          const { before, after } = calculateConnectingLines(index);
          const hasDescription =
            (audit.name.startsWith("BIP-") || audit.name.startsWith("PI-") || audit.name.startsWith("EBIP-")) &&
            audit.description &&
            audit.description.length > 0;

          return (
            <>
              {/* Before lines for first entry */}
              {before > 0 &&
                Array.from({ length: before }).map((_, i) => (
                  <div
                    key={`before-${index}-${i}`}
                    className="w-[1px] h-[5rem] sm:h-24 bg-pinto-gray-2 mt-4 mb-[0.375rem]"
                  />
                ))}

              <div key={audit.name} className="relative flex flex-col items-center flex-shrink-0">
                {audit.isYearMarker ? (
                  <>
                    {/* Year marker */}
                    <span className="text-base sm:text-xl font-light text-black text-center items-center justify-center absolute bottom-0 w-20">
                      {audit.name}
                    </span>
                    {/* Year connecting line - thicker */}
                    <div className="w-[1px] h-28 sm:h-36 bg-black mt-10 mb-8" />
                  </>
                ) : (
                  <>
                    {audit.isCombined ? (
                      <div className="flex flex-col gap-0.5 absolute top-0 group text-center items-center justify-center py-2 px-4">
                        <span className="text-base sm:text-xl font-light text-pinto-green-4 absolute top-0 group-hover:-top-6 whitespace-nowrap transition-all transform-gpu">
                          {audit.name}
                        </span>
                        <div className="flex flex-row gap-2 whitespace-nowrap">
                          {audit.descriptions?.map((description, index) => {
                            if (!audit.combinedLinks) return;
                            return (
                              <Link
                                key={index}
                                to={audit.combinedLinks[index]}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-row gap-0.5 text-pinto-green-4 hover:underline decoration-1 opacity-0 group-hover:opacity-100 transition-all transform-gpu text-center items-center justify-center"
                              >
                                <span className="text-base sm:text-xl font-light text-pinto-green-4">
                                  {description}
                                </span>
                                <DiagonalRightArrowIcon color="currentColor" width={"1.5rem"} height={"1.5rem"} />
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      /* Audit name */
                      <div className="flex flex-col-reverse gap-0.5 absolute top-0 text-center items-center justify-center py-2 px-4">
                        <Link
                          to={audit.githubLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex flex-row gap-0.5 text-pinto-green-4 peer hover:underline decoration-1 whitespace-nowrap text-center items-center justify-center absolute top-0 transition-all transform-gpu`}
                        >
                          <span className="text-base sm:text-xl font-light text-pinto-green-4">{audit.name}</span>
                          <DiagonalRightArrowIcon color="currentColor" width={"1.5rem"} height={"1.5rem"} />
                        </Link>
                        {hasDescription && (
                          <span className="text-sm font-light text-pinto-green-4 text-center whitespace-nowrap opacity-0 peer-hover:opacity-100 peer-hover:underline peer-hover:cursor-pointer absolute top-0 peer-hover:-top-6 transition-all transform-gpu pointer-events-none">
                            {audit.description}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Connecting line */}
                    <div className="w-[1px] h-[5rem] sm:h-[7.5rem] bg-pinto-green-4 mt-8 sm:mt-10 mb-6" />
                    {/* Date */}
                    <span className="text-xs sm:text-base font-light text-pinto-gray-4 absolute bottom-0 w-20 text-center">
                      {formatDate(audit.date)}
                    </span>
                  </>
                )}
              </div>

              {/* After lines */}
              {after > 0 &&
                Array.from({ length: after }).map((_, i) => (
                  <div
                    key={`after-${index}-${i}`}
                    className="w-[1px] h-20 sm:h-24 bg-pinto-gray-2 mt-4 mb-[0.375rem]"
                  />
                ))}
            </>
          );
        })}
      </div>
    </div>
  );
}
