import pintoTokenVanilla from "@/assets/tokens/PINTO_VANILLA.png";
import FrameAnimator from "@/components/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useAllMarket } from "@/state/market/useAllMarket";
import { useHarvestableIndex } from "@/state/useFieldData";
import { formatter } from "@/utils/format";
import { Chart, Legend, LinearScale, PointElement, ScatterController, Title, Tooltip } from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";

Chart.register(ScatterController, PointElement, LinearScale, Title, Tooltip, Legend);
// Chart.register(ScatterController, PointElement, LinearScale, Title, Tooltip, Legend, zoomPlugin);

interface ScatterPlotData {
  x: number;
  y: number;
  r: number;
  amount: number;
  status: string;
  originalEvent: any;
  id: string;
  type: string;
  index: number;
  interactable: boolean;
}

export interface ScatterChartProps {
  title?: string;
  data: ScatterPlotData[];
  isLoading: boolean;
  xYMinMax?: {
    x?: {
      min?: number;
      max?: number;
    };
    y?: {
      min?: number;
      max?: number;
    };
  };
  onPointClick?: (point: any) => void;
}

export function ScatterChart({ title, data, isLoading, xYMinMax, onPointClick }: Readonly<ScatterChartProps>) {
  const [chartInstance, setChartInstance] = useState<Chart | null>(null);
  const hasInitializedRef = useRef(false);
  const navigate = useNavigate();

  const selectedPointRef = useRef<any>(null);
  const isPointSelectedRef = useRef(false);
  const initialMaxX = useRef<number>(xYMinMax?.x?.max || 10);
  const initialMaxY = useRef<number>(xYMinMax?.y?.max || 1);
  const isZoomedRef = useRef(false);
  const isPanningRef = useRef(false);

  const navigateTo = useCallback(
    (event) => {
      if (event.status === "ACTIVE") {
        if (onPointClick) onPointClick(event);
        setTimeout(() => {
          if (event.type === "LISTING") {
            navigate(`/market/pods/buy/${event.index}`);
          } else {
            navigate(`/market/pods/sell/${event.id}`);
          }
        }, 10);
      }
    },
    [navigate, onPointClick],
  );

  useEffect(() => {
    if (isLoading || !data || !data.length || hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const maxXValue = data.reduce((max, point) => Math.max(max, point?.x || 0), 10);
    initialMaxX.current = xYMinMax?.x?.max || Math.ceil(maxXValue || 10);

    const canvas = document.getElementById("marketScatterChart") as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.src = pintoTokenVanilla;

    const customTooltipPlugin = {
      id: "customTooltip",
    };

    const crosshairPlugin = {
      id: "crosshairPlugin",
      afterDraw(chart: Chart) {
        if (!selectedPointRef.current) return;
        const point = selectedPointRef.current;
        const x = chart.scales.x.getPixelForValue(point.x);
        const y = chart.scales.y.getPixelForValue(point.y);
        const chartArea = chart.chartArea;
        ctx.save();
        ctx.lineWidth = 1;
        ctx.strokeStyle = "gray";
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, chartArea.bottom);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(chartArea.left, y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "black";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(formatter.twoDec(point.x) + "M", x, chartArea.bottom - 5);
        ctx.textAlign = "right";
        ctx.fillText(formatter.twoDec(point.y), chartArea.left + 25, y);
        ctx.restore();
      },
    };

    const pulsingEffectPlugin = {
      id: "pulsingEffect",
      afterDraw(chart: Chart) {
        if (selectedPointRef.current && isPointSelectedRef.current) {
          const point = selectedPointRef.current;
          const pulse = Math.abs(Math.sin(Date.now() / 500)) * 3;
          const radius = (point.r || 4) + pulse;
          const x = chart.scales.x.getPixelForValue(point.x);
          const y = chart.scales.y.getPixelForValue(point.y);
          ctx.save();
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, 2 * Math.PI);
          ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
          ctx.fill();
          ctx.restore();
          requestAnimationFrame(() => chart.draw());
        }
      },
    };

    const zoomInfoPlugin = {
      id: "zoomInfo",
      afterDraw(chart: Chart) {
        const isZoomed =
          chart.scales.x.min !== 0 ||
          chart.scales.x.max !== initialMaxX.current ||
          chart.scales.y.min !== 0 ||
          chart.scales.y.max !== initialMaxY.current;

        isZoomedRef.current = isZoomed;
        const canvasEl = chart.canvas;

        if (isZoomed && !isPointSelectedRef.current) {
          canvasEl.style.cursor = isPanningRef.current ? "grabbing" : "grab";
        } else if (!isPointSelectedRef.current) {
          canvasEl.style.cursor = "default";
        }

        const chartArea = chart.chartArea;
        const buttonX = chartArea.right - 80;
        const buttonY = chartArea.top - 10;
        const buttonWidth = 70;
        const buttonHeight = 20;

        if (isZoomed) {
          ctx.save();
          ctx.fillStyle = isPointSelectedRef.current ? "rgba(200, 200, 200, 0.5)" : "rgba(240, 240, 240, 0.8)";
          ctx.beginPath();
          ctx.roundRect(buttonX, buttonY, buttonWidth, buttonHeight, 4);
          ctx.fill();
          ctx.fillStyle = "#333";
          ctx.font = "10px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("Reset Zoom", buttonX + buttonWidth / 2, buttonY + buttonHeight / 2);
          ctx.restore();

          canvasEl.onclick = (event) => {
            if (isPointSelectedRef.current) return;
            const rect = canvasEl.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            if (x >= buttonX && x <= buttonX + buttonWidth && y >= buttonY && y <= buttonY + buttonHeight) {
              chart.resetZoom();
              sessionStorage.removeItem("chartZoomState");
            }
          };
        } else {
          canvasEl.onclick = null;
        }
      },
    };

    const newChartInstance = new Chart(ctx, {
      type: "scatter",
      data: {
        datasets: [
          {
            label: "Listings",
            data: data.filter((d) => d !== null && d.status === "ACTIVE" && d.type === "LISTING"),
            backgroundColor: "#00C767",
            borderColor: "#00C767",
            pointRadius: 3,
            pointHoverRadius: 4,
          },
          {
            label: "Orders",
            data: data.filter((d) => d !== null && d.status === "ACTIVE" && d.type === "ORDER"),
            backgroundColor: "#D3B567",
            borderColor: "#D3B567",
            pointRadius: 3,
            pointHoverRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: "linear",
            position: "bottom",
            min: xYMinMax?.x?.min || 0,
            max: xYMinMax?.x?.max || initialMaxX.current,
            ticks: {
              stepSize: 50,
              callback: (val) => `${Number(val).toFixed(2)}M`,
            },
          },
          y: {
            min: xYMinMax?.y?.min || 0,
            max: xYMinMax?.y?.max || initialMaxY.current,
            ticks: {
              stepSize: 0.2,
              callback: (val) => formatter.twoDec(val),
            },
          },
        },
        plugins: {
          tooltip: {
            displayColors: false,
            callbacks: {
              label: (ctx) => [`${formatter.noDec((ctx.raw as { amount: number | null }).amount || 0)} pods`],
              labelPointStyle: () => ({ pointStyle: "rect", rotation: 0 }),
            },
          },
          legend: { display: false },
          // zoom: {
          //   zoom: {
          //     wheel: { enabled: !isPointSelectedRef.current },
          //     pinch: { enabled: !isPointSelectedRef.current },
          //     mode: "xy",
          //   },
          //   pan: {
          //     enabled: true,
          //     mode: "xy",
          //   },
          //   limits: {
          //     x: { min: 0, max: initialMaxX.current, minRange: 1 },
          //     y: { min: 0, max: initialMaxY.current, minRange: 0.1 },
          //   },
          // },
        },
        onClick(event, elements) {
          if (elements.length > 0) {
            const element = elements[0];
            const dataPoint = newChartInstance.data.datasets[element.datasetIndex].data[element.index] as any;
            if (dataPoint.interactable) {
              selectedPointRef.current = dataPoint;
              isPointSelectedRef.current = true;

              // if (newChartInstance.options.plugins?.zoom?.zoom?.wheel && newChartInstance.options.plugins.zoom.pan) {
              //   newChartInstance.options.plugins.zoom.zoom.wheel.enabled = false;
              //   newChartInstance.options.plugins.zoom.pan.enabled = false;
              // }
              newChartInstance.update();

              setTimeout(() => navigateTo(dataPoint), 0);
            }
          } else {
            selectedPointRef.current = null;
            isPointSelectedRef.current = false;

            // if (newChartInstance.options.plugins?.zoom?.zoom?.wheel && newChartInstance.options.plugins.zoom.pan) {
            //   newChartInstance.options.plugins.zoom.zoom.wheel.enabled = true;
            //   newChartInstance.options.plugins.zoom.pan.enabled = true;
            // }
            newChartInstance.update();
          }
        },

        onHover(event, elements) {
          if (elements.length > 0) {
            const element = elements[0];
            const dataPoint = newChartInstance.data.datasets[element.datasetIndex].data[element.index] as any;

            if (dataPoint?.interactable) {
              selectedPointRef.current = dataPoint;
              canvas.style.cursor = "pointer";
            } else {
              selectedPointRef.current = null;
              canvas.style.cursor = isZoomedRef.current ? "grab" : "default";
            }
          } else {
            if (!isPointSelectedRef.current) {
              selectedPointRef.current = null;
              canvas.style.cursor = isZoomedRef.current ? "grab" : "default";
            }
          }

          newChartInstance.update();
        },
      },
      plugins: [customTooltipPlugin, crosshairPlugin, pulsingEffectPlugin, zoomInfoPlugin],
    });

    // Restore zoom function
    // try {
    //   const zoomState = JSON.parse(sessionStorage.getItem("chartZoomState") || "{}");
    //   if (zoomState.xMin != null) {
    //     if (newChartInstance.options.scales?.x) {
    //       newChartInstance.options.scales.x.min = zoomState.xMin;
    //       newChartInstance.options.scales.x.max = zoomState.xMax;
    //     }
    //     if (newChartInstance.options.scales?.y) {
    //       newChartInstance.options.scales.y.min = zoomState.yMin;
    //       newChartInstance.options.scales.y.max = zoomState.yMax;
    //     }
    //     newChartInstance.update();
    //   }
    // } catch { }

    canvas.addEventListener("mousedown", () => {
      if (isZoomedRef.current) {
        isPanningRef.current = true;
        canvas.style.cursor = "grabbing";
      }
    });
    canvas.addEventListener("mouseup", () => {
      if (isZoomedRef.current) {
        isPanningRef.current = false;
        canvas.style.cursor = "grab";
      }
    });
    canvas.addEventListener("mouseleave", () => {
      isPanningRef.current = false;
      if (isZoomedRef.current && !isPointSelectedRef.current) {
        canvas.style.cursor = "grab";
      }
    });

    setChartInstance(newChartInstance);

    return () => {
      if (selectedPointRef.current) {
        sessionStorage.setItem("selectedChartPoint", JSON.stringify(selectedPointRef.current));
        sessionStorage.setItem("isPointSelected", String(isPointSelectedRef.current));
      }
      if (newChartInstance) {
        try {
          const { min: xMin, max: xMax } = newChartInstance.scales.x;
          const { min: yMin, max: yMax } = newChartInstance.scales.y;
          sessionStorage.setItem("chartZoomState", JSON.stringify({ xMin, xMax, yMin, yMax }));
        } catch { }
        newChartInstance.destroy();
        hasInitializedRef.current = false;
      }
    };
  }, [isLoading, data, navigate, navigateTo]);

  return (
    <Card className="h-full w-full mt-4">
      <CardHeader>
        <div className="flex justify-between items-center w-full">
          <div className="flex space-x-2">
            {title && <CardTitle className="pinto-body-light text-pinto-light ml-2.5">{title}</CardTitle>}
            {isLoading && !hasInitializedRef.current && <FrameAnimator className="-mt-5 -mb-12" size={80} />}
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-[25rem]">
        <div className="w-full h-full">
          <canvas id="marketScatterChart" />
        </div>
      </CardContent>
    </Card>
  );
}

export default ScatterChart;
