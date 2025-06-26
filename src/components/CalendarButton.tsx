import { safeJSONStringify } from "@/utils/utils";
import { format, isValid, parse, set, startOfYear, subHours, subMonths, subWeeks, subYears } from "date-fns";
import { IRange, Time, UTCTimestamp } from "lightweight-charts";
import { useCallback, useEffect, useState, useRef } from "react";
import { ClassNames, DayPicker, DateRange as DayPickerDateRange, DeprecatedUI } from "react-day-picker";
import { CalendarIcon, ClockIcon } from "./Icons";
import { Input } from "./ui/Input";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/Popover";
import { Separator } from "./ui/Separator";

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export interface DatePresetConfig {
  from: () => Date | undefined;
  to: () => Date | undefined;
}

// Predefined date ranges
const DATE_PRESETS: Record<Exclude<string, "CUSTOM">, DatePresetConfig> = {
  "1D": { from: () => subHours(new Date(), 24), to: () => new Date() },
  "1W": { from: () => subWeeks(new Date(), 1), to: () => new Date() },
  "1M": { from: () => subMonths(new Date(), 1), to: () => new Date() },
  "3M": { from: () => subMonths(new Date(), 3), to: () => new Date() },
  "6M": { from: () => subMonths(new Date(), 6), to: () => new Date() },
  YTD: { from: () => startOfYear(new Date()), to: () => new Date() },
  "1Y": { from: () => subYears(new Date(), 1), to: () => new Date() },
  "2Y": { from: () => subYears(new Date(), 2), to: () => new Date() },
  ALL: { from: () => new Date("2024-11-01"), to: () => new Date() },
};

// Calendar styling classes
const CALENDAR_STYLES: Partial<ClassNames> & Partial<DeprecatedUI<string>> = {
  root: "p-0 pinto-sm-light",
  caption: "flex relative justify-center items-center mb-2.5",
  nav: "flex items-center place-self-end gap-2",
  button_next: "absolute right-2 rounded w-8 h-8 hover:bg-pinto-green-1 transition-colors duration-150 ease-in-out",
  button_previous: "absolute left-3 rounded w-8 h-8 hover:bg-pinto-green-1 transition-colors duration-150 ease-in-out",
  month: "-mt-3 justify-items-center",
  month_grid: "mt-4",
  head_row: "hidden",
  table: "flex justify-center",
  tbody: "ml-0.5",
  day: "rounded h-8 w-8",
  day_button: "rounded h-8 w-8 transition-colors duration-150 ease-in-out",
  today: "font-normal",
  selected: "font-bold bg-pinto-green text-white",
  range_start: "rounded-l rounded-r-none font-bold bg-pinto-green text-white hover:bg-pinto-green/80",
  range_middle: "rounded-none font-bold bg-pinto-green text-white hover:bg-pinto-green/80",
  range_end: "rounded-r rounded-l-none font-bold bg-pinto-green text-white hover:bg-pinto-green/80",
};

// Helper functions
const formatDate = (date: Date | undefined): string => (date ? format(date, "MM/dd/yyyy") : "");
const formatTime = (date: Date | undefined): string => (date ? format(date, "HH:mm") : "");
const parseDate = (dateStr: string, timeStr?: string): Date | undefined => {
  if (!dateStr) return undefined;
  try {
    const parsedDate = parse(dateStr, "MM/dd/yyyy", new Date());
    if (!isValid(parsedDate)) return undefined;

    if (timeStr) {
      const [hours, minutes] = timeStr.split(":").map(Number);
      return set(parsedDate, { hours: Number.isNaN(hours) ? 0 : hours, minutes: Number.isNaN(minutes) ? 0 : minutes });
    }
    return parsedDate;
  } catch (e) {
    return undefined;
  }
};

interface DateTimeInputs {
  from: string;
  to: string;
}

// DateRangeInput component - handles the date/time inputs
interface DateRangeInputProps {
  label: string;
  date: string;
  time: string;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
}

const DateRangeInput = ({ date, time, onDateChange, onTimeChange }: DateRangeInputProps) => (
  <div className="flex flex-row gap-2">
    <Input
      value={date}
      placeholder="MM/DD/YYYY"
      onChange={(e) => onDateChange(e.target.value)}
      className="h-8 px-2 pinto-sm-light"
      containerClassName="flex flex-grow basis-7/12"
    />
    <Input
      value={time}
      placeholder="00:00"
      onChange={(e) => onTimeChange(e.target.value)}
      className="h-8 px-2 pinto-sm-light"
      containerClassName="flex flex-grow basis-5/12"
      endIcon={
        <div>
          <ClockIcon className="mr-2 hidden sm:block 3xl:hidden" size={4} />
          <ClockIcon className="mr-2 sm:hidden 3xl:block" size={5} />
        </div>
      }
    />
  </div>
);

// PresetButton component - handles individual preset buttons
interface PresetButtonProps {
  preset: string;
  isSelected: boolean;
  onClick: () => void;
}

