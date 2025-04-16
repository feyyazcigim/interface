/*
    whitelistedTokens.forEach((token) => {
      const depositedChart: ChartSetupBase = {
        id: `${token.symbol}-Deposited`,
        name: `Deposited ${token.symbol}`,
        tooltipTitle: `Total Deposited ${token.symbol}`,
        tooltipHoverText: `The total number of Deposited ${token.name} at the beginning of every Season.`,
        shortDescription: `The total number of Deposited ${token.name}.`,
        icon: token.logoURI,
        timeScaleKey: "createdAt",
        priceScaleKey: "depositedAmount",
        valueAxisType: "depositedAmount",
        documentEntity: "seasons",
        valueFormatter: (value: any) => Number(formatUnits(value, token.decimals)),
        tickFormatter: (v: number) => formatNum(v, { minDecimals: 4, maxDecimals: 4 }),
        shortTickFormatter: (v: number) => formatNum(v, { minDecimals: 4, maxDecimals: 4 }),
      };
      const apyChart: ChartSetupBase = {
        id: `${token.symbol}-APY`,
        name: `${token.symbol} 30D vAPY`,
        tooltipTitle: `${token.symbol} 30D vAPY`,
        tooltipHoverText: `The Variable Pinto APY uses a moving average of Pinto earned by Stalkholders during recent Seasons to estimate a future rate of return, accounting for Stalk growth.`,
        shortDescription:
          "Average Pinto earned by Stalkholders during recent Seasons estimate a future rate of return.",
        icon: token.logoURI,
        timeScaleKey: "createdAt",
        priceScaleKey: "beanAPY",
        valueAxisType: "apy",
        documentEntity: "seasons",
        valueFormatter: (v: string) => Number(v) * 100,
        tickFormatter: (v: number) => formatPct(v),
        shortTickFormatter: (v: number) => formatPct(v),
      };

      depositCharts.push(depositedChart);
      apyCharts.push(apyChart);
    });
    */

/*
    lpTokens.forEach((token) => {
      const lpChart: ChartSetupBase = {
        id: `${token.symbol}-Liquidity`,
        name: `${token.symbol} Liquidity`,
        tooltipTitle: `${token.symbol} Liquidity`,
        tooltipHoverText: `The total USD value of ${token.symbol} in liquidity pools on the Minting Whitelist.`,
        shortDescription: `${token.symbol} Liquidity.`,
        icon: token.logoURI,
        timeScaleKey: "updatedAt",
        priceScaleKey: "liquidityUSD",
        documentEntity: "seasons",
        valueAxisType: "usdLiquidity",
        valueFormatter: (v: string) => Number(v),
        tickFormatter: (v: number) => formatNum(v, { minDecimals: 4, maxDecimals: 4 }),
        shortTickFormatter: (v: number) => formatNum(v, { minDecimals: 4, maxDecimals: 4 }),
      };

      lpCharts.push(lpChart);
    });
    */

import podIcon from "@/assets/protocol/Pod.png";
import { TokenValue } from "@/classes/TokenValue";
import { formatNum, formatPct, formatUSD } from "@/utils/format";
import { Token } from "@/utils/types";
import { useMemo } from "react";
import useTokenData from "./useTokenData";

