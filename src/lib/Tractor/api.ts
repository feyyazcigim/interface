import { TV } from "@/classes/TokenValue";
import { API_SERVICES } from "@/constants/endpoints";
import {
  MAIN_TOKEN,
  PINTO_CBBTC_TOKEN,
  PINTO_CBETH_TOKEN,
  PINTO_USDC_TOKEN,
  PINTO_WETH_TOKEN,
  PINTO_WSOL_TOKEN,
} from "@/constants/tokens";
import { getChainConstant } from "@/hooks/useChainConstant";
import { resolveChainId } from "@/utils/chain";
import { ChainLookup, HashString, Prettify } from "@/utils/types.generic";
import { safeJSONStringify } from "@/utils/utils";
import { base } from "viem/chains";
import { SowOrderTokenStrategy, TractorAPIOrderType, TractorAPIOrdersResponse } from "./types";

// ────────────────────────────────────────────────────────────────────────────────
// Shared Interfaces
// ────────────────────────────────────────────────────────────────────────────────

export type BaseTractorAPIResponse<T = unknown> = {
  lastUpdated: number;
  totalRecords: number;
} & T;

const MAX_LIMIT = 5_000;

async function paginateTractorApiRequest<T extends BaseTractorAPIResponse>(
  asyncCallback: (body?: Record<string, unknown>) => Promise<T>,
  getReturnLength: (res: T) => number,
  requestBody: any,
) {
  const body = { ...requestBody, limit: MAX_LIMIT };

  try {
    const res = await asyncCallback(body);

    if (getReturnLength(res) < body.limit) {
      return [res];
    }

    const amountLeft = Math.ceil((res.totalRecords - body.limit) / body.limit);

    return Promise.all(
      Array.from({ length: amountLeft }, (_, i) => i + 1).map((skipAmount) =>
        asyncCallback({ ...body, skip: skipAmount }),
      ),
    );
  } catch (e) {
    console.error(e);
    return [];
  }
}

// ================================================================================
// ────────────────────────────────────────────────────────────────────────────────
// TRACTOR API ORDER ENDPOINT
// ────────────────────────────────────────────────────────────────────────────────
// ================================================================================

export interface TractorAPIOrderOptions {
  orderType?: TractorAPIOrderType;
  cancelled?: boolean;
  publisher?: `0x${string}`;
}
const getOrders = async (options?: TractorAPIOrderOptions) => {
  console.debug("[Tractor/tractorAPIFetchOrders] Fetching orders...");

  try {
    const result = await paginateTractorApiRequest(
      (reqBody) => fetch(`${API_SERVICES.pinto}/tractor/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: safeJSONStringify(reqBody, undefined),
      }).then((res) => res.json() as Promise<TractorAPIOrdersResponse>),
      (res) => res.orders.length,
      { ...options, limit: MAX_LIMIT, skip: 0 },
    );

    const data = result.reduce<TractorAPIOrdersResponse>(
      (prev, curr) => {
        if (!prev.lastUpdated) prev.lastUpdated = curr.lastUpdated;
        if (!prev.totalRecords) prev.totalRecords = curr.totalRecords;
        prev.orders.push(...curr.orders);
        return prev;
      },
      { lastUpdated: 0, totalRecords: 0, orders: [] },
    );

    console.debug("[Tractor/tractorAPIFetchOrders] RESPONSE", data);

    return data;
  } catch (e) {
    console.error(e);
    return {
      lastUpdated: 0,
      totalRecords: 0,
      orders: [],
    };
  }
};

// ================================================================================
// ────────────────────────────────────────────────────────────────────────────────
// TRACTOR API EXECUTION ENDPOINT
// ────────────────────────────────────────────────────────────────────────────────
// ================================================================================

export interface TractorAPIExecutionsOptions {
  publisher?: `0x${string}`;
}
const tractorAPIFetchExecutions = async (options?: TractorAPIExecutionsOptions) => {
  console.debug("[Tractor/tractorAPIFetchExecutions] Fetching executions...");

  try {
    const results = await paginateTractorApiRequest(
      (requestBody: any) => {
        return fetch(`${API_SERVICES.pinto}/tractor/executions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: safeJSONStringify(requestBody, undefined),
        }).then((res) => res.json() as Promise<TractorAPIExecutionResponse<unknown>>);
      },
      (res) => res.executions.length,
      { orderType: "KNOWN", ...options },
    );

    const data = results.reduce<TractorAPIExecutionResponse<unknown>>(
      (prev, curr) => {
        if (!prev.lastUpdated) prev.lastUpdated = curr.lastUpdated;
        if (!prev.totalRecords) prev.totalRecords = curr.totalRecords;
        prev.executions.push(...curr.executions);
        return prev;
      },
      { lastUpdated: 0, totalRecords: 0, executions: [] },
    );

    console.debug("[Tractor/tractorAPIFetchExecutions] RESPONSE", data);

    return data;
  } catch (e) {
    console.error("[Tractor/tractorAPIFetchExecutions] ERROR", e);
    return {
      lastUpdated: 0,
      totalRecords: 0,
      executions: [],
    };
  }
};

