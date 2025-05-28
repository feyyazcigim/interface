import SeasonalChart, { tabToSeasonalLookback } from "@/components/charts/SeasonalChart";
import { TimeTab } from "@/components/charts/TimeTabs";
import {
  useSeasonalMcap,
  useSeasonalPrice,
  useSeasonalSupply,
  useSeasonalTotalLiquidity,
} from "@/state/seasonal/seasonalDataHooks";
import { useSunData } from "@/state/useSunData";
import { chartFormatters as f } from "@/utils/format";
import { useMemo, useState } from "react";

// Chart constants
const CHART_CONSTANTS = {
  TARGET_PRICE: 1.0, // Target price for reference line
  PADDING: {
    MIN: 0.95, // 5% padding below min
    MAX: 1.05, // 5% padding above max
  },
};

const PintoExplorer = () => {
  const [priceTab, setPriceTab] = useState(TimeTab.Week);
  const [liquidityTab, setLiquidityTab] = useState(TimeTab.Week);
  const [supplyTab, setSupplyTab] = useState(TimeTab.Week);
  const [mcapTab, setMcapTab] = useState(TimeTab.Week);

  const season = useSunData().current;

  const priceData = useSeasonalPrice(Math.max(0, season - tabToSeasonalLookback(priceTab)), season);
  const filteredPriceData = useMemo(() => {
    if (priceTab === TimeTab.AllTime && priceData.data) {
      const startIdx = priceData.data.findIndex(d => d.season > 5);
      return {
        ...priceData,
        data: priceData.data.slice(startIdx)
      };
    }
    return priceData;
  }, [priceData, priceTab]);

  const liquidityData = useSeasonalTotalLiquidity(Math.max(0, season - tabToSeasonalLookback(liquidityTab)), season);
  const supplyData = useSeasonalSupply(Math.max(0, season - tabToSeasonalLookback(supplyTab)), season);
  const mcapData = useSeasonalMcap(Math.max(0, season - tabToSeasonalLookback(mcapTab)), season);

  // Calculate average price and determine y-axis ranges
  const priceYAxisRanges = useMemo(() => {
    const { TARGET_PRICE, PADDING } = CHART_CONSTANTS;

    // Default range as fallback if data isn't available
    const defaultRange = {
      min: 0,
      max: TARGET_PRICE,
      showReferenceLine: true
    };

    // If we don't have data yet, return the default range
    if (!filteredPriceData.data || filteredPriceData.data.length === 0) {
      return {
        [TimeTab.Week]: defaultRange,
        [TimeTab.Month]: defaultRange,
        [TimeTab.AllTime]: defaultRange,
      };
    }

    // Calculate min, max values from the actual data
    const values = filteredPriceData.data.map((item) => item.value);
    const minValue = Math.min(...values) * PADDING.MIN;
    const maxValue = Math.max(...values) * PADDING.MAX;

    // Calculate range with buffer
    const range = {
      min: minValue,
      max: maxValue,
      showReferenceLine: TARGET_PRICE >= minValue && TARGET_PRICE <= maxValue
    };

    // Return the same range for all tabs
    return {
      [TimeTab.Week]: range,
      [TimeTab.Month]: range,
      [TimeTab.AllTime]: range,
    };
  }, [filteredPriceData.data]);

  return (
    <>
      <div className="flex flex-col sm:flex-row w-full sm:space-x-8">
        <div className="w-full sm:w-1/2">
          <SeasonalChart
            title="Pinto Price"
            tooltip="The Current Price of Pinto in USD."
            size="small"
            activeTab={priceTab}
            onChangeTab={setPriceTab}
            useSeasonalResult={filteredPriceData}
            valueFormatter={f.price6dFormatter}
            tickValueFormatter={f.price2dFormatter}
            useLogarithmicScale={true}
            showReferenceLineAtOne={priceYAxisRanges[priceTab]?.showReferenceLine ?? false}
            yAxisRanges={priceYAxisRanges}
          />
        </div>
        <div className="w-full sm:w-1/2">
          <SeasonalChart
            title="Total Liquidity"
            tooltip="The total USD value of tokens in liquidity pools on the Minting Whitelist."
            size="small"
            fillArea
            activeTab={liquidityTab}
            onChangeTab={setLiquidityTab}
            useSeasonalResult={liquidityData}
            valueFormatter={f.price0dFormatter}
            tickValueFormatter={f.largePriceFormatter}
          />
        </div>
      </div>
      <div className="flex flex-col sm:flex-row w-full sm:space-x-8">
        <div className="w-full sm:w-1/2">
          <SeasonalChart
            title="Pinto Supply"
            tooltip="The total Pinto supply."
            size="small"
            fillArea
            activeTab={supplyTab}
            onChangeTab={setSupplyTab}
            useSeasonalResult={supplyData}
            valueFormatter={f.number0dFormatter}
            tickValueFormatter={f.largeNumberFormatter}
          />
        </div>
        <div className="w-full sm:w-1/2">
          <SeasonalChart
            title="Market Capitalization"
            tooltip="The USD value of the Pinto supply."
            size="small"
            fillArea
            activeTab={mcapTab}
            onChangeTab={setMcapTab}
            useSeasonalResult={mcapData}
            valueFormatter={f.price0dFormatter}
            tickValueFormatter={f.largePriceFormatter}
          />
        </div>
      </div>
    </>
  );
};
export default PintoExplorer;
