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
import { AdvancedChartBeanDocument } from "@/generated/gql/graphql";
import { formatNum, formatPct, formatUSD } from "@/utils/format";
import { SGQueryParameters } from "@/utils/graph";
import { Token } from "@/utils/types";
import { hexToRgba } from "@/utils/utils";
import { useMemo } from "react";
import useTokenData from "./useTokenData";

interface ChartSetupBase extends SGQueryParameters {
  name: string;
  tooltipTitle: string;
  tooltipHoverText: string | JSX.Element;
  shortDescription: string;
  icon: string;
  valueAxisType: string;
  valueFormatter: (value: any) => number;
  dataFormatter?: (value: any) => any;
  tickFormatter: (value: number) => string;
  shortTickFormatter: (value: number) => string;
}

export type ChartSetup = ChartSetupBase & {
  type: string;
  index: number;
};

// The length of chartColors determines how many charts you can plot at the same time
export const chartColors = [
  {
    lineColor: "#246645", // Pinto Green (pinto-green-3)
    topColor: hexToRgba("#246645", 0.8),
    bottomColor: hexToRgba("#246645", 0.2),
  },
  {
    lineColor: "#1E6091", // Deep Blue
    topColor: hexToRgba("#1E6091", 0.8),
    bottomColor: hexToRgba("#1E6091", 0.2),
  },
  {
    lineColor: "#D62828", // Vibrant Red
    topColor: hexToRgba("#D62828", 0.8),
    bottomColor: hexToRgba("#D62828", 0.2),
  },
  {
    lineColor: "#8338EC", // Bright Purple
    topColor: hexToRgba("#8338EC", 0.8),
    bottomColor: hexToRgba("#8338EC", 0.2),
  },
  {
    lineColor: "#FF9F1C", // Golden Orange
    topColor: hexToRgba("#FF9F1C", 0.8),
    bottomColor: hexToRgba("#FF9F1C", 0.2),
  },
  {
    lineColor: "#00BCD4", // Light Blue / Cyan
    topColor: hexToRgba("#00BCD4", 0.8),
    bottomColor: hexToRgba("#00BCD4", 0.2),
  },
];

