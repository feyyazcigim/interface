import { Form } from "@/components/Form";
import ReviewTractorOrderDialog from "@/components/ReviewTractorOrderDialog";
import { sowOrderSchemaErrors, useSowOrderV0Form } from "@/components/Tractor/form/SowOrderV0Schema";
import { useProtocolAddress } from "@/hooks/pinto/useProtocolAddress";
import useSowOrderV0Calculations from "@/hooks/tractor/useSowOrderV0Calculations";
import {
  Blueprint,
  SowOrderTokenStrategy,
  TractorTokenStrategy,
  createBlueprint,
  createSowTractorData,
} from "@/lib/Tractor";
import useTractorOperatorAverageTipPaid from "@/state/tractor/useTractorOperatorAverageTipPaid";
import { useFarmerSilo } from "@/state/useFarmerSilo";
import { usePodLine } from "@/state/useFieldData";
import useTokenData from "@/state/useTokenData";
import { formatter } from "@/utils/format";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAccount, usePublicClient } from "wagmi";
import { Col, Row } from "./Container";
import TooltipSimple from "./TooltipSimple";
import TractorTokenStrategyDialog from "./Tractor/TractorTokenStrategyDialog";
import SowOrderV0Fields from "./Tractor/form/SowOrderV0Fields";
import { Button } from "./ui/Button";
import Warning from "./ui/Warning";

interface SowOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderPublished?: () => void;
}

// Types
enum FormStep {
  MAIN_FORM = 1,
  OPERATOR_TIP = 2,
}

interface SowOrderDialogState {
  formStep: FormStep;
  isLoading: boolean;
  showTokenSelectionDialog: boolean;
  showReview: boolean;
  didInitOperatorTip: boolean;
  didInitTokenStrategy: boolean;
}

