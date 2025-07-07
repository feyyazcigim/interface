import arrowDown from "@/assets/misc/ChevronDown.svg";
import { FormControl, FormField, FormItem, FormLabel } from "@/components/Form";
import { Button } from "@/components/ui/Button";
import IconImage from "@/components/ui/IconImage";
import { Input } from "@/components/ui/Input";
import { MAIN_TOKEN } from "@/constants/tokens";
import { useTokenMap } from "@/hooks/pinto/useTokenMap";
import { usePodLine, useTemperature } from "@/state/useFieldData";
import { useChainConstant } from "@/utils/chain";
import { formatter } from "@/utils/format";
import { postSanitizedSanitizedValue, sanitizeNumericInputValue, stringEq } from "@/utils/string";
import { getTokenIndex } from "@/utils/token";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { SowOrderV0FormSchema } from "./SowOrderV0Schema";

import { Prettify } from "@/utils/types.generic";
import { createContext } from "react";
import { useFormContext, useWatch } from "react-hook-form";

interface BaseIFormContextHandlers {
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => ReturnType<typeof sanitizeNumericInputValue>;
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus: (e: React.FocusEvent<HTMLInputElement>) => void;
}

export interface BaseIFormContext {
  ctx: ReturnType<typeof useFormContext<SowOrderV0FormSchema>>;
  handlers: (name: keyof SowOrderV0FormSchema) => BaseIFormContextHandlers;
}

const SowOrderV0CTX = createContext<Prettify<BaseIFormContext> | null>(null);

function SowOrderV0Fields({ children }: { children: React.ReactNode }) {
  const ctx = useFormContext<SowOrderV0FormSchema>();
  const mainToken = useChainConstant(MAIN_TOKEN);

  const handleNumericInputChange = useCallback(
    (name: keyof SowOrderV0FormSchema) => {
      return (e: React.ChangeEvent<HTMLInputElement>) => {
        const cleaned = sanitizeNumericInputValue(e.target.value, mainToken.decimals);

        if (cleaned.nonAmount) {
          ctx.setValue(name, cleaned.str, { shouldValidate: true });
        } else {
          ctx.setValue(name, cleaned.str, { shouldValidate: true });
        }
        return cleaned;
      };
    },
    [ctx.setValue, mainToken.decimals],
  );

  const handleNumericInputBlur = useCallback(
    (name: keyof SowOrderV0FormSchema) => {
      return (e: React.FocusEvent<HTMLInputElement>) => {
        const cleanValue = e.target.value.replace(/,/g, "");
        const parts = cleanValue.split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        const joined = parts.join(".");

        // only validate if the value is not empty
        ctx.setValue(name, joined, { shouldValidate: cleanValue !== "" });
      };
    },
    [ctx.setValue],
  );

  const handleNumericInputFocus = useCallback(
    (name: keyof SowOrderV0FormSchema) => {
      return (e: React.FocusEvent<HTMLInputElement>) => {
        const cleanValue = e.target.value.replace(/,/g, "");
        ctx.setValue(name, cleanValue, { shouldValidate: false });
      };
    },
    [ctx.setValue],
  );

  const handlers = useCallback(
    (name: keyof SowOrderV0FormSchema) => ({
      onChange: handleNumericInputChange(name),
      onBlur: handleNumericInputBlur(name),
      onFocus: handleNumericInputFocus(name),
    }),
    [handleNumericInputChange, handleNumericInputBlur, handleNumericInputFocus],
  );

  const contextValue = useMemo(() => ({ ctx, handlers }), [ctx, handlers]);

  return <SowOrderV0CTX.Provider value={contextValue}>{children}</SowOrderV0CTX.Provider>;
}

const useSowV0Context = () => {
  const ctx = useContext(SowOrderV0CTX);

  if (!ctx) {
    throw new Error("useSowV0Context must be used within a SowOrderV0Fields component");
  }

  return ctx;
};

