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
      <Separator className="w-[50%] mb-6" />
      <div className="flex flex-col items-start place-content-center px-3 sm:px-12 gap-3 sm:gap-6 sm:w-full max-w-[50rem] mx-auto">
        <h2 className="text-[1.75rem] sm:pinto-h2 sm:text-5xl leading-[1.1] text-black flex flex-row gap-4 items-center text-center">
          <span>
            Combining <span className="text-[#F7931A]">the values of BTC</span> with{" "}
            <span className="text-pinto-green-4">the properties of USD</span>
          </span>
        </h2>
        <span className="text-xl sm:text-lg sm:leading-[1.4] font-thin text-pinto-gray-4 text-center">
          Printed directly to the people. Founded on decentralized credit.
        </span>
      </div>
      <Separator className="w-[20%] mt-10 mb-6" />
    </div>
  );
}
