import { TV } from "@/classes/TokenValue";
import { ComboInputField } from "@/components/ComboInputField";
import DestinationBalanceSelect from "@/components/DestinationBalanceSelect";
import FrameAnimator from "@/components/LoadingSpinner";
import MobileActionBar from "@/components/MobileActionBar";
import RoutingAndSlippageInfo from "@/components/RoutingAndSlippageInfo";
import SiloOutputDisplay from "@/components/SiloOutputDisplay";
import SlippageButton from "@/components/SlippageButton";
import SmartSubmitButton from "@/components/SmartSubmitButton";
import TextSkeleton from "@/components/TextSkeleton";
import TokenSelectWithBalances from "@/components/TokenSelectWithBalances";
import { Label } from "@/components/ui/Label";
import { Switch, SwitchThumb } from "@/components/ui/Switch";
import { siloedPintoABI } from "@/constants/abi/siloedPintoABI";
import { abiSnippets } from "@/constants/abiSnippets";
import { defaultQuerySettingsQuote } from "@/constants/query";
import { useProtocolAddress } from "@/hooks/pinto/useProtocolAddress";
import { useTokenMap } from "@/hooks/pinto/useTokenMap";
import { useBuildSwapQuoteAsync } from "@/hooks/swap/useBuildSwapQuote";
import useSwap from "@/hooks/swap/useSwap";
import useSwapSummary from "@/hooks/swap/useSwapSummary";
import useTransaction from "@/hooks/useTransaction";
import { FarmerBalance, useFarmerBalances } from "@/state/useFarmerBalances";
import { useFarmerSilo } from "@/state/useFarmerSilo";
import { usePriceData } from "@/state/usePriceData";
import useTokenData from "@/state/useTokenData";
import { pickCratesAsCrates, sortCratesByStem } from "@/utils/convert";
import { tryExtractErrorMessage } from "@/utils/error";
import { formatter } from "@/utils/format";
import { isValidAddress, stringToNumber, stringToStringNum } from "@/utils/string";
import { tokensEqual } from "@/utils/token";
import { FarmFromMode, FarmToMode, Token } from "@/utils/types";
import { exists, getBalanceFromMode, noop } from "@/utils/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Address } from "viem";
import { useAccount, useReadContract } from "wagmi";

const balancesToShow = [FarmFromMode.INTERNAL, FarmFromMode.EXTERNAL];

type TxnType = "redeemToSilo" | "redeemAdvanced" | "swap";

