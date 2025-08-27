import PropertyLowVolatility from "@/assets/misc/Property_Low_Volatility.svg";
import PropertyMediumOfExchange from "@/assets/misc/Property_Medium_of_Exchange.svg";
import PropertyScalable from "@/assets/misc/Property_Scalable.svg";
import PropertyUnitOfAccount from "@/assets/misc/Property_Unit_of_Account.svg";
import { useState } from "react";
import CardModal from "./CardModal";

const data = [
  {
    logo: PropertyScalable,
    title: "Scalable",
    partOfSpeech: "adjective",
    pronunciation: "ˈskeɪləbəl",
    definition:
      "The ability of a system to handle increased demand, transaction volume, or user adoption without compromising performance or functionality.",
    pintoImplementation: "Pinto can scale to meet market demand for trustless currency in DeFi.",
    description: "Pinto can scale to meet market demand for trustless currency in DeFi. ", // Keep for backward compatibility
  },
  {
    logo: PropertyLowVolatility,
    title: "Low Volatility",
    partOfSpeech: "noun phrase",
    pronunciation: "loʊ ˌvoʊləˈtɪləti",
    definition:
      "A characteristic of an asset whose value remains relatively stable over time, with minimal price fluctuations compared to other assets.",
    pintoImplementation: "Pinto seeks to minimize volatility in it's value through thoughtful incentives.",
    description: "Pinto seeks to minimize volatility in it's value through thoughtful incentives.",
  },
  {
    logo: PropertyMediumOfExchange,
    title: "Medium of Exchange",
    partOfSpeech: "noun phrase",
    pronunciation: "ˈmidiəm ʌv ɪksˈtʃeɪndʒ",
    definition:
      "An asset that is widely accepted as payment for goods and services, facilitating trade by eliminating the need for direct barter.",
    pintoImplementation: "Pinto can facilitate seamless transactions between users.",
    description: "Pinto can facilitate seamless transactions between users.",
  },
  {
    logo: PropertyUnitOfAccount,
    title: "Unit of Account",
    partOfSpeech: "noun phrase",
    pronunciation: "ˈjunət ʌv əˈkaʊnt",
    definition:
      "A standard monetary unit of measurement that provides a consistent way to value and compare different goods, services, and assets.",
    pintoImplementation:
      "Pinto is a low-volatility value source onchain, which can be used to measure arbitrary value.",
    description: "Pinto is a low-volatility value source onchain, which can be used to measure arbitrary value.",
  },
];

export default function SecondaryCTAProperties() {
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
      <div className="w-fit flex flex-row items-center animate-long-marquee-reverse">
        {Array(12)
          .fill(data)
          .flat()
          .map((info, index) => (
            <div
              key={`dataInfo2_${info.title}_${index}`}
              className="p-4 2xl:p-4 w-[16rem] h-[13rem] 2xl:w-[23.5rem] 2xl:h-[16rem] flex-shrink-0 border rounded-2xl bg-pinto-off-white mr-6 2xl:mr-12 cursor-pointer transition-transform sm:hover:scale-105 sm:active:scale-95"
              onClick={() => handleCardClick(info)}
            >
              <div className="flex flex-col gap-4 2xl:gap-6">
                <img src={info.logo} className="w-16 h-16 2xl:w-20 2xl:h-20 flex-shrink-0" alt={info.title} />
                <div className="flex flex-col gap-2 2xl:gap-4">
                  <div className="text-base 2xl:text-xl leading-[1.1] font-thin text-black">{info.title}</div>
                  <div className="text-base 2xl:text-xl leading-[1.1] font-thin text-pinto-gray-4">
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
