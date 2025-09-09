import { MinimumViableUseQueryResult, Token } from "@/utils/types";
import { Address } from "viem";

export type IProtocolIntegration = {
  integration: ProtocolIntegration;
};

export type ProtocolIntegrationQueryReturnType<T = unknown> = MinimumViableUseQueryResult<T> & IProtocolIntegration;

export type ProtocolIntegration = "CREAM" | "SPECTRA";

export interface SpectraCurvePool {
  maturity: number;
  pool: Address;
  lp: Address;
  pt: Address;
  yt: Address;
  underlying: Token;
  token: Token;
}

interface Price {
  underlying?: number;
  usd: number;
}

interface AprDetails {
  base: number;
  rewards?: Record<string, number>;
}

interface Apr {
  total: number | null;
  details: AprDetails;
}

interface YieldToken {
  address: string;
  decimals: number;
  chainId: number;
}

interface InterestBearingToken {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  chainId: number;
  rate: string;
  apr: Apr;
  price: Price;
  protocol?: string;
}

interface UnderlyingToken {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  chainId: number;
  price: {
    usd: number;
  };
}

interface LiquidityProviderToken {
  address: string;
  decimals: number;
  chainId: number;
  supply: string;
  price: Price;
}

interface Liquidity {
  underlying: number;
  usd: number;
}

interface BoostedReward {
  min: number;
  max: number;
}

interface LpApyDetails {
  fees: number;
  pt: number;
  ibt: number | null;
  boostedRewards?: Record<string, BoostedReward>;
}

interface LpApy {
  total: number;
  details: LpApyDetails;
  boostedTotal?: number;
}

interface Pool {
  address: string;
  chainId: number;
  lpt: LiquidityProviderToken;
  liquidity: Liquidity;
  ptApy: number;
  ytLeverage: number;
  impliedApy: number;
  lpApy: LpApy;
  ibtToPt: string;
  ptToIbt: string;
  spotPrice: string;
  ptPrice: Price;
  ytPrice: Price;
  ibtAmount: string;
  ptAmount: string;
  feeRate: string;
  outFee: string;
  midFee: string;
  lastPrices: string;
  type: string;
}

interface MaturityValue {
  underlying: number;
  usd: number;
}

interface Multiplier {
  amount: number;
  name: string;
}

export interface SpectraPoolData {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  chainId: number;
  rate: string;
  yt: YieldToken;
  ibt: InterestBearingToken;
  underlying: UnderlyingToken;
  maturity: number;
  createdAt: number;
  pools: Pool[];
  maturityValue: MaturityValue;
  multipliers?: Multiplier[];
}