export default function UnwrapToken({ siloToken }: { siloToken: Token }) {
  // State
  const farmerBalances = useFarmerBalances();
  const { queryKeys: farmerDepositsQueryKeys } = useFarmerSilo();
  const contractBalances = useFarmerSilo(siloToken.isSiloWrapped ? siloToken.address : undefined);
  const { address: account, isConnecting } = useAccount();
  const { mainToken } = useTokenData();
  const diamond = useProtocolAddress();
  const qc = useQueryClient();
  const filterTokens = useFilterOutTokens(siloToken);
  const destinationTokenFilter = useFilterDestinationTokens();
  const { tokenPrices } = usePriceData();

  const farmerBalance = farmerBalances.balances.get(siloToken);

  // Local State
  const [slippage, setSlippage] = useState<number>(0.1);
  const [amountIn, setAmountIn] = useState<string>("0");
  const [balanceSource, setBalanceSource] = useState<FarmFromMode>(getPreferredBalanceSource(farmerBalance));

  const [toSilo, setToSilo] = useState<boolean>(true);
  const [didInitBalanceSource, setDidInitBalanceSource] = useState(!!farmerBalances.isFetched);
  const [inputError, setInputError] = useState<boolean>(false);
  const [tokenOut, setTokenOut] = useState<Token | undefined>(undefined);
  const [toMode, setToMode] = useState<FarmToMode | undefined>(undefined);

  // Derived
  const balance = getBalanceFromMode(farmerBalance, balanceSource) ?? TV.ZERO;
  const amountTV = TV.fromHuman(stringToStringNum(amountIn), siloToken.decimals);
  const validAmountIn = amountTV.gt(0);

  const txnType = useTxnType(toSilo, tokenOut);

  const quoteDisabled = !siloToken.isSiloWrapped || txnType === "swap";

  // Queries & Hooks
  // Quote for redeemToSilo and redeemAdvanced
  const { data: quote, ...quoteQuery } = useUnwrapTokenQuoteQuery(amountTV, siloToken, mainToken, quoteDisabled);
  const output = useUnwrapQuoteOutputSummary(contractBalances.deposits, mainToken, quote);

  // Quote for swap (ONLY if tokenOut is not main token)
  const swap = useSwap({
    tokenIn: siloToken,
    tokenOut,
    slippage,
    amountIn: amountTV,
    disabled: !tokenOut || txnType === "swap", // disable quote if we are unwrapping to silo deposit
  });
  const swapSummary = useSwapSummary(swap.data);
  const buildSwapQuote = useBuildSwapQuoteAsync(swap.data, balanceSource, toMode, account, account);

  // Transaction
  const onSuccess = useCallback(() => {
    setAmountIn("0");
    setToMode(undefined);
    setTokenOut(undefined);
    const keys = [...contractBalances.queryKeys, ...farmerBalances.queryKeys, ...farmerDepositsQueryKeys];
    keys.forEach((key) => qc.invalidateQueries({ queryKey: key }));
  }, [contractBalances, farmerBalances, farmerDepositsQueryKeys]);

  const { isConfirming, writeWithEstimateGas, submitting, setSubmitting } = useTransaction({
    successMessage: "Unwrap successful",
    errorMessage: "Unwrap failed",
    successCallback: onSuccess,
  });

  // Submit handlers
  const handleRedeemAdvanced = useCallback(async (shares: TV, address: Address, from: FarmFromMode, to: FarmToMode) => {
    return writeWithEstimateGas({
      address: siloToken.address,
      abi: siloedPintoABI,
      functionName: "redeemAdvanced",
      args: [shares, address, address, from, to],
    })
  }, [writeWithEstimateGas, siloToken]);

  const handleRedeemToSilo = useCallback(async (amount: TV, address: Address, from: FarmFromMode) => {
    return writeWithEstimateGas({
      address: siloToken.address,
      abi: siloedPintoABI,
      functionName: "redeemToSilo",
      args: [amount.toBigInt(), address, address, Number(from)],
    });
  }, [writeWithEstimateGas, siloToken]);

  const handleSwap = useCallback(async (buildSwapCallback: NonNullable<ReturnType<typeof useBuildSwapQuoteAsync>>) => {
    const swapbuild = await buildSwapCallback();
    if (!swapbuild) {
      throw new Error("Failed to build swap");
    }

    return writeWithEstimateGas({
      address: diamond,
      abi: abiSnippets.advancedFarm,
      functionName: "advancedFarm",
      args: [swapbuild.advancedFarm],
    });
  }, [writeWithEstimateGas, diamond]);

  const onSubmit = useCallback(async () => {
    try {
      // validations
      if (!account) throw new Error("Signer required");
      if (amountTV.lte(0)) throw new Error("Invalid amount");
      if (balance.lt(amountTV)) throw new Error("Insufficient balance");
      if (!toSilo && !tokenOut) throw new Error("Token out required");

      const startSubmission = () => {
        setSubmitting(true);
        toast.loading(`Unwrapping ${siloToken.symbol}...`);
      }

      // transaction
      if (toSilo) {
        startSubmission();
        return handleRedeemToSilo(amountTV, account, balanceSource);
      }

      if (!exists(toMode)) {
        throw new Error("Invalid destination mode");
      }

      if (!toSilo && tokenOut?.isMain) {
        startSubmission();
        return handleRedeemAdvanced(amountTV, account, balanceSource, toMode);
      }

      if (!tokenOut || !buildSwapQuote) {
        throw new Error("Swap quote not found");
      }

      startSubmission();
      return handleSwap(buildSwapQuote);
    } catch (e) {
      console.error(e);
      toast.dismiss();
      const message = tryExtractErrorMessage(e, "Failed to unwrap token.");
      toast.error(message);
      throw e instanceof Error ? e : new Error(message);
    } finally {
      setSubmitting(false);
    }
  }, [
    account,
    amountTV,
    balanceSource,
    siloToken,
    tokenOut,
    toSilo,
    buildSwapQuote,
    setSubmitting,
    handleRedeemToSilo,
    handleRedeemAdvanced,
    handleSwap,
  ]);

  // Effects
  useEffect(() => {
    if (didInitBalanceSource || !farmerBalance || farmerBalances.isLoading || isConnecting) {
      return;
    }
    setBalanceSource(getPreferredBalanceSource(farmerBalance));
    setDidInitBalanceSource(true);
  }, [didInitBalanceSource, farmerBalances.isLoading, farmerBalance, isConnecting]);

  // Display State
  const buttonText = amountTV.gt(balance) ? "Insufficient Balance" : "Unwrap";
  const inputAltText = `${getInputAltTextWithSource(balanceSource)} Balance:`;

  const quotingSwap = !toSilo && validAmountIn && swap.isLoading;
  const quotingRedeem = toSilo && validAmountIn && quoteQuery.isLoading;

  const quoting = txnType === "swap" ? quotingSwap : quotingRedeem;
  const outputNotReady = txnType !== "swap" ? output?.amount.lte(0) : swap.data?.buyAmount.lte(0);

  const baseDisabled = !account || !validAmountIn || !balance.gte(amountTV);
  const nonToSiloDisabled = txnType !== "redeemToSilo" && (!exists(toMode) || !tokenOut);
  const buttonDisabled = baseDisabled || isConfirming || submitting || outputNotReady || inputError || quoting || nonToSiloDisabled;

  const sourceIsInternal = balanceSource === FarmFromMode.INTERNAL;

  const spender = (() => {
    if (sourceIsInternal && txnType !== "swap") {
      return siloToken.address;
    }
    if (!sourceIsInternal && txnType === "swap") {
      return diamond;
    }
    return undefined;
  })();

  // only require allowance if
  const buttonToken = (() => {
    if (sourceIsInternal && txnType !== "swap") {
      return siloToken;
    }
    if (!sourceIsInternal && txnType === "swap") {
      return siloToken;
    }
    return undefined;
  })();

  const requiresDiamondAllowance = sourceIsInternal && txnType !== "swap";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col">
        <div className="flex flex-row justify-between items-center">
          <Label variant="section" expanded>
            Amount to Unwrap
          </Label>
          {!toSilo && <SlippageButton slippage={slippage} setSlippage={setSlippage} />}
        </div>
        <ComboInputField
          amount={amountIn}
          selectedToken={siloToken}
          customMaxAmount={balance}
          balanceFrom={balanceSource}
          error={inputError}
          setToken={noop}
          setAmount={setAmountIn}
          setError={setInputError}
          setBalanceFrom={setBalanceSource}
          altText={inputAltText}
          altTextMobile="Balance:"
          balancesToShow={balancesToShow}
          filterTokens={filterTokens}
          isLoading={!didInitBalanceSource}
          disableInput={txnType !== "redeemToSilo" && !tokenOut}
        />
        <div className="flex flex-row w-full justify-between items-center mt-4">
          <div className="pinto-sm sm:pinto-body-light sm:text-pinto-light text-pinto-light">
            Unwrap as {mainToken.symbol} deposit
          </div>
          <Switch
            checked={toSilo}
            onCheckedChange={() => {
              setTokenOut(undefined);
              setToSilo((prev) => !prev);
            }}
          >
            <SwitchThumb />
          </Switch>
        </div>
      </div>
      {txnType === "redeemToSilo" && validAmountIn ? (
        <SiloOutputDisplay
          token={mainToken}
          amount={output?.amount ?? TV.ZERO}
          stalk={output?.stalk.total ?? TV.ZERO}
          seeds={output?.seeds ?? TV.ZERO}
        />
      ) : null}
      {txnType !== "redeemToSilo" ? (
        <div>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col">
              <Label className="flex h-10 items-center">Destination</Label>
              <DestinationBalanceSelect setBalanceTo={setToMode} balanceTo={toMode} />
            </div>
            <div className="flex flex-col w-full pt-4 pb-2 gap-2">
              <div className="pinto-body-light text-pinto-light">Unwrap as</div>
              <div className="flex flex-col w-full gap-1">
                <div className="flex flex-row items-center justify-between w-full">
                  <div className="flex flex-col gap-1">
                    <TextSkeleton height="h3" loading={txnType === "swap" && swap.isLoading} className="w-20">
                      <div className="pinto-h3">
                        {formatter.token(txnType === "swap" ? swap.data?.buyAmount : output?.amount, tokenOut ?? mainToken)}
                      </div>
                    </TextSkeleton>
                  </div>
                  <TokenSelectWithBalances
                    selectedToken={tokenOut}
                    setToken={setTokenOut}
                    noBalances={true}
                    filterTokens={destinationTokenFilter}
                  />
                </div>
                <TextSkeleton height="sm" className="w-20" loading={txnType === "swap" && swap.isLoading}>
                  <div className="pinto-sm-light text-pinto-light">{formatter.usd(txnType === "swap" ? swap.data?.usdOut : output?.usd)}</div>
                </TextSkeleton>
              </div>
            </div>
          </div>
          {(txnType === "swap" && swap.isLoading) ? (
            <div className="flex flex-row items-center justify-center h-[5.5rem]">
              <FrameAnimator size={64} />
            </div>
          ) : swap.data && tokenOut ? (
            <RoutingAndSlippageInfo
              title="Total Unwrap Slippage"
              swapSummary={swapSummary}
              priceImpactSummary={undefined}
              preferredSummary="swap"
              tokenIn={siloToken}
              tokenOut={tokenOut}
              txnType="Swap"
            />
          ) : null}
        </div>
      ) : null
      }
      <div className="flex-row hidden sm:flex">
        <SmartSubmitButton
          submitFunction={onSubmit}
          submitButtonText={buttonText}
          variant="gradient"
          disabled={buttonDisabled}
          amount={amountIn}
          token={buttonToken}
          balanceFrom={balanceSource}
          spender={spender}
          requiresDiamondAllowance={requiresDiamondAllowance}
        />
      </div>
      <MobileActionBar>
        <SmartSubmitButton
          submitFunction={onSubmit}
          submitButtonText={buttonText}
          className="h-full"
          variant="gradient"
          amount={amountIn}
          disabled={buttonDisabled}
          token={buttonToken}
          balanceFrom={balanceSource}
          spender={spender}
          requiresDiamondAllowance={requiresDiamondAllowance}
        />
      </MobileActionBar>
    </div >
  );
}

