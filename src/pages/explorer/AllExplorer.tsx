import { AdvancedChart } from "@/components/charts/AdvancedChart";
import TVChart from "@/components/charts/TVChart";
import { AdvancedFieldDocument } from "@/generated/gql/graphql";

const AllExplorer = () => {
  return (
    <div className="-mb-4 sm:-mb-20 h-full flex flex-col gap-4 sm:gap-8">
      <AdvancedChart />
    </div>
  );
};
export default AllExplorer;