interface ChartSetupBase {
  /**
   * Chart ID
   */
  id: string;
  /**
   * Chart type, used to categorize charts in the Select panel
   */
  type: "Pinto" | "Field" | "Silo";
  /**
   * Name of variable to be used to fill the time scale. Usually "timestamp"
   */
  timeScaleKey: string;
  /**
   * Name of variable to be used to fill the price scale.
   */
  priceScaleKey: string;
  /**
   * Short name for this chart
   */
  name: string;
  /**
   * Short description for this chart, used in the Select panel
   */
  shortDescription: string;
  /**
   * Longer name for this chart, used on tooltips (not implemented yet)
   */
  tooltipTitle: string;
  /**
   * Longer description for this chart, used on tooltips (not implemented yet)
   */
  tooltipHoverText: string | JSX.Element;
  /**
   * Icon for this chart, shown in the Select panel
   */
  icon: string;
  /**
   * In Lightweight Charts, each price scale can have its own id tag, allowing
   * for multiple data sets to use the same price scale.
   *
   * For example, it makes sense for Instant DeltaB and TWA DeltaB to share the same price scale,
   * therefore they have the same valueAxisType.
   */
  valueAxisType: string;
  /**
   * Formats the value into a number for Lightweight Charts, this is the number
   * it uses internally to plot the line chart
   */
  valueFormatter: (value: any) => number;
  /**
   * Formats the number into a string. This is what is shown above the chart,
   * so this is where we want to do things like adding dollar signs and the like
   */
  tickFormatter: (value: number) => string;
  /**
   * Formats the number into a string. This is what is shown on the price scale,
   * so it's a good idea to make this a short string (ie: 30M instead of 30,000,000)
   * for aestethic purposes
   */
  shortTickFormatter: (value: number) => string;
}

export type ChartSetup = ChartSetupBase & {
  index: number;
};

type ChartColors = Array<{
  lineColor: string;
}>;

// The length of chartColors determines how many charts you can plot at the same time
export const chartColors: ChartColors = [
  {
    lineColor: "#246645", // Pinto Green (pinto-green-3)
  },
  {
    lineColor: "#1E6091", // Deep Blue
  },
  {
    lineColor: "#D62828", // Vibrant Red
  },
  {
    lineColor: "#8338EC", // Bright Purple
  },
  {
    lineColor: "#FF9F1C", // Golden Orange
  },
  {
    lineColor: "#00BCD4", // Light Blue / Cyan
  },
];

