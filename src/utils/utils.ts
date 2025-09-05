import { TokenValue } from "@/classes/TokenValue";
import { PricePoint } from "@/components/landing/LandingChart";
import { FarmerBalance } from "@/state/useFarmerBalances";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { FarmFromMode } from "./types";
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

/**
 * Utility function to check if an AbortSignal has been aborted and throw an error if so.
 * @param signal - Optional AbortSignal to check
 * @throws {DOMException} - Throws an AbortError if the signal has been aborted
 */
export function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new DOMException("The operation was aborted", "AbortError");
  }
}

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

export const deployedCommitHash = () => {
  return import.meta.env.VITE_COMMIT_HASH;
};

export function exists<T>(value: T | undefined | null): value is NonNullable<T> {
  return value !== undefined && value !== null;
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function existsNot(value: any): value is undefined | null {
  return !exists(value);
}

export function isFunction<T>(v: T | (() => T)): v is () => T {
  return typeof v === "function";
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
}

export function truncSeconds(date: Date): Date {
  date.setSeconds(0, 0);
  return date;
}

// Seeded random number generator using timestamp
export function seededRandom(seed: number): () => number {
  let x = Math.sin(seed) * 10000;
  return () => {
    x = Math.sin(x) * 10000;
    return x - Math.floor(x);
  };
}

// Pole-biased random value between min and max
export function poleBiasedRandom(rng: () => number, min: number, max: number): number {
  // Use power function to bias toward poles (0 and 1)
  let u = rng();
  // Apply bias - values closer to 0 or 1
  u = u < 0.5 ? (u * 2) ** 0.3 / 2 : 1 - ((1 - u) * 2) ** 0.3 / 2;
  return min + (max - min) * u;
}

// Generate chaotic unstable data with oscillating pattern
export function generateChaoticUnstableData(pointCount: number = 7): PricePoint[] {
  // Use page load timestamp as seed for different pattern each reload
  const seed = Date.now();
  const rng = seededRandom(seed);

  const data: PricePoint[] = [
    { txType: null, value: 1.0, speed: 1.0 }, // Always start at 1.0
  ];

  for (let i = 1; i < pointCount - 1; i++) {
    // Alternate between above and below 1.0
    const isAbove = i % 2 === 1;

    // Calculate speed that gradually decreases over time
    // Start with speed range 0.8 to 1.2 and gradually decrease to 0.95 to 1.05
    const progress = i / (pointCount - 2); // 0 to 1 progress through random points
    const startRange = 0.4; // 0.8 to 1.2 = range of 0.4
    const endRange = 0.1; // 0.95 to 1.05 = range of 0.1
    const speedRange = startRange + (endRange - startRange) * progress; // Decrease from 0.4 to 0.1
    const speedOffset = 1.0 - speedRange / 2; // Center the range around 1.0
    const randomSpeed = speedOffset + rng() * speedRange;

    if (isAbove) {
      // Above 1.0: range from 1.0005 to 1.0095
      data.push({
        txType: null,
        value: poleBiasedRandom(rng, 1.0005, 1.0095),
        // value: 1.0005 + rng() * (1.0095 - 1.0005),
        speed: randomSpeed,
        triggerPhase: i === 2 ? "unstable" : undefined,
      });
    } else {
      // Below 1.0: range from 0.9995 to 0.9905
      data.push({
        txType: null,
        value: poleBiasedRandom(rng, 0.9905, 0.9995),
        // value: 0.9905 + rng() * (0.9995 - 0.9905),
        speed: randomSpeed,
        triggerPhase: i === 2 ? "unstable" : undefined,
      });
    }
  }

  data.push({ txType: null, value: 1.0, speed: 1.0 }); // Always end at 1.0

  // Debug: Print all points with their speeds
  console.log("=== Chaotic Unstable Data Points ===");
  data.forEach((point, index) => {
    if (point.speed !== undefined) {
      console.log(`Point ${index}: value=${point.value}, speed=${point.speed.toFixed(3)}`);
    } else {
      console.log(`Point ${index}: value=${point.value}, speed=undefined (start/end point)`);
    }
  });
  console.log("===================================");

  return data;
}

// Helper: cubic Bezier at t
export function cubicBezier(p0: number, c1: number, c2: number, p1: number, t: number) {
  const mt = 1 - t;
  return mt ** 3 * p0 + 3 * mt ** 2 * t * c1 + 3 * mt * t ** 2 * c2 + t ** 3 * p1;
}

// Helper: derivative of cubic Bezier at t
export function cubicBezierDerivative(p0: number, c1: number, c2: number, p1: number, t: number) {
  const mt = 1 - t;
  return 3 * mt ** 2 * (c1 - p0) + 6 * mt * t * (c2 - c1) + 3 * t ** 2 * (p1 - c2);
}

// Find extrema (peaks/valleys) of a cubic Bezier curve segment
export function findBezierExtrema(segment: {
  p0: { x: number; y: number };
  c1: { x: number; y: number };
  c2: { x: number; y: number };
  p1: { x: number; y: number };
}) {
  const extrema: { t: number; x: number; y: number; type: "peak" | "valley" }[] = [];

  // Find Y extrema (where dy/dt = 0)
  const a = 3 * (segment.p1.y - 3 * segment.c2.y + 3 * segment.c1.y - segment.p0.y);
  const b = 6 * (segment.c2.y - 2 * segment.c1.y + segment.p0.y);
  const c = 3 * (segment.c1.y - segment.p0.y);

  // Solve quadratic equation at^2 + bt + c = 0
  const discriminant = b * b - 4 * a * c;

  if (discriminant >= 0 && Math.abs(a) > 1e-10) {
    const sqrt_d = Math.sqrt(discriminant);
    const t1 = (-b + sqrt_d) / (2 * a);
    const t2 = (-b - sqrt_d) / (2 * a);

    [t1, t2].forEach((t) => {
      if (t > 0.01 && t < 0.99) {
        // Exclude endpoints, small buffer for stability
        const x = cubicBezier(segment.p0.x, segment.c1.x, segment.c2.x, segment.p1.x, t);
        const y = cubicBezier(segment.p0.y, segment.c1.y, segment.c2.y, segment.p1.y, t);

        // Determine if it's a peak or valley by checking second derivative
        const secondDerivY = 6 * a * t + 2 * b;
        const type = secondDerivY < 0 ? "peak" : "valley";

        extrema.push({ t, x, y, type });
      }
    });
  }

  return extrema;
}
