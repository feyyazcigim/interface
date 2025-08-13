import { Link } from "react-router-dom";
import { PintoRightArrow } from "../Icons";
import { navLinks } from "../nav/nav/Navbar";
import { Button } from "../ui/Button";
import { Separator } from "../ui/Separator";

export default function SecondaryCTA() {
  return (
    <div className="flex flex-col items-center">
      <Separator className="w-[50%] mb-6" />
      <div className="flex flex-col items-start place-content-center px-12 gap-6 w-[50rem] mx-auto">
        <h2 className="pinto-h2 text-5xl leading-[1.1] text-black flex flex-row gap-4 items-center text-center">
          <span>
            Combining <span className="text-[#F7931A]">the values of BTC</span> with{" "}
            <span className="text-pinto-green-4">the properties of USD</span>
          </span>
        </h2>
        <span className="text-lg leading-[1.4] font-thin text-pinto-gray-4 text-center">
          Printed directly to the people. Founded on decentralized credit.
        </span>
        <div className="flex flex-row gap-4 place-self-center">
          <Link to={"/overview"}>
            <Button rounded="full" className="flex flex-row gap-2 items-center">
              <span>About Values</span>
              <PintoRightArrow />
            </Button>
          </Link>
          <Link to={"/overview"} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" rounded="full" className="shadow-none text-pinto-gray-4">
              About Properties
            </Button>
          </Link>
        </div>
      </div>
      <Separator className="w-[20%] mt-10 mb-6" />
      <Separator className="w-[10%]" />
    </div>
  );
}
