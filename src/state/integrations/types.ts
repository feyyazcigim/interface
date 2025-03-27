import { Token } from "@/utils/types";
import { Address } from "viem";
import { UseQueryReturnType } from "wagmi/query";

export interface ProtocolIntegrationStatsReturn<T> {
  integrationKey: ProtocolIntegration;
}

export type ProtocolIntegrationQueryReturnType<T = unknown> = UseQueryReturnType<T | undefined> &
  ProtocolIntegrationStatsReturn<T>;

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
