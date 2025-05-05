import { TV } from "@/classes/TokenValue";
import { Col } from "@/components/Container";
import BarChart from "@/components/charts/BarChart";
import { Card } from "@/components/ui/Card";
import useBucketedFieldPlotSummary, { FieldPlotBucketSummary } from "@/state/useBucketedFieldPlotSummary";
import { useHarvestableIndex } from "@/state/useFieldData";
import { formatter, numberAbbr } from "@/utils/format";
import { useDebounceValue } from "@/utils/useDebounce";
import React, { useMemo, useState } from "react";

const noData = {
  labels: [],
  datasets: [],
};

const FieldTemperatureBarChart = React.memo(() => {
  // hooks
  const harvestableIndex = useHarvestableIndex();

  // local State
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  // memoized functions
  const select = useMemo(() => getTransform(harvestableIndex), [harvestableIndex]);

  // queries
  const { data = noData, ...query } = useBucketedFieldPlotSummary({
    bucketSize: 1_000_000,
    select,
  });

  // derived state
  const isLoading = query.isLoading || harvestableIndex.lte(0);

  const lastIndex = data.datasets[0]?.data.length - 1;

  // Debounce the active index to prevent too many re-renders
  const debouncedActiveIndex = useDebounceValue(activeIndex, 10);

  const selectIndex = (debouncedActiveIndex === undefined ? lastIndex : debouncedActiveIndex) ?? 0;

  const indexes = data.labels?.[selectIndex]?.split("-");

  const startIndex = Number(indexes?.[0] ?? "0");
  const endIndex = Number(indexes?.[1] ?? "0");

  const activeData = data.datasets[0]?.data?.[selectIndex];

  return (
    <Card className="overflow-hidden">
      <Col className="gap-0">
        <Col className="gap-1 p-6">
          <div className="pinto-body">
            Avg Sown Temperature{" "}
            {!isLoading && (
              <>
                between {numberAbbr(startIndex, 0)} and {numberAbbr(endIndex, 0)}
              </>
            )}
          </div>
          <div className="pinto-h3">{activeData ? formatter.pct(activeData) : "-%"}</div>
        </Col>
        <Col className="h-[250px] w-full px-4 pb-4">
          <div className="mx-2 h-full">
            <BarChart
              data={data}
              isLoading={isLoading}
              onMouseOver={setActiveIndex}
              yLabelFormatter={formatY}
              xLabelFormatter={formatX}
              defaultHoverIndex={lastIndex}
            />
          </div>
        </Col>
      </Col>
    </Card>
  );
});

export default FieldTemperatureBarChart;

const formatY = (value: number | string) => {
  const asNum = typeof value === "number" ? value : Number(value);
  return formatter.pct(asNum, { minDecimals: 0, maxDecimals: 0 });
};

const formatX = (value: number | string) => {
  const asNum = typeof value === "number" ? value : Number(value);
  return numberAbbr(asNum * 1_000_000, 0);
};

const getTransform = (harvestableIndex: TV) => {
  return (summary: FieldPlotBucketSummary[] | undefined) => {
    if (!summary) return undefined;

    const labels = summary.map((d) => {
      const startIndex = d.startIndex.sub(harvestableIndex).toNumber();
      const endIndex = d.endIndex.sub(harvestableIndex).toNumber();

      return `${startIndex}-${endIndex}`;
    });

    const dataset = summary.map((d) => d.avgTemperature.toNumber());

    return {
      labels,
      datasets: [
        {
          data: dataset,
        },
      ],
    };
  };
};