// ────────────────────────────────────────────────────────────────────────────────
// INTERFACE
// ────────────────────────────────────────────────────────────────────────────────

export interface TractorAPIResponseExecution<Blueprint> {
  id: number;
  blueprintHash: HashString;
  nonce: string;
  operator: HashString;
  gasCostUsd: number;
  tipUsd: number;
  executedTimestamp: string;
  executedBlock: number;
  executedTxn: HashString;
  orderInfo: TractorAPIExecutionOrderInfo;
  blueprintData: Blueprint;
}

export interface TractorAPIExecutionOrderInfo {
  orderType: TractorAPIOrderType;
  publisher: HashString;
}

export interface TractorAPIExecutionResponse<Blueprint> {
  lastUpdated: number;
  totalRecords: number;
  executions: TractorAPIResponseExecution<Blueprint>[];
}

export interface TractorAPIExecutionSowBlueprint<Value extends string | TV = TV> {
  id: number;
  blueprintHash: HashString;
  index: Value;
  beans: Value;
  pods: Value;
  placeInLine: Value;
  usedTokens: HashString[];
  usedGrownStalkPerBdv: Value;
}

export type TractorAPIExecutionSowOrderItem<Value extends string | TV = TV> = Prettify<
  TractorAPIResponseExecution<TractorAPIExecutionSowBlueprint<Value>>
>;

// ────────────────────────────────────────────────────────────────────────────────
// DEFAULT EXPORT
// ────────────────────────────────────────────────────────────────────────────────

const TractorAPI = {
  getOrders,
  getExecutions: tractorAPIFetchExecutions,
} as const;

export default TractorAPI;

// ────────────────────────────────────────────────────────────────────────────────
// ORDER ENDPOINT HELPER FUNCTIONS
// ────────────────────────────────────────────────────────────────────────────────

// Chain Map to of index to SowOrderTokenStrategy
const INDEX_TO_SOW_ORDER_TOKEN_STRATEGY: ChainLookup<Record<string, SowOrderTokenStrategy>> = {
  [base.id]: {
    "0": { type: "SPECIFIC_TOKEN", address: getChainConstant(base.id, MAIN_TOKEN).address },
    "1": { type: "SPECIFIC_TOKEN", address: getChainConstant(base.id, PINTO_WETH_TOKEN).address },
    "2": { type: "SPECIFIC_TOKEN", address: getChainConstant(base.id, PINTO_CBETH_TOKEN).address },
    "3": { type: "SPECIFIC_TOKEN", address: getChainConstant(base.id, PINTO_CBBTC_TOKEN).address },
    "4": { type: "SPECIFIC_TOKEN", address: getChainConstant(base.id, PINTO_USDC_TOKEN).address },
    "5": { type: "SPECIFIC_TOKEN", address: getChainConstant(base.id, PINTO_WSOL_TOKEN).address },
    "254": { type: "LOWEST_PRICE" },
    "255": { type: "LOWEST_SEEDS" },
  },
};

const getTokenSowStrategySource = (indicies: string[], chainId: number = base.id): SowOrderTokenStrategy => {
  const resolvedChainId = resolveChainId(chainId);
  if (!(resolvedChainId in INDEX_TO_SOW_ORDER_TOKEN_STRATEGY)) {
    throw new Error(`[Tractor/getTokenSowStrategySource]: Invalid chainId: ${chainId}`);
  }

  if (indicies.length > 1) {
    throw new Error(`[Tractor/getTokenSowStrategySource]: Multiple indicies not supported: ${indicies}`);
  }

  const strategy = INDEX_TO_SOW_ORDER_TOKEN_STRATEGY[resolvedChainId]?.[indicies[0]];
  if (!strategy) {
    throw new Error(`[Tractor/getTokenSowStrategySource]: Invalid index: ${indicies[0]}`);
  }

  return strategy;
};
