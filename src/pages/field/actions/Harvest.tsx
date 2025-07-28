import { TokenValue } from "@/classes/TokenValue";
import MobileActionBar from "@/components/MobileActionBar";
import SmartSubmitButton from "@/components/SmartSubmitButton";
import IconImage from "@/components/ui/IconImage";
import { PODS } from "@/constants/internalTokens";
import deposit from "@/encoders/deposit";
import harvest from "@/encoders/harvest";
import { beanstalkAbi } from "@/generated/contractHooks";
import { useProtocolAddress } from "@/hooks/pinto/useProtocolAddress";
import useTransaction from "@/hooks/useTransaction";
import { useFarmerBalances } from "@/state/useFarmerBalances";
import { useFarmerField } from "@/state/useFarmerField";
import { useHarvestableIndex, useInvalidateField } from "@/state/useFieldData";
import { usePriceData } from "@/state/usePriceData";
import useTokenData from "@/state/useTokenData";
import { formatter } from "@/utils/format";
import { AdvancedFarmCall, FarmFromMode, FarmToMode } from "@/utils/types";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAccount } from "wagmi";

type HarvestProps = {
  isMorning: boolean;
};

function Harvest({ isMorning }: HarvestProps) {
  const account = useAccount();

  const tokenData = useTokenData();
  const mainToken = tokenData.mainToken;
  const diamond = useProtocolAddress();
  const harvestableIndex = useHarvestableIndex();
  const priceData = usePriceData();
  const queryClient = useQueryClient();
  const invalidateField = useInvalidateField();
  const { plots: fieldPlots, queryKeys } = useFarmerField();
  const balances = useFarmerBalances();

  const { plots, harvestableAmount } = useMemo(() => {
    let harvestable = TokenValue.ZERO;
    const _plots: string[] = [];
    fieldPlots.forEach((plot) => {
      if (plot.harvestablePods.gt(0) && plot.id) {
        _plots.push(plot.index.blockchainString);
      }
      harvestable = harvestable.add(plot.harvestablePods);
    });
    return { plots: _plots, harvestableAmount: harvestable };
  }, [fieldPlots]);

  const { writeWithEstimateGas, isConfirming, submitting, setSubmitting } = useTransaction({
    successCallback: () => {
      queryKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
      balances.queryKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
      invalidateField("podLine");
    },
  });

  const onSubmit = useCallback(async () => {
    setSubmitting(true);
    try {
      if (!account.address) throw new Error("Signer required");
      if (!plots.length) throw new Error("No plots to harvest");
      if (harvestableAmount.lte(0)) throw new Error("No harvestable pods");
      toast.loading("Harvesting and depositing...");

      const advFarm: AdvancedFarmCall[] = [];

      // Step 1: Harvest to INTERNAL balance
      const harvestStruct = harvest(
        0n, // fieldId
        plots,
        FarmToMode.INTERNAL, // Always to internal balance
      );
      advFarm.push(harvestStruct);

      // Step 2: Deposit from INTERNAL balance to Silo
      const depositStruct = deposit(
        mainToken,
        harvestableAmount,
        FarmFromMode.INTERNAL, // From internal balance
      );
      advFarm.push(depositStruct);

      return writeWithEstimateGas({
        address: diamond,
        abi: beanstalkAbi,
        functionName: "advancedFarm",
        args: [advFarm],
      });
    } catch (e) {
      setSubmitting(false);
      console.error(e);
      toast.dismiss();
      toast.error(e instanceof Error ? e.message : "Transaction failed.");
      throw e;
    } finally {
      setSubmitting(false);
    }
  }, [account.address, plots, harvestableAmount, writeWithEstimateGas, diamond, setSubmitting, mainToken]);

  const nextHarvestablePlot = fieldPlots?.[0];

  const nextHarvestablePlaceInLine = nextHarvestablePlot?.index.sub(harvestableIndex);

  return (
    <div className="flex flex-col gap-6 pt-2">
      {harvestableAmount.gt(0) ? (
        <>
          <div className="flex flex-col">
            <div className="flex flex-col gap-1">
              <div className="pinto-body-light text-pinto-light">You will receive in Silo</div>
              <div className="flex flex-row gap-2 items-center">
                <div className="pinto-h3 inline-flex gap-1 items-center">
                  {formatter.token(harvestableAmount, mainToken)}
                </div>
                <div className="pinto-h4 font-light inline-flex gap-1 items-center mt-1">
                  <IconImage size={6} nudge={2} src={mainToken.logoURI} />
                  {mainToken.name}
                </div>
              </div>
              <div className="pinto-sm text-pinto-light">{formatter.usd(harvestableAmount.mul(priceData.price))}</div>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="pinto-body-light text-pinto-light">
              Your Pods will be harvested and automatically deposited into the Silo for yield generation.
            </div>
          </div>
        </>
      ) : (
        <div className="pinto-body-light text-pinto-light text-center py-6">
          Your Pods become Harvestable when they reach a Place in Line of 0.{" "}
          {nextHarvestablePlaceInLine?.gt(0)
            ? `Your next Plot is at ${formatter.noDec(nextHarvestablePlaceInLine)} in Line.`
            : ""}
        </div>
      )}
      <SmartSubmitButton
        variant={isMorning ? "morning" : "gradient"}
        type="button"
        token={undefined}
        disabled={harvestableAmount.eq(0) || isConfirming || submitting}
        submitFunction={onSubmit}
        submitButtonText="Harvest & Deposit"
        className="hidden sm:flex"
      />
      <MobileActionBar>
        <SmartSubmitButton
          variant={isMorning ? "morning" : "gradient"}
          type="button"
          token={undefined}
          disabled={harvestableAmount.eq(0) || isConfirming || submitting}
          submitFunction={onSubmit}
          submitButtonText="Harvest & Deposit"
          className="h-full"
        />
      </MobileActionBar>
    </div>
  );
}

export default Harvest;
