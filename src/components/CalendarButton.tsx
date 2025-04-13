import useIsDesktop from "@/hooks/display/useIsDesktop";
import { clsx } from "clsx";
import {
  format,
  isValid,
  parse,
  set,
  setHours,
  setMinutes,
  startOfYear,
  subHours,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns";
import { useState } from "react";
import { DateRange, DayPicker } from "react-day-picker";
import { div } from "three/webgpu";
import { CalendarIcon, ClockIcon } from "./Icons";
import { Input } from "./ui/Input";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/Popover";
import { ResponsivePopover } from "./ui/ResponsivePopover";
import { Separator } from "./ui/Separator";

const calendarPresetRanges = [
  {
    key: "1D",
    from: subHours(new Date(), 24),
    to: new Date(),
  },
  {
    key: "1W",
    from: subWeeks(new Date(), 1),
    to: new Date(),
  },
  {
    key: "1M",
    from: subMonths(new Date(), 1),
    to: new Date(),
  },
  {
    key: "3M",
    from: subMonths(new Date(), 3),
    to: new Date(),
  },
  {
    key: "6M",
    from: subMonths(new Date(), 6),
    to: new Date(),
  },
  {
    key: "YTD",
    from: startOfYear(new Date()),
    to: new Date(),
  },
  {
    key: "1Y",
    from: subYears(new Date(), 1),
    to: new Date(),
  },
  {
    key: "2Y",
    from: subYears(new Date(), 2),
    to: new Date(),
  },
  {
    key: "ALL",
    from: undefined,
    to: undefined,
  },
];

const initialRange = {
  from: undefined,
  to: undefined,
};

type DateRangeState = {
  from: string | undefined;
  to: string | undefined;
};

const CalendarContent = ({ isMobile, range, selectedPreset, handleChange }) => {
  const [month, setMonth] = useState(new Date());
  const [inputValue, setInputValue] = useState<DateRangeState>({
    from: "",
    to: "",
  });
  const [inputTime, setInputTime] = useState<DateRangeState>({
    from: "",
    to: "",
  });

  const handleDayPickerSelect = (date) => {
    if (!date) {
      setInputValue({ from: undefined, to: undefined });
      handleChange(initialRange, "ALL");
    } else {
      const fromHour = inputTime.from ? parse(inputTime.from, "HH", new Date()).getHours() : undefined;
      const toHour = inputTime.to ? parse(inputTime.to, "HH", new Date()).getHours() : undefined;
      const adjustedDate = {
        from: date.from ? set(date.from, { hours: Number(fromHour || 0), minutes: 0 }) : undefined,
        to: date.to ? set(date.to, { hours: Number(toHour || 23), minutes: 0 }) : undefined,
      };
      handleChange(adjustedDate, "CUSTOM");
      setInputValue({
        from: adjustedDate.from ? format(adjustedDate.from, "MM/dd/yyyy") : undefined,
        to: adjustedDate.to ? format(adjustedDate.to, "MM/dd/yyyy") : undefined,
      });
    }
  };

  const handleInputChange = (type, target, value) => {
    if (type === "date") {
      const currentValue = inputValue;
      const currentTime = inputTime;

      setInputValue({
        from: target === "from" ? value : currentValue.from,
        to: target === "to" ? value : currentValue.to,
      });

      let customHour = 0;
      if (target === "from" && currentTime.from) {
        customHour = parse(currentTime.from, "HH", new Date()).getHours();
      } else if (target === "to" && currentTime.to) {
        customHour = parse(currentTime.to, "HH", new Date()).getHours();
      }

      const parsedDate = set(parse(value, "MM/dd/yyyy", new Date()), {
        hours: customHour,
        minutes: 5,
      });

      const currentDateFrom = currentValue.from ? parse(currentValue.from, "MM/dd/yyyy", new Date()) : undefined;
      const currentDateTo = currentValue.to ? parse(currentValue.to, "MM/dd/yyyy", new Date()) : undefined;

      if (isValid(parsedDate)) {
        handleChange(
          {
            from: target === "from" ? parsedDate : currentDateFrom,
            to: target === "to" ? parsedDate : currentDateTo,
          },
          "CUSTOM",
        );
        setMonth(parsedDate);
      } else {
        handleChange(
          {
            from: undefined,
            to: undefined,
          },
          "ALL",
        );
      }
    } else if (type === "time") {
      const currentValue = inputTime;

      setInputTime({
        from: target === "from" ? value : currentValue.from,
        to: target === "to" ? value : currentValue.to,
      });

      const parsedTime = parse(value, "HH:mm", new Date());

      if (isValid(parsedTime)) {
        const newHour = parsedTime.getHours();
        const newMinutes = parsedTime.getMinutes();
        const newTime = {
          from: target === "from" && range?.from ? setMinutes(setHours(range?.from, newHour), newMinutes) : range?.from,
          to: target === "to" && range?.to ? setMinutes(setHours(range?.to, newHour), newMinutes) : range?.to,
        };
        handleChange(newTime);
      }
    }
  };

  const formatInputTimeOnBlur = (target, value) => {
    const currentValue = inputTime;
    const parsedInput = parse(value, "HH", new Date());
    if (isValid(parsedInput)) {
      const newFrom = target === "from" ? format(parsedInput, "HH:mm") : currentValue.from;
      const newTo = target === "to" ? format(parsedInput, "HH:mm") : currentValue.to;
      setInputTime({
        from: newFrom,
        to: newTo,
      });
    }
  };

  return (
    <div className="flex flex-col gap-4 pt-4 px-4 sm:p-0">
      <div className="flex justify-between">
        <div className="pinto-body-light font-medium">Custom Date Range</div>
      </div>
      <div className="flex flex-col gap-2">
        {["from", "to"].map((inputType) => {
          const dateRange = range?.[inputType];
          const formattedDate = dateRange ? format(dateRange, "MM/dd/yyy") : undefined;
          const formattedHour = dateRange ? format(dateRange, "HH:mm") : undefined;

          return (
            <div className={`flex flex-row gap-2`} key={`timeInputField-${inputType}`}>
              <Input
                value={inputValue[inputType] || formattedDate || ""}
                placeholder="MM/DD/YYYY"
                onChange={(e) => {
                  handleInputChange("date", inputType, e.target.value);
                }}
                className="h-8 px-2 pinto-sm-light"
                containerClassName="flex flex-grow basis-7/12"
              />
              <Input
                value={inputTime[inputType] || formattedHour || ""}
                placeholder="00:00"
                onChange={(e) => {
                  handleInputChange("time", inputType, e.target.value);
                }}
                onBlur={(e) => {
                  formatInputTimeOnBlur(inputType, e.target.value);
                }}
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
        })}
      </div>
      <Separator />
      <div className="flex flex-col justify-between">
        <DayPicker
          mode="range"
          showOutsideDays
          selected={range}
          onSelect={handleDayPickerSelect}
          month={month}
          onMonthChange={setMonth}
          fixedWeeks
          classNames={{
            root: clsx("p-0 pinto-sm-light"),
            caption: clsx("flex relative justify-center items-center mb-2.5"),
            nav: clsx("flex items-center place-self-end gap-2"),
            button_next: clsx(
              "absolute right-2 rounded w-[1.875rem] h-[1.875rem] hover:bg-pinto-green-1 transition-colors duration-150 ease-in-out",
            ),
            button_previous: clsx(
              "absolute left-3 rounded w-[1.875rem] h-[1.875rem] hover:bg-pinto-green-1 transition-colors duration-150 ease-in-out",
            ),
            month: clsx("-mt-3 justify-items-center "),
            month_grid: clsx("mt-4"),
            nav_button_previous: clsx("absolute left-0 rounded-lg w-[1.875rem] h-[1.875rem]"),
            nav_button_next: clsx("absolute right-0 rounded-lg w-[1.875rem] h-[1.875rem]"),
            head_row: clsx("hidden"),
            table: clsx("flex justify-center"),
            tbody: clsx("ml-0.5"),
            day: clsx("rounded h-[2.125rem] w-[2.125rem]"),
            day_button: clsx("rounded h-[2.125rem] w-[2.125rem] transition-colors duration-150 ease-in-out"),
            today: clsx("font-normal"),
            selected: clsx("font-bold bg-pinto-green text-white"),
            range_start: clsx(
              "rounded-l rounded-r-none font-bold bg-pinto-green text-white hover:bg-pinto-green/80 transition-colors duration-150 ease-in-out",
            ),
            range_middle: clsx(
              "rounded-none font-bold bg-pinto-green text-white hover:bg-pinto-green/80 transition-colors duration-150 ease-in-out",
            ),
            range_end: clsx(
              "rounded-r rounded-l-none font-bold bg-pinto-green text-white hover:bg-pinto-green/80 transition-colors duration-150 ease-in-out",
            ),
          }}
        />
        {isMobile && (
          <div className="flex flex-row justify-between">
            {calendarPresetRanges.map((preset) => (
              <button
                key={`timePeriodPreset${preset.key}`}
                type="button"
                className={`rounded py-1 text-sm min-w-fit ${
                  selectedPreset === preset.key
                    ? "bg-pinto-green text-white"
                    : "border border-pinto-gray-2 text-pinto-gray-5"
                } w-8 pinto-body-light`}
                onClick={() => {
                  handleChange(
                    {
                      from: preset.from,
                      to: preset.to,
                    },
                    preset.key,
                  );
                }}
              >
                {preset.key}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const CalendarButton = ({ storageKeyPrefix = "advancedChart", setTimePeriod }) => {
  const isDesktop = useIsDesktop();

  const storedSetting1 = localStorage.getItem(`${storageKeyPrefix}Range`);
  const storedRange = storedSetting1 ? JSON.parse(storedSetting1) : undefined;

  const storedSetting2 = localStorage.getItem(`${storageKeyPrefix}Preset`);
  const storedPreset = storedSetting2 ? JSON.parse(storedSetting2) : undefined;

  const [selectedPreset, setPreset] = useState(storedPreset || "1W");
  const [range, setRange] = useState(storedRange || initialRange);

  const handleChange = (newRange, _preset) => {
    if (newRange) {
      const newTimePeriod = {
        from: (newRange.from || 0).valueOf() / 1000,
        to: (newRange.to || Date.now()).valueOf() / 1000,
      };
      setRange(newRange);
      setTimePeriod(newTimePeriod);

      localStorage.setItem(`${storageKeyPrefix}Range`, JSON.stringify(newRange));
      localStorage.setItem(`${storageKeyPrefix}TimePeriod`, JSON.stringify(newTimePeriod));
    }
    if (_preset) {
      setPreset(_preset);
      localStorage.setItem(`${storageKeyPrefix}Preset`, JSON.stringify(_preset));
    }
  };

  return (
    <div className="relative flex flex-row items-center">
      <div className="flex flex-row items-center gap-6">
        {isDesktop && (
          <>
            {calendarPresetRanges.map((preset) => (
              <button
                key={`timePeriodPreset${preset.key}`}
                type="button"
                className={`min-w-[1.875rem] pinto-body-light ${
                  selectedPreset === preset.key ? "text-pinto-green" : "text-pinto-gray-4"
                }`}
                onClick={() => {
                  handleChange(
                    {
                      from: preset.from,
                      to: preset.to,
                    },
                    preset.key,
                  );
                }}
              >
                {preset.key}
              </button>
            ))}
            <Separator orientation="vertical" className="h-6" />
          </>
        )}
      </div>
      <ResponsivePopover>
        <ResponsivePopover.Trigger>
          <div className={`ml-6 ${selectedPreset === "CUSTOM" && !isDesktop ? "text-pinto-green" : "text-gray-700"}`}>
            <CalendarIcon />
          </div>
        </ResponsivePopover.Trigger>
        <ResponsivePopover.Content align={"end"} className="w-[22rem] lg:w-[17.5rem]">
          <CalendarContent
            isMobile={!isDesktop}
            range={range}
            selectedPreset={selectedPreset}
            handleChange={handleChange}
          />
        </ResponsivePopover.Content>
      </ResponsivePopover>
    </div>
  );
};

export default CalendarButton;
