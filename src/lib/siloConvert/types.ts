import { Address } from "viem";
import { Config } from "wagmi";

/**
 * shared context for all silo convert related operations
 */
export interface SiloConvertContext {
  diamond: Address;
  account: Address;
  wagmiConfig: Config;
  chainId: number;
}
