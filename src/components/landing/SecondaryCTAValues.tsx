import ValueCensorshipResistance from "@/assets/misc/Value_Censorship_Resistance.svg";
import ValueCommunityRun from "@/assets/misc/Value_Community_Run.svg";
import ValueFairness from "@/assets/misc/Value_Fairness.svg";
import ValueOpenSource from "@/assets/misc/Value_Open_Source.svg";
import ValuePermissionless from "@/assets/misc/Value_Permissionlessness.svg";
import ValueTrustless from "@/assets/misc/Value_Trustlessness.svg";

const data = [
  {
    logo: ValueCensorshipResistance,
    title: "Censorship Resistance",
    description: "Pinto is designed to be maximally resistant to any censorship.",
  },
  {
    logo: ValueTrustless,
    title: "Trustlessness",
    description: "The monetary policy of Pinto is deterministic, eliminating any need for trust.",
  },
  {
    logo: ValuePermissionless,
    title: "Permissionless",
    description: "Anyone with an Ethereum wallet can participate in Pinto.",
  },
  {
    logo: ValueFairness,
    title: "Fairness",
    description: "Pinto strives to fairly incentivize all participants.",
  },
  {
    logo: ValueOpenSource,
    title: "Open-source",
    description: "All code is deployed on Base and publicly viewable by any participant.",
  },
  {
    logo: ValueCommunityRun,
    title: "Community-run",
    description: "Pinto is maintained by a decentralized group of contributors and run by it’s community.",
  },
];

export default function SecondaryCTAValues() {
  return (
    <div className="flex flex-col items-start w-[25.625rem] animate-vertical-marquee-reverse">
      {Array(2)
        .fill(data)
        .flat()
        .map((info, index) => (
          <div key={`dataInfo1_${info.title}_${index}`} className="p-6 border rounded-2xl bg-pinto-off-white mb-12">
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
