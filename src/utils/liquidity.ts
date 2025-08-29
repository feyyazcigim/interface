import { TokenValue } from "@/classes/TokenValue";
import { Token } from "@/utils/types";

export interface LiquidityDistribution {
  eth: {
    percentage: number;
    usdValue: TokenValue;
  };
  circleConinbase: {
    percentage: number;
    usdValue: TokenValue;
    breakdown: {
      cbETH: { percentage: number; usdValue: TokenValue };
      cbBTC: { percentage: number; usdValue: TokenValue };
      usdc: { percentage: number; usdValue: TokenValue };
    };
  };
  wormhole: {
    percentage: number;
    usdValue: TokenValue;
  };
  total: TokenValue;
}

export enum CensorshipRisk {
  CENSORSHIP_RESISTANT = "censorship_resistant",
  CIRCLE_COINBASE = "circle_coinbase",
  WORMHOLE = "wormhole",
}

/**
 * Categorizes a token by its censorship risk
 */
export function getTokenCensorshipRisk(token: Token): CensorshipRisk {
  const symbol = token.symbol.toLowerCase();

  console.log(`🔍 Getting censorship risk for token:`, {
    originalSymbol: token.symbol,
    lowerSymbol: symbol,
    address: token.address,
  });

  if (symbol === "weth" || symbol === "eth") {
    console.log(`  ✅ Categorized as CENSORSHIP_RESISTANT`);
    return CensorshipRisk.CENSORSHIP_RESISTANT;
  }

  if (symbol === "cbeth" || symbol === "cbbtc" || symbol === "usdc") {
    console.log(`  ✅ Categorized as CIRCLE_COINBASE`);
    return CensorshipRisk.CIRCLE_COINBASE;
  }

  if (symbol === "wsol") {
    console.log(`  ✅ Categorized as WORMHOLE`);
    return CensorshipRisk.WORMHOLE;
  }

  // Default to censorship resistant for unknown tokens
  console.log(`  ⚠️ Unknown token, defaulting to CENSORSHIP_RESISTANT`);
  return CensorshipRisk.CENSORSHIP_RESISTANT;
}

/**
 * Calculates percentage distribution of liquidity across different censorship risk categories
 */
export function calculateLiquidityDistribution(tokenUsdValues: Map<Token, TokenValue>): LiquidityDistribution {
  let totalUsd = TokenValue.ZERO;
  let ethUsd = TokenValue.ZERO;
  let cbETHUsd = TokenValue.ZERO;
  let cbBTCUsd = TokenValue.ZERO;
  let usdcUsd = TokenValue.ZERO;
  let wsolUsd = TokenValue.ZERO;

  console.log("🧮 Calculating liquidity distribution for", tokenUsdValues.size, "tokens");

  // Sum up USD values by token category
  for (const [token, usdValue] of tokenUsdValues) {
    totalUsd = totalUsd.add(usdValue);

    const risk = getTokenCensorshipRisk(token);
    const symbol = token.symbol.toLowerCase();

    console.log(`  🏷️ Categorizing ${token.symbol}:`, {
      symbol,
      risk,
      usdValue: usdValue.toHuman(),
    });

    if (risk === CensorshipRisk.CENSORSHIP_RESISTANT) {
      ethUsd = ethUsd.add(usdValue);
      console.log(`    ✅ Added to ETH category: $${ethUsd.toHuman()}`);
    } else if (risk === CensorshipRisk.CIRCLE_COINBASE) {
      if (symbol === "cbeth") {
        cbETHUsd = cbETHUsd.add(usdValue);
        console.log(`    ✅ Added to cbETH category: $${cbETHUsd.toHuman()}`);
      } else if (symbol === "cbbtc") {
        cbBTCUsd = cbBTCUsd.add(usdValue);
        console.log(`    ✅ Added to cbBTC category: $${cbBTCUsd.toHuman()}`);
      } else if (symbol === "usdc") {
        usdcUsd = usdcUsd.add(usdValue);
        console.log(`    ✅ Added to USDC category: $${usdcUsd.toHuman()}`);
      }
    } else if (risk === CensorshipRisk.WORMHOLE) {
      wsolUsd = wsolUsd.add(usdValue);
      console.log(`    ✅ Added to WSOL category: $${wsolUsd.toHuman()}`);
    }
  }

  console.log("📊 Final category totals:", {
    total: totalUsd.toHuman(),
    eth: ethUsd.toHuman(),
    cbETH: cbETHUsd.toHuman(),
    cbBTC: cbBTCUsd.toHuman(),
    usdc: usdcUsd.toHuman(),
    wsol: wsolUsd.toHuman(),
  });

  // Calculate total Circle/Coinbase exposure
  const circleCoinbaseUsd = cbETHUsd.add(cbBTCUsd).add(usdcUsd);

  // Helper function to calculate percentage
  const calculatePercentage = (value: TokenValue, total: TokenValue): number => {
    if (total.eq(0)) return 0;
    const percentage = Number(value.div(total).mul(100).toHuman());
    return Number(percentage.toFixed(1));
  };

  return {
    eth: {
      percentage: calculatePercentage(ethUsd, totalUsd),
      usdValue: ethUsd,
    },
    circleConinbase: {
      percentage: calculatePercentage(circleCoinbaseUsd, totalUsd),
      usdValue: circleCoinbaseUsd,
      breakdown: {
        cbETH: {
          percentage: calculatePercentage(cbETHUsd, totalUsd),
          usdValue: cbETHUsd,
        },
        cbBTC: {
          percentage: calculatePercentage(cbBTCUsd, totalUsd),
          usdValue: cbBTCUsd,
        },
        usdc: {
          percentage: calculatePercentage(usdcUsd, totalUsd),
          usdValue: usdcUsd,
        },
      },
    },
    wormhole: {
      percentage: calculatePercentage(wsolUsd, totalUsd),
      usdValue: wsolUsd,
    },
    total: totalUsd,
  };
}

/**
 * Formats the percentage distribution text for the censorship resistance card
 */
export function formatLiquidityDistributionText(distribution: LiquidityDistribution): string {
  const { eth, circleConinbase, wormhole } = distribution;

  return `

The current distribution of underlying liquidity is:

- ${eth.percentage}% ETH ![ETH](src/assets/tokens/ETH.png), which is censorship resistant.
- ${circleConinbase.breakdown.cbETH.percentage}% cbETH ![cbETH](src/assets/tokens/cbETH.png), ${circleConinbase.breakdown.cbBTC.percentage}% cbBTC ![cbBTC](src/assets/tokens/cbBTC.png) and ${circleConinbase.breakdown.usdc.percentage}% USDC ![USDC](src/assets/tokens/USDC.png), all of which are censorable by Circle/Coinbase ![Coinbase](src/assets/misc/coinbase-logo.svg).
- ${wormhole.percentage}% WSOL ![WSOL](src/assets/tokens/WSOL.png), which is censorable by Wormhole ![Wormhole](src/assets/misc/portal-bridge-logo.svg).


Future upgrades to the Deposit whitelist will incentivize converting assets censorable by Circle/Coinbase into assets censorable by other entities, further decentralizing the risk of censorship within the protocol.

`;
}
