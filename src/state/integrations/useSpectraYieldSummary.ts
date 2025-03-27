import { TV } from "@/classes/TokenValue";
import { spectraCurvePoolABI } from "@/constants/abi/integrations/spectraCurvePoolABI";
import { siloedPintoABI } from "@/constants/abi/siloedPintoABI";
import { MAIN_TOKEN, S_MAIN_TOKEN } from "@/constants/tokens";
import { getNowRounded } from "@/state/protocol/sun";
import { useChainConstant, useResolvedChainId } from "@/utils/chain";
import { Token } from "@/utils/types";
import { ChainLookup } from "@/utils/types.generic";
import { Address } from "viem";
import { base } from "viem/chains";
import { useReadContracts } from "wagmi";
import { ProtocolIntegrationQueryReturnType } from "./types";

export interface SpectraCurvePool {
  maturity: number;
  pool: Address;
  lp: Address;
  pt: Address;
  yt: Address;
  underlying: Token;
  token: Token;
}

const spectraCurvePool: ChainLookup<SpectraCurvePool> = {
  [base.id]: {
    maturity: 1758153782,
    pool: "0xd8E4662ffd6b202cF85e3783Fb7252ff0A423a72" satisfies Address,
    lp: "0xba1F1eA8c269003aFe161aFAa0bd205E2c7F782a" satisfies Address,
    pt: "0x42AF817725D8cda8E69540d72f35dBfB17345178" satisfies Address,
    yt: "0xaF4f5bdF468861feF71Ed6f5ea0C01A75B62273d" satisfies Address,
    underlying: MAIN_TOKEN[base.id],
    token: S_MAIN_TOKEN[base.id],
  },
} as const;

type SpectraYieldSummaryResponse = { apr: TV };

export const useSpectraYieldSummary = (): ProtocolIntegrationQueryReturnType<SpectraYieldSummaryResponse> => {
  const siloWrappedToken = useChainConstant(S_MAIN_TOKEN);
  const chainId = useResolvedChainId();

  const pool = spectraCurvePool[chainId];

  const query = useReadContracts({
    contracts: [
      {
        address: pool.pool,
        abi: spectraCurvePoolABI,
        functionName: "get_dy",
        args: [0n, 1n, BigInt(10 ** siloWrappedToken.decimals)],
      },
      {
        address: siloWrappedToken.address,
        abi: siloedPintoABI,
        functionName: "previewRedeem",
        args: [BigInt(10 ** siloWrappedToken.decimals)],
      },
    ],
    allowFailure: false,
    query: {
      enabled: !!pool,
      select: (response) => {
        return selectQuery(response, pool);
      },
    },
  });

  return {
    ...query,
    integrationKey: "SPECTRA",
  };
};

// ---------- CONSTANTS & INTERFACES ----------

const SECONDS_PER_HOUR = 60 * 60;

const HOURS_PER_YEAR = 24 * 365;

// ---------- FUNCTIONS ----------

type SpectraCurvePoolQueryReturn = [get_dy: bigint, previewRedeem: bigint];

const selectQuery = (response: SpectraCurvePoolQueryReturn, pool: SpectraCurvePool) => {
  const [get_dy, previewRedeem] = response;

  const now = getNowRounded();

  const ibt2PTRate = TV.fromBigInt(get_dy, 18);
  const ibtToUnderlyingRate = TV.fromBigInt(previewRedeem, 6);
  const underlyingToPTRate = ibt2PTRate.div(ibtToUnderlyingRate);

  const secondsToMaturity = pool.maturity - now.toSeconds();
  const hoursToMaturity = secondsToMaturity / SECONDS_PER_HOUR;

  // simple APR calculation
  const apr = underlyingToPTRate.sub(1).div(hoursToMaturity).mul(HOURS_PER_YEAR);

  return {
    apr,
  };
};
