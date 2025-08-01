import { TokenValue } from "@/classes/TokenValue";
import deposit from "@/encoders/deposit";
import harvest from "@/encoders/harvest";
import { beanstalkAbi } from "@/generated/contractHooks";
import { useProtocolAddress } from "@/hooks/pinto/useProtocolAddress";
import { useFarmerBalances } from "@/state/useFarmerBalances";
import { useFarmerField } from "@/state/useFarmerField";
import { useFarmerSilo } from "@/state/useFarmerSilo";
import { useInvalidateField } from "@/state/useFieldData";
import { useSiloData } from "@/state/useSiloData";
import useTokenData from "@/state/useTokenData";
import { AdvancedFarmCall, FarmFromMode, FarmToMode } from "@/utils/types";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { useAccount } from "wagmi";
import useTransaction from "./useTransaction";

export function useHarvestAndDeposit() {
  const account = useAccount();
  const queryClient = useQueryClient();
  const diamond = useProtocolAddress();
  const tokenData = useTokenData();
  const mainToken = tokenData.mainToken;

  // State hooks
  const { plots: fieldPlots, queryKeys: fieldQueryKeys } = useFarmerField();
  const farmerBalances = useFarmerBalances();
  const farmerSilo = useFarmerSilo();
  const siloData = useSiloData();
  const invalidateField = useInvalidateField();

  // Calculate harvestable data
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

  // Calculate stalk and seed gains from deposit
  const { stalkGain, seedGain } = useMemo(() => {
    if (harvestableAmount.lte(0)) {
      return { stalkGain: TokenValue.ZERO, seedGain: TokenValue.ZERO };
    }

    const sData = siloData.tokenData.get(mainToken);
    if (!sData) {
      return { stalkGain: TokenValue.ZERO, seedGain: TokenValue.ZERO };
    }

    const stalkGain = harvestableAmount.mul(sData.rewards.stalk).mul(sData.tokenBDV);
    const seedGain = harvestableAmount.mul(sData.rewards.seeds).mul(sData.tokenBDV);

    return { stalkGain, seedGain };
  }, [harvestableAmount, siloData.tokenData, mainToken]);

  const onSuccess = useCallback(() => {
    // Invalidate all related queries to update UI values
    fieldQueryKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
    farmerBalances.queryKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
    farmerSilo.queryKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
    siloData.queryKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
    invalidateField("podLine");
  }, [
    queryClient,
    fieldQueryKeys,
    farmerBalances.queryKeys,
    farmerSilo.queryKeys,
    siloData.queryKeys,
    invalidateField,
  ]);

  const { writeWithEstimateGas, isConfirming, submitting, setSubmitting } = useTransaction({
    successMessage: "Harvest complete!",
    successCallback: onSuccess,
  });

  const submitHarvestAndDeposit = useCallback(async () => {
    try {
      if (!account.address) throw new Error("Signer required");
      if (!plots.length) throw new Error("No plots to harvest");
      if (harvestableAmount.lte(0)) throw new Error("No harvestable pods");

      setSubmitting(true);
      toast.loading("Harvesting...");

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
    } catch (e: unknown) {
      console.error(e);
      setSubmitting(false);
      toast.dismiss();
      toast.error(e instanceof Error ? e.message : "Transaction failed.");
      throw e;
    } finally {
      setSubmitting(false);
    }
  }, [account.address, plots, harvestableAmount, writeWithEstimateGas, diamond, mainToken]);

  return {
    submitHarvestAndDeposit,
    isSubmitting: submitting || isConfirming,
    harvestableAmount,
    hasHarvestablePods: harvestableAmount.gt(0),
    stalkGain,
    seedGain,
  };
}