// Function to generate Pinto charts
const createPintoCharts = (mainToken: Token): ChartSetupBase[] => [
  {
    id: "priceInstantPINTO",
    name: "Pinto Price",
    tooltipTitle: "Current Pinto Price",
    tooltipHoverText: "The Current Price of Pinto in USD",
    shortDescription: "The USD price of 1 Pinto.",
    icon: mainToken.logoURI,
    timeScaleKey: "timestamp",
    priceScaleKey: "instPrice",
    context: "pinto",
    document: AdvancedChartBeanDocument,
    documentEntity: "seasons",
    valueAxisType: "PINTO_price",
    valueFormatter: (v: TokenValue) => v.toNumber(),
    tickFormatter: (v: number) => formatUSD(v, { decimals: 4 }),
    shortTickFormatter: (v: number) => formatUSD(v, { decimals: 4 }),
  },
  {
    id: "supplyPINTO",
    name: "Supply",
    tooltipTitle: "Pinto Supply",
    tooltipHoverText: "The total Pinto supply at the beginning of every Season.",
    shortDescription: "The total Pinto supply.",
    icon: mainToken.logoURI,
    timeScaleKey: "timestamp",
    priceScaleKey: "supply",
    context: "pinto",
    document: AdvancedChartBeanDocument,
    documentEntity: "seasons",
    valueAxisType: "PINTO_amount",
    valueFormatter: (v: TokenValue) => v.toNumber(),
    tickFormatter: (v: number) => TokenValue.fromHuman(v, 2).toHuman("short"),
    shortTickFormatter: (v: number) => TokenValue.fromHuman(v, 2).toHuman("short"),
  },
  {
    id: "marketCap",
    name: "Market Cap",
    tooltipTitle: "Market Cap",
    tooltipHoverText: "The USD value of the Pinto supply at the beginning of every Season.",
    shortDescription: "The USD value of the Pinto supply.",
    icon: mainToken.logoURI,
    timeScaleKey: "timestamp",
    priceScaleKey: "marketCap",
    context: "pinto",
    document: AdvancedChartBeanDocument,
    documentEntity: "seasons",
    valueAxisType: "marketCap",
    valueFormatter: (v: number) => v,
    tickFormatter: (v: number) => formatUSD(v, { decimals: 2 }),
    shortTickFormatter: (v: number) => formatUSD(v, { decimals: 2 }),
  },
  {
    id: "priceTargetCrosses",
    name: "Price Target Crosses",
    tooltipTitle: "Price Target Crosses",
    tooltipHoverText: "The total number of times Pinto has crossed its price target at the beginning of every Season.",
    shortDescription: "The total number of times Pinto has crossed its price target.",
    icon: mainToken.logoURI,
    timeScaleKey: "timestamp",
    priceScaleKey: "crosses",
    context: "pinto",
    document: AdvancedChartBeanDocument,
    documentEntity: "seasons",
    valueAxisType: "priceTargetCrosses",
    valueFormatter: (v: number) => v,
    tickFormatter: (v: number) => v.toFixed(0),
    shortTickFormatter: (v: number) => v.toFixed(0),
  },
  {
    id: "priceTwaPINTO",
    name: "TWA Pinto Price",
    tooltipTitle: "TWA Pinto Price",
    tooltipHoverText:
      "The cumulative liquidity and time weighted average USD price of 1 Pinto at the beginning of every Season.",
    shortDescription: "The cumulative liquidity and time weighted average USD price of 1 Pinto.",
    icon: mainToken.logoURI,
    timeScaleKey: "timestamp",
    priceScaleKey: "twaPrice",
    context: "pinto",
    document: AdvancedChartBeanDocument,
    documentEntity: "seasons",
    valueAxisType: "PINTO_price",
    valueFormatter: (v: TokenValue) => v.toNumber(),
    tickFormatter: (v: number) => formatUSD(v, { decimals: 4 }),
    shortTickFormatter: (v: number) => formatUSD(v, { decimals: 4 }),
  },
  {
    id: "instDeltaB",
    name: "Instantaneous ΔP",
    tooltipTitle: "Cumulative Instantaneous ΔP",
    tooltipHoverText:
      "The cumulative instantaneous shortage of Pinto in liquidity pools on the Minting Whitelist at the beginning of every Season.",
    shortDescription: "The cumulative instantaneous shortage of Pinto in liquidity pools on the Minting Whitelist.",
    icon: mainToken.logoURI,
    timeScaleKey: "timestamp",
    priceScaleKey: "instDeltaB",
    context: "pinto",
    document: AdvancedChartBeanDocument,
    documentEntity: "seasons",
    valueAxisType: "deltaB",
    valueFormatter: (v: TokenValue) => v.toNumber(),
    tickFormatter: (v: number) => formatNum(v, { allowZero: true, maxDecimals: 0, showPositiveSign: true }),
    shortTickFormatter: (v: number) => formatNum(v, { allowZero: true, maxDecimals: 0, showPositiveSign: true }),
  },
  {
    id: "twaDeltaB",
    name: "TWA ΔP",
    tooltipTitle: "Cumulative TWA ΔP",
    tooltipHoverText:
      "The cumulative liquidity and time weighted average shortage of Pinto in liquidity pools on the Minting Whitelist at the beginning of every Season.",
    shortDescription: "The time weighted average shortage of Pinto in liquidity pools on the Minting Whitelist.",
    icon: mainToken.logoURI,
    timeScaleKey: "timestamp",
    priceScaleKey: "twaDeltaB",
    context: "pinto",
    document: AdvancedChartBeanDocument,
    documentEntity: "seasons",
    valueAxisType: "deltaB",
    valueFormatter: (v: TokenValue) => v.toNumber(),
    tickFormatter: (v: number) =>
      formatNum(v, { allowZero: true, maxDecimals: 4, minDecimals: 4, showPositiveSign: true }),
    shortTickFormatter: (v: number) =>
      formatNum(v, { allowZero: true, maxDecimals: 4, minDecimals: 4, showPositiveSign: true }),
  },
  {
    id: "l2sr",
    name: "Liquidity to Supply Ratio",
    tooltipTitle: "Liquidity to Supply Ratio",
    tooltipHoverText:
      "The ratio of Pinto in Liquidity Pools on the Minting Whitelist per outstanding Pinto, displayed as a percentage.",
    shortDescription:
      "The ratio of Pinto in Liquidity Pools on the Minting Whitelist per outstanding Pinto, displayed as a percentage.",
    icon: mainToken.logoURI,
    timeScaleKey: "timestamp",
    priceScaleKey: "l2sr",
    context: "pinto",
    document: AdvancedChartBeanDocument,
    documentEntity: "seasons",
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
    name: "Max Temperature",
    tooltipTitle: "Max Temperature",
    tooltipHoverText: "The maximum interest rate for Sowing Pinto every Season.",
    shortDescription: "The maximum interest rate for Sowing Pinto every Season.",
    icon: podIcon,
    timeScaleKey: "timestamp",
    priceScaleKey: "temperature",
    context: "pinto",
    document: AdvancedChartBeanDocument,
    documentEntity: "seasons",
    valueAxisType: "maxTemp",
    valueFormatter: (v: number) => v,
    tickFormatter: (v: number) => formatPct(v, { minDecimals: 2, maxDecimals: 2 }),
    shortTickFormatter: (v: number) => formatPct(v, { minDecimals: 2, maxDecimals: 2 }),
  },
  {
    id: "podRate",
    name: "Pod Rate",
    tooltipTitle: "Pod Rate",
    tooltipHoverText:
      "The ratio of Unharvestable Pods per Pinto, displayed as a percentage, at the beginning of every Season. The Pod Rate is used by Pinto as a proxy for its health.",
    shortDescription: "The ratio of Unharvestable Pods per Pinto, displayed as a percentage.",
    icon: podIcon,
    timeScaleKey: "timestamp",
    priceScaleKey: "podRate",
    context: "pinto",
    document: AdvancedChartBeanDocument,
    documentEntity: "seasons",
    valueAxisType: "podRate",
    valueFormatter: (v: TokenValue) => v.toNumber(),
    tickFormatter: (v: number) => formatPct(v, { minDecimals: 2, maxDecimals: 2 }),
    shortTickFormatter: (v: number) => formatPct(v, { minDecimals: 2, maxDecimals: 2 }),
  },
  {
    id: "pintoSown",
    name: "Pinto Sown",
    tooltipTitle: "Pinto Sown",
    tooltipHoverText: "The total number of Pinto Sown at the beginning of every Season.",
    shortDescription: "The total number of Pinto Sown.",
    icon: mainToken.logoURI,
    timeScaleKey: "timestamp",
    priceScaleKey: "sownBeans",
    context: "pinto",
    document: AdvancedChartBeanDocument,
    documentEntity: "seasons",
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
    // Start with an empty output array only when dependencies change
    const output: ChartSetup[] = [];
    let dataIndex = 0;

    // Add Pinto charts
    const pintoCharts = createPintoCharts(mainToken);
    pintoCharts.forEach((chartData) => {
      output.push({
        ...chartData,
        type: "Pinto",
        index: dataIndex++,
      });
    });

    // LP charts processing (if needed)
    if (lpTokens.length > 0) {
      // Add LP charts processing here when uncommented
    }

    // Deposit & APY charts processing (if needed)
    if (whitelistedTokens.length > 0) {
      // Add deposit & APY charts processing here when uncommented
    }

    // Add Field charts
    const fieldCharts = createFieldCharts(mainToken);
    fieldCharts.forEach((chartData) => {
      const chartDataToAdd = {
        ...chartData,
        type: "Field",
        index: dataIndex,
      };
      output.push(chartDataToAdd);
      dataIndex += 1;
    });

    return output;
  }, [mainToken, lpTokens, whitelistedTokens]); // Include all dependencies

  // Return a stable reference when dependencies don't change
  return { data, chartColors };
}
