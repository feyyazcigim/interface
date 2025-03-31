import { MAIN_TOKEN, S_MAIN_TOKEN } from "@/constants/tokens";
import { Token } from "@/utils/types";
import { ChainLookup } from "@/utils/types.generic";
import { Address } from "viem";
import { base } from "viem/chains";

export interface SpectraCurvePool {
  maturity: number;
  pool: Address;
  lp: Address;
  pt: Address;
  yt: Address;
  underlying: Token;
  token: Token;
}


export const SPECTRA_CURVE_POOLS: ChainLookup<SpectraCurvePool> = {
  [base.id]: {
    maturity: 1758153782,
    pool: "0xd8E4662ffd6b202cF85e3783Fb7252ff0A423a72",
    lp: "0xba1F1eA8c269003aFe161aFAa0bd205E2c7F782a",
    pt: "0x42AF817725D8cda8E69540d72f35dBfB17345178",
    yt: "0xaF4f5bdF468861feF71Ed6f5ea0C01A75B62273d",
    underlying: MAIN_TOKEN[base.id],
    token: S_MAIN_TOKEN[base.id],
  },
} as const;

export const INTEGRATION_ENDPOINTS = {
  SPECTRA: import.meta.env.VITE_SPECTRA_ENDPOINT,
} as const;