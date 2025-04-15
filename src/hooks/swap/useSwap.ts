import { TV } from "@/classes/TokenValue";
import { useIsWSOL, usePINTOWSOL, useWSOL } from "@/hooks/pinto/useTokenMap";
import { Token } from "@/utils/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { useAccount, useChainId, useConfig } from "wagmi";

import { defaultQuerySettingsQuote } from "@/constants/query";
import { MAIN_TOKEN } from "@/constants/tokens";
import { useChainConstant } from "@/utils/chain";
import { tokensEqual } from "@/utils/token";
import { SwapOptions, SwapQuoter } from "../../lib/Swap/swap-router";

const useRouter = () => {
  const chainId = useChainId();
  const config = useConfig();

  return useMemo(() => {
    return new SwapQuoter(chainId, config);
  }, [chainId, config]);
};

const getSwapOptions = (
  tokenIn: Token,
  tokenOut: Token | undefined,
  wsol: Token,
  pintoWSOL: Token,
  mainToken: Token,
): SwapOptions => {
  const wsolIn = tokensEqual(tokenIn, wsol);
  const wsolOut = Boolean(tokenOut && tokensEqual(wsol, tokenOut));

  // Route all NON_PINTO -> PINTOWSOL through PINTO.
  // Since we are routing through PINTO, we can use 0x since we are not swapping for WSOL.
  const lpRouteOverrides = new Map<Token, Token>();
  lpRouteOverrides.set(pintoWSOL, mainToken);

  // In the case where user is going from WSOL => NON_PINTOWSOL LP, add single sided PINTO liquidity.
  if (wsolIn && tokenOut?.isLP) {
    lpRouteOverrides.set(tokenOut, mainToken);
  }

  return {
    directOnly: wsolIn || wsolOut,
    aggDisabled: wsolIn || wsolOut,
    disabledThruTokens: new Set([wsol]),
    lpRouteOverrides,
  };
}

const useSwapOptions = (tokenIn: Token, tokenOut: Token | undefined): SwapOptions => {
  const wsol = useWSOL();
  const pintoWSOL = usePINTOWSOL();
  const mainToken = useChainConstant(MAIN_TOKEN);

  return useMemo(() => {
    return getSwapOptions(tokenIn, tokenOut, wsol, pintoWSOL, mainToken)
  }, [tokenIn, tokenOut, wsol, pintoWSOL, mainToken]);
};

export type UseSwapParams = {
  tokenIn: Token;
  tokenOut: Token | undefined;
  amountIn: TV;
  slippage: number;
  disabled?: boolean;
};

export const SWAP_QUERY_KEY_PREDICATE = ["pinto-swap-router"] as const;

export default function useSwap({ tokenIn, tokenOut, amountIn, slippage, disabled = false }: UseSwapParams) {
  const router = useRouter();
  const account = useAccount();

  const swapOptions = useSwapOptions(tokenIn, tokenOut);
  const queryClient = useQueryClient();

  const hasSwapVars = !!tokenIn && !!tokenOut && amountIn.gt(0) && !!slippage;

  const swapNodesQuery = useQuery({
    queryKey: [SWAP_QUERY_KEY_PREDICATE, tokenIn.address, tokenOut?.address, amountIn, slippage],
    queryFn: async () => {
      if (!tokenOut) return;
      const swapResult = await router.route(tokenIn, tokenOut, amountIn, slippage, swapOptions).catch((e) => {
        console.error("Error routing swap: ", e);
        throw e;
      });
      console.debug("\n--------[Swap/useSwap] Query: ", swapResult, "\n");
      return swapResult;
    },
    enabled: !!account && hasSwapVars && !disabled,
    ...defaultQuerySettingsQuote,
  });

  const resetSwap = useCallback(() => {
    router.clear();
    queryClient.removeQueries({
      queryKey: [SWAP_QUERY_KEY_PREDICATE],
      exact: false,
      type: "all",
    });
  }, [queryClient, router]);

  return {
    ...swapNodesQuery,
    resetSwap,
  };
}

export interface IUseSwapMany {
  args: UseSwapParams[];
  disabled?: boolean;
}

export const useSwapMany = ({ args, disabled = false }: IUseSwapMany) => {
  const router = useRouter();
  const wsol = useWSOL();
  const pintoWSOL = usePINTOWSOL();
  const mainToken = useChainConstant(MAIN_TOKEN);

  const account = useAccount();
  const queryClient = useQueryClient();

  const swapOptions = useMemo(() => {
    return args.map((arg) => getSwapOptions(arg.tokenIn, arg.tokenOut, wsol, pintoWSOL, mainToken))
  }, [args, wsol, pintoWSOL, mainToken]);

  const hasSwapVars = useMemo(() => {
    return args.every((arg) => !!arg.tokenIn && !!arg.tokenOut && arg.amountIn.gt(0) && !!arg.slippage);
  }, [args]);

  const swapNodesQuery = useQuery({
    queryKey: [SWAP_QUERY_KEY_PREDICATE, args.map((arg) => [arg.tokenIn.address, arg.tokenOut?.address, arg.amountIn, arg.slippage])],
    queryFn: async () => {
      if (!args.length || !hasSwapVars) return;

      const swapResult = await Promise.all(args.map((arg, i) => {
        if (!arg.tokenOut) {
          // This should never happen
          throw new Error("Token out is required");
        }
        return router.route(arg.tokenIn, arg.tokenOut, arg.amountIn, arg.slippage, swapOptions[i])
      })).catch((e) => {
        console.error("Error routing swap: ", e);
        throw e;
      })

      console.debug("\n--------[Swap/useSwap] Query: ", swapResult, "\n");
      return swapResult;
    },
    enabled: !!account && hasSwapVars && !disabled,
    ...defaultQuerySettingsQuote,
  });

  const resetSwap = useCallback(() => {
    router.clear();
    queryClient.removeQueries({
      queryKey: [SWAP_QUERY_KEY_PREDICATE],
      exact: false,
      type: "all",
    });
  }, [queryClient, router]);

  return {
    ...swapNodesQuery,
    resetSwap,
  };
}