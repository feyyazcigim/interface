import PropertyLowVolatility from "@/assets/misc/Property_Low_Volatility.svg";
import PropertyMediumOfExchange from "@/assets/misc/Property_Medium_of_Exchange.svg";
import PropertyScalable from "@/assets/misc/Property_Scalable.svg";
import PropertyUnitOfAccount from "@/assets/misc/Property_Unit_of_Account.svg";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import CardModal from "./CardModal";

const data = [
  {
    logo: PropertyScalable,
    title: "Scalable",
    subtitle: "Pinto can grow infinitely to meet market demand for trustless low-volatility currency.",
    description: `**Scalable:** Competitive volatility and carrying costs can be sustained at arbitrary supply. 

Collateralized stablecoins are limited by the amount of available collateral. Due to the lack of crypto-native collateral, collateralized stablecoins have been forced to sacrifice Bitcoin's values and use centralized collateral in order to scale to meet demand. Instead of collateral, Pinto uses credit, which is infinitely scalable and network-native, enabling Pinto to grow to meet arbitrary demand without compromising on Bitcoin's values.`,
  },
  {
    logo: PropertyLowVolatility,
    title: "Low Volatility",
    subtitle:
      "Pinto seeks to minimize the volatility of its value through thoughtful incentives instead of trying to maintain a perfect peg.",
    description: `**Low Volatility:** Purchasing power varies minimally over time.

The stablecoin trilemma states that a stablecoin cannot be stable, scalable and decentralized. Pinto strikes the optimal balance within this trilemma by sacrificing perfect stability in favor of low volatility, thereby enabling it to scale to meet arbitrary demand without sacrificing the benefits of decentralization – which is not an end in and of itself – namely trustlessness, permissionlessness, censorship resistance and fairness.`,
  },
  {
    logo: PropertyMediumOfExchange,
    title: "Medium of Exchange",
    subtitle:
      "Prioritizing low volatility and yield generation over upward price movement, Pinto is the optimal crypto-native medium of exchange.",
    description: `**Medium of Exchange:** An asset widely accepted as payment, enabling trade without direct barter.

Pinto has the unique combination of being low in volatility and generating native yield, which makes an optimal medium of exchange between various types of value. sPinto, the fungible yield-bearing ERC-20 wrapper of Pinto Deposits, offers the ability to integrate Pinto into existing DeFi primitives and distribute yield to liquidity providers with minimal friction.`,
  },
  {
    logo: PropertyUnitOfAccount,
    title: "Unit of Account",
    subtitle:
      "Due to its low volatility and algorithmic distribution of newly minted currency, Pinto is the optimal crypto-native unit of account for loans.",
    description: `**Unit of Account:** A monetary standard used to price and compare value.

Unlike centralized fiat currencies, in which new currency is printed and distributed arbitrarily, often devaluing the wealth of the respective system's participants and the purchasing power of each unit of the currency, Pinto autonomously distributes newly minted currency directly to its holders. Combined with its native volatility-minimization mechanisms, the protocol creates a currency designed to serve as a unit of account for value and loans of value.`,
  },
];

interface SecondaryCTAPropertiesProps {
  glowingCardIndex?: number;
}

export default function SecondaryCTAProperties({ glowingCardIndex = -1 }: SecondaryCTAPropertiesProps) {
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
          .map((info, index) => {
            // Calculate original data index for glow effect
            const originalIndex = index % data.length;
            const isGlowing = glowingCardIndex === originalIndex;

            return (
              <Button
                key={`dataInfo2_${info.title}_${index}`}
                variant="outline-white"
                className={`flex flex-col hover:bg-pinto-green-1 gap-4 items-start 2xl:gap-6 p-4 2xl:p-4 w-[16rem] h-[13rem] 2xl:w-[23.5rem] 2xl:h-[16rem] flex-shrink-0 rounded-2xl bg-pinto-off-white mr-6 2xl:mr-12 sm:hover:scale-105 sm:active:scale-95 ${
                  isGlowing ? "shadow-[0_0_20px_rgba(56,127,92,0.6),0_0_40px_rgba(56,127,92,0.4)] scale-[1.02]" : ""
                }`}
                style={
                  {
                    "--glow-color": isGlowing ? "rgba(56, 127, 92, 0.6)" : undefined,
                    "--transition-duration-glow": "700ms",
                    "--transition-duration-hover": "200ms",
                    transition:
                      "box-shadow var(--transition-duration-glow) ease-in-out, transform var(--transition-duration-glow) ease-in-out",
                    ...(isGlowing
                      ? {}
                      : {
                          transition:
                            "box-shadow var(--transition-duration-glow) ease-in-out, transform var(--transition-duration-hover) ease-in-out",
                        }),
                  } as React.CSSProperties
                }
                onClick={() => handleCardClick(info)}
              >
                <img src={info.logo} className="w-16 h-16 2xl:w-20 2xl:h-20 flex-shrink-0 text-left" alt={info.title} />
                <div className="flex flex-col flex-1 gap-2 2xl:gap-4">
                  <div className="text-base text-left leading-[1.1] font-thin text-black">{info.title}</div>
                  <div className="text-xs sm:text-base leading-[1.1] font-thin text-pinto-gray-4 whitespace-normal text-left">
                    {info.subtitle}
                  </div>
                </div>
              </Button>
            );
          })}
      </div>

      <CardModal isOpen={isModalOpen} onOpenChange={handleModalClose} cardData={selectedCard} />
    </>
  );
}
