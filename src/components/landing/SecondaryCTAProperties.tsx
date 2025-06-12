import PropertyLowVolatility from "@/assets/misc/Property_Low_Volatility.svg";
import PropertyMediumOfExchange from "@/assets/misc/Property_Medium_of_Exchange.svg";
import PropertyScalable from "@/assets/misc/Property_Scalable.svg";
import PropertyUnitOfAccount from "@/assets/misc/Property_Unit_of_Account.svg";

export default function SecondaryCTAProperties() {
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

  return (
    <div className="flex flex-col items-start w-[25.625rem] animate-vertical-marquee">
      {Array(2)
        .fill(data)
        .flat()
        .map((info, index) => (
          <div key={`dataInfo2_${info.title}_${index}`} className="p-6 border rounded-2xl bg-pinto-off-white mb-12">
            <div className="h-[18.75rem] flex flex-col gap-6">
              <img src={info.logo} className="w-24 flex-shrink-0 h-auto" alt={info.title} />
              <div className="flex flex-col gap-4">
                <div className="text-lg leading-[1.1] font-thin text-black">{info.title}</div>
                <div className="text-xl leading-[1.1] font-thin text-pinto-gray-4">{info.description}</div>
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}
