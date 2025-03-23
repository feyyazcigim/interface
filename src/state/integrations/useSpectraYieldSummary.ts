import { ChainLookup } from '@/utils/types.generic';
import { MAIN_TOKEN, S_MAIN_TOKEN } from "@/constants/tokens";
import { useChainConstant, useResolvedChainId } from "@/utils/chain";
import { Token } from "@/utils/types";
import { Address } from "viem";
import { base } from "viem/chains";
import { useReadContract } from "wagmi";
import { useSiloWrappedTokenExchangeRateQuery } from '../useSiloWrappedTokenData';

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

export const useSpectraYieldBreakdown = () => {
  const siloWrappedToken = useChainConstant(S_MAIN_TOKEN);
  const rqteQ = useSiloWrappedTokenExchangeRateQuery();

  const chainId = useResolvedChainId();
  const pool = spectraCurvePool[chainId];

  const enabled = !!pool;

  const rateQuery = useReadContract({
    address: pool.pool,
    abi,
    functionName: "get_dy",
    args: [0n, 1n, BigInt(10 ** siloWrappedToken.decimals)],
    query: {
      enabled
    }
  });

  const priceOracleQuery = useReadContract({
    address: pool.pool,
    abi,
    functionName: "price_oracle",
    args: [],
    query: {
      enabled
    }
  });

  const ibt2PTRate = priceOracleQuery.data ? BigInt(1e18) / priceOracleQuery.data : undefined;

  const data = {
    ibt2PTRate,
    priceOracleQuery: priceOracleQuery.data,
    rateQuery: rateQuery.data
  }

  console.log(data);

  return data;
}

// 88278355 3118610363


/**
 * 
 * Add LP
 * -> lper APY
 * 
 * PT
 * -> 
 * 
 * 
 * YT
 * -> 
 * 
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
 * 
 */