// Function to generate Pinto charts
const createPintoCharts = (mainToken: Token): ChartSetupBase[] => [
  {
    id: "priceInstantPINTO",
    type: "Pinto",
    name: "Pinto Price",
    tooltipTitle: "Current Pinto Price",
    tooltipHoverText: "The Current Price of Pinto in USD",
    shortDescription: "The USD price of 1 Pinto.",
    icon: mainToken.logoURI,
    timeScaleKey: "timestamp",
    priceScaleKey: "instPrice",
    valueAxisType: "PINTO_price",
    valueFormatter: (v: TokenValue) => v.toNumber(),
    tickFormatter: (v: number) => formatUSD(v, { decimals: 4 }),
    shortTickFormatter: (v: number) => formatUSD(v, { decimals: 4 }),
  },
  {
    id: "supplyPINTO",
    type: "Pinto",
    name: "Supply",
    tooltipTitle: "Pinto Supply",
    tooltipHoverText: "The total Pinto supply at the beginning of every Season.",
    shortDescription: "The total Pinto supply.",
    icon: mainToken.logoURI,
    timeScaleKey: "timestamp",
    priceScaleKey: "supply",
    valueAxisType: "PINTO_amount",
    valueFormatter: (v: TokenValue) => v.toNumber(),
    tickFormatter: (v: number) => TokenValue.fromHuman(v, 2).toHuman("short"),
    shortTickFormatter: (v: number) => TokenValue.fromHuman(v, 2).toHuman("short"),
  },
  {
    id: "marketCap",
    type: "Pinto",
    name: "Market Cap",
    tooltipTitle: "Market Cap",
    tooltipHoverText: "The USD value of the Pinto supply at the beginning of every Season.",
    shortDescription: "The USD value of the Pinto supply.",
    icon: mainToken.logoURI,
    timeScaleKey: "timestamp",
    priceScaleKey: "marketCap",
    valueAxisType: "marketCap",
    valueFormatter: (v: number) => v,
    tickFormatter: (v: number) => formatUSD(v, { decimals: 2 }),
    shortTickFormatter: (v: number) => TokenValue.fromHuman(v, 2).toHuman("short"),
  },
  {
    id: "priceTargetCrosses",
    type: "Pinto",
    name: "Price Target Crosses",
    tooltipTitle: "Price Target Crosses",
    tooltipHoverText: "The total number of times Pinto has crossed its price target at the beginning of every Season.",
    shortDescription: "The total number of times Pinto has crossed its price target.",
    icon: mainToken.logoURI,
    timeScaleKey: "timestamp",
    priceScaleKey: "crosses",
    valueAxisType: "priceTargetCrosses",
    valueFormatter: (v: number) => v,
    tickFormatter: (v: number) => v.toFixed(0),
    shortTickFormatter: (v: number) => v.toFixed(0),
  },
  {
    id: "priceTwaPINTO",
    type: "Pinto",
    name: "TWA Pinto Price",
    tooltipTitle: "TWA Pinto Price",
    tooltipHoverText:
      "The cumulative liquidity and time weighted average USD price of 1 Pinto at the beginning of every Season.",
    shortDescription: "The cumulative liquidity and time weighted average USD price of 1 Pinto.",
    icon: mainToken.logoURI,
    timeScaleKey: "timestamp",
    priceScaleKey: "twaPrice",
    valueAxisType: "PINTO_price",
    valueFormatter: (v: TokenValue) => v.toNumber(),
    tickFormatter: (v: number) => formatUSD(v, { decimals: 4 }),
    shortTickFormatter: (v: number) => formatUSD(v, { decimals: 4 }),
  },
  {
    id: "instDeltaB",
    type: "Pinto",
    name: "Instantaneous ΔP",
    tooltipTitle: "Cumulative Instantaneous ΔP",
    tooltipHoverText:
      "The cumulative instantaneous shortage of Pinto in liquidity pools on the Minting Whitelist at the beginning of every Season.",
    shortDescription: "The cumulative instantaneous shortage of Pinto in liquidity pools on the Minting Whitelist.",
    icon: mainToken.logoURI,
    timeScaleKey: "timestamp",
    priceScaleKey: "instDeltaB",
    valueAxisType: "deltaB",
    valueFormatter: (v: TokenValue) => v.toNumber(),
    tickFormatter: (v: number) => formatNum(v, { allowZero: true, maxDecimals: 0, showPositiveSign: true }),
    shortTickFormatter: (v: number) => formatNum(v, { allowZero: true, maxDecimals: 0, showPositiveSign: true }),
  },
  {
    id: "twaDeltaB",
    type: "Pinto",
    name: "TWA ΔP",
    tooltipTitle: "Cumulative TWA ΔP",
    tooltipHoverText:
      "The cumulative liquidity and time weighted average shortage of Pinto in liquidity pools on the Minting Whitelist at the beginning of every Season.",
    shortDescription: "The time weighted average shortage of Pinto in liquidity pools on the Minting Whitelist.",
    icon: mainToken.logoURI,
    timeScaleKey: "timestamp",
    priceScaleKey: "twaDeltaB",
    valueAxisType: "deltaB",
    valueFormatter: (v: TokenValue) => v.toNumber(),
    tickFormatter: (v: number) =>
      formatNum(v, { allowZero: true, maxDecimals: 4, minDecimals: 4, showPositiveSign: true }),
    shortTickFormatter: (v: number) =>
      formatNum(v, { allowZero: true, maxDecimals: 4, minDecimals: 4, showPositiveSign: true }),
  },
  {
    id: "l2sr",
    type: "Pinto",
    name: "Liquidity to Supply Ratio",
    tooltipTitle: "Liquidity to Supply Ratio",
    tooltipHoverText:
      "The ratio of Pinto in Liquidity Pools on the Minting Whitelist per outstanding Pinto, displayed as a percentage.",
    shortDescription:
      "The ratio of Pinto in Liquidity Pools on the Minting Whitelist per outstanding Pinto, displayed as a percentage.",
    icon: mainToken.logoURI,
    timeScaleKey: "timestamp",
    priceScaleKey: "l2sr",
    valueAxisType: "L2SR",
    valueFormatter: (v: TokenValue) => v.toNumber(),
    tickFormatter: (v: number) => formatPct(v, { minDecimals: 2, maxDecimals: 2 }),
    shortTickFormatter: (v: number) => formatPct(v, { minDecimals: 2, maxDecimals: 2 }),
  },
];

