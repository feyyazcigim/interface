import { Link } from "react-router-dom";
import { Button } from "../ui/Button";

export default function SecondaryCTA() {
  return (
    <div className="flex flex-col items-start place-content-center px-12 gap-6 w-[48rem]">
      <h2 className="pinto-h2 text-5xl leading-[1.1] text-black flex flex-row gap-4 items-center">
        <span>Combining The Values of BTC with the properties of USD</span>
      </h2>
      <span className="text-lg leading-[1.1] text-pinto-gray-4">
        Pinto prioritizes trustlessness and scalability to power the leviathan-free economy.
      </span>
      <div className="flex flex-row gap-4">
        <Link to={"/overview"}>
          <Button rounded="full">Learn More About Properties</Button>
        </Link>
      </div>
    </div>
  );
}
