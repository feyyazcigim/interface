import { mockAddressAtom } from "@/Web3Provider";
import pintoIcon from "@/assets/tokens/PINTO.png";
import { WarningIcon } from "@/components/Icons";
import ReviewTractorOrderDialog from "@/components/ReviewTractorOrderDialog";
import { diamondABI } from "@/constants/abi/diamondABI";

import { TokenValue } from "@/classes/TokenValue";
import { Col, Row } from "@/components/Container";
import TooltipSimple from "@/components/TooltipSimple";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/Dialog";
import { useProtocolAddress } from "@/hooks/pinto/useProtocolAddress";
import { useGetTractorTokenStrategyWithBlueprint } from "@/hooks/tractor/useGetTractorTokenStrategy";
import useSowOrderV0Calculations from "@/hooks/tractor/useSowOrderV0Calculations";
import useTransaction from "@/hooks/useTransaction";
import { createBlueprint, createRequisition, useGetBlueprintHash, useSignRequisition } from "@/lib/Tractor/blueprint";
import { Blueprint, TractorTokenStrategy } from "@/lib/Tractor/types";
import { RequisitionEvent, createSowTractorData, getSowOrderTokenStrategy } from "@/lib/Tractor/utils";
import useTractorOperatorAverageTipPaid from "@/state/tractor/useTractorOperatorAverageTipPaid";
import { useFarmerSilo } from "@/state/useFarmerSilo";
import { usePodLine, useTemperature } from "@/state/useFieldData";
import useTokenData from "@/state/useTokenData";
import { formatter } from "@/utils/format";
import { isValidAddress, stringEq } from "@/utils/string";
import { isLocalhost } from "@/utils/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { encodeFunctionData } from "viem";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { Form } from "../Form";
import TractorTokenStrategyDialog from "./TractorTokenStrategyDialog";
import SowOrderV0Fields from "./form/SowOrderV0Fields";
import { SowOrderV0FormSchema, useSowOrderV0Form } from "./form/SowOrderV0Schema";

interface ModifyTractorOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderModified?: () => void;
  existingOrder: RequisitionEvent;
  // pass in as a prop to ensure data is loaded before the dialog is opened
  getStrategyProps: ReturnType<typeof useGetTractorTokenStrategyWithBlueprint>;
}

type OrderData = {
  totalAmount: string;
  temperature: string;
  podLineLength: string;
  minSoil: string;
  operatorTip: string;
  morningAuction: boolean;
  tokenStrategy: TractorTokenStrategy["type"];
  tokenSymbol: string | undefined;
};