const abi = [
  {
    name: "TokenExchange",
    inputs: [
      { name: "buyer", type: "address", indexed: true },
      { name: "sold_id", type: "uint256", indexed: false },
      { name: "tokens_sold", type: "uint256", indexed: false },
      { name: "bought_id", type: "uint256", indexed: false },
      { name: "tokens_bought", type: "uint256", indexed: false },
    ],
    anonymous: false,
    type: "event",
  },
  {
    name: "AddLiquidity",
    inputs: [
      { name: "provider", type: "address", indexed: true },
      { name: "token_amounts", type: "uint256[2]", indexed: false },
      { name: "fee", type: "uint256", indexed: false },
      { name: "token_supply", type: "uint256", indexed: false },
    ],
    anonymous: false,
    type: "event",
  },
  {
    name: "RemoveLiquidity",
    inputs: [
      { name: "provider", type: "address", indexed: true },
      { name: "token_amounts", type: "uint256[2]", indexed: false },
      { name: "token_supply", type: "uint256", indexed: false },
    ],
    anonymous: false,
    type: "event",
  },
  {
    name: "RemoveLiquidityOne",
    inputs: [
      { name: "provider", type: "address", indexed: true },
      { name: "token_amount", type: "uint256", indexed: false },
      { name: "coin_index", type: "uint256", indexed: false },
      { name: "coin_amount", type: "uint256", indexed: false },
    ],
    anonymous: false,
    type: "event",
  },
  {
    name: "CommitNewParameters",
    inputs: [
      { name: "deadline", type: "uint256", indexed: true },
      { name: "admin_fee", type: "uint256", indexed: false },
      { name: "mid_fee", type: "uint256", indexed: false },
      { name: "out_fee", type: "uint256", indexed: false },
      { name: "fee_gamma", type: "uint256", indexed: false },
      { name: "allowed_extra_profit", type: "uint256", indexed: false },
      { name: "adjustment_step", type: "uint256", indexed: false },
      { name: "ma_half_time", type: "uint256", indexed: false },
    ],
    anonymous: false,
    type: "event",
  },
  {
    name: "NewParameters",
    inputs: [
      { name: "admin_fee", type: "uint256", indexed: false },
      { name: "mid_fee", type: "uint256", indexed: false },
      { name: "out_fee", type: "uint256", indexed: false },
      { name: "fee_gamma", type: "uint256", indexed: false },
      { name: "allowed_extra_profit", type: "uint256", indexed: false },
      { name: "adjustment_step", type: "uint256", indexed: false },
      { name: "ma_half_time", type: "uint256", indexed: false },
    ],
    anonymous: false,
    type: "event",
  },
  {
    name: "RampAgamma",
    inputs: [
      { name: "initial_A", type: "uint256", indexed: false },
      { name: "future_A", type: "uint256", indexed: false },
      { name: "initial_gamma", type: "uint256", indexed: false },
      { name: "future_gamma", type: "uint256", indexed: false },
      { name: "initial_time", type: "uint256", indexed: false },
      { name: "future_time", type: "uint256", indexed: false },
    ],
    anonymous: false,
    type: "event",
  },
  {
    name: "StopRampA",
    inputs: [
      { name: "current_A", type: "uint256", indexed: false },
      { name: "current_gamma", type: "uint256", indexed: false },
      { name: "time", type: "uint256", indexed: false },
    ],
    anonymous: false,
    type: "event",
  },
  {
    name: "ClaimAdminFee",
    inputs: [
      { name: "admin", type: "address", indexed: true },
      { name: "tokens", type: "uint256", indexed: false },
    ],
    anonymous: false,
    type: "event",
  },
  { stateMutability: "nonpayable", type: "constructor", inputs: [{ name: "_weth", type: "address" }], outputs: [] },
  { stateMutability: "payable", type: "fallback" },
  {
    stateMutability: "payable",
    type: "function",
    name: "donate",
    inputs: [
      { name: "i", type: "uint256" },
      { name: "j", type: "uint256" },
      { name: "dx", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "payable",
    type: "function",
    name: "donate",
    inputs: [
      { name: "i", type: "uint256" },
      { name: "j", type: "uint256" },
      { name: "dx", type: "uint256" },
      { name: "use_eth", type: "bool" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "payable",
    type: "function",
    name: "donate",
    inputs: [
      { name: "i", type: "uint256" },
      { name: "j", type: "uint256" },
      { name: "dx", type: "uint256" },
      { name: "use_eth", type: "bool" },
      { name: "receiver", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "payable",
    type: "function",
    name: "exchange",
    inputs: [
      { name: "i", type: "uint256" },
      { name: "j", type: "uint256" },
      { name: "dx", type: "uint256" },
      { name: "min_dy", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "payable",
    type: "function",
    name: "exchange",
    inputs: [
      { name: "i", type: "uint256" },
      { name: "j", type: "uint256" },
      { name: "dx", type: "uint256" },
      { name: "min_dy", type: "uint256" },
      { name: "use_eth", type: "bool" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "payable",
    type: "function",
    name: "exchange",
    inputs: [
      { name: "i", type: "uint256" },
      { name: "j", type: "uint256" },
      { name: "dx", type: "uint256" },
      { name: "min_dy", type: "uint256" },
      { name: "use_eth", type: "bool" },
      { name: "receiver", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "payable",
    type: "function",
    name: "exchange_underlying",
    inputs: [
      { name: "i", type: "uint256" },
      { name: "j", type: "uint256" },
      { name: "dx", type: "uint256" },
      { name: "min_dy", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "payable",
    type: "function",
    name: "exchange_underlying",
    inputs: [
      { name: "i", type: "uint256" },
      { name: "j", type: "uint256" },
      { name: "dx", type: "uint256" },
      { name: "min_dy", type: "uint256" },
      { name: "receiver", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "payable",
    type: "function",
    name: "exchange_extended",
    inputs: [
      { name: "i", type: "uint256" },
      { name: "j", type: "uint256" },
      { name: "dx", type: "uint256" },
      { name: "min_dy", type: "uint256" },
      { name: "use_eth", type: "bool" },
      { name: "sender", type: "address" },
      { name: "receiver", type: "address" },
      { name: "cb", type: "bytes32" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "payable",
    type: "function",
    name: "add_liquidity",
    inputs: [
      { name: "amounts", type: "uint256[2]" },
      { name: "min_mint_amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "payable",
    type: "function",
    name: "add_liquidity",
    inputs: [
      { name: "amounts", type: "uint256[2]" },
      { name: "min_mint_amount", type: "uint256" },
      { name: "use_eth", type: "bool" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "payable",
    type: "function",
    name: "add_liquidity",
    inputs: [
      { name: "amounts", type: "uint256[2]" },
      { name: "min_mint_amount", type: "uint256" },
      { name: "use_eth", type: "bool" },
      { name: "receiver", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    name: "remove_liquidity",
    inputs: [
      { name: "_amount", type: "uint256" },
      { name: "min_amounts", type: "uint256[2]" },
    ],
    outputs: [],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    name: "remove_liquidity",
    inputs: [
      { name: "_amount", type: "uint256" },
      { name: "min_amounts", type: "uint256[2]" },
      { name: "use_eth", type: "bool" },
    ],
    outputs: [],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    name: "remove_liquidity",
    inputs: [
      { name: "_amount", type: "uint256" },
      { name: "min_amounts", type: "uint256[2]" },
      { name: "use_eth", type: "bool" },
      { name: "receiver", type: "address" },
    ],
    outputs: [],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    name: "remove_liquidity_one_coin",
    inputs: [
      { name: "token_amount", type: "uint256" },
      { name: "i", type: "uint256" },
      { name: "min_amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    name: "remove_liquidity_one_coin",
    inputs: [
      { name: "token_amount", type: "uint256" },
      { name: "i", type: "uint256" },
      { name: "min_amount", type: "uint256" },
      { name: "use_eth", type: "bool" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    name: "remove_liquidity_one_coin",
    inputs: [
      { name: "token_amount", type: "uint256" },
      { name: "i", type: "uint256" },
      { name: "min_amount", type: "uint256" },
      { name: "use_eth", type: "bool" },
      { name: "receiver", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  { stateMutability: "nonpayable", type: "function", name: "claim_admin_fees", inputs: [], outputs: [] },
  {
    stateMutability: "nonpayable",
    type: "function",
    name: "ramp_A_gamma",
    inputs: [
      { name: "future_A", type: "uint256" },
      { name: "future_gamma", type: "uint256" },
      { name: "future_time", type: "uint256" },
    ],
    outputs: [],
  },
  { stateMutability: "nonpayable", type: "function", name: "stop_ramp_A_gamma", inputs: [], outputs: [] },
  {
    stateMutability: "nonpayable",
    type: "function",
    name: "commit_new_parameters",
    inputs: [
      { name: "_new_mid_fee", type: "uint256" },
      { name: "_new_out_fee", type: "uint256" },
      { name: "_new_admin_fee", type: "uint256" },
      { name: "_new_fee_gamma", type: "uint256" },
      { name: "_new_allowed_extra_profit", type: "uint256" },
      { name: "_new_adjustment_step", type: "uint256" },
      { name: "_new_ma_half_time", type: "uint256" },
    ],
    outputs: [],
  },
  { stateMutability: "nonpayable", type: "function", name: "apply_new_parameters", inputs: [], outputs: [] },
  { stateMutability: "nonpayable", type: "function", name: "revert_new_parameters", inputs: [], outputs: [] },
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
