import useIsMobile from "@/hooks/display/useIsMobile";
import { Link } from "react-router-dom";
import { PintoRightArrow } from "../Icons";
import { navLinks } from "../nav/nav/Navbar";
import { Button } from "../ui/Button";
import { Separator } from "../ui/Separator";

export default function SecondaryCTA() {
  const isMobile = useIsMobile();
  return (
    <div className="flex flex-col items-center">
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
        <Link to={navLinks.printsToThePeople}>
          <Button
            rounded="full"
            variant={"defaultAlt"}
            size={isMobile ? "md" : "xl"}
            className={`z-20 transition-all duration-300 ease-in-out flex flex-row gap-2 items-center relative overflow-hidden !font-[340] !tracking-[-0.025rem]`}
            shimmer={true}
            glow={true}
          >
            <span>Why is this so valuable?</span>
            <span className="text-pinto-green-4">
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
    </div>
  );
}
