import { Separator } from "../ui/Separator";

export default function SecondaryCTA() {
  return (
    <div className="flex flex-col items-center">
      <Separator className="w-[80%] sm:w-[50%] mt-2 mb-4 sm:mt-6 sm:mb-8" />
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
      <Separator className="w-[40%] sm:w-[20%] mt-4 mb-2 sm:mt-8 sm:mb-6" />
    </div>
  );
}
