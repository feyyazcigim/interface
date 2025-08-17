import ValueCensorshipResistance from "@/assets/misc/Value_Censorship_Resistance.svg";
import ValueCommunityRun from "@/assets/misc/Value_Community_Run.svg";
import ValueFairness from "@/assets/misc/Value_Fairness.svg";
import ValueOpenSource from "@/assets/misc/Value_Open_Source.svg";
import ValuePermissionless from "@/assets/misc/Value_Permissionlessness.svg";
import ValueTrustless from "@/assets/misc/Value_Trustlessness.svg";
import { useState } from "react";
import CardModal from "./CardModal";

const data = [
  {
    logo: ValueCensorshipResistance,
    title: "Censorship Resistance",
    partOfSpeech: "noun",
    pronunciation: "ˈsensərˌʃɪp rɪˈzɪstəns",
    definition:
      "The ability of a system to withstand attempts by authorities or third parties to prevent, restrict, or control transactions and communications.",
    pintoImplementation: "Pinto is designed to be maximally resistant to any censorship.",
    description: "Pinto is designed to be maximally resistant to any censorship.", // Keep for backward compatibility
  },
  {
    logo: ValueTrustless,
    title: "Trustlessness",
    partOfSpeech: "noun",
    pronunciation: "ˈtrʌstləsnəs",
    definition:
      "A system where participants don't need to trust each other or a central authority for the system to function correctly and securely.",
    pintoImplementation: "The monetary policy of Pinto is deterministic, eliminating any need for trust.",
    description: "The monetary policy of Pinto is deterministic, eliminating any need for trust.",
  },
  {
    logo: ValuePermissionless,
    title: "Permissionless",
    partOfSpeech: "adjective",
    pronunciation: "pərˈmɪʃənləs",
    definition:
      "A system that allows anyone to participate without requiring approval from a central authority or gatekeeper.",
    pintoImplementation: "Anyone with an Ethereum wallet can participate in Pinto.",
    description: "Anyone with an Ethereum wallet can participate in Pinto.",
  },
  {
    logo: ValueFairness,
    title: "Fairness",
    partOfSpeech: "noun",
    pronunciation: "ˈfɛrnəs",
    definition:
      "The principle that all participants in a system are treated equitably and have equal opportunities to benefit from their contributions.",
    pintoImplementation: "Pinto strives to fairly incentivize all participants.",
    description: "Pinto strives to fairly incentivize all participants.",
  },
  {
    logo: ValueOpenSource,
    title: "Open-source",
    partOfSpeech: "adjective",
    pronunciation: "ˈoʊpən sɔrs",
    definition:
      "Software or systems where the source code is freely available for anyone to view, modify, and distribute.",
    pintoImplementation: "All code is deployed on Base and publicly viewable by any participant.",
    description: "All code is deployed on Base and publicly viewable by any participant.",
  },
  {
    logo: ValueCommunityRun,
    title: "Community-run",
    partOfSpeech: "adjective",
    pronunciation: "kəˈmjunəti rʌn",
    definition:
      "A system governed and operated by its community members rather than a centralized organization or authority.",
    pintoImplementation: "Pinto is maintained by a decentralized group of contributors and run by it's community.",
    description: "Pinto is maintained by a decentralized group of contributors and run by it's community.",
  },
];

export default function SecondaryCTAValues() {
  const [selectedCard, setSelectedCard] = useState<(typeof data)[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCardClick = (cardData: (typeof data)[0]) => {
    setSelectedCard(cardData);
    setIsModalOpen(true);
  };

  const handleModalClose = (open: boolean) => {
    setIsModalOpen(open);
    if (!open) {
      setSelectedCard(null);
    }
  };

  return (
    <>
      <div className="w-fit flex flex-row items-center animate-long-marquee">
        {Array(8)
          .fill(data)
          .flat()
          .map((info, index) => (
            <div
              key={`dataInfo1_${info.title}_${index}`}
              className="p-4 sm:p-6 w-[16rem] h-[13rem] sm:w-[23.5rem] sm:h-[18rem] flex-shrink-0 border rounded-2xl bg-pinto-off-white mr-6 sm:mr-12 cursor-pointer transition-transform hover:scale-105 active:scale-95"
              onClick={() => handleCardClick(info)}
            >
              <div className="flex flex-col gap-4 sm:gap-6">
                <img src={info.logo} className="w-16 h-16 sm:w-24 sm:h-24 flex-shrink-0" alt={info.title} />
                <div className="flex flex-col gap-2 sm:gap-4">
                  <div className="text-base sm:text-lg leading-[1.1] font-thin text-black">{info.title}</div>
                  <div className="text-base sm:text-xl leading-[1.1] font-thin text-pinto-gray-4">
                    {info.pintoImplementation}
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>

      <CardModal isOpen={isModalOpen} onOpenChange={handleModalClose} cardData={selectedCard} />
    </>
  );
}
