
import { ChainLookup } from '@/utils/types.generic';
import { MAIN_TOKEN, S_MAIN_TOKEN } from "@/constants/tokens";
import { useChainConstant, useResolvedChainId } from "@/utils/chain";
import { Token } from "@/utils/types";
import { Address } from "viem";
import { base } from "viem/chains";
import { useReadContracts } from "wagmi";
import { TV } from '@/classes/TokenValue';
import { DateTime } from 'luxon';
import { useCallback, useEffect, useMemo } from 'react';
import { getNowRounded } from '../protocol/sun';
import { siloedPintoABI } from '@/constants/abi/siloedPintoABI';

export interface SpectraCurvePool {
  maturity: number;
  pool: Address;
  lp: Address;
  pt: Address;
  yt: Address;
  underlying: Token;
  token: Token;
};

const spectraCurvePool: ChainLookup<SpectraCurvePool> = {
  [base.id]: {
    maturity: 1758153782,
    pool: "0xd8E4662ffd6b202cF85e3783Fb7252ff0A423a72" satisfies Address,
    lp: "0xba1F1eA8c269003aFe161aFAa0bd205E2c7F782a" satisfies Address,
    pt: "0x42AF817725D8cda8E69540d72f35dBfB17345178" satisfies Address,
    yt: "0xaF4f5bdF468861feF71Ed6f5ea0C01A75B62273d" satisfies Address,
    underlying: MAIN_TOKEN[base.id],
    token: S_MAIN_TOKEN[base.id]
  }
} as const;

const HOURS_IN_YEAR = 365 * 24;

const daysInYear = 365;
const termInDays = 183;

export const useSpectraYieldBreakdown = () => {
  const siloWrappedToken = useChainConstant(S_MAIN_TOKEN);
  const chainId = useResolvedChainId();
  const pool = spectraCurvePool[chainId];
  const enabled = !!pool;

  const { data, ...query } = useReadContracts({
    contracts: [
      {
        address: pool.pool,
        abi,
        functionName: "get_dy",
        args: [0n, 1n, BigInt(10 ** siloWrappedToken.decimals)],
      },
      {
        address: pool.pool,
        abi,
        functionName: "price_oracle",
        args: [],
      },
      {
        address: pool.pool,
        abi,
        functionName: "virtual_price",
        args: [],
      },
      {
        address: siloWrappedToken.address,
        abi: siloedPintoABI,
        functionName: "previewRedeem",
        args: [BigInt(10 ** siloWrappedToken.decimals)],
      }
    ],
    allowFailure: false,
    query: {
      enabled,
      select: useCallback(([get_dy, price_oracle, virtual_price, previewRedeem]) => ({
        ibt2PTRate: TV.fromBigInt(get_dy, 18),
        priceOracle: TV.fromBigInt(price_oracle, 18),
        virtualPrice: TV.fromBigInt(virtual_price, 18),
        ibtToUnderlyingRate: TV.fromBigInt(previewRedeem, 6)
      }), [])
    }
  });

  const { ibt2PTRate, priceOracle, virtualPrice, ibtToUnderlyingRate } = data ?? {
    ibt2PTRate: TV.ONE,
    priceOracle: TV.ZERO,
    virtualPrice: TV.ONE,
    ibtToUnderlyingRate: TV.ONE
  };

  const underlyingToPTRate = ibt2PTRate.div(ibtToUnderlyingRate);

  const maturity = DateTime.fromSeconds(pool.maturity);

  const maturitySeconds = pool.maturity;

  const now = getNowRounded();

  const hoursToMaturity = (maturitySeconds - now.toSeconds()) / 60 / 60;

  const ptAPYRate = priceOracle.isZero ? TV.ONE : TV.ONE.div(priceOracle).reDecimal(18);

  const ptAPY = ptAPYRate.pow((183 * 24) / hoursToMaturity).sub(1);


  const termReturn = underlyingToPTRate.sub(1);
  const ptAPY1 = ((termReturn.add(1)).pow(daysInYear / termInDays)).sub(1);

  // Or if working with hourly data
  const hoursInTerm = termInDays * 24;
  const ptAPY2 = ptAPYRate.pow(daysInYear * 24 / hoursInTerm).sub(1);

  const apr = ((underlyingToPTRate.sub(1)).div(hoursToMaturity)).mul(24 * 365);
  const compoundingPeriodsPerYear = 24 * 365; // hourly compounding
  const aprPerPeriod = apr.div(compoundingPeriodsPerYear);
  const apy2 = ((aprPerPeriod.add(1)).pow(compoundingPeriodsPerYear)).sub(1);

  const ytLeverage = priceOracle.isZero ? TV.ONE : TV.ONE.div(TV.ONE.sub(priceOracle));

  const remainingRate = hoursToMaturity / (HOURS_IN_YEAR / 2);

  const impliedAPY = (TV.ONE.div(priceOracle.isZero ? TV.ONE : priceOracle)).pow(365 / hoursToMaturity / 24).sub(1);

  // const ptAPY = rate.pow()

  /**
   * price_oracle: 0.882783553118610379
   * 
   */

  // const ibt2PTRate = data?.priceOracle ? TV.ONE.div(TV.fromBigInt(data.priceOracle, 18)) : undefined;

  // const ibtToUnderlyingRate = ibtUnderlyingRate.data ? TV.ONE.div(ibtUnderlyingRate.data) : undefined;
  // const underlyingToPTRate = ibtToUnderlyingRate && ibt2PTRate ? ibtToUnderlyingRate.div(ibt2PTRate) : undefined;

  // hours_to_maturity = (spectra_pool.maturity - event_dt).total_seconds() / (60 * 60)

  // 1742707623679

  //  apr = ((underlying_to_pt_rate - 1) / hours_to_maturity) * 24 * 365

  // const apr = (underlyingToPTRate?.sub(1))?.div(hoursToMaturity);

  useEffect(() => {
    const datas = {
      remainingRate,
      yt: ytLeverage.mul(remainingRate),
      ptAPYRate,
      apy2,
      diff: maturitySeconds - now.toSeconds(),
      hoursToMaturity,
      ibtToUnderlyingRate,
      ptAPY,
      ibt2PTRate,
      apr,
      underlyingToPTRate,
      ytLeverage,
      ptAPY1,
      ptAPY2,
      ptAPYImplied: impliedAPY,
      // ...data,
      // ibtUnderlyingRate: ibtUnderlyingRate,
      // hoursToMaturity,
      // ibt2PTRate,
      // ibtToUnderlyingRate,
      // underlyingToPTRate,
      // apr
    }

    console.log(datas);
  }, [data, data]);



  return data;
}


