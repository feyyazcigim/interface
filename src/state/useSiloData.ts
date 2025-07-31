import { TokenValue } from "@/classes/TokenValue";
import { ZERO_ADDRESS } from "@/constants/address";
import { SEEDS, STALK } from "@/constants/internalTokens";
import { defaultQuerySettings } from "@/constants/query";
import { subgraphs } from "@/constants/subgraph";
import { beanstalkAbi, beanstalkAddress } from "@/generated/contractHooks";
import { SiloYieldsDocument } from "@/generated/gql/pintostalk/graphql";
import { useProtocolAddress } from "@/hooks/pinto/useProtocolAddress";
import { stringEq } from "@/utils/string";
import { getTokenIndex } from "@/utils/token";
import { SiloTokenData, Token } from "@/utils/types";
import { Lookup, Prettify } from "@/utils/types.generic";
import { exists } from "@/utils/utils";
import { QueryKey, useQuery } from "@tanstack/react-query";
import request from "graphql-request";
import { chunk } from "lodash";
import { useEffect, useMemo } from "react";
import { useCallback } from "react";
import { Address, MulticallResponse, Omit } from "viem";
import { ContractFunctionParameters } from "viem";
import { UseReadContractsReturnType, useChainId, useReadContracts } from "wagmi";
import useTokenData, { useWhitelistedTokens } from "./useTokenData";

const settings = {
  query: {
    ...defaultQuerySettings,
  },
};

type GetTotalDepositedBDVParams = ContractFunctionParameters<typeof GetTotalDepositedBDVABI>;

type GetTotalDepositedBdvContractsResponse = Prettify<UseReadContractsReturnType<GetTotalDepositedBDVParams[], true>>;

export function useTotalDepositedBdvPerTokenQuery() {
  const whitelistedTokens = useWhitelistedTokens();
  const diamond = useProtocolAddress();

  const select = useCallback(
    (data: GetTotalDepositedBdvContractsResponse["data"]) => {
      return data?.reduce<Lookup<TokenValue>>((acc, curr, idx) => {
        const token = whitelistedTokens[idx];

        if (!token || !exists(curr.result)) return acc;
        acc[getTokenIndex(token)] = TokenValue.fromBlockchain(curr.result, token.decimals);
        return acc;
      }, {});
    },
    [whitelistedTokens],
  );

  return useReadContracts({
    contracts: whitelistedTokens.map((token) => {
      return {
        address: diamond,
        abi: GetTotalDepositedBDVABI,
        functionName: "getTotalDepositedBdv",
        args: [token.address],
      };
    }),
    query: {
      enabled: !!whitelistedTokens.length,
      ...settings.query,
      select,
    },
  });
}

const CALLS_STRUCTS_PER_SILO_TOKEN = 8;

