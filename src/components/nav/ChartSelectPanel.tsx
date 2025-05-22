import IconImage from "@/components/ui/IconImage";
import { navbarPanelAtom } from "@/state/app/navBar.atoms";
import { useChartSetupData } from "@/state/useChartSetupData";
import { cn } from "@/utils/utils";
import { useAtom } from "jotai";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { SearchIcon, ChevronDownIcon } from "../Icons";
import { selectedChartsAtom } from "../charts/AdvancedChart";
import { Input } from "../ui/Input";
import { ScrollArea } from "../ui/ScrollArea";
import { Separator } from "../ui/Separator";

const ChartSelectPanel = memo(() => {
  const { data: chartSetupData, chartColors } = useChartSetupData();

  const [panelState, _] = useAtom(navbarPanelAtom);
  const [selectedCharts, setSelected] = useAtom(selectedChartsAtom);
  const isOpen = panelState.openPanel === "chart-select";

  const [searchInput, setSearchInput] = useState("");
  const [internalSelected, setInternalSelected] = useState(selectedCharts);
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());

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
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchInput(e.target.value);
      if (e.target.value === "") {
        setExpandedTypes(new Set());
      } else {
        const allTypes = new Set(Object.keys(groupedData));
        setExpandedTypes(allTypes);
      }
    },
    [groupedData],
  );

  const toggleTypeFactory = useCallback(
    (type: string) => () => {
      setExpandedTypes((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(type)) {
          newSet.delete(type);
        } else {
          newSet.add(type);
        }
        return newSet;
      });
    },
    [],
  );

  const handleSelectionFactory = useCallback(
    (selection: number) => () => {
      const selectedItems = [...internalSelected];
      const indexInSelection = selectedItems.findIndex((selectionIndex) => selection === selectionIndex);
      const isSelected = indexInSelection > -1;
      isSelected ? selectedItems.splice(indexInSelection, 1) : selectedItems.push(selection);
      if (selectedItems.length > maxChartsSelected) return;
      setInternalSelected(selectedItems);
    },
    [internalSelected, maxChartsSelected],
  );

  // Update internal selection when panel opens
  useEffect(() => {
    if (isOpen) {
      setInternalSelected([...selectedCharts]);
    }
  }, [isOpen, selectedCharts]);

  // Save selections when panel closes
  useEffect(() => {
    if (!isOpen) {
      setSelected(internalSelected);
    }
  }, [isOpen, internalSelected, setSelected]);

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
            onChange={updateSearchInput}
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
                  onClick={toggleTypeFactory(type)}
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
                          key={`chartSelectList${data.id}`}
                          className={cn(
                            "flex flex-row items-center gap-3 my-0.5 justify-between hover:cursor-pointer hover:bg-pinto-gray-2/20 py-2 px-6 transition-colors",
                            isSelected && "bg-pinto-gray-2/70 hover:bg-pinto-gray-2/50",
                          )}
                          onClick={handleSelectionFactory(data.index)}
                        >
                          <IconImage src={data.icon} size={9} />
                          <div className="flex flex-col basis-full gap-1">
                            <div className="pinto-body-light">{data.name}</div>
                            <div className="pinto-sm-light text-pinto-gray-4">{data.shortDescription}</div>
                          </div>
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