/**
 * -------
 * 
 * 1 PINTO = 1 TY & 1 PT
 * 
 * Can mint 1 PINTO & 1PT for some fixed period of time
 * at redemption 1 PT -> 1 PINTO
 * 1 YT = yield of sPINTO
 *
 * 
 * 
 * 
 * -------
 * 
 * exchange rate
 * -> virtualPrice 10e18 sPINTO => 1000374163094591981 sPINTO PT
 * 
 * 
 * APY for holding PT
 * 
 * contract.price_oracle
 * 1e18 / 88278355_2398530886 => ~1.13 => exchange rate for 1.13 PT for 1 sPINTO
 * 
 * for 6 months long
 * 
 * what is the APY? 
 * 
 * => 1.13^2 = 1.2769 => 27.69% APY
 * 
 * How many days are left in the fixed term? 
 * 
 * rate^(1year/(time remaining in market)))
 * 
 * rate = 1/price_oracle
 * 
 * 
 * ____
 * 
 * POOLS
 * 
 * sPINTO<>PT pool
 * -> 1 PT => .88278355249174477 sPINTO
 * 
 * 
 * 
 * 
 * --------
 * 
 * yield leverage for buying YT = 1/(1-PRICEORACLE)
 * 1/(1-0.88278355249174477) = 8.5312259607 / PINTO
 * 
 * 
 * PT apy = rate^(1year/(time remaining in market)))
 * 
 * 
 */


const abi = [
  {
    stateMutability: "view",
    type: "function",
    name: "get_dy",
    inputs: [
      { name: "i", type: "uint256" },
      { name: "j", type: "uint256" },
      { name: "dx", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "calc_token_amount",
    inputs: [{ name: "amounts", type: "uint256[2]" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "calc_withdraw_one_coin",
    inputs: [
      { name: "token_amount", type: "uint256" },
      { name: "i", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  { stateMutability: "view", type: "function", name: "lp_price", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { stateMutability: "view", type: "function", name: "A", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { stateMutability: "view", type: "function", name: "gamma", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { stateMutability: "view", type: "function", name: "fee", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  {
    stateMutability: "view",
    type: "function",
    name: "get_virtual_price",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "price_oracle",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    name: "initialize",
    inputs: [
      { name: "A", type: "uint256" },
      { name: "gamma", type: "uint256" },
      { name: "mid_fee", type: "uint256" },
      { name: "out_fee", type: "uint256" },
      { name: "allowed_extra_profit", type: "uint256" },
      { name: "fee_gamma", type: "uint256" },
      { name: "adjustment_step", type: "uint256" },
      { name: "admin_fee", type: "uint256" },
      { name: "ma_half_time", type: "uint256" },
      { name: "initial_price", type: "uint256" },
      { name: "_token", type: "address" },
      { name: "_coins", type: "address[2]" },
      { name: "_precisions", type: "uint256" },
    ],
    outputs: [],
  },
  { stateMutability: "view", type: "function", name: "token", inputs: [], outputs: [{ name: "", type: "address" }] },
  {
    stateMutability: "view",
    type: "function",
    name: "coins",
    inputs: [{ name: "arg0", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "price_scale",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "last_prices",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "last_prices_timestamp",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "initial_A_gamma",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "future_A_gamma",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "initial_A_gamma_time",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "future_A_gamma_time",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "allowed_extra_profit",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "future_allowed_extra_profit",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "fee_gamma",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "future_fee_gamma",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "adjustment_step",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "future_adjustment_step",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "ma_half_time",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "future_ma_half_time",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  { stateMutability: "view", type: "function", name: "mid_fee", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { stateMutability: "view", type: "function", name: "out_fee", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  {
    stateMutability: "view",
    type: "function",
    name: "admin_fee",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "future_mid_fee",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "future_out_fee",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "future_admin_fee",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "balances",
    inputs: [{ name: "arg0", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  { stateMutability: "view", type: "function", name: "D", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { stateMutability: "view", type: "function", name: "factory", inputs: [], outputs: [{ name: "", type: "address" }] },
  {
    stateMutability: "view",
    type: "function",
    name: "xcp_profit",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "xcp_profit_a",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "virtual_price",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "admin_actions_deadline",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;
