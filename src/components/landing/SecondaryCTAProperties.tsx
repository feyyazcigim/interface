import PropertyLowVolatility from "@/assets/misc/Property_Low_Volatility.svg";
import PropertyMediumOfExchange from "@/assets/misc/Property_Medium_of_Exchange.svg";
import PropertyScalable from "@/assets/misc/Property_Scalable.svg";
import PropertyUnitOfAccount from "@/assets/misc/Property_Unit_of_Account.svg";

const data = [
  {
    logo: PropertyScalable,
    title: "Scalable",
    description: "Pinto can scale to meet market demand for trustless currency in DeFi. ",
  },
  {
    logo: PropertyLowVolatility,
    title: "Low Volatility",
    description: "Pinto seeks to minimize volatility in it’s value through thoughtful incentives.",
  },
  {
    logo: PropertyMediumOfExchange,
    title: "Medium of Exchange",
    description: "Pinto can facilitate seamless transactions between users.",
  },
  {
    logo: PropertyUnitOfAccount,
    title: "Unit of Account",
    description: "Pinto is a low-volatility value source onchain, which can be used to measure arbitrary value.",
  },
];

export default function SecondaryCTAProperties() {
  return (
    <div className="w-fit flex flex-row items-center animate-long-marquee-reverse">
      {Array(12)
        .fill(data)
        .flat()
        .map((info, index) => (
          <div
            key={`dataInfo2_${info.title}_${index}`}
            className="p-4 sm:p-6 w-[16rem] h-[13rem] sm:w-[23.5rem] sm:h-[18rem] flex-shrink-0 border rounded-2xl bg-pinto-off-white mr-6 sm:mr-12"
          >
            <div className="flex flex-col gap-4 sm:gap-6">
              <img src={info.logo} className="w-16 h-16 sm:w-24 sm:h-24 flex-shrink-0" alt={info.title} />
              <div className="flex flex-col gap-2 sm:gap-4">
                <div className="text-base sm:text-lg leading-[1.1] font-thin text-black">{info.title}</div>
                <div className="text-base sm:text-xl leading-[1.1] font-thin text-pinto-gray-4">{info.description}</div>
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}
