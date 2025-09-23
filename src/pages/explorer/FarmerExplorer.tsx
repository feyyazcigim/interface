import SeasonalChart, { tabToSeasonalLookback } from "@/components/charts/SeasonalChart";
import { TimeTab } from "@/components/charts/TimeTabs";
import { useSharedTimeTab } from "@/hooks/useSharedTimeTab";
import {
  useFarmerSeasonalClaimedGrownStalkBalance,
  useFarmerSeasonalPlantedPinto,
  useFarmerSeasonalStalkOwnership,
} from "@/state/seasonal/seasonalDataHooks";
import { useSunData } from "@/state/useSunData";
import { chartFormatters as f } from "@/utils/format";
import { useState } from "react";
import { useAccount } from "wagmi";

const NO_DATA_MESSAGE = "No silo interactions from connected wallet";

const FarmerExplorer = () => {
  const [plantedTab, setPlantedTab] = useSharedTimeTab("farmerPlanted");
  const [grownStalkTab, setGrownStalkTab] = useSharedTimeTab("farmerGrownStalk");
  const [stalkOwnershipTab, setStalkOwnershipTab] = useSharedTimeTab("farmerStalkOwnership");
  const season = useSunData().current;

  const { address, isConnecting } = useAccount();

  const plantedData = useFarmerSeasonalPlantedPinto(Math.max(0, season - tabToSeasonalLookback(plantedTab)), season);
  const grownStalkData = useFarmerSeasonalClaimedGrownStalkBalance(
    Math.max(0, season - tabToSeasonalLookback(grownStalkTab)),
    season,
  );
  const stalkOwnershipData = useFarmerSeasonalStalkOwnership(
    Math.max(0, season - tabToSeasonalLookback(stalkOwnershipTab)),
    season,
  );
  console.debug(
    "🚀 ~ FarmerExplorer ~ Math.max(0, season - tabToSeasonalLookback(stalkOwnershipTab)), season:",
    Math.max(0, season - tabToSeasonalLookback(stalkOwnershipTab)),
    season,
  );

  const dataNotFetching = !address && !isConnecting;

  return (
    <>
      <SeasonalChart
        title="Earned Pinto"
        tooltip="Total number of Pinto my Deposits have accumulated from the Silo."
        size="large"
        fillArea
        activeTab={plantedTab}
        onChangeTab={setPlantedTab}
        useSeasonalResult={plantedData}
        dataNotFetching={dataNotFetching}
        valueFormatter={f.number0dFormatter}
        tickValueFormatter={f.largeNumber1dFormatter}
        noDataMessage={NO_DATA_MESSAGE}
      />
      <div className="flex flex-col sm:flex-row w-full sm:space-x-8">
        <div className="w-full sm:w-1/2">
          <SeasonalChart
            title="Mown Stalk"
            tooltip="Amount of Stalk accumulated from Seeds currently tied to my Deposits (i.e., not burned from Withdrawals or disincentivized Converts)."
            size="small"
            activeTab={grownStalkTab}
            onChangeTab={setGrownStalkTab}
            useSeasonalResult={grownStalkData}
            dataNotFetching={dataNotFetching}
            valueFormatter={f.number0dFormatter}
            tickValueFormatter={f.largeNumber1dFormatter}
            noDataMessage={NO_DATA_MESSAGE}
          />
        </div>
        <div className="w-full sm:w-1/2">
          <SeasonalChart
            title="Stalk Ownership %"
            tooltip="Percentage of mints to the Silo I am entitled to."
            size="small"
            activeTab={stalkOwnershipTab}
            onChangeTab={setStalkOwnershipTab}
            useSeasonalResult={stalkOwnershipData}
            dataNotFetching={dataNotFetching}
            valueFormatter={f.percent3dFormatter}
            tickValueFormatter={f.percent0dFormatter}
            noDataMessage={NO_DATA_MESSAGE}
          />
        </div>
      </div>
    </>
  );
};
export default FarmerExplorer;
