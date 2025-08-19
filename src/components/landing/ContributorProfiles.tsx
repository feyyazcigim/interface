import { motion } from "framer-motion";
import { atom, useAtom } from "jotai";
import { useMemo } from "react";

export const contributors = [
  {
    id: 1,
    name: "Ryan",
    avatar: "/Ryan.jpg",
    description:
      "I believe a decentralized, pseudonymous group of creditors and value providers all around the world can work together to create stable value on the internet.",
  },
  {
    id: 2,
    name: "DefaultJuice",
    avatar: "/DefaultJuice.jpg",
    description:
      "Living through a financial crisis showed me the underbelly of a centralized fiat currency system. I'm building a decentralized one.",
  },
  {
    id: 3,
    name: "PintoPirate",
    avatar: "/PintoPirate.jpg",
    description:
      "I don't want others to be aware of my financial activities, nor am I comfortable having a centralized custodian managing or holding my wealth and potentially restricting my access to it.",
  },
  {
    id: 4,
    name: "natto",
    avatar: "/natto.jpg",
    description:
      "Pinto is a push back against 'good enough' — it openly continues to experiment and will bring the industry one step closer to the scalable and decentralized money that we need.",
  },
  {
    id: 5,
    name: "FordPinto",
    avatar: "/FordPinto.jpg",
    description:
      "We want sustainable growth and functionality over the long term. We want a new money. Not in the hands of the government, but in the hands of those using the money, and only by their choice.",
  },
  {
    id: 6,
    name: "burr",
    avatar: "/burr.jpg",
    description:
      "This isn’t just about rebuilding. It’s about fulfilling the long-term vision: creating Leviathan-free, low-volatility money that can make the promise of Bitcoin work for the world. I look forward to seeing it through.",
  },
];

export type Contributor = (typeof contributors)[0];

export const selectedContributorAtom = atom<Contributor>(contributors[0]);

// Function to randomly select 5 contributors
function getRandomContributors(count: number = 5): Contributor[] {
  const shuffled = [...contributors].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export default function ContributorProfiles() {
  const [selectedContributor, setSelectedContributor] = useAtom(selectedContributorAtom);

  // Get random contributors on component mount
  const displayedContributors = useMemo(() => {
    const random = getRandomContributors(5);
    setSelectedContributor(random[0]);
    return random;
  }, []);

  const handleContributorClick = (contributor: Contributor) => {
    setSelectedContributor(contributor);
  };

  // W shape positions with random variations: left peak, left valley, center peak, right valley, right peak
  const wPositions = useMemo(
    () => [
      { x: 0 + (Math.random() * 0.3125 - 0.15625), y: 5 + (Math.random() * 0.3125 - 0.15625) }, // left peak
      { x: 2.5 + (Math.random() * 0.3125 - 0.15625), y: 0.625 + (Math.random() * 0.3125 - 0.15625) }, // left valley
      { x: 5 + (Math.random() * 0.3125 - 0.15625), y: 5 + (Math.random() * 0.3125 - 0.15625) }, // center peak
      { x: 7.5 + (Math.random() * 0.3125 - 0.15625), y: 0.625 + (Math.random() * 0.3125 - 0.15625) }, // right valley
      { x: 10 + (Math.random() * 0.3125 - 0.15625), y: 5 + (Math.random() * 0.3125 - 0.15625) }, // right peak
    ],
    [],
  );

  // Memoize random animation values to prevent restarts on re-render
  const animationValues = useMemo(
    () =>
      displayedContributors.map(() => ({
        initialY: 20 + Math.random() * 4,
        bobbingY: -(6 + Math.random() * 4),
      })),
    [displayedContributors],
  );

  return (
    <div className="flex justify-center items-center relative -top-20 -left-20 pointer-events-none">
      <div className="relative w-80 h-32">
        {displayedContributors.map((contributor, index) => (
          <motion.div
            key={contributor.id}
            initial={{ opacity: 0, scale: 0, y: animationValues[index].initialY }}
            animate={{
              opacity: 1,
              scale: 1,
              y: [0, animationValues[index].bobbingY, 0],
            }}
            transition={{
              // Entrance animation
              delay: index * 0.1,
              duration: 0.5,
              ease: "backOut",
              y: {
                duration: 2 + index * 0.2, // Slightly different timing for each
                repeat: Infinity,
                ease: "easeInOut",
              },
            }}
            className="absolute"
            style={{
              left: `${wPositions[index].x}rem`,
              top: `${wPositions[index].y}rem`,
            }}
            whileHover={{
              scale: 1.1,
              rotate: 5,
              transition: { duration: 0.2 },
            }}
          >
            <div className="relative">
              {/* Outer border ring */}
              <motion.div
                className="absolute -inset-2 rounded-full border-[1.5px] border-pinto-green/30 pointer-events-none"
                animate={{
                  opacity: contributor.id === selectedContributor.id ? 1 : 0,
                  scale: contributor.id === selectedContributor.id ? 1 : 0.8,
                }}
                transition={{ duration: 0.3, delay: 0.1 }}
              />
              {/* Middle border ring */}
              <motion.div
                className="absolute -inset-1 rounded-full border-[1.5px] border-pinto-green/60 pointer-events-none"
                animate={{
                  opacity: contributor.id === selectedContributor.id ? 1 : 0,
                  scale: contributor.id === selectedContributor.id ? 1 : 0.9,
                }}
                transition={{ duration: 0.3, delay: 0.05 }}
              />
              <div
                className="w-16 h-16 rounded-full relative overflow-hidden border-[1.5px] shadow-lg cursor-pointer pointer-events-auto border-pinto-gray-2"
                onClick={() => handleContributorClick(contributor)}
              >
                <img src={contributor.avatar} alt={contributor.name} className="w-full h-full object-cover" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
