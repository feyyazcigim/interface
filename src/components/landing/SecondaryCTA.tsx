import PropertyLowVolatility from "@/assets/misc/Property_Low_Volatility.svg";
import PropertyMediumOfExchange from "@/assets/misc/Property_Medium_of_Exchange.svg";
import PropertyScalable from "@/assets/misc/Property_Scalable.svg";
import PropertyUnitOfAccount from "@/assets/misc/Property_Unit_of_Account.svg";
import ValueCensorshipResistance from "@/assets/misc/Value_Censorship_Resistance.svg";
import ValueFairness from "@/assets/misc/Value_Fairness.svg";
import ValueOpenSource from "@/assets/misc/Value_Open_Source.svg";
import ValuePermissionlessness from "@/assets/misc/Value_Permissionlessness.svg";
import ValueTrustless from "@/assets/misc/Value_Trustlessness.svg";
import useIsMobile from "@/hooks/display/useIsMobile";
import { useLiquidityDistribution } from "@/hooks/useLiquidityDistribution";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { PintoRightArrow } from "../Icons";
import { navLinks } from "../nav/nav/Navbar";
import { Button } from "../ui/Button";
import { Separator } from "../ui/Separator";
import CardModal from "./CardModal";

// Function to create values data with dynamic liquidity distribution
const createValuesData = (liquidityDistributionText: string) => [
  {
    logo: ValueCensorshipResistance,
    title: "Censorship Resistance",
    subtitle: "Pinto is designed to be maximally resistant to censorship.",
    definition: "**Censorship Resistant:** resilient to the prevention of valid actions from being executed reliably.",
    description: `Censorship can take the form of: 

1. **Communication failures:** single or coordinated actors blocking or delaying information sharing
2. **Availability failures**
    
    **Availability:** accessibility and operational readiness
    
3. **Liveness failures**
    
    **Liveness:** eventual progress and completion of all valid operations
    
4. **Integrity failures**
    
    **Integrity:** correct completion of operations
    

While Pinto trades against a variety of value which is subject to censorship, the currency itself is designed to be free from censorship. Due to the lack of censorship resistant value on chain (besides ETH), Pinto must manage the risk of censorship by minimizing the concentration of risk of censorship by any one party. Instances where some of the value Pinto trades against is censored, Pinto's price and liquidity would fall, but the integrity of the protocol as a whole would be maintained. 

${liquidityDistributionText || "Loading liquidity distribution data..."}

A future blacklist mitigation mechanism will extend the censorship resistance of the protocol by pushing the risk of holding censorable value within the protocol onto the holders of that value, instead of the protocol as a whole, by automatically freezing the Pinto in the censored pool. In this case, even if one of the non-Pinto assets in a Pinto liquidity pool is censored, while total liquidity would decrease, the value in all the other pools and pure Pinto would be protected. This design will safeguard the health of the protocol and encourage participants to favor Depositing value that increases overall censorship resistance.`,
  },
  {
    logo: ValueTrustless,
    title: "Trustlessness",
    subtitle:
      "Pinto is building fiat currency free from the risk of arbitrary money printing and interest rate manipulation.",
    definition:
      "**Trustlessness:** reliability is assured through autonomy, incorruptibility, and verifiability rather than trust.",
    description: `Key components of trustlessness include:

- **Reliability:** consistent and correct performance.
    - Reliable systems function as expected over time under both normal and adverse conditions.
- **Autonomy:** rule compliance guaranteed by internal mechanisms.
    - A system is autonomous if its rules are upheld by protocol design and crypto-economics without arbitrary or subjective judgement.
- **Incorruptibility:** resistance to unauthorized change.
    - Incorruptible systems prevent rules from being manipulated and tampered with. Change occurs only through explicitly defined mechanisms and authorized processes, ensuring the system's integrity cannot be compromised.
- **Verifiability:** the ability to independently validate correctness.
    - A system is verifiable to a participant if they can confirm correctness without trusting any party. Verification is typically enabled by transparency, reproducibility, or cryptographic proofs.

Pinto functions autonomously according to verifiable rules and parameters, which the Pinto Community Multisig (PCM) upgrades transparently to improve the protocol. Two weeks after the protocol reaches 500M supply, the PCM will forfeit governance of Pinto, with the exception of fixing security vulnerabilities and bugs. In its place, a permissionless fork system will enable continued improvements while protecting participants from having the code underlying their currency ever changed without their consent.`,
  },
  {
    logo: ValuePermissionlessness,
    title: "Permissionlessness",
    subtitle: "Anyone with an internet connection and funds on the Ethereum network can participate in Pinto.",
    definition: "**Permissionlessness:** the absence of approval requirements for participation.",
    description: `**Permissioned**: the quality of requiring approval for participation

Note: Barriers of strict technical capacity do not constitute permissions (*e.g.,* internet connection, gas payment).

Pinto is open for anyone to participate.`,
  },
  {
    logo: ValueFairness,
    title: "Fairness",
    subtitle: "The Pinto printer is designed to be free from capture.",
    definition: "**Fair:** Treating all parties impartially according to agreed upon rules and standards.",
    description: `In a fair market, informed participants act freely and compete on a playing field with the following properties:

- existing competitive advantages are difficult to entrench. 'Capture' is difficult, restricted to product or strategy alpha rather than privileged access or anti-competitive techniques.
- while participants can spend to achieve certain advantages over others, each additional marginal increase in advantage over other participants has increasing marginal costs.
- latency and information asymmetry are minimal.

Pinto functions according to explicitly defined rules. While Pinto rewards older and larger Deposits with more mints, the competitive advantage of older Deposits decreases over time and larger Deposits cost more for each marginal unit of value Deposited. [Tractor makes autonomous execution available to every participant](https://mirror.xyz/0x8F02813a0AC20affC2C7568e0CB9a7cE5288Ab27/cUuaXyfIWa3ugQUDs-7WVHy4DRBsfbLelzoaRv-H-QE), independent of technical savvy, and minimizes information asymmetry within the constraints of the EVM.`,
  },
  {
    logo: ValueOpenSource,
    title: "Open-Source",
    subtitle: "From code to plain language write-ups, Pinto is accessible to everyone.",
    definition: "**Open Source:** Artifacts (e.g Designs, Code, Documentation) with key freedoms:",
    description: `1. **Run:** anyone can use an Artifact without restriction.
2. **Study:** anyone can study an Artifact and understand how it works.
3. **Modify:** anyone can modify an Artifact and create new Artifacts from it.
4. **Distribute:** anyone can distribute an Artifact in its original or modified form. 

The protocol is [completely open-source](https://github.com/pinto-org), and tremendous effort has gone into defining it and putting it into context, from rigorous technical documentation (*i.e.*, [the whitepaper](https://pinto.money/pinto.pdf)) to plain language [explainers](https://mirror.xyz/0x8F02813a0AC20affC2C7568e0CB9a7cE5288Ab27).`,
  },
];

