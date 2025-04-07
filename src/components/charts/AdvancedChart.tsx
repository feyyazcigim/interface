import { navbarPanelAtom } from "@/state/app/navBar.atoms";
import { useChartSetupData } from "@/state/useChartSetupData";
import useSeasonsDataChart from "@/state/useSeasonsDataChart";
import { useSeason } from "@/state/useSunData";
import { cn } from "@/utils/utils";
import { atom, useAtom } from "jotai";
import { IRange, Time, UTCTimestamp } from "lightweight-charts";
import { useEffect, useMemo, useState } from "react";
import CalendarButton from "../CalendarButton";
import { PlusIcon } from "../Icons";
import { Button } from "../ui/Button";
import TVChart, { TVChartFormattedData } from "./TVChart";

export const selectedChartsAtom = atom<number[]>([0]);

export const AdvancedChart = () => {
  const { data: chartSetupData } = useChartSetupData();
  const currentSeason = useSeason();

  const storedSetting1 = localStorage.getItem("advancedChartTimePeriod");
  const storedTimePeriod = storedSetting1 ? JSON.parse(storedSetting1) : undefined;
  const storedSetting2 = localStorage.getItem("advancedChartSelectedCharts");
  const storedSelectedCharts = storedSetting2 ? JSON.parse(storedSetting2) : undefined;

  const [timePeriod, setTimePeriod] = useState<IRange<Time> | undefined>(storedTimePeriod);
  const [selectedCharts, setSelectedCharts] = useAtom(selectedChartsAtom);
  const [panelState, setPanelState] = useAtom(navbarPanelAtom);

  function handleDeselectChart(selectionIndex: number) {
    const newSelection = [...selectedCharts];
    newSelection.splice(selectionIndex, 1);
    setSelectedCharts(newSelection);
    localStorage.setItem("advancedChartSelectedCharts", JSON.stringify(newSelection));
  }

  const togglePanel = () => {
    if (panelState.openPanel === "chart-select") {
      setPanelState({
        ...panelState,
        backdropVisible: false,
        openPanel: undefined,
        walletPanel: {
          ...panelState.walletPanel,
          showClaim: false,
          showTransfer: false,
        },
      });
    } else {
      setPanelState({
        ...panelState,
        backdropMounted: true,
        backdropVisible: true,
        openPanel: "chart-select",
        walletPanel: {
          ...panelState.walletPanel,
          showClaim: false,
          showTransfer: false,
        },
      });
    }
  };

  const seasonsData = useSeasonsDataChart(7, currentSeason);

  const filtered = useMemo(() => {
    const output: TVChartFormattedData[][] = [];
    if (selectedCharts.length === 0) return output;
    selectedCharts.forEach((selection, selectedIndex) => {
      const selectedChart = chartSetupData[selection];
      const _output: TVChartFormattedData[] = [];
      seasonsData.data.forEach((seasonData, index) => {
        const formatValue = selectedChart.valueFormatter;
        const dataPoint = {
          value: formatValue(seasonData[selectedChart.priceScaleKey]),
          time: new Date(seasonData.timestamp).getTime() as UTCTimestamp,
          customValues: {
            season: seasonData.season,
          },
        };
        _output.push(dataPoint);
      });
      output.push(_output.reverse());
    });
    return output;
  }, [selectedCharts, chartSetupData, seasonsData.data]);

  // Handle height
  const [height, setHeight] = useState(500);

  const calculateHeight = () => {
    const elem = document.getElementById("pinto-navbar");
    if (!elem) {
      return;
    }
    const windowHeight = window.innerHeight;
    const headerOffset = elem?.getBoundingClientRect().height;
    const newHeight = windowHeight - headerOffset;
    setHeight(newHeight);
  };

  useEffect(() => {
    calculateHeight();

    window.addEventListener("resize", calculateHeight);
    return () => {
      window.removeEventListener("resize", calculateHeight);
    };
  }, []);

  return (
    <div className="flex flex-col -mb-8 sm:-mb-20 gap-6">
      <div className="flex flex-row gap-4 justify-between">
        <div className="flex flex-row gap-4">
          {selectedCharts.map(
            (selection, index) =>
              chartSetupData[selection] && (
                <Button
                  variant="outline"
                  size="default"
                  rounded="full"
                  key={`selectedChart${selection}`}
                  className="flex flex-row gap-2 shadow-none bg-white text-pinto-gray-5 hover:text-pinto-gray-5"
                  onClick={() => handleDeselectChart(index)}
                >
                  <span>{chartSetupData[selection].name}</span>
                  <span className="w-4 h-4">×</span>
                </Button>
              ),
          )}
          <Button
            variant="outline"
            size="default"
            rounded="full"
            onClick={togglePanel}
            noShrink
            className={cn(
              `flex flex-row gap-0.5 bg-pinto-green-1 text-pinto-green-3 border-pinto-green-3 hover:bg-pinto-green-2/30 shadow-none hover:text-pinto-green-3 sm:gap-2`,
            )}
          >
            Add Chart
            <PlusIcon color={"currentColor"} />
          </Button>
        </div>
        <CalendarButton setTimePeriod={setTimePeriod} />
      </div>
      <TVChart selected={selectedCharts} formattedData={filtered} height={height} timePeriod={timePeriod} />
    </div>
  );
};
