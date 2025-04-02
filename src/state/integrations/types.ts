import { Token } from "@/utils/types";
import { QueryKey } from "@tanstack/react-query";
import { Address } from "viem";

export type ProtocolIntegrationQueryReturnType<T = unknown> = {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  integrationKey: ProtocolIntegration;
  refetch: () => void;
  queryKeys: QueryKey[];
};

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
