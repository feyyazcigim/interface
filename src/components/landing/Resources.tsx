import useIsMobile from "@/hooks/display/useIsMobile";
import clsx from "clsx";
import { Link } from "react-router-dom";
import { PintoRightArrow } from "../Icons";
import { navLinks } from "../nav/nav/Navbar";
import { Button } from "../ui/Button";
import GameOfLife from "./GameOfLife";

const resourceCards = [
  {
    title: "Learn",
    description: "Learn more about the incentives that coordinate the farm.",
    pattern: "pufferfishCompanion",
    initialScale: 2.4,
    finalScale: 1.1,
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
    description: "Ask questions, participate in discussion about protocol improvements and connect with other farmers.",
    pattern: "trafficCircle",
    initialScale: 1.5,
    finalScale: 1.5,
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
    pattern: "tenCell",
    initialScale: 6,
    finalScale: 1.1,
    buttons: [
      {
        href: navLinks.discord,
        label: "Dashboard",
      },
    ],
  },
];

const cardStyles = clsx(
  "border border-pinto-gray-2 rounded-[1.25rem] w-[32rem] flex flex-col gap-8 overflow-clip bg-white",
);
const buttonStyles = clsx("w-full flex p-4 justify-center items-center gap-2.5 h-[3.125rem] text-sm font-normal");

export default function Resources() {
  const isMobile = useIsMobile();
  return (
    <div className="flex flex-col items-center self-stretch gap-12 mx-auto">
      <h2 className="text-4xl leading-same-h2 font-light text-black">Resources</h2>
      <div className="flex flex-row gap-8">
        {resourceCards.map((card, index) => (
          <div key={index} className={cardStyles}>
            <div className="overflow-hidden relative h-[24rem] flex justify-center items-center">
              <div
                className={`flex transition-transform duration-1000 ease-in-out transform-gpu`}
                style={{
                  transform: `scale(${card.initialScale})`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = `scale(${card.finalScale})`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = `scale(${card.initialScale})`;
                }}
              >
                <GameOfLife startingPattern={card.pattern} />
              </div>
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
      <Button
        rounded="full"
        size={isMobile ? "xl" : "xxl"}
        className="mt-16 scale-150 flex flex-row gap-2 items-center relative overflow-hidden animate-[pulse-glow_3s_ease-in-out_infinite] hover:shadow-[0_0_30px_rgba(36,102,69,0.6)] transition-shadow duration-1500"
      >
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-pinto-green-2/50 to-transparent" />
        <span className="relative z-10">Become a Farmer</span>
        <PintoRightArrow width={"1.5rem"} height={"1.5rem"} className="relative z-10" />
      </Button>
    </div>
  );
}
