import clsx from "clsx";
import { Link } from "react-router-dom";
import { navLinks } from "../nav/nav/Navbar";
import { Button } from "../ui/Button";
import GameOfLife from "./GameOfLife";

const resourceCards = [
  {
    title: "Learn",
    description: "Learn more about the incentives that coordinate the farm.",
    pattern: "tenCell",
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
    pattern: "trafficCircle",
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
  return (
    <div className="flex flex-col items-center self-stretch gap-12 mx-auto">
      <h2 className="text-4xl leading-same-h2 font-light text-black">Resources</h2>
      <div className="flex flex-row gap-8">
        {resourceCards.map((card, index) => (
          <div key={index} className={cardStyles}>
            <div className="overflow-hidden relative h-[24rem] flex justify-center items-center">
              <div
                className="
                flex
                transition-transform duration-300 ease-in-out
                scale-[4]
                hover:scale-110
                cursor-pointer
                transform-gpu
              "
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
    </div>
  );
}