// -----------------------------------------------------------------------
// =======================================================================

// ================================ HOOKS ================================

const useTxnType = (toSilo: boolean, tokenOut: Token | undefined): TxnType | undefined => {
  if (toSilo) return "redeemToSilo";

  if (!tokenOut) return undefined;

  return tokenOut.isMain ? "redeemAdvanced" : "swap";
}

const useButtonProps = (
  toSilo: boolean,
  siloToken: Token,
  tokenOut: Token | undefined,
  fromMode: FarmFromMode,
) => {
  const diamond = useProtocolAddress();
  const txnType = useTxnType(toSilo, tokenOut);

  const fromInternal = fromMode === FarmFromMode.INTERNAL;

  let spender: Address | undefined = undefined;
  let token: Token | undefined = undefined;

  switch (txnType) {
    case "redeemAdvanced": {
      if (fromInternal) {
        spender = siloToken.address;
        token = siloToken;
      }
      break;
    }
    case "swap": {
      spender = diamond;
      token = siloToken;
      break;
    }
    // default is redeemToSilo
    default: {
      if (fromInternal) {
        spender = siloToken.address;
        token = siloToken;
      }
      break;
    }
  }

  if (fromInternal) {
    spender = diamond;
    token = siloToken;
  }

  if (txnType === "swap") {
    spender = diamond;
    token = siloToken;
  }
}

