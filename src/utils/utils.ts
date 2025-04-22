import { TokenValue } from "@/classes/TokenValue";
import { FarmerBalance } from "@/state/useFarmerBalances";
import { calculateConvertData } from "@/utils/convert";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { FarmFromMode, Token } from "./types";
import { MayArray } from "./types.generic";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const generateID = (prefix = "") => {
  const hash = Math.random().toString(36).slice(-7);
  return `${prefix}-${hash}`;
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const noop = () => {};

export function unpackStem(data: string | number | bigint): bigint {
  // Convert input to BigInt if it isn't already
  const dataBigInt = BigInt(data);

  // Extract stem using mask
  const mask = (1n << 96n) - 1n;
  let stem = dataBigInt & mask;

  // Handle negative numbers (two's complement)
  if (stem & (1n << 95n)) {
    // Check if the sign bit is set
    stem = stem - (1n << 96n);
  }

  return stem;
}

export const isProd = () => {
  return import.meta.env.VITE_NETLIFY_CONTEXT === "production";
};

export const isLocalhost = () => {
  return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
};

export const isNetlifyPreview = () => {
  return import.meta.env.VITE_NETLIFY_CONTEXT === "deploy-preview";
};

export const isDev = () => {
  return isLocalhost() || isNetlifyPreview() || process.env.NODE_ENV === "development";
};

export function exists<T>(value: T | undefined | null): value is NonNullable<T> {
  return value !== undefined && value !== null;
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function existsNot(value: any): value is undefined | null {
  return !exists(value);
}

/**
 * Check if a value is an object
 * @param value - The value to check
 * @returns True if the value is an object, false otherwise. Excludes arrays.
 */
export const isObject = (value: unknown): value is Record<string, unknown> => {
  return !!value && typeof value === "object" && !Array.isArray(value);
};

export function arrayify<T>(value: MayArray<T>): T[];
export function arrayify<T, U>(value: MayArray<T>, map: (v: T, i: number, arr: T[]) => U): U[];
export function arrayify<T, U = T>(value: MayArray<T>, map?: (v: T, i: number, arr: T[]) => U): (T | U)[] {
  const array = Array.isArray(value) ? value : [value];
  return map ? array.map(map) : array;
}

export function getBalanceFromMode(balance: FarmerBalance | undefined, mode: FarmFromMode) {
  if (!balance) return TokenValue.ZERO;
  switch (mode) {
    case FarmFromMode.INTERNAL:
      return balance.internal;
    case FarmFromMode.EXTERNAL:
      return balance.external;
    default:
      return balance.total;
  }
}

export function timeRemaining(time: Date, targetTime?: Date) {
  const now = targetTime ?? new Date();
  const diffMs = time.getTime() - now.getTime();
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = 60 - now.getMinutes();
  const diffSecs = 60 - now.getSeconds();

  if (diffHrs <= 0 && diffMins <= 0 && diffSecs <= 0) return "0m 0s";

  return diffHrs > 0 ? `${diffHrs}h ${diffMins}m ${diffSecs}s` : `${diffMins}m ${diffSecs}s`;
}

interface PlantEventData {
  amount: bigint;
  blockHash: string;
  transactionHash: string;
}

interface DepositEventData {
  amount: bigint;
  stem: bigint;
  blockHash: string;
  transactionHash: string;
}

interface PlantDepositMap {
  [key: string]: {
    plant?: PlantEventData;
    deposit?: DepositEventData;
  };
}

interface PlantDepositInfo {
  isPlantDeposit: boolean;
  plantedAmount: bigint;
}

export function identifyPlantDeposits(
  deposits: any[],
  plantEvents: PlantEventData[] | undefined,
  depositEvents: DepositEventData[] | undefined,
): Map<string, PlantDepositInfo> {
  // Create lookup by transaction hash
  const eventMap: PlantDepositMap = {};

  // Group plant and deposit events by transaction hash
  plantEvents?.forEach((plant) => {
    if (!eventMap[plant.transactionHash]) {
      eventMap[plant.transactionHash] = {};
    }
    eventMap[plant.transactionHash].plant = plant;
  });

  depositEvents?.forEach((deposit) => {
    if (!eventMap[deposit.transactionHash]) {
      eventMap[deposit.transactionHash] = {};
    }
    eventMap[deposit.transactionHash].deposit = deposit;
  });

  // Map deposit IDs to their plant deposit info
  const plantDepositMap = new Map<string, PlantDepositInfo>();

  deposits.forEach((deposit) => {
    let isPlantDeposit = false;
    let plantedAmount = 0n;

    // Check all transactions that could contain this deposit
    Object.values(eventMap).forEach((events) => {
      if (events.plant && events.deposit) {
        // Direct match - amount and stem match exactly
        if (events.deposit.amount === deposit.depositedAmount && events.deposit.stem === deposit.stem) {
          isPlantDeposit = true;
          plantedAmount = events.plant.amount;
        }

        // Combined deposit case - plant amount is part of total amount
        // and stems match
        if (events.deposit.stem === deposit.stem && deposit.depositedAmount >= events.plant.amount) {
          const remainder = deposit.depositedAmount - events.plant.amount;
          // Allow for small remainder from regular deposit combined with plant
          if (remainder === 0n || remainder >= 1000000n) {
            // Minimum reasonable deposit size
            isPlantDeposit = true;
            plantedAmount = events.plant.amount;
          }
        }
      }
    });

    plantDepositMap.set(deposit.id.toString(), {
      isPlantDeposit,
      plantedAmount,
    });
  });

  return plantDepositMap;
}

/**
 * Converts hex string to rgba
 */
export const hexToRgba = (hex: string, alpha?: number) => {
  const stripped = hex.replace("#", "").split("");
  if (stripped.length % 3 !== 0 || stripped.length > 6) {
    throw new Error(`unexpected invalid hex value: ${hex}`);
  }

  const isCondensedHex = stripped.length === 3;
  const hexArr = stripped
    .reduce((prev, curr) => {
      let _prev = prev;
      if (isCondensedHex) {
        _prev += curr;
      }
      _prev += curr;
      return _prev;
    }, "" as string)
    .toString();

  const r = parseInt(hexArr.slice(0, 2), 16);
  const g = parseInt(hexArr.slice(2, 4), 16);
  const b = parseInt(hexArr.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha ?? 1})`;
};

export function safeJSONParse<T, F = false>(jsonString: string | null | undefined, fallbackValue: F): T | F {
  try {
    if (jsonString === null || jsonString === undefined) {
      return fallbackValue;
    }
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error("Failed to parse JSON:", error);
    return fallbackValue;
  }
}

export function safeJSONStringify<T>(value: T | null | undefined, fallbackValue: string = "{}"): string {
  try {
    if (value === null || value === undefined) {
      return fallbackValue;
    }
    return JSON.stringify(value);
  } catch (error) {
    console.error("Failed to stringify object:", error);
    return fallbackValue;
  }

interface RatioDeposit {
  stem: string;
  ratio: TokenValue;
}