const makeSiloTokenData = (
  siloTokenData: SiloTokenDataResponse,
  token: Token,
  mainToken: Token,
): Omit<SiloTokenData, "yields"> => {
  const ts = siloTokenData?.[5]?.result;

  const tokenSettings: SiloTokenData["tokenSettings"] = {
    deltaStalkEarnedPerSeason: TokenValue.fromBlockchain(ts?.deltaStalkEarnedPerSeason ?? 0n, STALK.decimals),
    encodeType: ts?.encodeType ?? "0x",
    gaugePointImplementation: {
      target: ts?.gaugePointImplementation.target ?? "0x",
      selector: ts?.gaugePointImplementation.selector ?? "0x",
      encodeType: ts?.gaugePointImplementation.encodeType ?? "0x",
      data: ts?.gaugePointImplementation.data ?? "0x",
    },
    gaugePoints: ts?.gaugePoints ?? 0n,
    liquidityWeightImplementation: {
      target: ts?.liquidityWeightImplementation.target ?? "0x",
      selector: ts?.liquidityWeightImplementation.selector ?? "0x",
      encodeType: ts?.liquidityWeightImplementation.encodeType ?? "0x",
      data: ts?.liquidityWeightImplementation.data ?? "0x",
    },
    milestoneSeason: ts?.milestoneSeason ?? 0,
    milestoneStem: TokenValue.fromBlockchain(ts?.milestoneStem ?? 0n, mainToken.decimals),
    optimalPercentDepositedBdv: TokenValue.fromBlockchain(ts?.optimalPercentDepositedBdv ?? 0n, mainToken.decimals),
    selector: ts?.selector ?? "0x",
    stalkEarnedPerSeason: TokenValue.fromBlockchain(ts?.stalkEarnedPerSeason ?? 1n, SEEDS.decimals),
    stalkIssuedPerBdv: TokenValue.fromBlockchain(ts?.stalkIssuedPerBdv ?? 1n, STALK.decimals).mul(
      10 ** mainToken.decimals,
    ),
  };

  const rewards: SiloTokenData["rewards"] = {
    seeds: TokenValue.fromBlockchain(ts?.stalkEarnedPerSeason ?? 0n, SEEDS.decimals),
    stalk: TokenValue.fromBlockchain(ts?.stalkIssuedPerBdv ?? 0n, STALK.decimals).mul(10 ** mainToken.decimals),
  };

  return {
    totalDeposited: TokenValue.fromBlockchain(siloTokenData?.[0]?.result ?? 0n, token.decimals),
    tokenBDV: TokenValue.fromBlockchain(siloTokenData?.[1]?.result ?? 0n, mainToken.decimals),
    stemTip: TokenValue.fromBlockchain(siloTokenData?.[2]?.result ?? 0n, mainToken.decimals),
    depositedBDV: TokenValue.fromBlockchain(siloTokenData?.[3]?.result ?? 0n, mainToken.decimals),
    germinatingStem: TokenValue.fromBlockchain(siloTokenData?.[4]?.result ?? 0n, mainToken.decimals),
    tokenSettings,
    rewards,
    germinatingAmount: TokenValue.fromBlockchain(siloTokenData?.[6]?.result ?? 0n, token.decimals),
    germinatingBDV: TokenValue.fromBlockchain(siloTokenData?.[7]?.result ?? 0n, mainToken.decimals),
  };
};

export function useReadSiloTokensDataQuery(tokens: Token[]) {
  const protocolAddress = useProtocolAddress();

  const { mainToken } = useTokenData();

  const scopeKey = tokens.map((token) => token.address).join(",");
  const enabled = Boolean(tokens.length && tokens.every((token) => !!token.address));

  const selectSiloTokensData = useCallback(
    // unkown here because we expect the same data type for all tokens but it is [...Type, ...Type] not [Type, Type]
    (data: unknown[]) => {
      const chunks = chunk(data, CALLS_STRUCTS_PER_SILO_TOKEN) as SiloTokenDataResponse[];

      if (chunks.length !== tokens.length) {
        throw new Error("tokens and chunked data length mismatch");
      }

      return tokens.reduce<[token: Token, chunk: Omit<SiloTokenData, "yields">][]>((prev, token, i) => {
        const siloTokenData = makeSiloTokenData(chunks[i], token, mainToken);
        prev.push([token, siloTokenData]);
        return prev;
      }, []);
    },
    [tokens, mainToken],
  );

  return useReadContracts({
    contracts: tokens.flatMap((token) => {
      const shared = {
        address: protocolAddress,
        abi: beanstalkAbi,
        args: [token.address] as const,
      } as const;
      const tokenAddress = token.address;
      return [
        { ...shared, functionName: "getTotalDeposited" as const },
        {
          ...shared,
          functionName: "bdv" as const,
          args: [tokenAddress, BigInt(10 ** (token?.decimals ?? 1))] as const,
        },
        { ...shared, functionName: "stemTipForToken" as const },
        { ...shared, functionName: "getTotalDepositedBdv" as const },
        { ...shared, functionName: "getGerminatingStem" as const },
        { ...shared, functionName: "tokenSettings" as const },
        { ...shared, functionName: "getTotalGerminatingAmount" as const },
        { ...shared, functionName: "getTotalGerminatingBdv" as const },
      ];
    }),
    scopeKey,
    query: {
      ...settings.query,
      enabled,
      select: selectSiloTokensData,
    },
  });
}