const MainTokenAdornment = () => {
  const mainToken = useChainConstant(MAIN_TOKEN);

  return (
    <div className="flex items-center gap-2 px-4 bg-white">
      <IconImage src={mainToken.logoURI} alt="PINTO" size={6} className="rounded-full" />
      <span className="text-black">{mainToken.symbol}</span>
    </div>
  );
};

SowOrderV0Fields.TotalAmount = function TotalAmount() {
  const { ctx, handlers } = useSowV0Context();

  const decimals = useChainConstant(MAIN_TOKEN).decimals;

  const getHandlers = (): BaseIFormContextHandlers => {
    const inputProps = handlers("totalAmount");

    return {
      ...inputProps,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        const cleaned = inputProps.onChange(e);
        handleCrossValidate(ctx, cleaned, "minSoil", decimals, "gte");
        handleCrossValidate(ctx, cleaned, "maxPerSeason", decimals, "lte");
        return cleaned;
      },
    };
  };

  return (
    <FormField
      control={ctx.control}
      name="totalAmount"
      render={({ field, fieldState }) => (
        <FormItem>
          <FormLabel>I want to Sow up to</FormLabel>
          <FormControl>
            <Input
              {...field}
              placeholder="0.00"
              type="text"
              outlined
              {...getHandlers()}
              isError={!!fieldState.error}
              endIcon={<MainTokenAdornment />}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
};

SowOrderV0Fields.MinSoil = function MinSoil() {
  const { ctx, handlers } = useSowV0Context();
  const decimals = useChainConstant(MAIN_TOKEN).decimals;

  const getHandlers = (): BaseIFormContextHandlers => {
    const inputProps = handlers("minSoil");

    return {
      ...inputProps,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        const cleaned = inputProps.onChange(e);
        handleCrossValidate(ctx, cleaned, "maxPerSeason", decimals, "lte");
        handleCrossValidate(ctx, cleaned, "totalAmount", decimals, "lte");
        return cleaned;
      },
    };
  };

  return (
    <FormField
      control={ctx.control}
      name="minSoil"
      render={({ field, fieldState }) => (
        <FormItem className="flex-1">
          <FormLabel>Min per Season</FormLabel>
          <div className="flex-1">
            <FormControl>
              <Input
                {...field}
                placeholder="0.00"
                type="text"
                outlined
                {...getHandlers()}
                isError={!!fieldState.error}
                endIcon={<MainTokenAdornment />}
              />
            </FormControl>
          </div>
        </FormItem>
      )}
    />
  );
};

SowOrderV0Fields.MaxPerSeason = function MaxPerSeason() {
  const { ctx, handlers } = useSowV0Context();

  const decimals = useChainConstant(MAIN_TOKEN).decimals;

  const getHandlers = (): BaseIFormContextHandlers => {
    const inputProps = handlers("maxPerSeason");

    return {
      ...inputProps,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        const cleaned = inputProps.onChange(e);
        handleCrossValidate(ctx, cleaned, "minSoil", decimals, "gte");
        handleCrossValidate(ctx, cleaned, "totalAmount", decimals, "lte");
        return cleaned;
      },
    };
  };

  return (
    <FormField
      control={ctx.control}
      name="maxPerSeason"
      render={({ field, fieldState }) => (
        <FormItem className="flex-1">
          <FormLabel>Max per Season</FormLabel>
          <FormControl className="flex-1">
            <Input
              {...field}
              placeholder="0.00"
              outlined
              type="text"
              {...getHandlers()}
              isError={!!fieldState.error}
              endIcon={<MainTokenAdornment />}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
};

/**
 * 
 * Handle cross validation between two fields.

 * @param ctx - The form context.
 * @param left - The left field value.
 * @param rightName - The right field name.
 * @param rightDecimals - The right field decimals.
 * @param operation - The operation to perform (lte, gte).
 * 
 * @note There is somewhat some duplicated logic in the schema; however, because individual fields
 * do not re-render when the other field changes, we need to handle cross validation manually.
 * 
 * This function will trigger the right field's validation if:
 * 1. the condition is not met
 * 2. OR if the right field has an error but the condition is valid.
 */
const handleCrossValidate = (
  ctx: ReturnType<typeof useFormContext<SowOrderV0FormSchema>>,
  left: ReturnType<typeof sanitizeNumericInputValue>,
  rightName: keyof SowOrderV0FormSchema,
  rightDecimals: number,
  operation: "lte" | "gte",
) => {
  const value = ctx.getValues(rightName);

  if (typeof value !== "string") {
    throw new Error("Unexpected value type");
  }

  const rightValue = postSanitizedSanitizedValue(value, rightDecimals);

  if (left.nonAmount || rightValue.nonAmount) {
    return;
  }

  const valid = left.tv[operation]?.(rightValue.tv);

  const rightError = ctx.formState.errors?.[rightName];

  if (!valid || (valid && rightError)) {
    ctx.trigger(rightName);
  }
};

SowOrderV0Fields.TokenStrategy = function TokenStrategy(props: {
  openDialog: () => void;
}) {
  const { ctx } = useSowV0Context();
  const tokenMap = useTokenMap();

  const strategy = useWatch({ control: ctx.control, name: "selectedTokenStrategy" });

  const selectedToken =
    strategy?.address && strategy.type === "SPECIFIC_TOKEN" ? tokenMap[getTokenIndex(strategy.address)] : undefined;

  const getSelectedTokenDisplay = () => {
    if (strategy?.type === "LOWEST_SEEDS") {
      return "Token with Least Seeds";
    } else if (strategy?.type === "LOWEST_PRICE") {
      return "Token with Best Price";
    } else if (strategy?.type === "SPECIFIC_TOKEN") {
      return selectedToken?.symbol || "Select Token";
    }
    return "Select Deposited Silo Token";
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <div>Fund order using</div>
        <Button variant="outline-gray-shadow" size="xl" rounded="full" onClick={props.openDialog}>
          <div className="flex items-center gap-2">
            {selectedToken && <IconImage src={selectedToken.logoURI} alt="token" size={6} className="rounded-full" />}
            <div className="pinto-body-light">{getSelectedTokenDisplay()}</div>
            <IconImage src={arrowDown} size={3} alt="open token select dialog" />
          </div>
        </Button>
      </div>
    </div>
  );
};

SowOrderV0Fields.Temperature = function Temperature() {
  const { ctx, handlers } = useSowV0Context();

  const currTemp = useTemperature();
  return (
    <FormField
      control={ctx.control}
      name="temperature"
      render={({ field, fieldState }) => (
        <FormItem className="flex flex-row w-full items-center justify-between gap-2 space-y-0">
          <FormLabel>Execute when Temperature is at least</FormLabel>
          <div className="flex flex-col">
            <FormControl>
              <Input
                {...field}
                className="rounded-lg w-[140px]"
                placeholder={`${Math.max(10, Math.floor(currTemp.scaled?.toNumber() || 0) + 1)}`}
                type="text"
                outlined
                {...handlers("temperature")}
                isError={!!fieldState.error}
                endIcon={<div className="mr-2 text-pinto-primary pinto-body-bold">%</div>}
              />
            </FormControl>
          </div>
        </FormItem>
      )}
    />
  );
};

const POD_LINE_INCREMENTS = [5, 10, 25, 50, 100] as const;
SowOrderV0Fields.PodLineLength = function PodLineLength() {
  const { ctx, handlers } = useSowV0Context();

  const podLine = usePodLine();

  const value = useWatch({ control: ctx.control, name: "podLineLength" });

  const calculatePodLineValue = useCallback(
    (increment: number) => {
      const increase = podLine.mul(increment).div(100);
      const newValue = podLine.add(increase);
      return formatter.number(newValue);
    },
    [podLine.toBigInt()],
  );

  const isButtonActive = useCallback(
    (increment: number) => {
      return value === calculatePodLineValue(increment);
    },
    [value],
  );

  const handlePodLineSelect = useCallback(
    (increment: number) => {
      // if the button is active, set the value to empty
      if (isButtonActive(increment)) {
        ctx.setValue("podLineLength", "");
        return;
      }

      if (increment === 0) {
        const formattedValue = formatter.number(podLine);
        ctx.setValue("podLineLength", formattedValue, { shouldValidate: true });
      } else {
        const increase = podLine.mul(increment).div(100);
        const newValue = podLine.add(increase);
        const formattedValue = formatter.number(newValue);
        ctx.setValue("podLineLength", formattedValue, { shouldValidate: true });
      }
    },
    [ctx, podLine, isButtonActive],
  );

  return (
    <FormField
      control={ctx.control}
      name="podLineLength"
      render={({ field, fieldState }) => (
        <FormItem>
          <FormLabel>Execute when the length of the Pod Line is at most</FormLabel>
          <FormControl>
            <Input
              {...field}
              placeholder={formatter.number(podLine)}
              outlined
              type="text"
              isError={!!fieldState.error}
              {...handlers("podLineLength")}
            />
          </FormControl>
          <div className="flex justify-between gap-2 mt-1 w-full">
            {POD_LINE_INCREMENTS.map((increment) => (
              <Button
                key={increment}
                variant="outline"
                size="sm"
                className={`rounded-full px-4 py-2 flex items-center justify-center transition-colors h-[2rem] sm:h-[2.25rem] pinto-sm whitespace-nowrap ${
                  isButtonActive(increment)
                    ? "bg-pinto-green-1 border border-pinto-green-4 text-pinto-green-4 hover:bg-pinto-green-1 hover:text-pinto-green-4 hover:border-pinto-green-4"
                    : "bg-white border-pinto-gray-2 text-pinto-gray-4 hover:bg-pinto-green-1/50 hover:border-pinto-green-2/50"
                } flex-1`}
                onClick={() => handlePodLineSelect(increment)}
                type="button"
              >
                {increment}% ↑
              </Button>
            ))}
          </div>
        </FormItem>
      )}
    />
  );
};

const MorningAuctionButton = ({
  label,
  value,
  fieldValue,
  onChange,
}: { label: string; value: boolean; fieldValue: boolean; onChange: (value: boolean) => void }) => {
  const isActive = value === fieldValue;
  return (
    <Button
      variant="outline"
      size="sm"
      className={`rounded-full px-4 py-2 flex items-center justify-center transition-colors h-[2rem] sm:h-[2.25rem] pinto-sm whitespace-nowrap ${
        isActive
          ? "bg-pinto-green-1 border border-pinto-green-4 text-pinto-green-4 hover:bg-pinto-green-1 hover:text-pinto-green-4 hover:border-pinto-green-4"
          : "bg-white border-pinto-gray-2 text-pinto-gray-4 hover:bg-pinto-green-1/50 hover:border-pinto-green-2/50"
      } flex-1`}
      onClick={() => onChange(value)}
      type="button"
    >
      {label}
    </Button>
  );
};

SowOrderV0Fields.MorningAuction = function MorningAuction() {
  const { ctx } = useSowV0Context();

  return (
    <FormField
      control={ctx.control}
      name="morningAuction"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Execute during the Morning Auction</FormLabel>
          <div className="flex justify-between gap-2 w-full">
            <MorningAuctionButton label="Yes" value={true} fieldValue={field.value} onChange={field.onChange} />
            <MorningAuctionButton label="No" value={false} fieldValue={field.value} onChange={field.onChange} />
          </div>
        </FormItem>
      )}
    />
  );
};

export type ActiveTipButton = "down5" | "down1" | "average" | "up1" | "up5";

const TIP_PRESETS = ["down5", "down1", "average", "up1", "up5"] as const;

const TIP_PRESET_LABELS: Record<ActiveTipButton, string> = {
  down5: "5% ↓",
  down1: "1% ↓",
  average: "Average",
  up1: "1% ↑",
  up5: "5% ↑",
};

SowOrderV0Fields.OperatorTip = function OperatorTip({ averageTipPaid }: { averageTipPaid: number }) {
  const { ctx, handlers } = useSowV0Context();

  const [activeTipButton, setActiveTipButton] = useState<ActiveTipButton>("average");

  // Helper functions for UI
  const getTipValue = (type: ActiveTipButton) => {
    if (!type) return "0";
    const baseValue = averageTipPaid;
    switch (type) {
      case "down5":
        return (baseValue * 0.95).toFixed(2);
      case "down1":
        return (baseValue * 0.99).toFixed(2);
      case "average":
        return baseValue.toFixed(2);
      case "up1":
        return (baseValue * 1.01).toFixed(2);
      case "up5":
        return (baseValue * 1.05).toFixed(2);
      default:
        return "0";
    }
  };

  const handleTipButtonClick = useCallback(
    (type: ActiveTipButton) => {
      setActiveTipButton(type);
      const newValue = getTipValue(type);
      ctx.setValue("operatorTip", newValue);
    },
    [ctx, getTipValue],
  );

  // Update operator tip when average changes and button is active
  useEffect(() => {
    if (activeTipButton === "average") {
      ctx.setValue("operatorTip", averageTipPaid.toFixed(2));
    }
  }, [averageTipPaid, activeTipButton, ctx.setValue]);

  return (
    <FormField
      control={ctx.control}
      name="operatorTip"
      render={({ field, fieldState }) => (
        <FormItem>
          <FormControl>
            <Input
              {...field}
              outlined
              placeholder="0.00"
              type="text"
              {...handlers("operatorTip")}
              isError={!!fieldState.error}
              endIcon={<MainTokenAdornment />}
            />
          </FormControl>
          <div className="flex justify-between gap-2 mb-2">
            {TIP_PRESETS.map((type) => (
              <Button
                key={type}
                variant="outline"
                size="sm"
                className={`${activeTipButtonStyles.base} ${
                  activeTipButton === type ? activeTipButtonStyles.active : activeTipButtonStyles.inactive
                }`}
                onClick={() => handleTipButtonClick(type)}
                type="button"
              >
                {TIP_PRESET_LABELS[type]}
              </Button>
            ))}
          </div>
        </FormItem>
      )}
    />
  );
};

const activeTipButtonStyles = {
  base: "rounded-full px-4 py-2 flex items-center justify-center transition-colors h-[2rem] sm:h-[2.25rem] pinto-sm whitespace-nowrap flex-1",
  active:
    "bg-pinto-green-1 border border-pinto-green-4 text-pinto-green-4 hover:bg-pinto-green-1 hover:text-pinto-green-4 hover:border-pinto-green-4",
  inactive: "bg-white border-pinto-gray-2 text-pinto-gray-4 hover:bg-pinto-green-1/50 hover:border-pinto-green-2/50",
} as const;

SowOrderV0Fields.ExecutionsAndTip = function ExecutionsAndTip() {
  const { ctx } = useSowV0Context();

  const mainToken = useChainConstant(MAIN_TOKEN);

  // Use selective watching instead of watching all fields
  const [totalAmount, minSoil, maxPerSeason, operatorTip] = useWatch({
    control: ctx.control,
    name: ["totalAmount", "minSoil", "maxPerSeason", "operatorTip"],
  }) as [string, string, string, string];

  const calculationFields = { totalAmount, minSoil, maxPerSeason, operatorTip };

  // Memoize cleaned values calculation
  const cleanedValues = useMemo(() => {
    return {
      min: sanitizeNumericInputValue(calculationFields.minSoil || "", mainToken.decimals).tv,
      max: sanitizeNumericInputValue(calculationFields.maxPerSeason || "", mainToken.decimals).tv,
      total: sanitizeNumericInputValue(calculationFields.totalAmount || "", mainToken.decimals).tv,
    };
  }, [calculationFields.minSoil, calculationFields.maxPerSeason, calculationFields.totalAmount, mainToken.decimals]);

  // Memoize estimated executions calculation
  const estimatedExecutions = useMemo(() => {
    const { total, min, max } = cleanedValues;

    if (!calculationFields.totalAmount || !calculationFields.maxPerSeason) {
      return "~0";
    }

    try {
      if (total.eq(0) || max.eq(0)) {
        return "~0";
      }

      if (min.eq(0)) {
        let lowerBound = Math.floor(total.div(max).toNumber());
        lowerBound = Math.max(1, lowerBound);
        return `~${lowerBound}-∞`;
      }

      let lowerBound = Math.floor(total.div(max).toNumber());
      let upperBound = Math.ceil(total.div(min).toNumber());

      lowerBound = Math.max(1, lowerBound);
      upperBound = Math.max(lowerBound, upperBound);

      if (lowerBound === upperBound) {
        return `~${lowerBound}`;
      } else {
        return `~${lowerBound}-${upperBound}`;
      }
    } catch (e) {
      console.error("Error calculating executions:", e);
      return "~0";
    }
  }, [cleanedValues, calculationFields.totalAmount, calculationFields.maxPerSeason]);

  // Memoize estimated total tip calculation
  const estimatedTotalTip = useMemo(() => {
    if (!calculationFields.operatorTip || !calculationFields.totalAmount || !calculationFields.maxPerSeason) {
      return "~0";
    }

    const { total, min, max } = cleanedValues;

    try {
      const tipValue = parseFloat(calculationFields.operatorTip);

      if (total.eq(0) || max.eq(0) || Number.isNaN(tipValue)) {
        return "~0";
      }

      let lowerBound = Math.floor(total.div(max).toNumber());
      lowerBound = Math.max(1, lowerBound);
      const lowerTip = lowerBound * tipValue;

      if (min.eq(0)) {
        return `~${lowerTip.toFixed(2)}-∞`;
      }

      let upperBound = Math.ceil(total.div(min).toNumber());
      upperBound = Math.max(lowerBound, upperBound);
      const upperTip = upperBound * tipValue;

      if (lowerTip === upperTip) {
        return `~${lowerTip.toFixed(2)}`;
      } else {
        return `~${lowerTip.toFixed(2)}-${upperTip.toFixed(2)}`;
      }
    } catch (e) {
      console.error("Error calculating total tip:", e);
      return "~0";
    }
  }, [
    cleanedValues,
    calculationFields.operatorTip,
    calculationFields.totalAmount,
    calculationFields.maxPerSeason,
    calculationFields.minSoil,
  ]);

  return (
    <>
      <div className="text-pinto-gray-4 text-base font-light mb-32">each time they Sow part of my Tractor Order.</div>
      <div className="flex flex-col gap-2">
        <div className="flex justify-between">
          <div className="text-pinto-gray-4 text-base font-light">Estimated total number of executions</div>
          <div className="text-black text-base font-light">{estimatedExecutions}</div>
        </div>
        <div className="flex justify-between items-center">
          <div className="text-pinto-gray-4 text-base font-light">Estimated total tip</div>
          <div className="flex items-center text-black text-base font-light">
            {estimatedTotalTip}
            <IconImage src={mainToken.logoURI} alt="PINTO" size={5} className="rounded-full mx-1" />
            {mainToken.symbol}
          </div>
        </div>
      </div>
    </>
  );
};

export default SowOrderV0Fields;
