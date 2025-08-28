import ValueCensorshipResistance from "@/assets/misc/Value_Censorship_Resistance.svg";
import ValueCommunityRun from "@/assets/misc/Value_Community_Run.svg";
import ValueFairness from "@/assets/misc/Value_Fairness.svg";
import ValueOpenSource from "@/assets/misc/Value_Open_Source.svg";
import ValuePermissionlessness from "@/assets/misc/Value_Permissionlessness.svg";
import ValueTrustless from "@/assets/misc/Value_Trustlessness.svg";
import { useState } from "react";
import CardModal from "./CardModal";

const data = [
  {
    logo: ValueCensorshipResistance,
    title: "Censorship Resistance",
    subtitle: "Pinto is designed to be maximally resistant to censorship.",
    description: `## Pinto is designed to be maximally resistant to censorship.

Censorship Resistant: resilient to the prevention of valid actions from being executed reliably. 

Censorship can take the form of: 

1. **Communication failures:** single or coordinated actors blocking or delaying information sharing
2. **Availability failures**
    
    **Availability:** accessibility and operational readiness
    
3. **Liveness failures**
    
    **Liveness:** eventual progress and completion of all valid operations
    
4. **Integrity failures**
    
    **Integrity:** correct completion of operations
    

While Pinto trades against a variety of value, some of which is subject to censorship, the currency itself is designed to be free from censorship. Currently, in instances where the value it trades against is censored, it may have short term effects on Pinto’s price and liquidity, but does not jeopardize the integrity of the protocol as a whole. 

A future blacklist mitigation mechanism will enshrine the censorship resistance of the protocol by pushing the risk of holding censorable value within the protocol onto the holders of that value instead of the protocol as a whole. In this case, even if one of the non-Pinto assets in a Pinto liquidity pool is censored, the value in all the other pools and pure Pinto would be protected. This design safeguards the health of the protocol and encourages participants to favor censorship resistant value.`,
  },
  {
    logo: ValueTrustless,
    title: "Trustlessness",
    subtitle:
      "Pinto is building fiat currency free from the risk of arbitrary money printing and interest rate manipulation.",
    description: `## Pinto is building fiat currency free from the risk of arbitrary money printing and interest rate manipulation.

**Trustlessness:** reliability is assured through autonomy, incorruptibility, and verifiability rather than trust

- **Reliability:** consistent and correct performance
    - Reliable systems function as expected over time under both normal and adverse conditions.
- **Autonomy:** rule compliance guaranteed by internal mechanisms
    - A system is autonomous if its rules are upheld by protocol design and crypto-economics without arbitrary or subjective judgement.
- **Incorruptibility:** resistance to unauthorized change
    - Incorruptible systems prevent rules from being manipulated and tampered with. Change occurs only through explicitly defined mechanisms and authorized processes, ensuring the system's integrity cannot be compromised.
- **Verifiability:** the ability to independently validate correctness
    - A system is verifiable to a participant if they can confirm correctness without trusting any party. Verification is typically enabled by transparency, reproducibility, or zero-knowledge proofs.

Pinto functions autonomously according to verifiable rules and parameters, which the Pinto Community Multisig (PCM) upgrades transparently to improve the protocol. At 500M supply, the PCM will forfeit governance of Pinto. In its place, a permissionless fork system will enable continued improvements while protecting participant’s from having the code underlying their currency ever changed without their consent.`,
  },
  {
    logo: ValuePermissionlessness,
    title: "Permissionlessness",
    subtitle: "Anyone with an internet connection and funds on the Ethereum network can participate in Pinto.",
    description: `## Anyone with an internet connection and funds on the Ethereum network can participate in Pinto.

**Permissionlessness:** the absence of approval requirements for participation

**Permissioned:** the quality of requiring approval for participation

Note: Barriers of strict technical capacity do not constitute permissions (*e.g.,* internet connection, gas payment).

Pinto is open for anyone to participate.`,
  },
  {
    logo: ValueFairness,
    title: "Fairness",
    subtitle: "The Pinto printer is designed to be free from capture.",
    description: `## The Pinto printer is designed to be free from capture.

**Fair:** Treating all parties impartially according to agreed upon rules and standards.

In a fair market, informed participants act freely and compete on a playing field with the following properties:

- existing competitive advantages are difficult to entrench. ‘Capture’ is difficult, restricted to product or strategy alpha rather than privileged access or anti-competitive techniques.
- while participants can spend to achieve certain advantages over others, each additional marginal increase in advantage over other participants has increasing marginal costs.
- latency and information asymmetry are minimal.

Pinto functions according to explicitly defined rules. While Pinto rewards older and larger Deposits with more mints, the competitive advantage of older Deposits decreases over time and larger Deposits cost more for each marginal unit of value Deposited. [Tractor makes autonomous execution available to every participant](https://mirror.xyz/0x8F02813a0AC20affC2C7568e0CB9a7cE5288Ab27/cUuaXyfIWa3ugQUDs-7WVHy4DRBsfbLelzoaRv-H-QE), independent of technical savvy, and minimizes information asymmetry within the constraints of the EVM.`,
  },
  {
    logo: ValueOpenSource,
    title: "Open-Source",
    subtitle: "From code to plain language write-ups, Pinto is accessible to everyone.",
    description: `## From code to plain language write-ups, Pinto is accessible to everyone

Software is open source if it is freely available for anyone to:

1. run;
2. study and modify;
3. redistribute in original and modified form.

The protocol is [completely open-source](https://github.com/pinto-org), and tremendous effort has gone into defining it and putting it into context, from rigorous technical documentation (*i.e.*, [the whitepaper](https://pinto.money/pinto.pdf)) to plain language [explainers](https://mirror.xyz/0x8F02813a0AC20affC2C7568e0CB9a7cE5288Ab27).`,
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
              className="p-4 2xl:p-4 w-[16rem] h-[13rem] 2xl:w-[23.5rem] 2xl:h-[16rem] flex-shrink-0 border rounded-2xl bg-pinto-off-white mr-6 2xl:mr-12 cursor-pointer transition-transform sm:hover:scale-105 sm:active:scale-95"
              onClick={() => handleCardClick(info)}
            >
              <div className="flex flex-col gap-4 2xl:gap-6">
                <img src={info.logo} className="w-16 h-16 2xl:w-20 2xl:h-20 flex-shrink-0" alt={info.title} />
                <div className="flex flex-col gap-2 2xl:gap-4">
                  <div className="text-base leading-[1.1] font-thin text-black">{info.title}</div>
                  <div className="text-xs sm:text-base leading-[1.1] font-thin text-pinto-gray-4">{info.subtitle}</div>
                </div>
              </div>
            </div>
          ))}
      </div>
      <CardModal isOpen={isModalOpen} onOpenChange={handleModalClose} cardData={selectedCard} />
    </>
  );
}
