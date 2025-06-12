import { Link } from "react-router-dom";
import { navLinks } from "../nav/nav/Navbar";
import { Button } from "../ui/Button";

export default function MainCTA() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 self-stretch items-center">
        <h2 className="text-[4rem] leading-[1.1] font-thin text-black">Fair Fiat Money</h2>
        <span className="text-2xl leading-[1.4] font-thin text-pinto-gray-4">
          Printed directly to the people. Founded on decentralized credit.
        </span>
      </div>
      <div className="flex flex-row gap-4 mx-auto">
        <Link to={navLinks.overview}>
          <Button rounded="full">Come Seed the Trustless Economy →</Button>
        </Link>
        <Link to={navLinks.docs} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" rounded="full" className="shadow-none text-pinto-gray-4">
            Read the Docs
          </Button>
        </Link>
      </div>
    </div>
  );
}
