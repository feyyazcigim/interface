import { TV } from "@/classes/TokenValue";
import { Col, Row } from "@/components/Container";
import BarChart from "@/components/charts/BarChart";
import TimeTabsSelector, { TimeTab } from "@/components/charts/TimeTabs";
import { Card } from "@/components/ui/Card";
import useBucketedFieldPlotSummary, {
  aggregateFieldPlotBucketSummary,
  FieldPlotBucketSummary,
} from "@/state/useBucketedFieldPlotSummary";
import { useHarvestableIndex } from "@/state/useFieldData";
import { formatter, numberAbbr } from "@/utils/format";
import { useDebounceValue } from "@/utils/useDebounce";
import { cn } from "@/utils/utils";
import { ChartData } from "chart.js";
import React, { useCallback, useEffect, useMemo, useState } from "react";

type FieldTemperatureBarChartProps = {
  className?: string;
};

// We don't want to show too many bars, so we limit the number of bars to 50
const MAX_REASONABLE_BARS = 60;

// 50k is the default
const BUCKET_SIZE = 50_000;

const FieldTemperatureBarChart = React.memo(({ className }: FieldTemperatureBarChartProps) => {
  // global state
  const harvestableIndex = useHarvestableIndex();

  // local State
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  const [tab, setTab] = useState<TimeTab>(TimeTab.Month);

  const select = useCallback(
    (data: FieldPlotBucketSummary[] | undefined) => {
      if (!data || harvestableIndex.lte(0)) return [];
      const mapped = data.map((d) => ({
        ...d,
        startIndex: d.startIndex.sub(harvestableIndex),
        endIndex: d.endIndex.sub(harvestableIndex),
      }));

      const maxLookback = getTimestampLookback(tab);
      const filtered = mapped.filter((data) => data.startTimestamp > maxLookback);

      const transformed = aggregateFieldPlotBucketSummary(filtered, MAX_REASONABLE_BARS);

      return transformed;
    },
    [harvestableIndex, tab],
  );

  // queries
  const query = useBucketedFieldPlotSummary<FieldPlotBucketSummary[]>({
    bucketSize: BUCKET_SIZE,
    select,
  });

  // Transform the data to be used in the chart
  const data = useTransformBucketedFieldPlotSummary(query.data);

  // derived state
  const isLoading = query.isLoading || harvestableIndex.lte(0);
  const lastIndex = data.datasets[0]?.data.length - 1;

  // Debounce the active index to prevent too many re-renders
  const debouncedActiveIndex = useDebounceValue(activeIndex, 10);

  const selectIndex = (debouncedActiveIndex === undefined ? lastIndex : debouncedActiveIndex) ?? 0;

  const indexes = (data.labels?.[selectIndex] as string)?.split("-");

  const startIndex = Number(indexes?.[0] ?? "0");
  const endIndex = Number(indexes?.[1] ?? "0");

  const decimals = getDiffDecimals(startIndex, endIndex);

  const activeData = data.datasets[0]?.data?.[selectIndex] as number | undefined;

  return (
    <Card className="overflow-hidden">
      <Col className="gap-0">
        <Row className="w-full justify-between p-4 sm:p-6 gap-2">
          <Col className="gap-1">
            <div className="pinto-sm sm:pinto-body">
              Avg Sown Temperature{" "}
              {!isLoading && (
                <>
                  between {numberAbbr(startIndex, decimals)} and {numberAbbr(endIndex, decimals)}
                </>
              )}
            </div>
            <div className="pinto-body sm:pinto-h3">{activeData ? formatter.pct(activeData) : "-%"}</div>
          </Col>
          <div className="self-start sm:pt-1 shrink-0">
            <TimeTabsSelector tab={tab} setTab={setTab} />
          </div>
        </Row>
        <Col className={cn("h-[250px] sm:h-[435px] w-full px-2 sm:px-4 pb-2 sm:pb-4", className)}>
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

const DAY_MS = 1000 * 60 * 60 * 24;
const WEEK_MS = DAY_MS * 7;
const MONTH_MS = DAY_MS * 30;

const getTimestampLookback = (timeTab: TimeTab) => {
  const now = new Date().getTime();

  switch (timeTab) {
    case TimeTab.Week:
      return now - WEEK_MS;
    case TimeTab.Month:
      return now - MONTH_MS;
    default:
      return 0;
  }
};

const getDiffDecimals = (startIndex: number, endIndex: number) => {
  if (startIndex === endIndex) return 0;
  const diff = endIndex - startIndex;

  switch (true) {
    case diff >= 1_000_000:
      return 0;
    case diff >= 100_000:
      return 1;
    default:
      return 2;
  }
};

const noData: { labels: string[]; datasets: ChartData<"bar">["datasets"] } = {
  labels: [],
  datasets: [],
};
const useTransformBucketedFieldPlotSummary = (data: FieldPlotBucketSummary[] | undefined) => {
  const [transformedData, setTransformedData] = useState<ChartData<"bar">>(noData);

  useEffect(() => {
    if (!data?.length) {
      setTransformedData(noData);
    } else {
      setTransformedData(transform(data) ?? noData);
    }
  }, [data]);

  return transformedData;
};
const transform = (summary: FieldPlotBucketSummary[] | undefined) => {
  if (!summary) return undefined;

  const labels: string[] = [];
  const data: number[] = [];

  for (const d of summary) {
    const startIndex = d.startIndex.toNumber();
    const endIndex = d.endIndex.toNumber();

    labels.push(`${startIndex}-${endIndex}`);
    data.push(d.avgTemperature.toNumber());
  }

  return {
    labels,
    datasets: [{ data }],
  };
};
