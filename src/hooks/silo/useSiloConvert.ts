import { TV } from "@/classes/TokenValue";
import { defaultQuerySettingsQuote } from "@/constants/query";
import { useProtocolAddress } from "@/hooks/pinto/useProtocolAddress";
import { SiloConvert } from "@/lib/siloConvert/SiloConvert";
import { queryKeys } from "@/state/queryKeys";
import { stringEq } from "@/utils/string";
import { DepositData, Token, TokenDepositData } from "@/utils/types";
import { isDev } from "@/utils/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { useAccount, useChainId, useConfig } from "wagmi";

/**
 * NOTE: B/c 0xV2 utilizes permits, LP<>LP convert quotes will fail if the local block time is further ahead than the permit's expiration.
 * Testing LP<>LP converts locally must be done by impersonating an account that already has deposits on a fork that has not been forwarded.
 *
 * SERIALIZATION NOTE: Hooks in this file return complex class instances (TokenValue, AdvancedFarmWorkflow) that are
 * not serializable for TanStack Query persistence. This is intentional for conversion-related queries as the data
 * is ephemeral and benefits from maintaining full class functionality over cross-session persistence.
 */

export default function useSiloConvert() {
  const diamond = useProtocolAddress();
  const account = useAccount();
  const config = useConfig();
  const chainId = useChainId();

  const scRef = useRef<SiloConvert | null>(null);

  const address = account.address ?? ("0x" as `0x${string}`);

  // Check if we need to create/recreate the instance
  if (
    !scRef.current ||
    !stringEq(scRef.current.context.diamond, diamond) ||
    !stringEq(scRef.current.context.account, address) ||
    scRef.current.context.chainId !== chainId
  ) {
    scRef.current = new SiloConvert(diamond, address, config, chainId);
  }

  // Cleanup on unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      if (scRef.current) {
        scRef.current.clear();
        scRef.current = null;
      }
    };
  }, []);

  return scRef.current;
}

export function useClearSiloConvertQueries() {
  const qc = useQueryClient();

  const clear = useCallback(() => {
    qc.invalidateQueries({ queryKey: queryKeys.base.silo.convert, exact: false, type: "all" });
  }, [qc]);

  return clear;
}

// ------------------------------ SHARED CONSTANTS ------------------------------

const SILO_CONVERT_QUERY_SETTINGS = {
  ...(isDev()
    ? {
        refetchInterval: 30_000,
        staleTime: 30_000,
      }
    : defaultQuerySettingsQuote),
  meta: { persist: false },
};

// ------------------------------ MAX CONVERT ------------------------------

/**
 * Hook for fetching the maximum convertible amount between two Silo tokens.
 *
 * IMPORTANT: Returns TokenValue instances which are non-serializable. Persistence is disabled
 * to avoid localStorage issues. Max convert amounts are context-dependent and change frequently.
 *
 * @param siloConvert - SiloConvert instance for executing max convert calculations
 * @param farmerDeposits - Farmer's deposit data for the source token
 * @param source - Source token to convert from
 * @param target - Target token to convert to
 * @param enabled - Whether the query should be enabled
 * @returns Query result with TokenValue instance
 */
export function useSiloMaxConvertQuery(
  siloConvert: SiloConvert,
  farmerDeposits: TokenDepositData | undefined,
  source: Token | undefined,
  target: Token | undefined,
  enabled: boolean = true,
) {
  const account = useAccount();

  const farmerMax = farmerDeposits?.convertibleAmount?.toBlockchain();

  const queryKey = useMemo(
    () => queryKeys.silo.convert.maxConvert(source?.address, target?.address, farmerMax),
    [source, target, farmerMax],
  );

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!source || !target || !farmerDeposits) return TV.ZERO;
      return siloConvert.getMaxConvert(source, target, farmerDeposits.convertibleDeposits).catch((e) => {
        console.error("Error fetching max convert: ", e);
        return TV.ZERO;
      });
    },
    enabled: !!account.address && !!source?.address && !!target?.address && enabled && !!farmerMax,
    ...SILO_CONVERT_QUERY_SETTINGS,
  });

  return { ...query, queryKey };
}

// ------------------------------ CONVERT QUOTE ------------------------------

/**
 * Hook for fetching real-time conversion quotes between Silo tokens.
 *
 * IMPORTANT: The return value contains non-serializable class instances (TokenValue, AdvancedFarmWorkflow)
 * and cannot be persisted to localStorage. This is intentional as quote data is ephemeral and
 * market conditions change frequently, making persistence potentially harmful.
 *
 * @param siloConvert - SiloConvert instance for executing quotes
 * @param source - Source token to convert from
 * @param target - Target token to convert to (can be undefined)
 * @param amountIn - Amount to convert as string
 * @param convertibleDeposits - Available deposits for conversion
 * @param slippage - Slippage tolerance as decimal (e.g., 0.25 for 0.25%)
 * @param enabled - Whether the query should be enabled
 * @returns Query result with SiloConvertSummary array containing class instances
 */
export function useSiloConvertQuote(
  siloConvert: SiloConvert,
  source: Token,
  target: Token | undefined,
  amountIn: string,
  convertibleDeposits: DepositData[] | undefined,
  slippage: number,
  enabled: boolean = true,
) {
  const account = useAccount();

  const queryKey = useMemo(
    () => queryKeys.silo.convert.quote(account.address, source.address, target?.address, amountIn, slippage),
    [account.address, source.address, target?.address, amountIn, slippage],
  );

  const sourceAmount = TV.fromHuman(amountIn, source.decimals);

  const queryEnabled = !!account.address && !!convertibleDeposits?.length && sourceAmount.gt(0) && !!target && enabled;

  const query = useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      if (!account.address || !convertibleDeposits?.length || sourceAmount.lte(0) || !target) {
        return;
      }

      try {
        return await siloConvert.quote(source, target, convertibleDeposits, sourceAmount, slippage, signal);
      } catch (e) {
        // Don't log or throw for aborted requests
        if (e instanceof Error && e.name === "AbortError") {
          return;
        }
        console.error("Error fetching quote: ", e);
        throw e;
      }
    },
    enabled: queryEnabled,
    retry: false,
    ...SILO_CONVERT_QUERY_SETTINGS,
  });

  const isDefaultConvert = source.isMain || target?.isMain;

  useEffect(() => {
    if (!query.error || sourceAmount.lte(0) || !target?.address) {
      return;
    }

    // Skip error toast for aborted requests
    if (query.error instanceof Error && query.error.name === "AbortError") {
      return;
    }

    const msg = isDefaultConvert ? "Quote failed. Try lowering amount or increasing slippage" : "Quote failed. Try increasing slippage";
    toast.dismiss();
    toast.error(msg);
  }, [query.error, target?.address, isDefaultConvert, sourceAmount]);

  return { ...query, queryKey };
}
