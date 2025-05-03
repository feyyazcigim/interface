import { exists } from "@/utils/utils";
import { BarController, BarElement, ChartData, Chart as ChartJS, ChartOptions, PointElement } from "chart.js";
import React, { useMemo } from "react";
import { Col } from "../Container";
import LoadingSpinner from "../LoadingSpinner";
import { ReactChart } from "../ReactChart";
import { plugins } from "./chartHelpers";

ChartJS.register(BarController, BarElement, PointElement);

type BarChartProps = {
  data: ChartData<"bar">;
  isLoading?: boolean;
  showXLabels?: boolean;
  showYLabels?: boolean;
  onMouseOver?: (index: number | undefined) => void;
  yLabelFormatter?: (value: number | string) => string;
  defaultHoverIndex?: number;
};

const BarChart = React.memo(
  ({
    data,
    isLoading,
    showXLabels = false,
    showYLabels = false,
    onMouseOver,
    yLabelFormatter,
    defaultHoverIndex,
  }: BarChartProps) => {
    const options: ChartOptions<"bar"> = useMemo(
      () => ({
        ...baseOptions,
        scales: {
          y: {
            ...baseOptions.scales?.y,
            display: showYLabels,
            ticks: {
              display: showYLabels,
              callback: showYLabels ? yLabelFormatter : undefined,
            },
          },
          x: {
            ...baseOptions.scales?.x,
            display: showXLabels,
            ticks: {
              display: showXLabels,
            },
          },
        },
        plugins: {
          tooltip: {
            enabled: false,
          },
        },
        onHover: (_, elements) => {
          const index = elements[0]?.index;
          onMouseOver?.(index);
        },
        onLeave: () => {
          onMouseOver?.(defaultHoverIndex);
        },
        elements: {
          bar: {
            ...baseOptions.elements?.bar,
            backgroundColor: (ctx) => {
              const index = ctx.dataIndex;
              const isHovered = ctx.active || (!ctx.chart.getActiveElements().length && index === defaultHoverIndex);
              return isHovered
                ? (baseOptions.elements?.bar?.hoverBackgroundColor as string)
                : (baseOptions.elements?.bar?.backgroundColor as string);
            },
            borderColor: (ctx) => {
              const index = ctx.dataIndex;
              const isHovered = ctx.active || (!ctx.chart.getActiveElements().length && index === defaultHoverIndex);
              return isHovered
                ? (baseOptions.elements?.bar?.hoverBorderColor as string)
                : (baseOptions.elements?.bar?.borderColor as string);
            },
          },
        },
      }),
      [showXLabels, showYLabels, onMouseOver, yLabelFormatter, defaultHoverIndex],
    );

    const hasMouseOver = exists(onMouseOver);

    const chartPlugins = useMemo(() => {
      if (onMouseOver) {
        return [plugins.selectionCallback(onMouseOver)];
      }
      return [];
    }, [hasMouseOver]);

    if (isLoading) {
      return (
        <Col className="flex items-center justify-center h-full">
          <LoadingSpinner size={50} />
        </Col>
      );
    }

    return <ReactChart type="bar" data={data} options={options} plugins={chartPlugins} />;
  },
);

export default BarChart;

const baseOptions: ChartOptions<"bar"> = {
  responsive: true,
  maintainAspectRatio: false,
  // @ts-ignore
  borderRadius: 4,
  categoryPercentage: 0.95,
  // hover interaction for over the area not the bar
  interaction: {
    mode: "index",
    intersect: false,
    axis: "x",
  },
  hover: {
    mode: "index",
    intersect: false,
    axis: "x",
  },
  scales: {
    y: {
      beginAtZero: true,
    },
    x: {
      stacked: false,
    },
  },
  elements: {
    // default colors. Can be overriden
    bar: {
      backgroundColor: "rgba(56, 127, 92, 0.5)",
      borderColor: "rgba(56, 127, 92, 1)",
      hoverBackgroundColor: "rgba(56, 127, 92, 0.8)",
      hoverBorderColor: "rgba(56, 127, 92, 1)",
      hoverBorderWidth: 1,
    },
  },
};