const PresetButton = ({ preset, isSelected, onClick }: PresetButtonProps) => (
  <button
    type="button"
    className={`min-w-8 pinto-body-light ${isSelected ? "text-pinto-green" : "text-pinto-gray-4"}`}
    onClick={onClick}
  >
    {preset}
  </button>
);

// CalendarContent component - handles the popover content
interface CalendarContentProps {
  datePresets: typeof DATE_PRESETS;
  range: DateRange;
  selectedPreset: string;
  onChange: (range: DateRange, preset: string) => void;
}

const CalendarContent = ({ datePresets, range, selectedPreset, onChange }: CalendarContentProps) => {
  const [month, setMonth] = useState<Date>(new Date());
  const [dateInputs, setDateInputs] = useState<DateTimeInputs>({ from: "", to: "" });
  const [timeInputs, setTimeInputs] = useState<DateTimeInputs>({ from: "", to: "" });

  const DEBOUNCE_DELAY = 500;
  const timeChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dateChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update inputs when range changes
  useEffect(() => {
    setDateInputs({
      from: formatDate(range.from),
      to: formatDate(range.to),
    });
    setTimeInputs({
      from: formatTime(range.from),
      to: formatTime(range.to),
    });
  }, [range]);

  // Handle date picker selection
  const handleDayPickerSelect = useCallback(
    (selectedRange: DayPickerDateRange | undefined) => {
      if (!selectedRange) {
        onChange({ from: DATE_PRESETS.ALL.from(), to: DATE_PRESETS.ALL.to() }, "ALL");
        return;
      }

      const { from, to } = selectedRange;
      const newRange: DateRange = {
        from: from ? parseDate(formatDate(from), timeInputs.from || "00:00") : undefined,
        to: to ? parseDate(formatDate(to), timeInputs.to || "23:59") : undefined,
      };

      onChange(newRange, "CUSTOM");
    },
    [onChange, timeInputs],
  );

  // Handle date input change with debouncing
  const handleDateChange = useCallback(
    (type: "from" | "to", value: string): void => {
      setDateInputs((prev) => ({ ...prev, [type]: value }));

      if (dateChangeTimeoutRef.current) {
        clearTimeout(dateChangeTimeoutRef.current);
      }

      // Set new timeout for debounced execution
      dateChangeTimeoutRef.current = setTimeout(() => {
        const newDate = parseDate(value, timeInputs[type]);
        if (newDate) {
          const newRange: DateRange = { ...range, [type]: newDate };
          onChange(newRange, "CUSTOM");
          setMonth(newDate);
        }
      }, DEBOUNCE_DELAY);
    },
    [onChange, range, timeInputs],
  );

  // Handle time input change with debouncing
  const handleTimeChange = useCallback(
    (type: "from" | "to", value: string): void => {
      setTimeInputs((prev) => ({ ...prev, [type]: value }));

      if (timeChangeTimeoutRef.current) {
        clearTimeout(timeChangeTimeoutRef.current);
      }

      // Set new timeout for debounced execution
      timeChangeTimeoutRef.current = setTimeout(() => {
        if (range[type] && value) {
          try {
            const [hours, minutes] = value.split(":").map(Number);
            const newDate = set(range[type] as Date, {
              hours: Number.isNaN(hours) ? 0 : hours,
              minutes: Number.isNaN(minutes) ? 0 : minutes,
            });
            const newRange: DateRange = { ...range, [type]: newDate };
            onChange(newRange, "CUSTOM");
          } catch (e) {
            // Invalid time format
          }
        }
      }, DEBOUNCE_DELAY);
    },
    [onChange, range],
  );

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeChangeTimeoutRef.current) {
        clearTimeout(timeChangeTimeoutRef.current);
      }
      if (dateChangeTimeoutRef.current) {
        clearTimeout(dateChangeTimeoutRef.current);
      }
    };
  }, []);

  // Mobile preset buttons
  const renderMobilePresets = useCallback(
    () => (
      <div className="flex flex-row justify-between mt-4">
        {Object.keys(datePresets).map((preset) => (
          <button
            key={`mobile-preset-${preset}`}
            type="button"
            className={`rounded py-1 text-sm min-w-fit w-8 pinto-body-light ${
              selectedPreset === preset ? "bg-pinto-green text-white" : "border border-pinto-gray-2 text-pinto-gray-5"
            }`}
            onClick={() => {
              const newRange = {
                from: datePresets[preset].from(),
                to: datePresets[preset].to(),
              };
              onChange(newRange, preset);
            }}
          >
            {preset}
          </button>
        ))}
      </div>
    ),
    [datePresets, onChange, selectedPreset],
  );

  return (
    <div className="flex flex-col gap-4 p-0">
      <div className="pinto-body-light font-medium">Custom Date Range</div>
      <div className="flex flex-col gap-2">
        <DateRangeInput
          label="From"
          date={dateInputs.from}
          time={timeInputs.from}
          onDateChange={(val) => handleDateChange("from", val)}
          onTimeChange={(val) => handleTimeChange("from", val)}
        />
        <DateRangeInput
          label="To"
          date={dateInputs.to}
          time={timeInputs.to}
          onDateChange={(val) => handleDateChange("to", val)}
          onTimeChange={(val) => handleTimeChange("to", val)}
        />
      </div>
      <Separator />
      <div className="flex flex-col">
        <DayPicker
          mode="range"
          showOutsideDays
          selected={range}
          onSelect={handleDayPickerSelect}
          month={month}
          onMonthChange={setMonth}
          fixedWeeks
          classNames={CALENDAR_STYLES}
        />
        <div className="lg:hidden">{renderMobilePresets()}</div>
      </div>
    </div>
  );
};

