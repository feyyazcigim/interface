import { TV } from "@/classes/TokenValue";
import { spectraCurvePoolABI } from "@/constants/abi/integrations/spectraCurvePoolABI";
import { siloedPintoABI } from "@/constants/abi/siloedPintoABI";
import { API_SERVICES } from "@/constants/endpoints";
import { SPECTRA_CURVE_POOLS } from "@/constants/integrations";
import { S_MAIN_TOKEN } from "@/constants/tokens";
import { getNowRounded } from "@/state/protocol/sun";
import { useChainConstant, useResolvedChainId } from "@/utils/chain";
import { base } from "viem/chains";
import { useReadContracts } from "wagmi";
import { ProtocolIntegrationQueryReturnType, SpectraCurvePool } from "./types";

type SpectraYieldSummaryResponse = { apr: TV };

const impliedAPYFetchOptions = {
  method: "GET",
  headers: new Headers({ "x-client-id": "Pinto" }),
};

const urlParams = new URLSearchParams({ source: "Pinto" });

const getSpectraPoolImpliedAPYEndpoint = (chainId: number, pool: SpectraCurvePool) => {
  if (chainId === base.id) {
    const onlyURL = `${API_SERVICES.spectra}/base/implied-apy/${pool.pool}`;
    const url = `${onlyURL}?${urlParams.toString()}`;

    // https://app.spectra.finance/api/v1/base/implied-apy/0xd8E4662ffd6b202cF85e3783Fb7252ff0A423a72/?source=Pinto
    // https://app.spectra.finance/api/v1/base/implied-apy/0xd8e4662ffd6b202cf85e3783fb7252ff0a423a72?source=Pinto

    return {
      url,
      options: impliedAPYFetchOptions,
    };
  }

  return;
};

export const useSpectraYieldSummary = (): ProtocolIntegrationQueryReturnType<SpectraYieldSummaryResponse> => {
  const siloWrappedToken = useChainConstant(S_MAIN_TOKEN);
  const chainId = useResolvedChainId();

  const pool = SPECTRA_CURVE_POOLS[chainId];

  // const apyQuery = useQuery({
  //   queryKey: ["spectra-yield-summary", chainId],
  //   queryFn: async () => {
  //     if (!endpoint) return;
  //     console.log("endpoint", endpoint);
  //     const response = await fetch(endpoint.url, endpoint.options);
  //     console.log("response", response);
  //     return response;
  //   },
  //   enabled: !!endpoint?.url,
  //   staleTime: 1000 * 60 * 20,
  //   refetchInterval: 1000 * 60 * 20,
  // });

  // console.log("apyQuery", apyQuery);

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
      {
        address: siloWrappedToken.address,
        abi: siloedPintoABI,
        functionName: "previewWithdraw",
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

type SpectraCurvePoolQueryReturn = [get_dy: bigint, previewRedeem: bigint, previewWithdraw: bigint];

const selectQuery = (response: SpectraCurvePoolQueryReturn, pool: SpectraCurvePool) => {
  const [get_dy, previewRedeem, previewWithdraw] = response;

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
