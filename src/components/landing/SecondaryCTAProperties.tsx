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
    pintoImplementation: "Pinto can grow infinitely to meet market demand for trustless low-volatility currency.",
    description: `Scalable: Competitive volatility and carrying costs can be sustained at arbitrary supply. 

Collateralized stablecoins are limited by the amount of available collateral. Due to the lack of crypto-native collateral, collateralized stablecoins have been forced to sacrifice Bitcoin’s values and use centralized collateral in order to scale to meet demand. Instead of collateral, Pinto uses credit, which is infinitely scalable and network-native, enabling Pinto to grow to meet arbitrary demand without compromising on Bitcoin’s values.`,
  },
  {
    logo: PropertyLowVolatility,
    title: "Low Volatility",
    partOfSpeech: "noun phrase",
    pronunciation: "loʊ ˌvoʊləˈtɪləti",
    definition:
      "A characteristic of an asset whose value remains relatively stable over time, with minimal price fluctuations compared to other assets.",
    pintoImplementation:
      "Pinto seeks to minimize the volatility of its value through thoughtful incentives instead of trying to maintain a perfect peg.",
    description: `Low Volatility: Purchasing power varies minimally over time.

The stablecoin trilemma states that a stablecoin cannot be stable, scalable and decentralized. Pinto strikes the optimal balance within this trilemma by sacrificing perfect stability in favor of low volatility, thereby enabling it to scale to meet arbitrary demand without sacrificing the benefits of decentralization – which is not an end in and of itself – namely trustlessness, permissionlessness, censorship resistance and fairness.`,
  },
  {
    logo: PropertyMediumOfExchange,
    title: "Medium of Exchange",
    partOfSpeech: "noun phrase",
    pronunciation: "ˈmidiəm ʌv ɪksˈtʃeɪndʒ",
    definition:
      "An asset that is widely accepted as payment for goods and services, facilitating trade by eliminating the need for direct barter.",
    pintoImplementation:
      "Prioritizing low volatility and yield generation over upward price movement, Pinto is the optimal crypto-native medium of exchange.",
    description: `Medium of Exchange: An asset widely accepted as payment, enabling trade without direct barter.

Pinto has the unique combination of being low in volatility and generating native yield, which makes an optimal medium of exchange between various types of value. sPinto, the fungible yield-bearing ERC-20 wrapper of Pinto Deposits, offers the ability to integrate Pinto into existing DeFi primitives and distribute yield to liquidity providers with minimal friction.`,
  },
  {
    logo: PropertyUnitOfAccount,
    title: "Unit of Account",
    partOfSpeech: "noun phrase",
    pronunciation: "ˈjunət ʌv əˈkaʊnt",
    definition:
      "A standard monetary unit of measurement that provides a consistent way to value and compare different goods, services, and assets.",
    pintoImplementation:
      "Due to its low volatility and algorithmic distribution of newly minted currency, Pinto is the optimal crypto-native unit of account for loans.",
    description: `Unit of Account: A monetary standard used to price and compare value.

Unlike centralized fiat currencies, in which new currency is printed and distributed arbitrarily, often devaluing the wealth of the respective system's participants and the purchasing power of each unit of the currency, Pinto autonomously distributes newly minted currency directly to its holders. Combined with its native volatility-minimization mechanisms, the protocol creates a currency designed to serve as a unit of account for value and loans of value.`,
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
                  <div className="text-base leading-[1.1] font-thin text-black">{info.title}</div>
                  <div className="text-base leading-[1.1] font-thin text-pinto-gray-4">{info.pintoImplementation}</div>
                </div>
              </div>
            </div>
          ))}
      </div>

      <CardModal isOpen={isModalOpen} onOpenChange={handleModalClose} cardData={selectedCard} />
    </>
  );
}