export default function SowOrderDialog({ open, onOpenChange, onOrderPublished }: SowOrderDialogProps) {
  // External hooks
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const protocolAddress = useProtocolAddress();
  const podLine = usePodLine();
  const { whitelistedTokens } = useTokenData();
  const farmerSilo = useFarmerSilo();
  const { data: averageTipPaid = 1, isLoading: isLoadingAverageTipPaid } = useTractorOperatorAverageTipPaid();

  // Local state
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [encodedData, setEncodedData] = useState<`0x${string}` | null>(null);
  const [operatorPasteInstructions, setOperatorPasteInstructions] = useState<`0x${string}`[] | null>(null);
  const [depositOptimizationCalls, setDepositOptimizationCalls] = useState<`0x${string}`[] | undefined>(undefined);

  const farmerDeposits = farmerSilo.deposits;

  const { form, getMissingFields, getAreAllFieldsValid } = useSowOrderV0Form();
  const calculations = useSowOrderV0Calculations();

  // Local state
  const [state, setState] = useState<SowOrderDialogState>({
    formStep: FormStep.MAIN_FORM,
    isLoading: false,
    showTokenSelectionDialog: false,
    showReview: false,
    didInitOperatorTip: false,
    didInitTokenStrategy: false,
  });

  // Initialize operator tip
  useEffect(() => {
    if (!state.didInitOperatorTip && !isLoadingAverageTipPaid) {
      form.setValue("operatorTip", averageTipPaid.toFixed(2));
      setState((prev) => ({ ...prev, didInitOperatorTip: true }));
    }
  }, [averageTipPaid, state.didInitOperatorTip, form.setValue]);

  // Initialize token strategy only once when dialog opens
  useEffect(() => {
    if (open && !state.didInitTokenStrategy) {
      // Only auto-set if user hasn't made a selection and it's still the default
      const currentStrategy = form.getValues("selectedTokenStrategy");
      if (!currentStrategy || currentStrategy.type === "LOWEST_SEEDS") {
        form.setValue("selectedTokenStrategy", calculations.tokenWithHighestValue);
      }
      setState((prev) => ({ ...prev, didInitTokenStrategy: true }));
    } else if (!open) {
      // Reset initialization flags when dialog closes
      setState((prev) => ({
        ...prev,
        didInitTokenStrategy: false,
        didInitOperatorTip: false,
      }));
    }
  }, [open, calculations.tokenWithHighestValue, form, state.didInitTokenStrategy]);

  const handleOpenTokenSelectionDialog = () => {
    setState((prev) => ({ ...prev, showTokenSelectionDialog: true }));
  };

  const watchedValues = form.watch();

  // Main handlers
  const handleNext = async (e: React.MouseEvent<HTMLButtonElement>) => {
    // prevent default to avoid form submission
    e.preventDefault();
    if (state.formStep === FormStep.MAIN_FORM) {
      const isValid = await form.trigger();
      if (isValid) {
        setState((prev) => ({ ...prev, formStep: FormStep.OPERATOR_TIP }));
      }
      return;
    }

    // Second step - submit form
    try {
      setState((prev) => ({ ...prev, isLoading: true }));

      if (!publicClient) {
        toast.error("No public client available");
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      const formData = form.getValues();
      const { data, operatorPasteInstrs, rawCall, depositOptimizationCalls } = await createSowTractorData({
        totalAmountToSow: formData.totalAmount || "0",
        temperature: formData.temperature?.replace("%", "") || "0",
        minAmountPerSeason: formData.minSoil || "0",
        maxAmountToSowPerSeason: formData.maxPerSeason || "0",
        maxPodlineLength: formData.podLineLength || formatter.number(podLine).replace(/,/g, ""),
        maxGrownStalkPerBdv: "10000000000000000",
        runBlocksAfterSunrise: formData.morningAuction ? "0" : "300",
        operatorTip: formData.operatorTip || "0",
        whitelistedOperators: [],
        tokenStrategy: formData.selectedTokenStrategy as SowOrderTokenStrategy,
        publicClient,
        farmerDeposits: farmerDeposits,
        userAddress: address,
        protocolAddress: protocolAddress,
      });

      if (!address) {
        toast.error("Please connect your wallet");
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      const UINT256_MAX = BigInt(2) ** BigInt(256) - BigInt(1);
      const newBlueprint = createBlueprint({
        publisher: address,
        data,
        operatorPasteInstrs,
        maxNonce: UINT256_MAX,
      });

      setBlueprint(newBlueprint);
      setEncodedData(rawCall);
      setOperatorPasteInstructions(operatorPasteInstrs);
      setDepositOptimizationCalls(depositOptimizationCalls);
      setState((prev) => ({ ...prev, showReview: true, isLoading: false }));
    } catch (e) {
      console.error("Error creating sow tractor data:", e);
      toast.error("Failed to create order");
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleBack = (e: React.MouseEvent<HTMLButtonElement>) => {
    // prevent default to avoid form submission
    e.preventDefault();
    if (state.formStep === FormStep.OPERATOR_TIP) {
      setState((prev) => ({ ...prev, formStep: FormStep.MAIN_FORM }));
    } else {
      onOpenChange(false);
    }
  };

  if (!open) return null;

  const missingFields = getMissingFields();
  const allFieldsValid = getAreAllFieldsValid();

  const isMissingFields = missingFields.length > 0;

  const isStep1 = state.formStep === FormStep.MAIN_FORM;

  const nextDisabled = (state.isLoading || isMissingFields || !allFieldsValid) && isStep1;

  console.log("form values", watchedValues);

  return (
    <>
      <Form {...form}>
        <Col className="h-auto w-full">
          <div>
            <div className="flex flex-col gap-6">
              {/* Form Fields */}
              <div className="flex flex-col gap-6">
                {state.formStep === FormStep.MAIN_FORM ? (
                  // Step 1 - Main Form
                  <Col className="gap-6 pinto-sm-light text-pinto-light">
                    {/* Title and separator */}
                    <div className="flex flex-col gap-2">
                      <div className="pinto-body font-medium text-pinto-secondary mb-4">
                        🚜 Specify Conditions for automated Sowing
                      </div>
                      <div className="h-[1px] w-full bg-pinto-gray-2" />
                    </div>
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
                    </SowOrderV0Fields>
                  </Col>
                ) : (
                  // Step 2 - Operator Tip
                  <Col className="gap-6">
                    <Col>
                      {/* Title and separator for Step 2 */}
                      <div className="flex flex-col gap-2">
                        <div className="pinto-body font-medium text-pinto-secondary mb-4">🚜 Tip per Execution</div>
                        <div className="h-[1px] w-full bg-pinto-gray-2 mb-6" />
                      </div>
                      <div className="pinto-sm-light text-pinto-light gap-2 mb-4">I'm willing to pay someone</div>
                      <SowOrderV0Fields>
                        <SowOrderV0Fields.OperatorTip averageTipPaid={averageTipPaid} />
                        <SowOrderV0Fields.ExecutionsAndTip />
                      </SowOrderV0Fields>
                    </Col>
                  </Col>
                )}
                <FormErrors errors={form.formState.errors} />
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
                      isStep1 && isMissingFields ? (
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
                    disabled={!(isMissingFields && isStep1)}
                  >
                    <div className="flex-1">
                      <Button
                        size="xlargest"
                        rounded="full"
                        className={`w-full ${
                          state.isLoading ? "bg-pinto-gray-2 text-pinto-light" : "bg-pinto-green-4 text-white"
                        }`}
                        disabled={nextDisabled}
                        onClick={handleNext}
                        type="button"
                      >
                        {state.isLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                          </div>
                        ) : state.formStep === FormStep.MAIN_FORM ? (
                          "Next"
                        ) : (
                          "Review"
                        )}
                      </Button>
                    </div>
                  </TooltipSimple>
                </Row>
              </div>
            </div>
          </div>
        </Col>
      </Form>
      <TractorTokenStrategyDialog
        open={state.showTokenSelectionDialog}
        onOpenChange={(open) => setState((prev) => ({ ...prev, showTokenSelectionDialog: open }))}
        onTokenStrategySelected={(tokenStrategy) => {
          form.setValue("selectedTokenStrategy", tokenStrategy);
          setState((prev) => ({ ...prev, showTokenSelectionDialog: false }));
        }}
        selectedTokenStrategy={watchedValues.selectedTokenStrategy as TractorTokenStrategy}
        farmerDeposits={farmerDeposits}
        {...calculations}
      />

      {/* Token Selection Dialog */}

      {state.showReview && encodedData && operatorPasteInstructions && blueprint && (
        <ReviewTractorOrderDialog
          open={state.showReview}
          onOpenChange={(open) => setState((prev) => ({ ...prev, showReview: open }))}
          onSuccess={() => onOpenChange(false)}
          onOrderPublished={onOrderPublished}
          orderData={{
            totalAmount: watchedValues.totalAmount || "",
            temperature: watchedValues.temperature || "",
            podLineLength: watchedValues.podLineLength || "",
            minSoil: watchedValues.minSoil || "",
            operatorTip: watchedValues.operatorTip || "",
            tokenStrategy: watchedValues.selectedTokenStrategy?.type || "LOWEST_SEEDS",
            tokenSymbol:
              watchedValues.selectedTokenStrategy?.type === "SPECIFIC_TOKEN"
                ? whitelistedTokens.find((t) => t.address === watchedValues.selectedTokenStrategy?.address)?.symbol
                : undefined,
            morningAuction: watchedValues.morningAuction || false,
          }}
          encodedData={encodedData}
          operatorPasteInstrs={operatorPasteInstructions}
          blueprint={blueprint}
          includesDepositOptimization={calculations.needsOptimization}
          depositOptimizationCalls={depositOptimizationCalls}
        />
      )}
    </>
  );
}

const errorsToShow = new Set<string>(Object.values(sowOrderSchemaErrors));

const FormErrors = ({ errors }: { errors: ReturnType<typeof useSowOrderV0Form>["form"]["formState"]["errors"] }) => {
  const deduplicate = () => {
    const set = new Set<string>();
    for (const err of Object.values(errors)) {
      if (err?.message && errorsToShow.has(err.message)) {
        set.add(err.message);
      }
    }

    return Array.from(set);
  };

  const errs = deduplicate();

  if (!errs.length) return null;

  return (
    <Col className="gap-1">
      {errs.map((err) => {
        return (
          <div key={`${err}-error`}>
            <Warning variant="warning">{err}</Warning>
          </div>
        );
      })}
    </Col>
  );
};

export const AnimateSowOrderDialog = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={className}>
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: 1, scaleY: 1 }}
          exit={{ opacity: 0, scaleY: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="overflow-hidden"
          style={{ transformOrigin: "50% 70%" }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
