import SeasonalChart, { tabToSeasonalLookback } from "@/components/charts/SeasonalChart";
import { TimeTab } from "@/components/charts/TimeTabs";
import { useSeasonalTractorPodsIssued, useSeasonalTractorSownPinto } from "@/state/seasonal/seasonalDataHooks";
import { useSunData } from "@/state/useSunData";
import { chartFormatters as f } from "@/utils/format";
import { useState } from "react";

const TractorExplorer = () => {
  const [sownTab, setSownTab] = useState(TimeTab.Week);
  const [podsTab, setPodsTab] = useState(TimeTab.Week);
  const [fundedTab, setFundedTab] = useState(TimeTab.Week);
  const [tipsTab, setTipsTab] = useState(TimeTab.Week);
  const [maxTipTab, setMaxTipTab] = useState(TimeTab.Week);
  const [executionsTab, setExecutionsTab] = useState(TimeTab.Week);

  const season = useSunData().current;

  const pintoSownData = useSeasonalTractorSownPinto(Math.max(0, season - tabToSeasonalLookback(sownTab)), season);
  const podsIssuedData = useSeasonalTractorPodsIssued(Math.max(0, season - tabToSeasonalLookback(podsTab)), season);

  return (
    <>
      <div className="flex flex-col sm:flex-row w-full sm:space-x-8">
        <div className="w-full sm:w-1/2">
          <SeasonalChart
            title="Sown Pinto"
            size="small"
            activeTab={sownTab}
            onChangeTab={setSownTab}
            useSeasonalResult={pintoSownData}
            valueFormatter={f.number0dFormatter}
            tickValueFormatter={f.largeNumberFormatter}
          />
        </div>
        <div className="w-full sm:w-1/2">
          <SeasonalChart
            title="Pods Issued"
            size="small"
            fillArea
            activeTab={podsTab}
            onChangeTab={setPodsTab}
            useSeasonalResult={podsIssuedData}
            valueFormatter={f.number0dFormatter}
            tickValueFormatter={f.largeNumberFormatter}
          />
        </div>
      </div>
    </>
  );
};

export default TractorExplorer;
