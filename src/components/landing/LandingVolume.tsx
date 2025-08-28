import LineChart, { LineChartData, MakeGradientFunction } from "@/components/charts/LineChart";
import { useCallback, useEffect, useState } from "react";

const makeLineGradients: MakeGradientFunction[] = [
  (ctx: CanvasRenderingContext2D | null) => {
    if (!ctx) return undefined;
    const gradient = ctx.createLinearGradient(0, 0, ctx.canvas.width, 0);
    gradient.addColorStop(0, "#59f0a7");
    gradient.addColorStop(0.5, "#00C767");
    gradient.addColorStop(1, "#246645");
    return gradient;
  },
];

const makeAreaGradients: MakeGradientFunction[] = [
  (ctx: CanvasRenderingContext2D | null) => {
    if (!ctx) return undefined;
    const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
    gradient.addColorStop(0, "rgba(0, 199, 103, 0.3)");
    gradient.addColorStop(1, "rgba(0, 199, 103, 0.05)");
    return gradient;
  },
];

// Cumulative volume data from 2021 to 2025 - steady growth to $1.1B
const sampleVolumeData: LineChartData[] = [
  { values: [0], day: "2021" },
  { values: [57894737], day: "2021" },
  { values: [95789474], day: "2021" },
  { values: [113684211], day: "2021" },
  { values: [211578947], day: "2022" },
  { values: [249473684], day: "2022" },
  { values: [347368421], day: "2022" },
  { values: [385263158], day: "2022" },
  { values: [473157895], day: "2023" },
  { values: [511052632], day: "2023" },
  { values: [558947368], day: "2023" },
  { values: [616842105], day: "2023" },
  { values: [634736842], day: "2024" },
  { values: [772631579], day: "2024" },
  { values: [830526316], day: "2024" },
  { values: [848421053], day: "2024" },
  { values: [956315789], day: "2025" },
  { values: [984210526], day: "2025" },
  { values: [1000000000], day: "2025" },
];

const valueFormatter = (value: number) => {
  if (value >= 1000000000) {
    return `$${(value / 1000000000).toFixed(0)}B`;
  }
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(0)}M`;
  }
  if (value === 0) {
    return "";
  }
  return `$${(value / 1000).toFixed(0)}K`;
};

export default function LandingVolume() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="w-screen sm:w-full place-self-center">
        <div className="bg-white border mx-4 p-3 sm:mx-0 sm:p-6 rounded-lg flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <span className="text-sm sm:text-xl font-light text-pinto-gray-4">Cumulative Volume</span>
            <span className="text-body sm:text-[2rem] font-normal leading-[1.1] tracking-h3 text-black">$1B</span>
          </div>
          <div className="max-sm:aspect-3/1">
            <div className="h-[250px] sm:w-[60rem] sm:h-[25rem] bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen sm:w-full">
      <div className="bg-white border mx-4 p-3 sm:mx-0 sm:p-6 rounded-lg flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <span className="text-sm sm:text-xl font-light text-pinto-gray-4">Cumulative Volume</span>
          <span className="text-body sm:text-[2rem] font-normal leading-[1.1] tracking-h3 text-black">$1B</span>
        </div>
        <div className="max-sm:aspect-3/1">
          <div className="h-[150px] sm:w-[60rem] sm:h-[15rem] pointer-events-none">
            <LineChart
              key="volume-chart"
              data={sampleVolumeData}
              size="small"
              xKey="day"
              makeLineGradients={makeLineGradients}
              makeAreaGradients={makeAreaGradients}
              valueFormatter={valueFormatter}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
