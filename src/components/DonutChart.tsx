import { ArcElement, Chart, ChartData, ChartOptions, PieController, Tooltip } from "chart.js";
import { ReactChart } from "./ReactChart";
import { cn } from "@/utils/utils";

Chart.register(PieController, ArcElement, Tooltip);

const donutOptions: ChartOptions = {
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      enabled: false,
    },
  },
  // @ts-ignore
  offset: 0,
};

export interface DonutChartProps {
  data: ChartData;
  size?: number;
  className?: string;
  options?: ChartOptions;
}

export default function DonutChart({ data, size = 50, className, options = donutOptions }: DonutChartProps) {
  const mergedOptions = mergeOptions(options);

  return (
    <div className={cn("w-4 h-4", className)}>
      <ReactChart type="doughnut" data={data} options={mergedOptions as ChartOptions} height={size} width={size} />
    </div>
  );
}

const mergeOptions = (options?: ChartOptions): ChartOptions => {
  return {
    ...options,
    plugins: {
      ...options?.plugins,
      legend: {
        display: options?.plugins?.legend?.display ?? false,
        ...options?.plugins?.legend,
      },
      tooltip: {
        ...options?.plugins?.tooltip,
        enabled: options?.plugins?.tooltip?.enabled ?? true,
      },
    },
    // @ts-ignore
    offset: options?.offset ?? 0,
  };
};
