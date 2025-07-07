import { validateFormLte } from "@/utils/number";
import { isValidAddress, postSanitizedSanitizedValue } from "@/utils/string";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Helper function to validate positive numbers
const positiveNumber = (fieldName: string) =>
  z
    .string()
    .min(1, `${fieldName} is required`)
    .refine((val) => {
      const vals = postSanitizedSanitizedValue(val, 6);
      if (vals.nonAmount) return true;
      return vals.tv.gt(0);
    }, `${fieldName} must be greater than 0`);

// Token strategy validation
const tokenStrategyValidation = z
  .object({
    type: z.enum(["LOWEST_SEEDS", "LOWEST_PRICE", "SPECIFIC_TOKEN"]),
    address: z.string().optional(),
  })
  .refine((data) => {
    if (data.type === "SPECIFIC_TOKEN") {
      return isValidAddress(data.address);
    }
    return true;
  }, "Token address is required for specific token strategy");

export const sowOrderSchemaErrors = {
  minLteMax: "Min per Season cannot exceed Max per Season",
  minLteTotal: "Min per Season cannot exceed the total amount to Sow",
  maxLteTotal: "Max per Season cannot exceed the total amount to Sow",
} as const;

const addCTXErrors = (ctx: z.RefinementCtx, message: string, paths: string[]) => {
  for (const path of paths) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message,
      path: [path],
    });
  }
};

// Main schema for sow order dialog
export const sowOrderDialogSchema = z
  .object({
    totalAmount: positiveNumber("Total Amount"),
    minSoil: positiveNumber("Min per Season"),
    maxPerSeason: positiveNumber("Max per Season"),
    temperature: positiveNumber("Temperature"),
    podLineLength: positiveNumber("Pod Line Length"),
    morningAuction: z.boolean().default(false),
    operatorTip: positiveNumber("Operator Tip"),
    selectedTokenStrategy: tokenStrategyValidation,
  })
  .superRefine((data, ctx) => {
    // Cross-field validation: minSoil <= maxPerSeason
    if (!validateFormLte(data.minSoil, data.maxPerSeason, 6, 6)) {
      addCTXErrors(ctx, sowOrderSchemaErrors.minLteMax, ["minSoil", "maxPerSeason"]);
    }
  })
  .superRefine((data, ctx) => {
    // Cross-field validation: minSoil <= totalAmount
    if (!validateFormLte(data.minSoil, data.totalAmount, 6, 6)) {
      addCTXErrors(ctx, sowOrderSchemaErrors.minLteTotal, ["minSoil", "totalAmount"]);
    }
  })
  .superRefine((data, ctx) => {
    // Cross-field validation: maxPerSeason <= totalAmount
    if (!validateFormLte(data.maxPerSeason, data.totalAmount, 6, 6)) {
      addCTXErrors(ctx, sowOrderSchemaErrors.maxLteTotal, ["maxPerSeason", "totalAmount"]);
    }
  });

// Type inference from schema
export type SowOrderV0FormSchema = z.infer<typeof sowOrderDialogSchema>;

// Default values for the form
export const defaultSowOrderDialogValues: Partial<SowOrderV0FormSchema> = {
  totalAmount: "",
  minSoil: "",
  maxPerSeason: "",
  temperature: "",
  podLineLength: "",
  morningAuction: false,
  operatorTip: "1",
  selectedTokenStrategy: { type: "LOWEST_SEEDS" },
};

export type SowOrderV0Form = {
  form: ReturnType<typeof useForm<SowOrderV0FormSchema>>;
  prefillValues: (prefillValues: Partial<SowOrderV0FormSchema>) => void;
  getAreAllFieldsFilled: () => boolean;
  getAreAllFieldsValid: () => boolean;
  getMissingFields: () => string[];
};

export const useSowOrderV0Form = (): SowOrderV0Form => {
  const form = useForm<SowOrderV0FormSchema>({
    resolver: zodResolver(sowOrderDialogSchema),
    defaultValues: { ...defaultSowOrderDialogValues },
    mode: "onChange",
  });

  const prefillValues = useCallback(
    (prefillValues: Partial<SowOrderV0FormSchema>) => {
      form.reset(prefillValues, { keepDirty: true });
    },
    [form.reset],
  );

  const getAreAllFieldsFilled = useCallback(() => {
    return Object.values(form.getValues()).every((v) => {
      if (typeof v === "string") return Boolean(v.trim());
      return true;
    });
  }, [form.getValues]);

  const getAreAllFieldsValid = useCallback(() => {
    return Object.values(form.formState.errors).every((value) => !value) && getAreAllFieldsFilled();
  }, [form.formState.errors, getAreAllFieldsFilled]);

  const getMissingFields = useCallback(() => {
    const values = form.getValues();

    const missingFields = Object.keys(values).filter((key) => {
      const value = values[key as keyof SowOrderV0FormSchema];
      if (typeof value === "string") {
        return value.trim() === "";
      }
      if (typeof value !== "boolean") {
      } else if (typeof value === "object" && value !== null) {
        return Object.values(value).every((v) => v === "");
      }
      return false;
    });

    return missingFields;
  }, [form.formState.errors]);

  return {
    form,
    prefillValues,
    getAreAllFieldsFilled,
    getAreAllFieldsValid,
    getMissingFields,
  } as const;
};

export const useSowOrderV0State = () => {};
