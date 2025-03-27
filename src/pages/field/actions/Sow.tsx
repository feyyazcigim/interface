import { TV } from "@/classes/TokenValue";
import { ComboInputField } from "@/components/ComboInputField";
import OutputDisplay from "@/components/OutputDisplay";
import SmartSubmitButton from "@/components/SmartSubmitButton";
import Warning from "@/components/ui/Warning";
import { PODS, SEEDS, STALK } from "@/constants/internalTokens";
import sowWithMin from "@/encoders/sowWithMin";
import { beanstalkAbi } from "@/generated/contractHooks";
import { useProtocolAddress } from "@/hooks/pinto/useProtocolAddress";
import useTransaction from "@/hooks/useTransaction";
import { useFarmerBalances } from "@/state/useFarmerBalances";
import { useFarmerField } from "@/state/useFarmerField";
import { useInvalidateField, usePodLine, useTotalSoil } from "@/state/useFieldData";
import { useTemperature } from "@/state/useFieldData";
import useTokenData from "@/state/useTokenData";
import { formatter } from "@/utils/format";
import { stringToNumber, stringToStringNum } from "@/utils/string";
import { AdvancedFarmCall, FarmFromMode, FarmToMode, Token } from "@/utils/types";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAccount } from "wagmi";

import settingsIcon from "@/assets/misc/Settings.svg";
import FrameAnimator from "@/components/LoadingSpinner";
import MobileActionBar from "@/components/MobileActionBar";

import { Col, Row } from "@/components/Container";
import RoutingAndSlippageInfo, { useRoutingAndSlippageWarning } from "@/components/RoutingAndSlippageInfo";
import TextSkeleton from "@/components/TextSkeleton";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { Switch } from "@/components/ui/Switch";
import siloWithdraw from "@/encoders/silo/withdraw";
import useDelayedLoading from "@/hooks/display/useDelayedLoading";
import { useTokenMap } from "@/hooks/pinto/useTokenMap";
import { useBuildSwapQuoteAsync } from "@/hooks/swap/useBuildSwapQuote";
import useMaxBuy from "@/hooks/swap/useMaxBuy";
import useSwap from "@/hooks/swap/useSwap";
import useSwapSummary from "@/hooks/swap/useSwapSummary";
import { usePreferredInputSiloDepositToken, usePreferredInputToken } from "@/hooks/usePreferredInputToken";
import { useFarmerSilo } from "@/state/useFarmerSilo";
import { sortAndPickCrates } from "@/utils/convert";
import { HashString } from "@/utils/types.generic";
import { useDebouncedEffect } from "@/utils/useDebounce";
import { getBalanceFromMode } from "@/utils/utils";
import { AnimatePresence, motion } from "framer-motion";

type SowProps = {
  isMorning: boolean;
};