const useFilterDestinationTokens = () => {
  const tokenMap = useTokenMap();
  const [tokens, setTokens] = useState<Set<Token>>(new Set());

  useEffect(() => {
    const tokens = Object.values(tokenMap);
    const filtered = tokens.filter((t) => t.isSiloWrapped || t.isLP || t.is3PSiloWrapped);
    setTokens(new Set(filtered));
  }, [tokenMap]);

  return tokens;
};

function useUnwrapTokenQuoteQuery(amount: TV, tokenIn: Token, tokenOut: Token, disabled: boolean = false) {
  const [quote, setQuote] = useState<TV | undefined>(undefined);

  const query = useReadContract({
    address: tokenIn.address,
    abi: siloedPintoABI,
    functionName: "previewRedeem",
    args: [amount.toBigInt()],
    query: {
      ...defaultQuerySettingsQuote,
      enabled: amount.gt(0) && !disabled,
    },
  });

  const amountStr = amount.toHuman();

  // Use UseEffect here to update quote return data to enable caching of previous quotes.
  // This is necessary to prevent flickering of quote return values when the query is loading.

  // Effects.
  useEffect(() => {
    if (!query.data) return;
    setQuote(TV.fromBigInt(query.data, tokenOut.decimals));
  }, [query.data, tokenOut.decimals]);

  useEffect(() => {
    if (stringToNumber(amountStr) <= 0 || query.isError) {
      setQuote(undefined);
    }
  }, [amountStr, query.isError]);

  return {
    ...query,
    data: quote,
  };
}