// Main CalendarButton component
interface CalendarButtonProps<T extends Record<string, DatePresetConfig> = typeof DATE_PRESETS> {
  setTimePeriod: (timePeriod: IRange<Time>) => void;
  storageKeyPrefix?: string;
  datePresets?: T;
  defaultPreset?: keyof T;
}

const CalendarButton = ({
  setTimePeriod,
  storageKeyPrefix = "advancedChart",
  datePresets = DATE_PRESETS,
  defaultPreset = "1W",
}: CalendarButtonProps) => {
  const [selectedPreset, setSelectedPreset] = useState<string>(defaultPreset);
  const [range, setRange] = useState<DateRange>({ from: undefined, to: undefined });

  // Save to localStorage and set period
  const saveRangeAndSetPeriod = useCallback(
    (rangeToSave: DateRange, presetToSave: string): void => {
      if (!rangeToSave.from && !rangeToSave.to) return;

      // Save to localStorage
      try {
        localStorage.setItem(`${storageKeyPrefix}Range`, safeJSONStringify(rangeToSave));
        localStorage.setItem(`${storageKeyPrefix}Preset`, safeJSONStringify(presetToSave));

        // Set time period
        const timePeriod: IRange<Time> = {
          from: (rangeToSave.from ? rangeToSave.from.valueOf() : 0) as UTCTimestamp,
          to: (rangeToSave.to ? rangeToSave.to.valueOf() : Date.now()) as UTCTimestamp,
        };

        setTimePeriod(timePeriod);
      } catch (error) {
        console.error("Error saving date range to localStorage", error);
      }
    },
    [storageKeyPrefix, setTimePeriod],
  );

  // Apply preset range
  const applyPreset = useCallback(
    (preset: Exclude<string, "CUSTOM">): void => {
      const presetConfig = datePresets[preset];
      if (!presetConfig) return;

      const newRange: DateRange = {
        from: presetConfig.from(),
        to: presetConfig.to(),
      };

      setRange(newRange);
      setSelectedPreset(preset);
      saveRangeAndSetPeriod(newRange, preset);
    },
    [datePresets, saveRangeAndSetPeriod],
  );

  // Initialize from localStorage if available
  useEffect(() => {
    try {
      const storedRange = localStorage.getItem(`${storageKeyPrefix}Range`);
      const storedPreset = localStorage.getItem(`${storageKeyPrefix}Preset`);

      if (storedRange) {
        const parsedRange = JSON.parse(storedRange);
        // Convert stored timestamps back to Date objects
        setRange({
          from: parsedRange.from ? new Date(parsedRange.from) : undefined,
          to: parsedRange.to ? new Date(parsedRange.to) : undefined,
        });
        setTimePeriod({
          from: (parsedRange.from ? parsedRange.from.valueOf() : 0) as UTCTimestamp,
          to: (parsedRange.to ? parsedRange.to.valueOf() : Date.now()) as UTCTimestamp,
        });
      } else {
        applyPreset(defaultPreset);
      }

      if (storedPreset) {
        setSelectedPreset(JSON.parse(storedPreset));
      }
    } catch (e) {
      console.error("Error loading saved date range", e);
      applyPreset(defaultPreset);
    }
  }, [storageKeyPrefix, defaultPreset, setTimePeriod, applyPreset]);

  const handleCalendarInteraction = (newRange: DateRange, preset: string): void => {
    setRange(newRange);
    setSelectedPreset(preset);
    saveRangeAndSetPeriod(newRange, preset);
  };

  return (
    <div className="relative flex flex-row items-center">
      <div className="hidden lg:flex">
        <div className="flex flex-row items-center gap-6">
          {Object.keys(datePresets).map((preset) => (
            <PresetButton
              key={`preset-${preset}`}
              preset={preset}
              isSelected={selectedPreset === preset}
              onClick={() => applyPreset(preset as Exclude<string, "CUSTOM">)}
            />
          ))}
        </div>
        <Separator orientation="vertical" className="h-6 mx-4" />
      </div>
      <Popover>
        <PopoverTrigger>
          <div
            className={`text-pinto-gray-4 ${selectedPreset === "CUSTOM" ? "lg:text-pinto-green" : "text-pinto-gray-4"}`}
          >
            <CalendarIcon color={"currentColor"} />
          </div>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[22rem] lg:w-[17.5rem]">
          <CalendarContent
            datePresets={datePresets}
            range={range}
            selectedPreset={selectedPreset}
            onChange={handleCalendarInteraction}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default CalendarButton;