export function useReadSiloTokenData(token: Token | undefined) {
  const chainId = useChainId();
  const protocolAddress = beanstalkAddress[chainId as keyof typeof beanstalkAddress];

  const BEAN = useTokenData().mainToken;

  const selectSiloTokenData = useCallback(
    (siloTokenData: SiloTokenDataResponse): Omit<SiloTokenData, "yields"> => {
      // should never happen
      if (!token) return {} as Omit<SiloTokenData, "yields">;

      return {
        totalDeposited: TokenValue.fromBlockchain(siloTokenData?.[0]?.result ?? 0n, token.decimals),
        tokenBDV: TokenValue.fromBlockchain(siloTokenData?.[1]?.result ?? 0n, BEAN.decimals),
        stemTip: TokenValue.fromBlockchain(siloTokenData?.[2]?.result ?? 0n, BEAN.decimals),
        depositedBDV: TokenValue.fromBlockchain(siloTokenData?.[3]?.result ?? 0n, BEAN.decimals),
        germinatingStem: TokenValue.fromBlockchain(siloTokenData?.[4]?.result ?? 0n, BEAN.decimals),
        tokenSettings: {
          deltaStalkEarnedPerSeason: TokenValue.fromBlockchain(
            siloTokenData?.[5]?.result?.deltaStalkEarnedPerSeason ?? 0n,
            STALK.decimals,
          ),
          encodeType: siloTokenData?.[5]?.result?.encodeType as string,
          gaugePointImplementation: {
            target: siloTokenData?.[5]?.result?.gaugePointImplementation.target as Address,
            selector: siloTokenData?.[5]?.result?.gaugePointImplementation.selector as string,
            encodeType: siloTokenData?.[5]?.result?.gaugePointImplementation.encodeType as string,
            data: siloTokenData?.[5]?.result?.gaugePointImplementation.data as string,
          },
          gaugePoints: siloTokenData?.[5]?.result?.gaugePoints as bigint,
          liquidityWeightImplementation: {
            target: siloTokenData?.[5]?.result?.liquidityWeightImplementation.target as Address,
            selector: siloTokenData?.[5]?.result?.liquidityWeightImplementation.selector as string,
            encodeType: siloTokenData?.[5]?.result?.liquidityWeightImplementation.encodeType as string,
            data: siloTokenData?.[5]?.result?.liquidityWeightImplementation.data as string,
          },
          milestoneSeason: siloTokenData?.[5]?.result?.milestoneSeason as number,
          milestoneStem: TokenValue.fromBlockchain(siloTokenData?.[5]?.result?.milestoneStem ?? 0n, BEAN.decimals),
          optimalPercentDepositedBdv: TokenValue.fromBlockchain(
            siloTokenData?.[5]?.result?.optimalPercentDepositedBdv ?? 0n,
            BEAN.decimals,
          ),
          selector: siloTokenData?.[5]?.result?.selector as string,
          stalkEarnedPerSeason: TokenValue.fromBlockchain(
            siloTokenData?.[5]?.result?.stalkEarnedPerSeason ?? 1n,
            SEEDS.decimals,
          ),
          stalkIssuedPerBdv: TokenValue.fromBlockchain(
            siloTokenData?.[5]?.result?.stalkIssuedPerBdv ?? 1n,
            STALK.decimals,
          ).mul(10 ** BEAN.decimals),
        },
        rewards: {
          seeds: TokenValue.fromBlockchain(siloTokenData?.[5]?.result?.stalkEarnedPerSeason ?? 0n, SEEDS.decimals),
          stalk: TokenValue.fromBlockchain(siloTokenData?.[5]?.result?.stalkIssuedPerBdv ?? 0n, STALK.decimals).mul(
            10 ** BEAN.decimals,
          ),
        },
        germinatingAmount: TokenValue.fromBlockchain(siloTokenData?.[6]?.result ?? 0n, token.decimals),
        germinatingBDV: TokenValue.fromBlockchain(siloTokenData?.[7]?.result ?? 0n, BEAN.decimals),
      } as Omit<SiloTokenData, "yields">;
    },
    [token, BEAN],
  );

  return useReadContracts({
    contracts: [
      {
        address: protocolAddress,
        abi: beanstalkAbi,
        functionName: "getTotalDeposited",
        args: [token?.address ?? ZERO_ADDRESS],
      },
      {
        address: protocolAddress,
        abi: beanstalkAbi,
        functionName: "bdv",
        args: [token?.address ?? ZERO_ADDRESS, BigInt(10 ** (token?.decimals ?? 1))],
      },
      {
        address: protocolAddress,
        abi: beanstalkAbi,
        functionName: "stemTipForToken",
        args: [token?.address ?? ZERO_ADDRESS],
      },
      {
        address: protocolAddress,
        abi: beanstalkAbi,
        functionName: "getTotalDepositedBdv",
        args: [token?.address ?? ZERO_ADDRESS],
      },
      {
        address: protocolAddress,
        abi: beanstalkAbi,
        functionName: "getGerminatingStem",
        args: [token?.address ?? ZERO_ADDRESS],
      },
      {
        address: protocolAddress,
        abi: beanstalkAbi,
        functionName: "tokenSettings",
        args: [token?.address ?? ZERO_ADDRESS],
      },
      {
        address: protocolAddress,
        abi: beanstalkAbi,
        functionName: "getTotalGerminatingAmount",
        args: [token?.address ?? ZERO_ADDRESS],
      },
      {
        address: protocolAddress,
        abi: beanstalkAbi,
        functionName: "getTotalGerminatingBdv",
        args: [token?.address ?? ZERO_ADDRESS],
      },
    ],
    scopeKey: token?.address,
    query: {
      ...settings.query,
      enabled: Boolean(token?.address),
      select: selectSiloTokenData,
    },
  });
}