function useUnwrapQuoteOutputSummary(
  data: ReturnType<typeof useFarmerSilo>["deposits"],
  token: Token,
  quote: TV | undefined,
) {
  const { tokenPrices } = usePriceData();

  // sort by latest deposit first
  const sortedDeposits = useMemo(() => {
    const depositsData = data.get(token);
    return sortCratesByStem(depositsData?.deposits ?? [], "desc");
  }, [data, token]);

  return useMemo(() => {
    if (!quote || quote.lte(0)) return undefined;

    const tokenPrice = tokenPrices.get(token);
    const usd = quote.mul(tokenPrice?.instant ?? 0);

    return {
      ...pickCratesAsCrates(sortedDeposits, quote),
      usd: usd,
    };
  }, [quote, sortedDeposits]);
}

function useFilterOutTokens(token: Token) {
  const tokenMap = useTokenMap();

  return useMemo(() => {
    const set = new Set<Token>();
    Object.values(tokenMap).forEach((t) => {
      if (!tokensEqual(t, token)) {
        set.add(t);
      }
    });
    return set;
  }, [tokenMap, token]);
}

function getPreferredBalanceSource(balance: FarmerBalance | undefined) {
  if (!balance || balance.total.eq(0)) return FarmFromMode.EXTERNAL;
  return balance.external.gt(balance.internal) ? FarmFromMode.EXTERNAL : FarmFromMode.INTERNAL;
}

// ================================ UTILS ================================

function getInputAltTextWithSource(source: FarmFromMode) {
  switch (source) {
    case FarmFromMode.EXTERNAL:
      return "Wallet";
    case FarmFromMode.INTERNAL:
      return "Farm";
    default:
      return "Combined";
  }
}

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