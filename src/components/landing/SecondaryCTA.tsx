import { Separator } from "../ui/Separator";

export default function SecondaryCTA() {
  return (
    <div className="flex flex-col items-center">
      <Separator className="w-[80%] sm:w-[50%] mt-2 mb-4 lg:mt-6 lg:mb-8" />
      <div className="flex flex-col items-start place-content-center px-3 lg:px-12 gap-3 lg:gap-6 lg:w-full sm:max-w-[25rem] lg:max-w-[50rem] mx-auto">
        <h2 className="text-[1.75rem] lg:pinto-h2 lg:text-5xl leading-[1.1] text-black flex flex-row gap-4 items-center text-center">
          <span>
            Combining <span className="text-[#F7931A]">the values of BTC</span> with{" "}
            <span className="text-pinto-green-4">the properties of USD</span>
          </span>
        </h2>
        <span className="text-xl lg:text-lg lg:leading-[1.4] font-thin text-pinto-gray-4 text-center">
          Printed directly to the people. Founded on decentralized credit.
        </span>
      </div>
      <Separator className="w-[40%] sm:w-[20%] mt-4 mb-2 lg:mt-8 lg:mb-6" />
    </div>
  );
}
