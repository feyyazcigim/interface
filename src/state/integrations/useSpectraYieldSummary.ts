
import { ChainLookup } from '@/utils/types.generic';
import { MAIN_TOKEN, S_MAIN_TOKEN } from "@/constants/tokens";
import { useChainConstant, useResolvedChainId } from "@/utils/chain";
import { Token } from "@/utils/types";
import { Address } from "viem";
import { base } from "viem/chains";
import { useReadContracts } from "wagmi";
import { TV } from '@/classes/TokenValue';
import { getNowRounded } from '@/state/protocol/sun';
import { siloedPintoABI } from '@/constants/abi/siloedPintoABI';
import { spectraPoolABI } from '@/constants/abi/integrations/spectraPoolABI';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSeason } from '../useSunData';
import { DateTime } from 'luxon';

export interface SpectraCurvePool {
  maturity: number;
  pool: Address;
  lp: Address;
  pt: Address;
  yt: Address;
  underlying: Token;
  token: Token;
};

const spectraCurvePool: ChainLookup<SpectraCurvePool> = {
  [base.id]: {
    maturity: 1758153782,
    pool: "0xd8E4662ffd6b202cF85e3783Fb7252ff0A423a72" satisfies Address,
    lp: "0xba1F1eA8c269003aFe161aFAa0bd205E2c7F782a" satisfies Address,
    pt: "0x42AF817725D8cda8E69540d72f35dBfB17345178" satisfies Address,
    yt: "0xaF4f5bdF468861feF71Ed6f5ea0C01A75B62273d" satisfies Address,
    underlying: MAIN_TOKEN[base.id],
    token: S_MAIN_TOKEN[base.id]
  }
} as const;

const selectQuery = ([get_dy, previewRedeem]: readonly [bigint, bigint]) => {
  return {
    ibt2PTRate: TV.fromBigInt(get_dy, 18),
    ibtToUnderlyingRate: TV.fromBigInt(previewRedeem, 6)
  }
}

const SECONDS_PER_HOUR = 60 * 60;

const HOURS_PER_YEAR = 24 * 365;

export const useSpectraYieldBreakdown = () => {
  const siloWrappedToken = useChainConstant(S_MAIN_TOKEN);
  const chainId = useResolvedChainId();

  const pool = spectraCurvePool[chainId];

  const enabled = !!pool;

  const selectAPR = useCallback(([get_dy, previewRedeem]: readonly [bigint, bigint]) => {
    const now = getNowRounded();

    const ibt2PTRate = TV.fromBigInt(get_dy, 18);
    const ibtToUnderlyingRate = TV.fromBigInt(previewRedeem, 6);

    const underlyingToPTRate = ibt2PTRate.div(ibtToUnderlyingRate);
    const hoursToMaturity = (pool.maturity - now.toSeconds()) / SECONDS_PER_HOUR;

    const apr = ((underlyingToPTRate.sub(1)).div(hoursToMaturity)).mul(HOURS_PER_YEAR);

    return apr;
  }, [pool]);

  const query = useReadContracts({
    contracts: [
      {
        address: pool.pool,
        abi: spectraPoolABI,
        functionName: "get_dy",
        args: [0n, 1n, BigInt(10 ** siloWrappedToken.decimals)],
      },
      {
        address: siloWrappedToken.address,
        abi: siloedPintoABI,
        functionName: "previewRedeem",
        args: [BigInt(10 ** siloWrappedToken.decimals)],
      }
    ],
    allowFailure: false,
    query: {
      enabled,
      select: selectAPR
    }
  });

  return query;
}