// Properties data (USD properties - green glow)
const propertiesData = [
  {
    logo: PropertyScalable,
    title: "Scalable",
    subtitle: "Pinto can grow infinitely to meet market demand for trustless low-volatility currency.",
    definition: "**Scalable:** Competitive volatility and carrying costs can be sustained at arbitrary supply.",
    description: `Collateralized stablecoins are limited by the amount of available collateral. Due to the lack of crypto-native collateral, collateralized stablecoins have been forced to sacrifice Bitcoin's values and use centralized collateral in order to scale to meet demand. Instead of collateral, Pinto uses credit, which is infinitely scalable and network-native, enabling Pinto to grow to meet arbitrary demand without compromising on Bitcoin's values.`,
  },
  {
    logo: PropertyLowVolatility,
    title: "Low Volatility",
    subtitle:
      "Pinto seeks to minimize the volatility of its value through thoughtful incentives instead of trying to maintain a perfect peg.",
    definition: "**Low Volatility:** Purchasing power varies minimally over time.",
    description: `The stablecoin trilemma states that a stablecoin cannot be stable, scalable and decentralized. Pinto strikes the optimal balance within this trilemma by sacrificing perfect stability in favor of low volatility, thereby enabling it to scale to meet arbitrary demand without sacrificing the benefits of decentralization – which is not an end in and of itself – namely trustlessness, permissionlessness, censorship resistance and fairness.`,
  },
  {
    logo: PropertyMediumOfExchange,
    title: "Medium of Exchange",
    subtitle:
      "Prioritizing low volatility and yield generation over upward price movement, Pinto is the optimal crypto-native medium of exchange.",
    definition: "**Medium of Exchange:** An asset widely accepted as payment, enabling trade without direct barter.",
    description: `Pinto has the unique combination of being low in volatility and generating native yield, which makes an optimal medium of exchange between various types of value. sPinto, the fungible yield-bearing ERC-20 wrapper of Pinto Deposits, offers the ability to integrate Pinto into existing DeFi primitives and distribute yield to liquidity providers with minimal friction.`,
  },
  {
    logo: PropertyUnitOfAccount,
    title: "Unit of Account",
    subtitle:
      "Due to its low volatility and algorithmic distribution of newly minted currency, Pinto is the optimal crypto-native unit of account for loans.",
    definition: "**Unit of Account:** A monetary standard used to price and compare value.",
    description: `Unlike centralized fiat currencies, in which new currency is printed and distributed arbitrarily, often devaluing the wealth of the respective system's participants and the purchasing power of each unit of the currency, Pinto autonomously distributes newly minted currency directly to its holders. Combined with its native volatility-minimization mechanisms, the protocol creates a currency designed to serve as a unit of account for value and loans of value.`,
  },
];