// Function to generate Field charts
const createFieldCharts = (mainToken: Token): ChartSetupBase[] => [
  {
    id: "pintoMaxTemperature",
    type: "Field",
    name: "Max Temperature",
    tooltipTitle: "Max Temperature",
    tooltipHoverText: "The maximum interest rate for Sowing Pinto every Season.",
    shortDescription: "The maximum interest rate for Sowing Pinto every Season.",
    icon: podIcon,
    timeScaleKey: "timestamp",
    priceScaleKey: "temperature",
    valueAxisType: "maxTemp",
    valueFormatter: (v: number) => v,
    tickFormatter: (v: number) => formatPct(v, { minDecimals: 2, maxDecimals: 2 }),
    shortTickFormatter: (v: number) => formatPct(v, { minDecimals: 2, maxDecimals: 2 }),
  },
  {
    id: "podRate",
    type: "Field",
    name: "Pod Rate",
    tooltipTitle: "Pod Rate",
    tooltipHoverText:
      "The ratio of Unharvestable Pods per Pinto, displayed as a percentage, at the beginning of every Season. The Pod Rate is used by Pinto as a proxy for its health.",
    shortDescription: "The ratio of Unharvestable Pods per Pinto, displayed as a percentage.",
    icon: podIcon,
    timeScaleKey: "timestamp",
    priceScaleKey: "podRate",
    valueAxisType: "podRate",
    valueFormatter: (v: TokenValue) => v.toNumber(),
    tickFormatter: (v: number) => formatPct(v, { minDecimals: 2, maxDecimals: 2 }),
    shortTickFormatter: (v: number) => formatPct(v, { minDecimals: 2, maxDecimals: 2 }),
  },
  {
    id: "pintoSown",
    type: "Field",
    name: "Pinto Sown",
    tooltipTitle: "Pinto Sown",
    tooltipHoverText: "The total number of Pinto Sown at the beginning of every Season.",
    shortDescription: "The total number of Pinto Sown.",
    icon: mainToken.logoURI,
    timeScaleKey: "timestamp",
    priceScaleKey: "sownBeans",
    valueAxisType: "PINTO_amount",
    valueFormatter: (v: TokenValue) => v.toNumber(),
    tickFormatter: (v: number) => TokenValue.fromHuman(v, 2).toHuman("short"),
    shortTickFormatter: (v: number) => TokenValue.fromHuman(v, 2).toHuman("short"),
  },
];

export function useChartSetupData() {
  const { mainToken, lpTokens, whitelistedTokens } = useTokenData();

  // Memoize data separately with proper dependencies
  const data = useMemo(() => {
    // Get Pinto charts
    const pintoCharts = createPintoCharts(mainToken);

    // Get Field charts
    const fieldCharts = createFieldCharts(mainToken);

    // LP charts
    if (lpTokens.length > 0) {
      // Add LP charts here
    }

    // Deposit & APY charts
    if (whitelistedTokens.length > 0) {
      // Add deposit & APY charts here
    }

    const output: ChartSetup[] = [...pintoCharts, ...fieldCharts].map((setupData, index) => ({
      ...setupData,
      index: index,
    }));

    return output;
  }, [mainToken, lpTokens, whitelistedTokens]); // Include all dependencies

  // Return a stable reference when dependencies don't change
  return { data, chartColors };
}