export function useSiloData() {
  const chainId = useChainId();
  const protocolAddress = useProtocolAddress();
  const BEAN = useTokenData().mainToken;

  const selectComboSiloData = useCallback(
    (queryData: SiloDataResponse) => {
      return {
        totalStalk: TokenValue.fromBlockchain(queryData?.[0] ?? 0n, STALK.decimals),
        totalEarnedBeans: TokenValue.fromBlockchain(queryData?.[1] ?? 0n, BEAN.decimals),
        averageGrownStalkPerBdvPerSeason: TokenValue.fromBlockchain(queryData?.[2] ?? 0n, STALK.decimals),
      };
    },
    [BEAN],
  );

  const comboSiloData = useReadContracts({
    contracts: [
      {
        address: protocolAddress,
        abi: beanstalkAbi,
        functionName: "totalStalk",
        args: [],
      },
      {
        address: protocolAddress,
        abi: beanstalkAbi,
        functionName: "totalEarnedBeans",
        args: [],
      },
      {
        address: protocolAddress,
        abi: beanstalkAbi,
        functionName: "getAverageGrownStalkPerBdvPerSeason",
        args: [],
      },
    ],
    allowFailure: false,
    query: {
      ...settings.query,
      select: selectComboSiloData,
    },
  });

  const { data: yields } = useQuery({
    queryKey: ["siloYields", { chainId: chainId }],
    queryFn: async () => await request(subgraphs[chainId].beanstalk, SiloYieldsDocument),
    ...settings.query,
  });

  const { whitelistedTokens, deWhitelistedTokens, mayBeWhitelistedTokens } = useTokenData();

  const { data: whitelistedTokensData, ...whitelistedTokensDataQuery } = useReadSiloTokensDataQuery(whitelistedTokens);
  const { data: deWhitelistedTokensData, ...deWhitelistedTokensDataQuery } =
    useReadSiloTokensDataQuery(deWhitelistedTokens);

  const keys = useMemo(
    () => [whitelistedTokensDataQuery.queryKey, deWhitelistedTokensDataQuery.queryKey],
    [whitelistedTokensDataQuery.queryKey, deWhitelistedTokensDataQuery.queryKey],
  );

  const wlTokenDatas = useMemo(() => {
    const keys: QueryKey[] = [];
    const data: Map<Token, SiloTokenData> = new Map();

    const wl = [...(whitelistedTokensData ?? []), ...(deWhitelistedTokensData ?? [])];

    for (const [token, wlTokenData] of wl) {
      const index = yields?.siloYields[0]?.tokenAPYS?.findIndex((apys) => stringEq(apys?.token, token?.address));
      const yieldData = index ? yields?.siloYields[0]?.tokenAPYS?.[index] : undefined;

      data.set(token, {
        ...wlTokenData,
        yields: {
          beanAPY: yieldData ? Number(yieldData.beanAPY) : 0,
          stalkAPY: yieldData ? Number(yieldData.stalkAPY) : 0,
        },
      });
    }

    return {
      tokenData: data.size !== mayBeWhitelistedTokens.length ? new Map<Token, SiloTokenData>() : data,
      queryKeys: keys,
    };
  }, [whitelistedTokensData, deWhitelistedTokensData, mayBeWhitelistedTokens, yields]);

  const isLoading =
    comboSiloData.isLoading || whitelistedTokensDataQuery.isLoading || deWhitelistedTokensDataQuery.isLoading;

  return useMemo(() => {
    return {
      ...wlTokenDatas,
      queryKeys: keys,
      isLoading,
      totalStalk: comboSiloData.data?.totalStalk ?? TokenValue.ZERO,
      totalEarnedBeans: comboSiloData.data?.totalEarnedBeans ?? TokenValue.ZERO,
      averageGrownStalkPerBdvPerSeason: comboSiloData.data?.averageGrownStalkPerBdvPerSeason ?? TokenValue.ZERO,
    };
  }, [comboSiloData.data, wlTokenDatas, isLoading, keys]);
}

const GetTotalDepositedBDVABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
    ],
    name: "getTotalDepositedBdv",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

type SiloDataResponse = [totalStalk: bigint, totalEarnedBeans: bigint, averageGrownStalkPerBdvPerSeason: bigint];

type FailableChainResponse<T> = MulticallResponse<T, Error, true>;

type Repeat<T, N extends number, Result extends readonly T[] = []> = Result["length"] extends N
  ? Result
  : Repeat<T, N, readonly [...Result, T]>;

type SiloTokenTokenSettings = {
  selector: `0x${string}`;
  stalkEarnedPerSeason: number;
  stalkIssuedPerBdv: number;
  milestoneSeason: number;
  milestoneStem: bigint;
  encodeType: `0x${string}`;
  deltaStalkEarnedPerSeason: number;
  gaugePoints: bigint;
  optimalPercentDepositedBdv: bigint;
  gaugePointImplementation: {
    target: `0x${string}`;
    selector: `0x${string}`;
    encodeType: `0x${string}`;
    data: `0x${string}`;
  };
  liquidityWeightImplementation: {
    target: `0x${string}`;
    selector: `0x${string}`;
    encodeType: `0x${string}`;
    data: `0x${string}`;
  };
};

type SiloTokenDataResponse = [
  totalDeposited: FailableChainResponse<bigint>,
  bdv: FailableChainResponse<bigint>,
  stemTipForToken: FailableChainResponse<bigint>,
  totalDepositedBdv: FailableChainResponse<bigint>,
  germinatingStem: FailableChainResponse<bigint>,
  tokenSettings: FailableChainResponse<SiloTokenTokenSettings>,
  germinatingAmount: FailableChainResponse<bigint>,
  germinatingBdv: FailableChainResponse<bigint>,
];
