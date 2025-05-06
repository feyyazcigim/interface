import { exists } from "@/utils/utils";
import {
  BarController,
  BarElement,
  CartesianScaleTypeRegistry,
  ChartData,
  Chart as ChartJS,
  ChartOptions,
  PointElement,
} from "chart.js";
import React, { useMemo } from "react";
import { Col } from "../Container";
import LoadingSpinner from "../LoadingSpinner";
import { ReactChart } from "../ReactChart";
import { plugins } from "./chartHelpers";

ChartJS.register(BarController, BarElement, PointElement);

type BarChartProps = {
  data: ChartData<"bar">;
  isLoading?: boolean;
  onMouseOver?: (index: number | undefined) => void;
  yLabelFormatter?: (value: number | string) => string;
  xLabelFormatter?: (value: number | string) => string;
  defaultHoverIndex?: number;
  yScaleType?: keyof CartesianScaleTypeRegistry;
  enableTooltips?: boolean;
};

const BarChart = React.memo(
  ({
    data,
    isLoading,
    onMouseOver,
    yLabelFormatter,
    xLabelFormatter,
    defaultHoverIndex,
    yScaleType = "logarithmic",
    enableTooltips = false,
  }: BarChartProps) => {
    const options: ChartOptions<"bar"> = useMemo(
      () => ({
        ...baseOptions,
        scales: {
          y: {
            type: yScaleType,
            ticks: {
              display: !!yLabelFormatter,
              callback: yLabelFormatter,
              beginAtZero: yScaleType === "linear", // only linear scale can begin at zero
              autoSkip: true,
              maxTicksLimit: 5,
            },
          },
          x: {
            stacked: false, //
            ticks: {
              display: !!xLabelFormatter,
              callback: xLabelFormatter,
              autoSkip: true,
              maxTicksLimit: 5,
            },
          },
        },
        onHover: (_, elements) => {
          onMouseOver?.(elements[0]?.index ?? undefined);
        },
        onLeave: () => {
          onMouseOver?.(defaultHoverIndex);
        },
        elements: {
          bar: {
            ...baseOptions.elements?.bar,
            backgroundColor: (ctx) => {
              const hoverColor = ctx.dataset.hoverBackgroundColor ?? baseOptions.elements?.bar?.hoverBackgroundColor;
              const color = ctx.dataset.backgroundColor ?? baseOptions.elements?.bar?.backgroundColor;
              // Don't handle the case where the background color is a scriptable function yet.
              if (typeof hoverColor !== "string" || typeof color !== "string") return undefined;
              const isHovered =
                ctx.active || (!ctx.chart.getActiveElements().length && ctx.dataIndex === defaultHoverIndex);
              return isHovered ? hoverColor : color;
            },
            borderColor: (ctx) => {
              const hoverColor = ctx.dataset.hoverBorderColor ?? baseOptions.elements?.bar?.hoverBorderColor;
              const color = ctx.dataset.borderColor ?? baseOptions.elements?.bar?.borderColor;

              // Don't handle the case where the border color is a scriptable function yet.
              if (typeof hoverColor !== "string" || typeof color !== "string") return undefined;
              const isHovered =
                ctx.active || (!ctx.chart.getActiveElements().length && ctx.dataIndex === defaultHoverIndex);
              return isHovered ? hoverColor : color;
            },
          },
        },
        plugins: {
          tooltip: {
            enabled: enableTooltips,
          },
        },
      }),
      [onMouseOver, yLabelFormatter, xLabelFormatter, defaultHoverIndex, enableTooltips, yScaleType],
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
  plugins: {
    tooltip: {
      enabled: false,
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
