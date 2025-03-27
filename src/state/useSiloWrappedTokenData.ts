import { TV } from "@/classes/TokenValue";
import { siloedPintoABI } from "@/constants/abi/siloedPintoABI";
import { S_MAIN_TOKEN } from "@/constants/tokens";
import { useChainConstant } from "@/utils/chain";
import { Token } from "@/utils/types";
import { useMemo } from "react";
import { useReadContract } from "wagmi";
import { usePriceData } from "./usePriceData";
import useTokenData from "./useTokenData";

const getExchangeRate = (mainToken: Token, siloWrappedToken: Token, amount: bigint) => {
  const baseAmount = TV.fromHuman(1, mainToken.decimals);
  const siloWrappedAmount = TV.fromBigInt(amount, siloWrappedToken.decimals);

  const exchangeRate = siloWrappedAmount.div(baseAmount);

  return exchangeRate;
};

export const useSiloWrappedTokenExchangeRateQuery = (options?: {
  enabled?: boolean;
}) => {
  const { mainToken, siloWrappedToken } = useTokenData();

  return useReadContract({
    address: siloWrappedToken.address,
    abi: siloedPintoABI,
    functionName: "previewDeposit",
    args: [BigInt(10 ** mainToken.decimals)],
    query: {
      enabled: options?.enabled ?? true,
      select: (data) => {
        return getExchangeRate(mainToken, siloWrappedToken, data);
      },
    },
  });
};

export const useSiloWrappedTokenExchangeRate = () => {
  const { mainToken } = useTokenData();
  const { tokenPrices } = usePriceData();

  const query = useSiloWrappedTokenExchangeRateQuery();

  const siloWrappedTokenUSD = useMemo(() => {
    const mainTokenUSD = tokenPrices.get(mainToken)?.instant ?? TV.ZERO;
    const exchangeRate = query.data ?? TV.ZERO;

    // 6 decimals. All price data has 6 decimals.
    return exchangeRate.mul(mainTokenUSD).reDecimal(6);
  }, [query.data, mainToken, tokenPrices]);

  return {
    ...query,
    usd: siloWrappedTokenUSD,
  };
};

export const useSiloWrappedTokenToUSD = (amount: TV | undefined) => {
  const { data: exchangeRate = TV.ZERO, usd, ...query } = useSiloWrappedTokenExchangeRate();

  const totalUSD = useMemo(() => {
    return amount?.mul(usd) ?? TV.ZERO;
  }, [amount, exchangeRate, usd]);

  return {
    isLoading: query.isLoading,
    totalUSD,
  };
};

export const useSiloWrappedTokenTotalSupply = () => {
  const siloWrappedToken = useChainConstant(S_MAIN_TOKEN);

  const query = useReadContract({
    address: siloWrappedToken.address,
    abi: siloedPintoABI,
    functionName: "totalSupply",
  });

  const totalAssets = useMemo(() => {
    if (!query.data) return undefined;
    return TV.fromBigInt(query.data, siloWrappedToken.decimals);
  }, [query.data, siloWrappedToken]);

  return {
    ...query,
    data: totalAssets,
  };
};
