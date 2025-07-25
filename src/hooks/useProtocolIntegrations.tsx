import creamFinanceLogo from "@/assets/misc/cream-finance-logo.png";
import spectraLogo from "@/assets/misc/spectra-token-logo.svg";
import { resolveChainId } from "@/utils/chain";
import { formatter } from "@/utils/format";
import { Token } from "@/utils/types";
import { ChainLookup } from "@/utils/types.generic";
import { base } from "viem/chains";
import { useChainId } from "wagmi";

export interface ProtocolIntegrationSummary {
  protocol: string;
  name: string;
  url: string;
  logoURI: string;
  ctaMessage: (token: Token, value?: number) => JSX.Element;
}

type IntegrationLookup = Record<string, ProtocolIntegrationSummary>;

const baseIntegrations: IntegrationLookup = {
  cream: {
    protocol: "CREAM",
    name: "CREAM Finance",
    url: "https://app.cream.finance/market-detail/base-meme-pool/0x98887ED12565cd9518f41A009d2EcE7c71ff271e",
    logoURI: creamFinanceLogo,
    ctaMessage: (token: Token) => {
      return <span>Borrow against {token.symbol} on CREAM Finance</span>;
    },
  },
  spectraPool: {
    protocol: "SPECTRA",
    name: "Spectra",
    url: "https://app.spectra.finance/pools/base:0xd8e4662ffd6b202cf85e3783fb7252ff0a423a72",
    logoURI: spectraLogo,
    ctaMessage: (token, value: number | undefined) => {
      const formattedApy = value ? `~${formatter.pct(value)}` : "-%";

      return (
        <span>
          Earn an extra <span className={formattedApy ? "text-pinto-green-4" : ""}>{formattedApy}</span> APY on your{" "}
          {token.symbol} with our Spectra pool
        </span>
      );
    },
  },
  spectraFixedRate: {
    protocol: "SPECTRA",
    name: "Spectra",
    url: "https://app.spectra.finance/fixed-rate/base:0xd8e4662ffd6b202cf85e3783fb7252ff0a423a72",
    logoURI: spectraLogo,
    ctaMessage: (token, value: number | undefined) => {
      const formattedApy = value ? `~${formatter.pct(value)}` : "-%";

      return (
        <span>
          Predictable {token.symbol} yield? Secure a{" "}
          <span className={formattedApy ? "text-pinto-green-4" : ""}>{formattedApy}</span> fixed APY on Spectra
        </span>
      );
    },
  },
  spectraTradeYield: {
    protocol: "SPECTRA",
    name: "Spectra",
    url: "https://app.spectra.finance/trade-yield/base:0xd8e4662ffd6b202cf85e3783fb7252ff0a423a72",
    logoURI: spectraLogo,
    ctaMessage: (token, value: number | undefined) => {
      const formattedLev = value ? `${formatter.twoDec(value)}x` : "Increase";

      return (
        <span>
          <span className={value ? "text-pinto-green-4" : ""}>{formattedLev}</span> your exposure to {token.symbol}{" "}
          native yield with Spectra's Yield Tokens
        </span>
      );
    },
  },
} as const;

const integrationURLs: ChainLookup<IntegrationLookup> = {
  [base.id]: baseIntegrations,
};

export const useProtocolIntegrationLinks = () => {
  const chainId = useChainId();
  return integrationURLs[resolveChainId(chainId)];
};