interface GlowingCard {
  component: "values" | "properties";
  cardIndex: number;
}

interface CardData {
  logo: string;
  title: string;
  subtitle: string;
  definition: string;
  description: string;
}

interface CarouselCardProps {
  data: CardData;
  index: number;
  keyPrefix: string;
  isGlowing: boolean;
  glowColor: string;
  hoverBgColor: string;
  onClick: (cardData: CardData) => void;
}

function CarouselCard({ data, index, keyPrefix, isGlowing, glowColor, hoverBgColor, onClick }: CarouselCardProps) {
  return (
    <Button
      key={`${keyPrefix}_${data.title}_${index}`}
      variant="outline-white"
      className={`flex flex-col ${hoverBgColor} gap-4 items-start 2xl:gap-6 p-4 2xl:p-4 w-[16rem] h-[13rem] 2xl:w-[23.5rem] 2xl:h-[16rem] flex-shrink-0 rounded-2xl bg-pinto-off-white mr-6 2xl:mr-12 sm:hover:scale-105 sm:active:scale-95 ${
        isGlowing
          ? glowColor === "orange"
            ? "shadow-[0_0_20px_rgba(255,166,77,0.6),0_0_40px_rgba(255,166,77,0.4)] scale-[1.02]"
            : "shadow-[0_0_20px_rgba(56,127,92,0.6),0_0_40px_rgba(56,127,92,0.4)] scale-[1.02]"
          : ""
      }`}
      style={
        {
          "--glow-color": isGlowing ? glowColor : undefined,
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
      onClick={() => onClick(data)}
    >
      <img src={data.logo} className="w-16 h-16 2xl:w-20 2xl:h-20 flex-shrink-0 text-left" alt={data.title} />
      <div className="flex flex-col flex-1 gap-2 2xl:gap-4">
        <div className="text-base text-left leading-[1.1] font-thin text-black">{data.title}</div>
        <div className="text-xs sm:text-base leading-[1.1] font-thin text-pinto-gray-4 whitespace-normal text-left">
          {data.subtitle}
        </div>
      </div>
    </Button>
  );
}

export default function SecondaryCTA() {
  const isMobile = useIsMobile();
  const { formattedText: liquidityDistributionText, loading: liquidityLoading } = useLiquidityDistribution();

  // Create valuesData with dynamic liquidity distribution
  const valuesData = createValuesData(liquidityDistributionText);

  // Modal state
  const [selectedCard, setSelectedCard] = useState<(typeof valuesData)[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Glow effect state management
  const [glowingCard, setGlowingCard] = useState<GlowingCard | null>(null);
  const glowTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Constants for glow effect
  const GLOW_DURATION = 2000; // 2 second glow
  const GAP_DURATION = 1500; // 1.5 second gap with no glow
  const TOTAL_CYCLE_TIME = GLOW_DURATION + GAP_DURATION; // 3.5 seconds total
  const TOTAL_VALUES_CARDS = valuesData.length; // 5
  const TOTAL_PROPERTIES_CARDS = propertiesData.length; // 4

  // Flip-flop selection logic with center-weighted preference for better visibility
  const selectRandomCard = useCallback(
    (currentCard: GlowingCard | null): GlowingCard => {
      // Determine which component to use next (flip-flop between values and properties)
      const nextComponent: "values" | "properties" = currentCard?.component === "values" ? "properties" : "values";

      // Get the appropriate card count for the next component
      const cardCount = nextComponent === "values" ? TOTAL_VALUES_CARDS : TOTAL_PROPERTIES_CARDS;

      // HEAVILY center-weighted selection - strongly prefer middle cards for visibility
      const centerIndex = Math.floor(cardCount / 2);

      // Always select from center area (±1 from center for all card counts)
      const centerStart = Math.max(0, centerIndex - 1);
      const centerEnd = Math.min(cardCount - 1, centerIndex + 1);
      const selectedIndex: number = centerStart + Math.floor(Math.random() * (centerEnd - centerStart + 1));

      return {
        component: nextComponent,
        cardIndex: selectedIndex,
      };
    },
    [TOTAL_VALUES_CARDS, TOTAL_PROPERTIES_CARDS],
  );

  // Glow effect timer
  useEffect(() => {
    let currentGlowingCard: GlowingCard | null = null;
    let mainInterval: NodeJS.Timeout | null = null;
    let glowClearTimeout: NodeJS.Timeout | null = null;

    const runGlowCycle = () => {
      // Start glow phase - select next card
      currentGlowingCard = selectRandomCard(currentGlowingCard);
      setGlowingCard(currentGlowingCard);

      // Clear glow after GLOW_DURATION
      glowClearTimeout = setTimeout(() => {
        setGlowingCard(null);
      }, GLOW_DURATION);
    };

    // Start immediately with first glow
    runGlowCycle();

    // Set up recurring cycle (glow + gap = total cycle time)
    mainInterval = setInterval(runGlowCycle, TOTAL_CYCLE_TIME);

    // Store reference for cleanup
    glowTimerRef.current = mainInterval;

    // Cleanup function
    return () => {
      if (mainInterval) {
        clearInterval(mainInterval);
        mainInterval = null;
      }
      if (glowClearTimeout) {
        clearTimeout(glowClearTimeout);
        glowClearTimeout = null;
      }
      if (glowTimerRef.current) {
        clearInterval(glowTimerRef.current);
        glowTimerRef.current = null;
      }
      setGlowingCard(null);
    };
  }, [selectRandomCard, GLOW_DURATION, TOTAL_CYCLE_TIME]);

  const handleCardClick = (cardData: (typeof valuesData)[0]) => {
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
      <div className="flex flex-col items-center">
        {/* Values Carousel */}
        <div className="w-fit flex flex-row items-center animate-long-marquee place-self-start">
          {Array(8)
            .fill(valuesData)
            .flat()
            .map((info, index) => {
              // Calculate original data index for glow effect
              const originalIndex = index % valuesData.length;
              const isGlowing = glowingCard?.component === "values" && glowingCard.cardIndex === originalIndex;

              return (
                <CarouselCard
                  key={`dataInfo1_${info.title}_${index}`}
                  data={info}
                  index={index}
                  keyPrefix="dataInfo1"
                  isGlowing={isGlowing}
                  glowColor="orange"
                  hoverBgColor="hover:bg-pinto-orange-1"
                  onClick={handleCardClick}
                />
              );
            })}
        </div>

        {/* Middle Content */}
        <Separator className="w-[80%] sm:w-[50%] my-2 lg:my-4" />
        <div className="flex flex-col items-center place-content-center px-3 lg:px-12 gap-3 lg:gap-6 lg:w-full sm:max-w-[25rem] lg:max-w-[50rem] mx-auto">
          <h2 className="text-[1.75rem] lg:pinto-h2 lg:text-5xl leading-[1.1] text-black flex flex-row gap-4 items-center text-center">
            <span>
              Combining <span className="text-[#F7931A]">the values of BTC</span> with{" "}
              <span className="text-pinto-green-4">the properties of USD</span>
            </span>
          </h2>
          <span className="text-xl lg:text-lg lg:leading-[1.4] font-thin text-pinto-gray-4 text-center">
            Printed directly to the people. Founded on decentralized credit.
          </span>
          <Link to={navLinks.printsToThePeople} target="_blank" rel="noopener noreferrer">
            <Button
              rounded="full"
              variant={"defaultAlt"}
              size={isMobile ? "md" : "xl"}
              className={`z-20 hover:bg-pinto-green-2/50 transition-all duration-300 ease-in-out flex flex-row gap-2 items-center relative overflow-hidden !font-[340] !tracking-[-0.025rem]`}
            >
              <span>Why is this so valuable?</span>
              <span className="text-pinto-green-4 transition-all duration-300 ease-in-out">
                <PintoRightArrow
                  width={isMobile ? "1.25rem" : "1.5rem"}
                  height={isMobile ? "1.25rem" : "1.5rem"}
                  className="transition-all"
                  color="currentColor"
                />
              </span>
            </Button>
          </Link>
        </div>
        <Separator className="w-[40%] sm:w-[20%] my-2 lg:my-4" />

        {/* Properties Carousel */}
        <div className="w-fit flex flex-row items-center animate-long-marquee-reverse place-self-start">
          {Array(12)
            .fill(propertiesData)
            .flat()
            .map((info, index) => {
              // Calculate original data index for glow effect
              const originalIndex = index % propertiesData.length;
              const isGlowing = glowingCard?.component === "properties" && glowingCard.cardIndex === originalIndex;

              return (
                <CarouselCard
                  key={`dataInfo2_${info.title}_${index}`}
                  data={info}
                  index={index}
                  keyPrefix="dataInfo2"
                  isGlowing={isGlowing}
                  glowColor="green"
                  hoverBgColor="hover:bg-pinto-green-1"
                  onClick={handleCardClick}
                />
              );
            })}
        </div>
      </div>

      <CardModal isOpen={isModalOpen} onOpenChange={handleModalClose} cardData={selectedCard} />
    </>
  );
}