function ModifySowV0Form({
  handleOpenTokenSelectionDialog,
  averageTipPaid,
}: { handleOpenTokenSelectionDialog: () => void; averageTipPaid: number }) {
  return (
    <>
      <SowOrderV0Fields>
        {/* I want to Sow up to */}
        <SowOrderV0Fields.TotalAmount />
        {/* Min and Max per Season - combined in a single row */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-4">
            <SowOrderV0Fields.MinSoil />
            <SowOrderV0Fields.MaxPerSeason />
          </div>
        </div>
        {/* Fund order using */}
        <SowOrderV0Fields.TokenStrategy openDialog={handleOpenTokenSelectionDialog} />
        {/* Execute when Temperature is at least */}
        <SowOrderV0Fields.Temperature />
        {/* Execute when the length of the Pod Line is at most */}
        <SowOrderV0Fields.PodLineLength />
        {/* Execute during the Morning Auction */}
        <SowOrderV0Fields.MorningAuction />
        <SowOrderV0Fields.OperatorTip averageTipPaid={averageTipPaid} />
        <SowOrderV0Fields.ExecutionsAndTip />
      </SowOrderV0Fields>
    </>
  );
}

export default function ModifyTractorOrderDialog({
  open,
  onOpenChange,
  onOrderModified,
  existingOrder,
  getStrategyProps,
}: ModifyTractorOrderDialogProps) {
  const podLine = usePodLine();
  const currentTemperature = useTemperature();
  const { address } = useAccount();
  const protocolAddress = useProtocolAddress();
  const { data: averageTipValue = 1 } = useTractorOperatorAverageTipPaid();

  // Use shared form hook
  const { form, getMissingFields, getAreAllFieldsValid, prefillValues } = useSowOrderV0Form();

  // Use shared calculations hook
  const calculations = useSowOrderV0Calculations();

  const [showTokenSelectionDialog, setShowTokenSelectionDialog] = useState(false);

  // Pre-fill form with existing order data
  const [didPrefill, setDidPrefill] = useState(false);
  useEffect(() => {
    if (didPrefill || getStrategyProps.isLoading || !existingOrder.decodedData) return;

    if (open) {
      const data = existingOrder.decodedData;
      const tokenStrategy = getStrategyProps.getTokenStrategy(data);

      prefillValues({
        totalAmount: data.sowAmounts.totalAmountToSowAsString,
        minSoil: data.sowAmounts.minAmountToSowPerSeasonAsString,
        maxPerSeason: data.sowAmounts.maxAmountToSowPerSeasonAsString,
        temperature: data.minTempAsString,
        podLineLength: data.maxPodlineLengthAsString,
        operatorTip: data.operatorParams.operatorTipAmountAsString,
        morningAuction: data.runBlocksAfterSunrise === 0n,
        selectedTokenStrategy: tokenStrategy ?? { type: "LOWEST_SEEDS" as const },
      });
      setDidPrefill(true);
    }
  }, [open, existingOrder, didPrefill, prefillValues]);

  // State for dialog management
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [encodedData, setEncodedData] = useState<`0x${string}` | null>(null);
  const [operatorPasteInstructions, setOperatorPasteInstructions] = useState<`0x${string}`[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [orderData, setOrderData] = useState<OrderData | undefined>(undefined);

  const publicClient = usePublicClient();
  const queryClient = useQueryClient();
  const farmerSilo = useFarmerSilo();
  const farmerDeposits = farmerSilo.deposits;

  const { whitelistedTokens } = useTokenData();

  // Transaction handling for the cancel + create flow
  const { writeWithEstimateGas, submitting, setSubmitting } = useTransaction({
    successMessage: "Order modified successfully",
    errorMessage: "Failed to modify order",
    successCallback: () => {
      queryClient.invalidateQueries();
      onOpenChange(false);
      if (onOrderModified) {
        onOrderModified();
      }
    },
  });

  // Handle creating the modified order
  const handleNext = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    const isValid = await form.trigger();

    if (!isValid) {
      return;
    }

    try {
      console.time("handleNext total");
      setIsLoading(true);

      if (!publicClient) {
        throw new Error("No public client available");
      }

      if (!address) {
        throw new Error("Please connect your wallet");
      }

      const formState = form.getValues();

      const { data, operatorPasteInstrs, rawCall } = await createSowTractorData({
        totalAmountToSow: formState.totalAmount || "0",
        temperature: formState.temperature || "0",
        minAmountPerSeason: formState.minSoil || "0",
        maxAmountToSowPerSeason: formState.maxPerSeason || "0",
        maxPodlineLength: formState.podLineLength || formatter.number(podLine).replace(/,/g, ""),
        maxGrownStalkPerBdv: "10000000000000000",
        runBlocksAfterSunrise: formState.morningAuction ? "0" : "300",
        operatorTip: formState.operatorTip || "0",
        whitelistedOperators: [],
        tokenStrategy: formState.selectedTokenStrategy as TractorTokenStrategy,
        publicClient,
      });

      const newBlueprint = createBlueprint({
        publisher: address,
        data,
        operatorPasteInstrs,
        maxNonce: TokenValue.MAX_UINT256.toBigInt(),
      });

      const tokenSymbol =
        formState.selectedTokenStrategy?.type === "SPECIFIC_TOKEN"
          ? whitelistedTokens.find((t) => stringEq(t.address, formState.selectedTokenStrategy?.address))?.symbol
          : undefined;

      setOrderData({
        totalAmount: formState.totalAmount,
        temperature: formState.temperature,
        podLineLength: formState.podLineLength,
        minSoil: formState.minSoil,
        operatorTip: formState.operatorTip,
        morningAuction: formState.morningAuction,
        tokenStrategy: formState.selectedTokenStrategy.type,
        tokenSymbol: tokenSymbol,
      });

      console.log({
        newBlueprint,
        rawCall,
        operatorPasteInstrs,
      });
      setBlueprint(newBlueprint);
      setEncodedData(rawCall);
      setOperatorPasteInstructions(operatorPasteInstrs);
      setShowReview(true);
      console.timeEnd("handleNext total");
    } catch (e) {
      console.error("Error creating sow tractor data:", e);
      toast.error("Failed to create order");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle back button
  const handleBack = () => {
    onOpenChange(false);
  };

  if (!open) return null;

  const missingFields = getMissingFields();

  const allFieldsValid = getAreAllFieldsValid();

  const isMissingFields = missingFields.length > 0;

  const nextDisabled = isLoading || isMissingFields || !allFieldsValid;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogPortal>
          <DialogOverlay className="fixed inset-0 backdrop-blur-[2px] bg-white/50" />
          <DialogContent className="max-w-[35rem] p-6 max-h-[80vh] overflow-y-auto">
            <Col className="gap-6">
              <DialogHeader>
                <DialogTitle className="font-normal text-[1.25rem] tracking-normal">Modify Tractor Order</DialogTitle>
                <DialogDescription className="pinto-sm-light text-pinto-light">
                  <p>
                    Update your existing Tractor Order. The current order will be cancelled and a new one will be
                    created with your updated conditions.
                  </p>
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <div className="flex flex-col gap-6">
                  {/* Main Form */}
                  <div className="flex flex-col gap-2">
                    <div className="pinto-body font-medium text-pinto-secondary mb-4">
                      🚜 Update Conditions for automated Sowing
                    </div>
                    <div className="h-[1px] w-full bg-pinto-gray-2" />
                  </div>
                  <ModifySowV0Form
                    handleOpenTokenSelectionDialog={() => setShowTokenSelectionDialog(true)}
                    averageTipPaid={averageTipValue}
                  />

                  <Row className="gap-6">
                    <Button
                      variant="outline"
                      size="xlargest"
                      rounded="full"
                      className="flex-1 text-pinto-light bg-pinto-gray-1"
                      onClick={handleBack}
                      type="button"
                    >
                      ← Back
                    </Button>
                    <TooltipSimple
                      content={
                        isMissingFields ? (
                          <div className="p-1">
                            <div className="font-medium mb-1">Please fill in the following fields:</div>
                            <ul className="list-disc pl-4 text-sm">
                              {missingFields.map((field) => (
                                <li key={field}>{field}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null
                      }
                      side="top"
                      align="center"
                      // Only show tooltip when there are missing fields or errors
                      disabled={!isMissingFields}
                    >
                      <div className="flex-1">
                        <Button
                          size="xlargest"
                          rounded="full"
                          className={`w-full ${
                            isLoading ? "bg-pinto-gray-2 text-pinto-light" : "bg-pinto-green-4 text-white"
                          }`}
                          disabled={nextDisabled}
                          onClick={handleNext}
                          type="button"
                        >
                          {isLoading ? (
                            <div className="flex items-center gap-2">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                            </div>
                          ) : (
                            "Review"
                          )}
                        </Button>
                      </div>
                    </TooltipSimple>
                  </Row>
                </div>

                {/* Token Selection Dialog */}
                <SowOrderV0TokenStrategyDialog
                  open={showTokenSelectionDialog}
                  onOpenChange={setShowTokenSelectionDialog}
                  farmerDeposits={farmerDeposits}
                  calculations={calculations}
                />
              </Form>
            </Col>
          </DialogContent>
        </DialogPortal>
      </Dialog>

      {showReview && encodedData && operatorPasteInstructions && blueprint && orderData && (
        <ModifyTractorOrderReviewDialog
          open={showReview}
          onOpenChange={setShowReview}
          onSuccess={() => {
            onOpenChange(false);
            if (onOrderModified) {
              onOrderModified();
            }
          }}
          existingOrder={existingOrder}
          orderData={orderData}
          encodedData={encodedData}
          operatorPasteInstrs={operatorPasteInstructions}
          blueprint={blueprint}
        />
      )}
    </>
  );
}

const SowOrderV0TokenStrategyDialog = ({
  open,
  onOpenChange,
  farmerDeposits,
  calculations,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  farmerDeposits: ReturnType<typeof useFarmerSilo>["deposits"];
  calculations: ReturnType<typeof useSowOrderV0Calculations>;
}) => {
  const ctx = useFormContext<SowOrderV0FormSchema>();

  // Use useWatch instead of ctx.watch to only watch this specific field
  const selectedTokenStrategy = useWatch({
    control: ctx.control,
    name: "selectedTokenStrategy",
  });

  // Memoize the callback to prevent recreating on every render
  const handleTokenStrategySelected = (tokenStrategy: TractorTokenStrategy) => {
    ctx.setValue("selectedTokenStrategy", tokenStrategy);
    onOpenChange(false);
  };

  return (
    <TractorTokenStrategyDialog
      open={open}
      onOpenChange={onOpenChange}
      onTokenStrategySelected={handleTokenStrategySelected}
      selectedTokenStrategy={selectedTokenStrategy as TractorTokenStrategy}
      farmerDeposits={farmerDeposits}
      {...calculations}
    />
  );
};

// Create a specialized review dialog for modify operations
interface ModifyTractorOrderReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  existingOrder: RequisitionEvent;
  orderData: OrderData;
  encodedData: `0x${string}`;
  operatorPasteInstrs: `0x${string}`[];
  blueprint: Blueprint;
}

function ModifyTractorOrderReviewDialog({
  open,
  onOpenChange,
  onSuccess,
  existingOrder,
  orderData,
  encodedData,
  operatorPasteInstrs,
  blueprint,
}: ModifyTractorOrderReviewDialogProps) {
  const { address } = useAccount();
  const protocolAddress = useProtocolAddress();
  const queryClient = useQueryClient();
  const { data: walletClient } = useWalletClient();
  const [isLoading, setIsLoading] = useState(false);
  const [signedRequisitionData, setSignedRequisitionData] = useState<any>(null);

  // Use the imported Tractor utilities
  const { data: blueprintHash } = useGetBlueprintHash(blueprint);
  const signRequisition = useSignRequisition();

  // Transaction handling for the cancel + create flow
  const { writeWithEstimateGas, submitting, setSubmitting } = useTransaction({
    successMessage: "Order modified successfully",
    errorMessage: "Failed to modify order",
    successCallback: () => {
      queryClient.invalidateQueries();
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    },
  });

  const handleSignBlueprint = async () => {
    if (!address) return;

    if (!blueprintHash) {
      toast.error("Blueprint hash not ready yet, please try again in a moment");
      return;
    }

    try {
      setIsLoading(true);
      // Create and sign the requisition using the hash
      const requisition = createRequisition(blueprint, blueprintHash);
      const signedRequisition = await signRequisition(requisition);

      // Store the signed requisition data
      setSignedRequisitionData(signedRequisition);
      toast.success("Blueprint signed successfully");
    } catch (error) {
      console.error("Error signing blueprint:", error);
      toast.error("Failed to sign blueprint");
    } finally {
      setIsLoading(false);
    }
  };

  const handleModifyOrder = async () => {
    if (!address || !protocolAddress) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!signedRequisitionData?.signature) {
      toast.error("Please sign the blueprint first");
      return;
    }

    try {
      setSubmitting(true);
      toast.loading("Modifying order...");

      // Create the farm call data that cancels the old order and creates the new one
      const farmCalls = [
        // Cancel the existing order
        encodeFunctionData({
          abi: diamondABI,
          functionName: "cancelBlueprint",
          args: [existingOrder.requisition],
        }),
        // Create the new order (publish requisition)
        encodeFunctionData({
          abi: diamondABI,
          functionName: "publishRequisition",
          args: [signedRequisitionData],
        }),
      ];

      // Execute the farm transaction
      await writeWithEstimateGas({
        address: protocolAddress,
        abi: diamondABI,
        functionName: "farm",
        args: [farmCalls],
      });

      toast.success("Order modified successfully");
    } catch (error) {
      console.error("Error modifying order:", error);
      toast.error("Failed to modify order");
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 backdrop-blur-[2px] bg-white/50" />
        <DialogContent className="max-w-[98rem] w-[95vw] sm:max-w-[600px] p-0 sm:p-0">
          <Col className="gap-3 pb-3">
            <DialogHeader>
              <DialogTitle className="font-normal text-[1.25rem] tracking-normal px-6 pt-6">
                Review Order Modification
              </DialogTitle>
              <DialogDescription className="px-6 pinto-sm-light text-pinto-light">
                <p>
                  Your existing Tractor Order will be cancelled and replaced with this new order. This happens in a
                  single transaction to ensure atomicity.
                </p>
              </DialogDescription>
            </DialogHeader>

            <div className="px-6">
              {/* Show a comparison of old vs new */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h3 className="font-medium mb-2">Order Changes</h3>
                <div className="space-y-2 text-sm">
                  {/* Show differences between old and new order */}
                  <div className="space-y-2 text-sm">
                    <div>
                      Total Amount: {existingOrder.decodedData?.sowAmounts.totalAmountToSowAsString}{" "}
                      {(existingOrder.decodedData?.sowAmounts.totalAmountToSowAsString?.replace(/,/g, "") || "") !==
                        (orderData.totalAmount?.replace(/,/g, "") || "") && "→"}{" "}
                      {(existingOrder.decodedData?.sowAmounts.totalAmountToSowAsString?.replace(/,/g, "") || "") !==
                        (orderData.totalAmount?.replace(/,/g, "") || "") && `${orderData.totalAmount} Pinto`}
                    </div>
                    <div>
                      Pod Line Length: {existingOrder.decodedData?.maxPodlineLengthAsString}{" "}
                      {(existingOrder.decodedData?.maxPodlineLengthAsString?.replace(/,/g, "") || "") !==
                        (orderData.podLineLength?.replace(/,/g, "") || "") && "→"}{" "}
                      {(existingOrder.decodedData?.maxPodlineLengthAsString?.replace(/,/g, "") || "") !==
                        (orderData.podLineLength?.replace(/,/g, "") || "") && `${orderData.podLineLength} Pods`}
                    </div>
                    <div>
                      Temperature: {existingOrder.decodedData?.minTempAsString}%{" "}
                      {(existingOrder.decodedData?.minTempAsString?.replace(/,/g, "") || "") !==
                        (orderData.temperature?.replace(/,/g, "") || "") && "→"}{" "}
                      {(existingOrder.decodedData?.minTempAsString?.replace(/,/g, "") || "") !==
                        (orderData.temperature?.replace(/,/g, "") || "") && `${orderData.temperature}%`}
                    </div>
                    <div>
                      Operator Tip: {existingOrder.decodedData?.operatorParams.operatorTipAmountAsString}{" "}
                      {(existingOrder.decodedData?.operatorParams.operatorTipAmountAsString?.replace(/,/g, "") ||
                        "") !== (orderData.operatorTip?.replace(/,/g, "") || "") && "→"}{" "}
                      {(existingOrder.decodedData?.operatorParams.operatorTipAmountAsString?.replace(/,/g, "") ||
                        "") !== (orderData.operatorTip?.replace(/,/g, "") || "") && `${orderData.operatorTip} Pinto`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <Row className="justify-between items-center">
                <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 mr-2">
                  Cancel
                </Button>

                {!signedRequisitionData ? (
                  <Button variant="gradient" onClick={handleSignBlueprint} disabled={isLoading} className="flex-1 ml-2">
                    {isLoading ? "Signing..." : "Sign New Order"}
                  </Button>
                ) : (
                  <Button variant="gradient" onClick={handleModifyOrder} disabled={submitting} className="flex-1 ml-2">
                    {submitting ? "Modifying..." : "Modify Order"}
                  </Button>
                )}
              </Row>
            </div>
          </Col>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