function Sow({ isMorning }: SowProps) {
  // Hooks
  const qc = useQueryClient();
  const diamond = useProtocolAddress();
  const { mainToken } = useTokenData();
  const farmerBalances = useFarmerBalances();
  const farmerSilo = useFarmerSilo();
  const farmerField = useFarmerField();
  const account = useAccount();

  const temperature = useTemperature();
  const podLine = usePodLine();
  const { totalSoil, isLoading: totalSoilLoading } = useTotalSoil();
  const invalidateField = useInvalidateField();

  const depositedByWhitelistedToken = useMapSiloDepositsToAmounts(farmerSilo.deposits);

  // Form State
  const [tokenSource, setTokenSource] = useState<TokenSource>("balances");

  const preferredSiloDepositToken = usePreferredInputSiloDepositToken(farmerSilo, mainToken);
  const preferredBalanceToken = usePreferredInputToken({
    filterLP: true,
  });

  const preferredLoading =
    tokenSource === "deposits" ? preferredSiloDepositToken.isLoading : preferredBalanceToken.loading;

  const [balanceFrom, setBalanceFrom] = useState(FarmFromMode.INTERNAL_EXTERNAL);
  const [tokenIn, setTokenIn] = useState<Token>(
    tokenSource === "deposits" ? preferredSiloDepositToken.preferredToken : preferredBalanceToken.preferredToken,
  );
  const [amountIn, setAmountIn] = useState("0");
  const [slippage, setSlippage] = useState(0.1);
  const [minTemperature, setMinTemperature] = useState(Math.max(temperature.scaled.toNumber(), 1));

  const [didSetPreferred, setDidSetPreferred] = useState(!preferredLoading);
  const [inputError, setInputError] = useState(false);

  //
  const { loading, setLoading } = useDelayedLoading();
  const filterTokens = useFilterTokens(tokenSource);

  // Derived State
  const fromSilo = tokenSource === "deposits";
  const numIn = stringToNumber(amountIn);
  const currentTemperature = temperature.scaled;
  const isUsingMain = !!tokenIn.isMain;

  // Swap / Quotes
  const maxBuyQuery = useMaxBuy(tokenIn, slippage, totalSoil);
  const maxBuy = totalSoilLoading ? TV.ZERO : maxBuyQuery.data;

  const amountInTV = TV.fromHuman(stringToStringNum(amountIn), tokenIn.decimals);

  const swap = useSwap({
    tokenIn: tokenIn,
    tokenOut: mainToken,
    amountIn: tokenIn.isMain ? TV.ZERO : amountInTV,
    slippage,
    disabled: tokenIn.isMain || stringToNumber(amountIn) <= 0 || maxBuy?.lte(0),
  });

  const swapSummary = useSwapSummary(swap.data);
  const resetSwap = swap.resetSwap;

  const buildSwapAsync = useBuildSwapQuoteAsync(
    swap.data,
    fromSilo ? FarmFromMode.INTERNAL : balanceFrom, // if we are using silo deposits, fromMode = INTERNAL
    FarmToMode.INTERNAL,
  );

  // Swap Quote Derived
  const { slippageWarning, canProceed } = useRoutingAndSlippageWarning({
    totalSlippage: swapSummary?.swap.totalSlippage,
    priceImpact: undefined,
    txnType: "Swap",
    noMarginTop: true,
  });

  const withdrawBreakdown = useWithdrawDepositBreakdown(farmerSilo.deposits, tokenIn, amountIn, fromSilo);

  // Transaction
  const onSuccess = useCallback(() => {
    setAmountIn("0");
    resetSwap();
    invalidateField("all");
    farmerField.refetch();
    if (fromSilo) {
      farmerSilo.refetch();
    } else {
      farmerBalances.refetch();
    }
  }, [fromSilo, farmerField.refetch, farmerBalances.refetch, farmerSilo.refetch, invalidateField, resetSwap]);

  const { writeWithEstimateGas, isConfirming, submitting, setSubmitting } = useTransaction({
    successCallback: onSuccess,
    errorMessage: "Sow failed",
    successMessage: "Sow successful",
  });

  const pods = useMemo(() => {
    const amount = stringToNumber(amountIn);
    if (amount <= 0) return;

    const multiplier = currentTemperature.add(100).div(100);

    if (isUsingMain) {
      return multiplier.mul(amount);
    } else if (swap?.data?.buyAmount) {
      const numPinto = swap.data.buyAmount;
      return multiplier.mul(numPinto);
    }

    return TV.ZERO;
  }, [amountIn, currentTemperature, isUsingMain, swap.data?.buyAmount]);

  const onSubmit = useCallback(async () => {
    try {
      if (!account.address) {
        throw new Error("Signer required");
      }
      if (minTemperature < 0) {
        throw new Error("Min temperature must be greater than 0");
      }
      if (currentTemperature.lte(0)) {
        throw new Error("Current temperature must be greater than 0");
      }
      if (inputError) {
        throw new Error("Invalid input");
      }
      setSubmitting(true);

      const mainTokenAmount = isUsingMain
        ? TV.fromHuman(amountIn || 0n, mainToken.decimals)
        : swap.data?.buyAmount ?? TV.ZERO;

      if (!mainTokenAmount.gt(0)) {
        throw new Error("Sow amount must be greater than 0");
      }

      toast.loading(`Sowing...`);

      // temperature at 6 decimals
      const _minTemp = TV.fromHuman(minTemperature, PODS.decimals);
      const minTemp = (_minTemp.gt(currentTemperature) ? _minTemp : currentTemperature).subSlippage(slippage);

      const minSoil = TV.ZERO;

      // If we are sowing w/ the Main Token, we can use the regular sowWithMin function
      if (isUsingMain && !fromSilo) {
        return writeWithEstimateGas({
          address: diamond,
          abi: beanstalkAbi,
          functionName: "sowWithMin",
          args: [mainTokenAmount.toBigInt(), minTemp.toBigInt(), minSoil.toBigInt(), Number(balanceFrom)],
        });
      }

      const advFarm: AdvancedFarmCall[] = [];

      // If we are using silo deposits, withdraw first to INTERNAL
      if (fromSilo) {
        if (!withdrawBreakdown) {
          throw new Error("Unable to calculate Silo withdraw");
        }

        const withdrawStruct = siloWithdraw(
          tokenIn,
          withdrawBreakdown.crates.map((crate) => crate.stem),
          withdrawBreakdown.crates.map((crate) => crate.amount),
          FarmToMode.INTERNAL,
        );

        advFarm.push(withdrawStruct);
      }

      let clipboard: HashString | undefined = undefined;

      // If we are sowing w/ a non-Main Token, we need to build a swap
      if (!isUsingMain) {
        const swapBuild = await buildSwapAsync?.();
        if (!swapBuild) {
          throw new Error("No swap quote");
        }

        const result = await swapBuild.deriveClipboardWithOutputToken(mainToken, 0, account.address, {
          before: advFarm,
        });

        clipboard = result.clipboard;
        swapBuild.advFarm.getSteps().forEach((step) => {
          advFarm.push(step);
        });
      }

      // Finally, add the sowWithMin call to the advFarm
      const sowCallStruct = sowWithMin(mainTokenAmount, minTemp, minSoil, FarmFromMode.INTERNAL, clipboard);
      advFarm.push(sowCallStruct);

      const value = tokenIn.isNative ? TV.fromHuman(amountIn, tokenIn.decimals).toBigInt() : 0n;

      return writeWithEstimateGas({
        address: diamond,
        abi: beanstalkAbi,
        functionName: "advancedFarm",
        args: [advFarm],
        value,
      });
    } catch (e) {
      console.error(e);
      toast.dismiss();
      toast.error("Sow failed");
      throw e;
    } finally {
      setSubmitting(false);
    }
  }, [
    writeWithEstimateGas,
    setSubmitting,
    buildSwapAsync,
    withdrawBreakdown,
    diamond,
    slippage,
    swap.data,
    account.address,
    fromSilo,
    amountIn,
    tokenIn,
    mainToken,
    balanceFrom,
    isUsingMain,
    minTemperature,
    currentTemperature,
    inputError,
  ]);

  // Callbacks
  const handleOnCheckedChange = (checked: boolean) => {
    setAmountIn("0");
    const newTokenSource = checked ? "deposits" : "balances";
    if (newTokenSource === "deposits") {
      setTokenIn(preferredSiloDepositToken.preferredToken);
    } else {
      setTokenIn(preferredBalanceToken.preferredToken);
    }
    setTokenSource(newTokenSource);
  };

  // Effects
  // Initialize the token source
  useEffect(() => {
    // If we are still calculating the preferred token, set the token to the preferred token once it's been set.
    if (didSetPreferred || preferredLoading) return;
    const preferred = fromSilo ? preferredSiloDepositToken.preferredToken : preferredBalanceToken.preferredToken;

    setTokenIn(preferred);
    setDidSetPreferred(true);
  }, [
    preferredBalanceToken.preferredToken,
    preferredLoading,
    didSetPreferred,
    fromSilo,
    preferredSiloDepositToken.preferredToken,
  ]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: only reset when token in changes
  useEffect(() => {
    setAmountIn("0");
  }, [tokenIn]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: only reset when swap data changes
  useEffect(() => {
    setLoading(swap.isLoading);
  }, [swap.isLoading]);

  // Derived State
  const hasSoil = Boolean(!totalSoilLoading && totalSoil.gt(0));

  const initializing = !didSetPreferred || (hasSoil ? maxBuyQuery.isLoading : false);

  const isLoading = (numIn > 0 && loading) || (pods?.lte(0) && numIn > 0);
  const ready = pods?.gt(0) && podLine.gte(0) && (hasSoil ? maxBuy?.gt(0) && amountInTV.gt(0) : true);

  const tokenBalance = fromSilo
    ? depositedByWhitelistedToken.get(tokenIn)
    : getBalanceFromMode(farmerBalances.balances.get(tokenIn), balanceFrom);

  const balanceExceedsSoil =
    (!totalSoilLoading && totalSoil.lte(0)) ||
    (!maxBuyQuery.isLoading && Boolean(tokenBalance && maxBuy?.lt(tokenBalance)));

  const ctaDisabled = isLoading || isConfirming || submitting || !ready || inputError || !canProceed;

  const buttonText = inputError ? "Amount too large" : "Sow";

  const animationHeight = getAnimateHeight({ fromSilo, hasSoil, tokenIn });

  return (
    <Col className="gap-4">
      <div>
        <Row className="justify-between items-center">
          <div className="pinto-body-light text-pinto-light">Amount and token to sow</div>
          <SettingsPoppover
            slippage={slippage}
            setSlippage={setSlippage}
            minTemperature={minTemperature}
            setMinTemperature={setMinTemperature}
          />
        </Row>
        <ComboInputField
          isLoading={initializing}
          tokenSelectLoading={!didSetPreferred}
          amount={amountIn}
          disableInput={isConfirming}
          customMaxAmount={maxBuy?.gt(0) && tokenBalance?.gt(0) ? TV.min(tokenBalance, maxBuy) : TV.ZERO}
          setAmount={setAmountIn}
          setToken={setTokenIn}
          setBalanceFrom={setBalanceFrom}
          setError={setInputError}
          selectedToken={tokenIn}
          error={inputError}
          transformTokenLabels={fromSilo ? transformTokenLabels : undefined}
          tokenAndBalanceMap={fromSilo ? depositedByWhitelistedToken : undefined}
          balanceFrom={fromSilo ? undefined : balanceFrom}
          disableButton={isConfirming}
          connectedAccount={!!account.address}
          altText={balanceExceedsSoil ? "Usable balance:" : undefined}
          filterTokens={filterTokens}
          disableClamping={true}
        />
      </div>
      <Row className="justify-between mt-2">
        <div className="pinto-sm sm:pinto-body-light sm:text-pinto-light text-pinto-light">Use Silo deposits</div>
        <TextSkeleton loading={false} className="w-11 h-6">
          <Switch checked={tokenSource === "deposits"} onCheckedChange={handleOnCheckedChange} />
        </TextSkeleton>
      </Row>
      <AnimatePresence mode="wait">
        {(isLoading || ready) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: animationHeight }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.1 }}
            className="relative overflow-hidden"
          >
            {isLoading ? (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <FrameAnimator size={64} />
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-6 px-2">
                  <OutputDisplay>
                    <OutputDisplay.Item label="Pods">
                      <OutputDisplay.Value value={formatter.token(pods, PODS)} token={PODS} suffix={PODS.symbol} />
                    </OutputDisplay.Item>
                    <OutputDisplay.Item label="Place in line">
                      <OutputDisplay.Value value={formatter.noDec(podLine)} />
                    </OutputDisplay.Item>
                    {fromSilo ? (
                      <>
                        <OutputDisplay.Item label="Stalk">
                          <OutputDisplay.Value
                            value={formatter.token(withdrawBreakdown?.stalk, STALK)}
                            delta="down"
                            suffix="Stalk"
                            token={STALK}
                            showArrow
                          />
                        </OutputDisplay.Item>
                        <OutputDisplay.Item label="Seed">
                          <OutputDisplay.Value
                            value={formatter.token(withdrawBreakdown?.seeds, SEEDS)}
                            token={SEEDS}
                            delta="down"
                            suffix="Seeds"
                            showArrow
                          />
                        </OutputDisplay.Item>
                      </>
                    ) : null}
                  </OutputDisplay>
                </div>
                <div className="flex flex-col gap-0">
                  <Col className="gap-4">
                    {!hasSoil && <Warning>Your usable balance is 0.00 because there is no Soil available.</Warning>}
                    <Warning>Pods become redeemable for Pinto 1:1 when they reach the front of the Pod Line.</Warning>
                  </Col>
                  {!tokenIn.isMain && swapSummary?.swap && (
                    <RoutingAndSlippageInfo
                      title="Total Swap Slippage"
                      swapSummary={swapSummary}
                      preferredSummary="swap"
                      txnType="Swap"
                      tokenIn={tokenIn}
                      tokenOut={mainToken}
                    />
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {slippageWarning}
      <div className="hidden sm:flex flex-row gap-2">
        <SmartSubmitButton
          variant={isMorning ? "morning" : "gradient"}
          disabled={ctaDisabled}
          token={!fromSilo ? tokenIn : undefined}
          amount={!fromSilo ? amountIn : undefined}
          balanceFrom={!fromSilo ? balanceFrom : undefined}
          submitFunction={onSubmit}
          submitButtonText={buttonText}
        />
      </div>
      <MobileActionBar>
        <SmartSubmitButton
          variant={isMorning ? "morning" : "gradient"}
          disabled={ctaDisabled}
          token={!fromSilo ? tokenIn : undefined}
          amount={!fromSilo ? amountIn : undefined}
          balanceFrom={!fromSilo ? balanceFrom : undefined}
          submitFunction={onSubmit}
          submitButtonText={buttonText}
          className="h-full"
        />
      </MobileActionBar>
    </Col>
  );
}

export default Sow;

// ------------------------------ SETTINGS POPOVER ------------------------------

const SettingsPoppover = ({
  slippage,
  setSlippage,
  minTemperature,
  setMinTemperature,
}: {
  slippage: number;
  setSlippage: React.Dispatch<React.SetStateAction<number>>;
  minTemperature: number;
  setMinTemperature: React.Dispatch<React.SetStateAction<number>>;
}) => {
  const [internalAmount, setInternalAmount] = useState(slippage);
  const [internalMinTemperature, setInternalMinTemperature] = useState(minTemperature);

  // Effects
  useDebouncedEffect(() => setSlippage(internalAmount), [internalAmount], 100);
  useDebouncedEffect(() => setMinTemperature(internalMinTemperature), [internalMinTemperature], 100);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant={"ghost"} noPadding className="rounded-full w-10 h-10 ">
          <img src={settingsIcon} className="w-4 h-4 transition-all" alt="slippage" />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="end" className="w-52 flex flex-col shadow-none">
        <div className="flex flex-col gap-4">
          <div className="pinto-md">Slippage Tolerance</div>
          <div className="flex flex-row gap-2">
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              value={internalAmount}
              onChange={(e) => setInternalAmount(Number(e.target.value))}
            />
            <div className="text-xl self-center">%</div>
          </div>
          <div className="pinto-md">Minimum Temperature</div>
          <div className="flex flex-row gap-2">
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              value={internalMinTemperature}
              onChange={(e) => setInternalMinTemperature(Number(e.target.value))}
            />
            <div className="text-xl self-center">%</div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

// ------------------------------ Types ------------------------------

type TokenSource = "deposits" | "balances";

// ------------------------------ Hooks ------------------------------

const useFilterTokens = (mode: TokenSource) => {
  const tokenMap = useTokenMap();
  return useMemo(() => {
    const set = new Set<Token>();

    Object.values(tokenMap).forEach((token) => {
      if (mode === "balances") {
        if (token.isLP || token.isSiloWrapped || token.is3PSiloWrapped) {
          set.add(token);
        }
      } else if (mode === "deposits") {
        if (token.isSiloWrapped || token.is3PSiloWrapped || (!token.isLP && !token.isMain)) {
          set.add(token);
        }
      }
    });
    return set;
  }, [tokenMap, mode]);
};

const useMapSiloDepositsToAmounts = (deposits: ReturnType<typeof useFarmerSilo>["deposits"]) => {
  const tokenMap = useTokenMap();

  return useMemo(
    () =>
      Object.values(tokenMap).reduce<Map<Token, TV>>(
        (acc, curr) => acc.set(curr, deposits.get(curr)?.amount ?? TV.ZERO),
        new Map(),
      ),
    [deposits, tokenMap],
  );
};

const useWithdrawDepositBreakdown = (
  deposits: ReturnType<typeof useFarmerSilo>["deposits"],
  token: Token,
  amountIn: string | undefined,
  enabled: boolean,
) => {
  const tokenDeposits = useMemo(() => deposits.get(token), [deposits, token]);

  const [breakdown, setBreakdown] = useState<ReturnType<typeof sortAndPickCrates> | undefined>(undefined);

  const inputAmount = stringToStringNum(amountIn ?? "0");

  useEffect(() => {
    if (!enabled || inputAmount === "0") {
      setBreakdown(undefined);
      return;
    }

    if (!tokenDeposits || !tokenDeposits?.deposits.length) return;

    // Take the minimum of the amount in and the amount in the deposits
    // If the amount is greater than amount deposited, sortAndPickCrates will throw
    const amount = TV.min(TV.fromHuman(stringToStringNum(inputAmount ?? "0"), token.decimals), tokenDeposits.amount);

    setBreakdown(sortAndPickCrates("withdraw", amount, tokenDeposits.deposits));
  }, [inputAmount, tokenDeposits, enabled, token]);

  return breakdown;
};

// ------------------------------ Functions ------------------------------

const transformTokenLabels = (token: Token) => {
  return {
    label: `Dep. ${token.symbol}`,
    sublabel: `Silo Deposited ${token.name}`,
  };
};

// TODO: This is hard to maintain and not that generic...
const heightMapping = {
  fromSilo: {
    isMain: { 0: "20rem", 1: "25.5rem" },
    notMain: { 0: "25.5rem", 1: "31rem" },
  },
  fromBalance: {
    isMain: { 0: "13.75rem", 1: "19rem" },
    notMain: { 0: "19.25rem", 1: "24.5rem" },
  },
} as const;

const getAnimateHeight = (args: {
  fromSilo: boolean;
  hasSoil: boolean;
  tokenIn: Token;
}) => {
  const { fromSilo, hasSoil, tokenIn } = args;

  const baseKey = fromSilo ? "fromSilo" : "fromBalance";
  const isMainKey = tokenIn.isMain ? "isMain" : "notMain";
  const soilKey = !hasSoil ? 1 : 0;

  return heightMapping[baseKey]?.[isMainKey]?.[soilKey] ?? "auto";
};
