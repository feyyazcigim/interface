import IconImage from "@/components/ui/IconImage";
import { navbarPanelAtom } from "@/state/app/navBar.atoms";
import { useChartSetupData } from "@/state/useChartSetupData";
import { useSeason } from "@/state/useSunData";
import { cn } from "@/utils/utils";
import { useAtom } from "jotai";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDownIcon, SearchIcon } from "../Icons";
import { MIN_ADV_SEASON, chartSeasonInputsAtom, selectedChartsAtom } from "../charts/AdvancedChart";
import { Input } from "../ui/Input";
import { ScrollArea } from "../ui/ScrollArea";
import { Separator } from "../ui/Separator";

const ChartSelectPanel = memo(() => {
  const { data: chartSetupData, chartColors } = useChartSetupData();
  const currentSeason = useSeason();

  const [panelState, _] = useAtom(navbarPanelAtom);
  const [selectedCharts, setSelected] = useAtom(selectedChartsAtom);
  const [chartSeasonInputs, setChartSeasonInputs] = useAtom(chartSeasonInputsAtom);
  const isOpen = panelState.openPanel === "chart-select";

  const [searchInput, setSearchInput] = useState("");
  const [internalSelected, setInternalSelected] = useState(selectedCharts);
  const [internalSeasonInputs, setInternalSeasonInputs] = useState(chartSeasonInputs);
  const [rawSeasonInputs, setRawSeasonInputs] = useState<Record<string, string>>({});
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());
  const validationTimeouts = useRef<Record<string, NodeJS.Timeout>>({});

  const currentlySelected = internalSelected.length;
  const maxChartsSelected = chartColors.length;

  const filteredData = useMemo(() => {
    if (!searchInput || searchInput === "") {
      return chartSetupData;
    } else {
      const inputFilter = searchInput.split(/(\s+)/).filter((output) => output.trim().length > 0);
      return chartSetupData.filter((option) =>
        inputFilter.every((filter) => option.name.toLowerCase().includes(filter.toLowerCase())),
      );
    }
  }, [chartSetupData, searchInput]);

  const groupedData = useMemo(() => {
    const groups: Record<string, typeof filteredData> = {};
    filteredData.forEach((item) => {
      groups[item.type] ??= [];
      groups[item.type].push(item);
    });
    return groups;
  }, [filteredData]);

  // Expand all types when searching
  useEffect(() => {
    if (searchInput) {
      const allTypes = new Set(Object.keys(groupedData));
      setExpandedTypes(allTypes);
    }
  }, [searchInput, groupedData]);

  const updateSearchInput = useCallback(
    (searchText: string) => {
      setSearchInput(searchText);
      if (searchText === "") {
        setExpandedTypes(new Set());
      } else {
        const allTypes = new Set(Object.keys(groupedData));
        setExpandedTypes(allTypes);
      }
    },
    [groupedData],
  );

  const toggleType = (type: string) => {
    setExpandedTypes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  };

  const handleSelection = useCallback(
    (selection: number) => {
      const selectedItems = [...internalSelected];
      const indexInSelection = selectedItems.findIndex((selectionIndex) => selection === selectionIndex);
      const isSelected = indexInSelection > -1;

      if (isSelected) {
        // When deselecting, also clear the season input for this chart
        const chartData = chartSetupData.find((chart) => chart.index === selection);
        if (chartData) {
          if (validationTimeouts.current[chartData.id]) {
            clearTimeout(validationTimeouts.current[chartData.id]);
            delete validationTimeouts.current[chartData.id];
          }
          setInternalSeasonInputs((prev) => {
            const updated = { ...prev };
            delete updated[chartData.id];
            return updated;
          });
          setRawSeasonInputs((prev) => {
            const updated = { ...prev };
            delete updated[chartData.id];
            return updated;
          });
        }
        selectedItems.splice(indexInSelection, 1);
      } else {
        // When selecting, initialize season input to min value
        const chartData = chartSetupData.find((chart) => chart.index === selection);
        if (chartData && chartData.inputOptions === "SEASON") {
          setInternalSeasonInputs((prev) => ({
            ...prev,
            [chartData.id]: MIN_ADV_SEASON,
          }));
          setRawSeasonInputs((prev) => ({
            ...prev,
            [chartData.id]: MIN_ADV_SEASON.toString(),
          }));
        }
        selectedItems.push(selection);
      }

      if (selectedItems.length > maxChartsSelected) return;
      setInternalSelected(selectedItems);
    },
    [internalSelected, maxChartsSelected, chartSetupData],
  );

  // Update internal selection when panel opens
  useEffect(() => {
    if (isOpen) {
      setInternalSelected([...selectedCharts]);
      setInternalSeasonInputs({ ...chartSeasonInputs });
      // Initialize raw inputs from the stored values
      const rawInputs: Record<string, string> = {};
      Object.entries(chartSeasonInputs).forEach(([chartId, value]) => {
        rawInputs[chartId] = value.toString();
      });
      setRawSeasonInputs(rawInputs);
    }
  }, [isOpen, selectedCharts, chartSeasonInputs]);

  // Save selections and season inputs when panel closes
  useEffect(() => {
    if (!isOpen) {
      setSelected(internalSelected);
      setChartSeasonInputs(internalSeasonInputs);
    }
  }, [isOpen, internalSelected, internalSeasonInputs, setSelected, setChartSeasonInputs]);

  // Handle raw season input changes with debounced validation
  const handleSeasonInputChange = useCallback(
    (chartId: string, value: string) => {
      // Clear existing timeout for this specific chart
      if (validationTimeouts.current[chartId]) {
        clearTimeout(validationTimeouts.current[chartId]);
      }

      // Update raw input immediately
      setRawSeasonInputs((prev) => ({
        ...prev,
        [chartId]: value,
      }));

      // Set new timeout only for this chart
      validationTimeouts.current[chartId] = setTimeout(() => {
        const numValue = parseInt(value, 10);
        if (!Number.isNaN(numValue) && value.trim() !== "") {
          const clampedValue = Math.max(MIN_ADV_SEASON, Math.min(currentSeason, numValue));
          setInternalSeasonInputs((prev) => ({
            ...prev,
            [chartId]: clampedValue,
          }));
          // Update raw input to show the clamped value
          setRawSeasonInputs((prev) => ({
            ...prev,
            [chartId]: clampedValue.toString(),
          }));
        } else if (value.trim() === "") {
          // Don't allow empty values - revert to minimum value
          setInternalSeasonInputs((prev) => ({
            ...prev,
            [chartId]: MIN_ADV_SEASON,
          }));
          setRawSeasonInputs((prev) => ({
            ...prev,
            [chartId]: MIN_ADV_SEASON.toString(),
          }));
        }
        delete validationTimeouts.current[chartId];
      }, 500);
    },
    [currentSeason],
  );

  useEffect(() => {
    if (!isOpen) {
      // Clear all pending timeouts when panel closes
      Object.values(validationTimeouts.current).forEach(clearTimeout);
      validationTimeouts.current = {};
    }
  }, [isOpen]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      Object.values(validationTimeouts.current).forEach(clearTimeout);
    };
  }, []);

  return (
    <>
      <div className="flex flex-col">
        <div className="flex flex-col gap-6 p-6">
          <div className="flex flex-row justify-between items-center">
            <span className="pinto-h4">Compare Data</span>
            <span className="pinto-sm-light text-pinto-gray-4">
              {currentlySelected}/{maxChartsSelected} Selected
            </span>
          </div>
          <Input
            type="text"
            className="bg-pinto-gray-1 placeholder:text-pinto-gray-4 border-pinto-gray-2"
            placeholder="Search"
            onChange={(e) => updateSearchInput(e.target.value)}
            startIcon={<SearchIcon className="ml-2" />}
          />
        </div>
        <Separator />
        <div className="overflow-clip">
          <ScrollArea className="flex flex-col h-[calc(100dvh-17.5rem)]">
            {Object.entries(groupedData).map(([type, items]) => (
              <div key={type} className="flex flex-col">
                <div
                  className="flex flex-row items-center gap-3 justify-between hover:cursor-pointer hover:bg-pinto-gray-2/20 py-3 pl-3 pr-4 transition-colors"
                  onClick={() => toggleType(type)}
                >
                  <div className="flex items-center gap-2">
                    <ChevronDownIcon
                      className={cn("w-4 h-4 transition-transform", expandedTypes.has(type) ? "rotate-180" : "")}
                    />
                    <span className="pinto-body-light">{type}</span>
                  </div>
                  <span className="pinto-sm-light text-pinto-gray-4">{items.length} items</span>
                </div>
                <div className="flex flex-col">
                  {items.map((data) => {
                    const indexInSelection = internalSelected.findIndex(
                      (selectionIndex) => data.index === selectionIndex,
                    );
                    const isSelected = indexInSelection > -1;
                    return (
                      (expandedTypes.has(type) || isSelected) && (
                        <div
                          className={cn(
                            "hover:cursor-pointer hover:bg-pinto-gray-2/20 py-2 px-6",
                            isSelected && "bg-pinto-gray-2/70 hover:bg-pinto-gray-2/50",
                          )}
                          onClick={() => handleSelection(data.index)}
                        >
                          <div
                            key={`chartSelectList${data.id}`}
                            className="flex flex-row items-center gap-3 my-0.5 justify-between transition-colors"
                          >
                            <IconImage src={data.icon} size={9} />
                            <div className="flex flex-col basis-full gap-1">
                              <div className="pinto-body-light">{data.name}</div>
                              <div className="pinto-sm-light text-pinto-gray-4">{data.shortDescription}</div>
                            </div>
                          </div>
                          {isSelected && data.inputOptions === "SEASON" && (
                            <div className="mt-2 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <label className="pinto-sm-light text-pinto-primary whitespace-nowrap">
                                Starting Season:
                              </label>
                              <Input
                                type="number"
                                min={MIN_ADV_SEASON}
                                max={currentSeason}
                                value={rawSeasonInputs[data.id] || ""}
                                onChange={(e) => handleSeasonInputChange(data.id, e.target.value)}
                                className="w-[70px] rounded-[0.5rem] bg-pinto-gray-1 border-pinto-gray-2 text-sm px-2 py-0 h-8"
                              />
                            </div>
                          )}
                        </div>
                      )
                    );
                  })}
                </div>
              </div>
            ))}
          </ScrollArea>
        </div>
      </div>
    </>
  );
});

export default ChartSelectPanel;
