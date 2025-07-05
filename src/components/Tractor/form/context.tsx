import { Prettify } from "@/utils/types.generic";
import { createContext } from "react";
import { FieldValues, useFormContext } from "react-hook-form";

export interface BaseIFormContext<T extends FieldValues> {
  ctx: ReturnType<typeof useFormContext<T>>;
  handlers: (name: keyof T) => {
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => void;
  };
}

export const IFormContextFactory = <T extends FieldValues>() =>
  createContext<Prettify<BaseIFormContext<T>> | null>(null);
