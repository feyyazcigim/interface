import arrowDown from "@/assets/misc/ChevronDown.svg";
import seedIcon from "@/assets/protocol/Seed.png";
import stalkIcon from "@/assets/protocol/Stalk.png";
import { TokenValue } from "@/classes/TokenValue";
import { InfoOutlinedIcon, WarningIcon } from "@/components/Icons";
import ReviewTractorOrderDialog from "@/components/ReviewTractorOrderDialog";
import SmartSubmitButton from "@/components/SmartSubmitButton";
import IconImage from "@/components/ui/IconImage";
import { PINTO } from "@/constants/tokens";
import { useProtocolAddress } from "@/hooks/pinto/useProtocolAddress";
import useBuildSwapQuote from "@/hooks/swap/useBuildSwapQuote";
import useSwap, { useSwapMany } from "@/hooks/swap/useSwap";
import { useClaimRewards } from "@/hooks/useClaimRewards";
import { createBlueprint } from "@/lib/Tractor/blueprint";
import { Blueprint } from "@/lib/Tractor/types";
import { TokenStrategy, createSowTractorData, getAverageTipPaid } from "@/lib/Tractor/utils";
import { needsCombining, generateBatchSortDepositsCallData } from "@/lib/claim/depositUtils";
import { useFarmerSilo } from "@/state/useFarmerSilo";
import { usePodLine, useTemperature } from "@/state/useFieldData";
import { usePriceData } from "@/state/usePriceData";
import useTokenData from "@/state/useTokenData";
import { formatter } from "@/utils/format";
import { isValidAddress } from "@/utils/string";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { Button } from "./ui/Button";
import { Dialog, DialogContent, DialogOverlay, DialogPortal } from "./ui/Dialog";
import { Input } from "./ui/Input";
import { PublicClient, encodeFunctionData } from "viem";
import { diamondABI as beanstalkAbi } from "@/constants/abi/diamondABI";
import { useQueryClient } from "@tanstack/react-query";
import useTransaction from "@/hooks/useTransaction";
import { mockAddressAtom } from "@/Web3Provider";
import { useAtom } from "jotai";
import { isLocalhost } from "@/utils/utils";

interface SowOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SowOrderDialog({ open, onOpenChange }: SowOrderDialogProps) {
  const podLine = usePodLine();
  const currentTemperature = useTemperature();
  const [podLineLength, setPodLineLength] = useState("");
  const [rawPodLineLength, setRawPodLineLength] = useState(""); // Track raw input
  const podLineLengthTimeoutRef = useRef<NodeJS.Timeout | null>(null); // For debounce
  const farmerSilo = useFarmerSilo();
  const farmerDeposits = farmerSilo.deposits;
  const { whitelistedTokens, mainToken } = useTokenData();
  const priceData = usePriceData();
  const [minSoil, setMinSoil] = useState("");
  const [maxPerSeason, setMaxPerSeason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [totalAmount, setTotalAmount] = useState("");
  const [temperature, setTemperature] = useState("");
  const [displayTemperature, setDisplayTemperature] = useState("");
  const [morningAuction, setMorningAuction] = useState(false);
  const [operatorTip, setOperatorTip] = useState("1");
  const { address } = useAccount();
  const [loading, setLoading] = useState<string | null>(null);
  const [formStep, setFormStep] = useState(() => {
    // If deposits need combining, start at step 0, otherwise normal flow
    return needsCombining(farmerDeposits) ? 0 : 1;
  });
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [encodedData, setEncodedData] = useState<`0x${string}` | null>(null);
  const [operatorPasteInstructions, setOperatorPasteInstructions] = useState<`0x${string}`[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showTokenSelectionDialog, setShowTokenSelectionDialog] = useState(false);
  const [activeTipButton, setActiveTipButton] = useState<"down5" | "down1" | "average" | "up1" | "up5" | null>(
    "average",
  );
  const temperatureInputRef = useRef<HTMLInputElement>(null);
  const [averageTipValue, setAverageTipValue] = useState<number>(1);

  // Add these new declarations for combine and sort functionality
  const [sortingAllTokens, setSortingAllTokens] = useState(false);
  const publicClient = usePublicClient();
  const protocolAddress = useProtocolAddress();
  const queryClient = useQueryClient();
  const { data: walletClient } = useWalletClient();
  const [mockAddress] = useAtom(mockAddressAtom);
  const isLocal = isLocalhost();
  const { writeWithEstimateGas, isConfirming, submitting, setSubmitting } = useTransaction({
    successMessage: "Combine & Sort successful",
    errorMessage: "Combine & Sort failed",
    successCallback: () => {
      queryClient.invalidateQueries();
      // If combining is successful, advance to the next step
      setFormStep(1);
    }
  });

  // Claim rewards necessary if deposits have not been combined
  const { submitClaimRewards, isSubmitting: isClaimSubmitting } = useClaimRewards();

  // Check if farmer needs combining using depositUtils
  const needsDepositCombining = useMemo(() => {
    return needsCombining(farmerDeposits);
  }, [farmerDeposits]);

  // Recheck the need for combining whenever deposits change
  useEffect(() => {
    // Only auto-update if we're on step 0
    if (formStep === 0) {
      // If no longer needs combining, advance to step 1
      if (!needsDepositCombining) {
        setFormStep(1);
      }
    }
  }, [needsDepositCombining, formStep]);

  // Get LP tokens
  const lpTokens = useMemo(() => whitelistedTokens.filter((t) => t.isLP), [whitelistedTokens]);

  const swapArgs = useMemo(() => {
    return lpTokens.map((token) => {
      const amount = farmerDeposits.get(token)?.amount || TokenValue.ZERO;
      return {
        tokenIn: token,
        tokenOut: mainToken,
        amountIn: amount,
        slippage: 0.5,
        disabled: amount.eq(0), // Only enable if there's an amount to swap
      };
    });
  }, [mainToken, farmerDeposits, lpTokens]);

  // Create swap hooks for each LP token
  const swapQuotes = useSwapMany({
    args: swapArgs,
  });

  // Combine the results into a map
  const swapResults = useMemo(() => {
    const results = new Map<string, TokenValue>();
    lpTokens.forEach((token, i) => {
      const buyAmount = swapQuotes[i]?.data?.buyAmount;
      if (buyAmount) {
        results.set(token.address, buyAmount);
      }
    });
    return results;
  }, [lpTokens, swapQuotes]);

  // Calculate the token with the highest dollar value
  const tokenWithHighestValue = useMemo(() => {
    let highestValue = TokenValue.ZERO;
    let tokenWithHighestValue: string | null = null;
    let tokenType: "SPECIFIC_TOKEN" | "LOWEST_SEEDS" = "LOWEST_SEEDS";

    // Check PINTO token first
    const pintoToken = whitelistedTokens.find(t => t.symbol === "PINTO");
    if (pintoToken) {
      const pintoDeposit = farmerDeposits.get(pintoToken);
      if (pintoDeposit?.amount) {
        const pintoDollarValue = pintoDeposit.amount.mul(priceData.price);
        if (pintoDollarValue.gt(highestValue)) {
          highestValue = pintoDollarValue;
          tokenWithHighestValue = pintoToken.address;
          tokenType = "SPECIFIC_TOKEN";
        }
      }
    }

    // Check all LP tokens
    whitelistedTokens.forEach(token => {
      if (token.isLP) {
        const lpDollarValue = swapResults.get(token.address);
        if (lpDollarValue && lpDollarValue.gt(highestValue)) {
          highestValue = lpDollarValue;
          tokenWithHighestValue = token.address;
          tokenType = "SPECIFIC_TOKEN";
        }
      }
    });

    // If no token has value, default to LOWEST_SEEDS
    if (!tokenWithHighestValue) {
      return { type: "LOWEST_SEEDS" } as TokenStrategy;
    }

    // Return the token with highest value
    return {
      type: tokenType,
      address: tokenWithHighestValue as `0x${string}`
    } as TokenStrategy;
  }, [farmerDeposits, whitelistedTokens, priceData.price, swapResults]);

  // Update the default token strategy
  const [selectedTokenStrategy, setSelectedTokenStrategy] = useState<TokenStrategy>(tokenWithHighestValue);

  // Add state for the review dialog
  const [showReview, setShowReview] = useState(false);

  // Load average tip value on component mount
  useEffect(() => {
    const fetchAverageTip = async () => {
      try {
        const avgTip = await getAverageTipPaid(publicClient as PublicClient);
        setAverageTipValue(avgTip);
        // Set the initial operator tip to the average tip value
        setOperatorTip(avgTip.toFixed(2));
      } catch (error) {
        console.error("Error fetching average tip value:", error);
      }
    };
    
    fetchAverageTip();
  }, [publicClient]);

  // Update operatorTip if averageTipValue changes and the active button is "average"
  useEffect(() => {
    if (activeTipButton === "average") {
      setOperatorTip(averageTipValue.toFixed(2));
    }
  }, [averageTipValue, activeTipButton]);

  // Function to format number with commas
  const formatNumberWithCommas = (value: string) => {
    // Remove any existing commas
    const cleanValue = value.replace(/,/g, "");
    // Format with commas but preserve decimal portion
    const parts = cleanValue.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  };

  // Handle debounced formatting for pod line length
  useEffect(() => {
    if (rawPodLineLength) {
      // Clear existing timeout
      if (podLineLengthTimeoutRef.current) {
        clearTimeout(podLineLengthTimeoutRef.current);
      }

      // Set new timeout
      podLineLengthTimeoutRef.current = setTimeout(() => {
        setPodLineLength(formatNumberWithCommas(rawPodLineLength));
      }, 500); // 500ms debounce
    }

    // Cleanup timeout on unmount
    return () => {
      if (podLineLengthTimeoutRef.current) {
        clearTimeout(podLineLengthTimeoutRef.current);
      }
    };
  }, [rawPodLineLength]);

  const handlePodLineSelect = (increment: number) => {
    if (increment === 0) {
      // Set to current pod line length in human readable format
      const formattedValue = formatter.number(podLine);
      setPodLineLength(formattedValue);
      setRawPodLineLength(formattedValue.replace(/,/g, ""));
    } else {
      // Calculate new value with percentage increase
      const increase = podLine.mul(increment).div(100);
      const newValue = podLine.add(increase);
      const formattedValue = formatter.number(newValue);
      setPodLineLength(formattedValue);
      setRawPodLineLength(formattedValue.replace(/,/g, ""));
    }
  };

  // Update the validateSoilAmounts function to check against total amount too
  const validateSoilAmounts = (minSoilAmount: string, maxSeasonAmount: string, totalSowAmount: string) => {
    // Skip validation if any values are missing
    if (!minSoilAmount || !maxSeasonAmount || !totalSowAmount) {
      setError(null);
      return;
    }

    try {
      // Remove commas and convert to numbers first
      const minClean = minSoilAmount.replace(/,/g, "");
      const maxClean = maxSeasonAmount.replace(/,/g, "");
      const totalClean = totalSowAmount.replace(/,/g, "");

      const min = TokenValue.fromHuman(minClean, PINTO.decimals);
      const max = TokenValue.fromHuman(maxClean, PINTO.decimals);
      const total = TokenValue.fromHuman(totalClean, PINTO.decimals);

      if (min.gt(max)) {
        setError("Min per Season must be less than or equal to Max per Season");
      } else if (min.gt(total)) {
        setError("Min per Season cannot exceed the total amount to Sow");
      } else {
        setError(null);
      }
    } catch (e) {
      console.error("Validation error:", e);
      setError("Invalid number format");
    }
  };

  // Validate whenever any of the values changes
  useEffect(() => {
    validateSoilAmounts(minSoil, maxPerSeason, totalAmount);
  }, [minSoil, maxPerSeason, totalAmount]);

  // Set initial pod line length to current + 100% when component mounts
  useEffect(() => {
    const increase = podLine.mul(100).div(100); // Calculate 100% increase
    const newValue = podLine.add(increase);
    const formattedValue = formatter.number(newValue);
    setPodLineLength(formattedValue);
    setRawPodLineLength(formattedValue.replace(/,/g, ""));
  }, [podLine]); // Only run when podLine changes

  // Add a function to calculate what the value would be for a given percentage
  const calculatePodLineValue = (increment: number) => {
    const increase = podLine.mul(increment).div(100);
    const newValue = podLine.add(increase);
    return formatter.number(newValue);
  };

  // Add a function to check if a button should be highlighted
  const isButtonActive = (increment: number) => {
    return podLineLength === calculatePodLineValue(increment);
  };

  // This code is used to generate random numbers for quick order creation in dev mode
  /*useEffect(() => {
    if (isDev()) {
      // Generate random numbers within specified ranges
      const randomTotal = Math.floor(Math.random() * (10000 - 1000) + 1000);
      const randomTemp = Math.floor(Math.random() * (900-100) + 100);
      const randomMaxSeason = Math.floor(Math.random() * (1000 - 500) + 500);
      const randomMinSoil = Math.floor(Math.random() * (100 - 50) + 50);
      const randomPodLineLength = Math.floor(Math.random() * (70000000 - 35000000) + 35000000);

      setTotalAmount(randomTotal.toString());
      setTemperature(randomTemp.toString());
      setPodLineLength(randomPodLineLength.toString());
      setMinSoil(randomMinSoil.toString());
      setOperatorTip("0.1");
      setMaxPerSeason(randomMaxSeason.toString());
      setSelectedTokenStrategy({ type: "LOWEST_SEEDS" });
    }
  }, [isDev]);*/

  // Add this function to check if the pod line length is valid
  const isPodLineLengthValid = () => {
    try {
      // Remove commas and convert to a number
      const inputLength = parseFloat(podLineLength.replace(/,/g, ""));
      const currentLength = parseFloat(formatter.number(podLine).replace(/,/g, ""));

      return !Number.isNaN(inputLength);
    } catch (e) {
      return false;
    }
  };

  // Add this function to check if all required fields are filled
  const areRequiredFieldsFilled = () => {
    return (
      // Check if temperature is filled
      !!temperature &&
      // Check if min soil is filled
      !!minSoil &&
      // Check if max per season is filled
      !!maxPerSeason &&
      // Check if total amount is filled
      !!totalAmount &&
      // Check if pod line length is valid
      isPodLineLengthValid()
    );
  };

  // New function to handle combine and sort all deposits
  const handleCombineAndSortAll = async () => {
    if (!address || !publicClient || !protocolAddress || !farmerDeposits) return;
    
    const effectiveAddress = isLocal && isValidAddress(mockAddress) ? mockAddress : address;
    console.log("Combine & Sort All - Using address:", effectiveAddress);
    
    setSortingAllTokens(true);
    setSubmitting(true);
    
    try {
      toast.info("Preparing to combine and sort all deposits...");
      
      console.log(`Processing ${farmerDeposits.size} tokens for sorting`);
      
      // Use the utility function to generate batch sort deposits call data
      const callData = await generateBatchSortDepositsCallData(
        effectiveAddress as `0x${string}`,
        farmerDeposits,
        publicClient,
        protocolAddress
      );
      
      if (!callData || callData.length === 0) {
        toast.warning("No sort deposit calls were generated");
        return;
      }
      
      // Output raw calldata for simulator debugging
      const rawCalldata = encodeFunctionData({
        abi: beanstalkAbi,
        functionName: 'farm',
        args: [callData]
      });
      
      console.log(`=== Raw Farm Calldata for All Tokens ===`);
      console.log(rawCalldata);
      console.log(`Number of calls: ${callData.length}`);
      console.log("======================================");
      
      toast.info(`Executing ${callData.length} operations for all tokens (combines + sort updates)...`);
      
      
      // Execute the farm transaction using writeWithEstimateGas with higher gas limit
      const simulateFirst = await publicClient.simulateContract({
        address: protocolAddress,
        abi: beanstalkAbi,
        functionName: "farm",
        args: [callData],
        account: effectiveAddress
      }).catch(e => {
        console.error("Simulation failed:", e);
        return { error: e };
      });
      
      if ('error' in simulateFirst) {
        console.error("Transaction would fail in simulation, not submitting");
        toast.error("Transaction would fail: " + (simulateFirst.error as any)?.shortMessage || "unknown error");
        setSubmitting(false);
        setSortingAllTokens(false);
        return;
      }
      
      // Execute with higher gas limit to prevent running out of gas
      await writeWithEstimateGas({
        address: protocolAddress,
        abi: beanstalkAbi,
        functionName: 'farm',
        args: [callData]
      });

    } catch (error) {
      console.error("Error processing all tokens:", error);
      
      // Extract error details for debugging
      const errorObj = error as any;
      
      if (errorObj.cause) console.log('Error cause:', errorObj.cause);
      if (errorObj.details) console.log('Error details:', errorObj.details);
      if (errorObj.data) console.log('Error data:', errorObj.data);
      if (errorObj.reason) console.log('Error reason:', errorObj.reason);
      if (errorObj.shortMessage) console.log('Short message:', errorObj.shortMessage);
      
      // Display toast with specific error information
      const errorMessage = 
        errorObj.shortMessage || 
        errorObj.reason || 
        (errorObj.cause?.message) || 
        (error as Error).message;
        
      toast.error(`Failed to process all tokens: ${errorMessage}`);
      
      setSubmitting(false);
      setSortingAllTokens(false);
    }
  };

  // Update handleNext to remove formSubmitAttempted
  const handleNext = async () => {
    // Step 0 does nothing on Next since we handle the claim button separately
    if (formStep === 0) {
      return;
    }
    // First step just moves to the next form view if validation passes
    if (formStep === 1) {
      if (areRequiredFieldsFilled() && !error) {
        setFormStep(2);
      }
      return;
    }

    // Second step (operator tip) submits the form
    try {
      console.time("handleNext total");
      setIsLoading(true);

      if (!publicClient) {
        toast.error("No public client available");
        setIsLoading(false);
        return;
      }

      const { data, operatorPasteInstrs, rawCall } = await createSowTractorData({
        totalAmountToSow: totalAmount || "0",
        temperature: temperature || "0",
        minAmountPerSeason: minSoil || "0",
        maxAmountToSowPerSeason: maxPerSeason || "0",
        maxPodlineLength: podLineLength || "0",
        maxGrownStalkPerBdv: "10000000000000000", // default of 100 grown stalk per bdv, which would take about 21 years at 4 seeds. TODO: add input for this in the future
        runBlocksAfterSunrise: "0",
        operatorTip: operatorTip || "0",
        whitelistedOperators: [],
        tokenStrategy: selectedTokenStrategy,
        publicClient,
      });

      console.log("createSowTractorData, data:", data);
      console.log("rawCall:", rawCall);

      if (!address) {
        toast.error("Please connect your wallet");
        setIsLoading(false);
        return;
      }

      console.time("createBlueprint");
      // Calculate uint256 max (2^256 - 1)
      const UINT256_MAX = BigInt(2) ** BigInt(256) - BigInt(1);

      const newBlueprint = createBlueprint({
        publisher: address,
        data,
        operatorPasteInstrs,
        maxNonce: UINT256_MAX,
      });
      console.timeEnd("createBlueprint");

      // Set state immediately
      setBlueprint(newBlueprint);
      setEncodedData(rawCall);
      setOperatorPasteInstructions(operatorPasteInstrs);
      setShowReview(true);
      setIsLoading(false);

      console.timeEnd("handleNext total");
    } catch (e) {
      console.error("Error creating sow tractor data:", e);
      toast.error("Failed to create order");
      setIsLoading(false);
    }
  };

  // Handle claim button click in step 0
  const handleClaim = async () => {
    try {
      await submitClaimRewards();
      // We don't need to manually advance to the next step
      // The useEffect will detect the change in needsDepositCombining
      // and automatically advance when appropriate
    } catch (e) {
      console.error("Failed to claim rewards:", e);
      toast.error("Failed to claim rewards");
    }
  };

  // Add handle back function
  const handleBack = () => {
    if (formStep === 2) {
      setFormStep(1);
    } else if (formStep === 1) {
      // Can't go back from step 1 to step 0 as step 0 is conditional
      onOpenChange(false);
    } else {
      onOpenChange(false);
    }
  };

  // Add a function to get the selected token display text
  const getSelectedTokenDisplay = () => {
    if (selectedTokenStrategy.type === "LOWEST_SEEDS") {
      return "Token with Least Seeds";
    } else if (selectedTokenStrategy.type === "LOWEST_PRICE") {
      return "Token with Best Price";
    } else if (selectedTokenStrategy.type === "SPECIFIC_TOKEN") {
      const token = whitelistedTokens.find((t) => t.address === selectedTokenStrategy.address);
      return token?.symbol || "Select Token";
    }
    return "Select Deposited Silo Token";
  };

  // Add a function to get the dollar value for the selected strategy
  const getSelectedTokenDollarValue = () => {
    if (selectedTokenStrategy.type === "SPECIFIC_TOKEN" && selectedTokenStrategy.address) {
      const token = whitelistedTokens.find((t) => t.address === selectedTokenStrategy.address);

      // If it's PINTO token, use its direct value multiplied by price
      if (token?.symbol === "PINTO") {
        const pintoDeposit = farmerDeposits.get(token);
        return pintoDeposit?.amount ? pintoDeposit.amount.mul(priceData.price) : TokenValue.ZERO;
      }

      return swapResults.get(selectedTokenStrategy.address) || TokenValue.ZERO;
    } else if (selectedTokenStrategy.type === "LOWEST_PRICE" || selectedTokenStrategy.type === "LOWEST_SEEDS") {
      // Sum all token dollar values
      let totalValue = TokenValue.ZERO;

      // Include PINTO tokens in the calculation
      const pintoToken = whitelistedTokens.find((t) => t.symbol === "PINTO");
      if (pintoToken) {
        const pintoDeposit = farmerDeposits.get(pintoToken);
        if (pintoDeposit?.amount) {
          totalValue = totalValue.add(pintoDeposit.amount.mul(priceData.price));
        }
      }

      // Add all LP token values
      swapResults.forEach((value) => {
        totalValue = totalValue.add(value);
      });

      return totalValue;
    }
    return TokenValue.ZERO;
  };

  // Helper function to calculate tip values for different percentages
  const getTipValue = (type: "down5" | "down1" | "average" | "up1" | "up5") => {
    const baseValue = averageTipValue;
    switch (type) {
      case "down5":
        return (baseValue * 0.95).toFixed(2);
      case "down1":
        return (baseValue * 0.99).toFixed(2);
      case "average":
        return baseValue.toFixed(2);
      case "up1":
        return (baseValue * 1.01).toFixed(2);
      case "up5":
        return (baseValue * 1.05).toFixed(2);
    }
  };

  // Helper function to check which button should be active based on current tip value
  const checkActiveTipButton = (tipValue: string) => {
    const normalizedTip = parseFloat(tipValue).toFixed(2);
    if (normalizedTip === getTipValue("down5")) return "down5";
    if (normalizedTip === getTipValue("down1")) return "down1";
    if (normalizedTip === averageTipValue.toFixed(2)) return "average";
    if (normalizedTip === getTipValue("up1")) return "up1";
    if (normalizedTip === getTipValue("up5")) return "up5";
    return null;
  };

  // Handler for tip button clicks
  const handleTipButtonClick = (type: "down5" | "down1" | "average" | "up1" | "up5") => {
    setActiveTipButton(type);
    const newValue = getTipValue(type);
    setOperatorTip(newValue);
  };

  // Calculate the estimated number of executions
  const calculateEstimatedExecutions = () => {
    // If any of the required values are missing, return a default
    if (!totalAmount || !maxPerSeason) {
      return "~0";
    }

    try {
      // Remove commas and convert to numbers
      const totalClean = totalAmount.replace(/,/g, "");
      const minClean = minSoil ? minSoil.replace(/,/g, "") : "0";
      const maxClean = maxPerSeason.replace(/,/g, "");

      // Convert to TokenValue for precision math
      const total = TokenValue.fromHuman(totalClean, PINTO.decimals);
      const min = TokenValue.fromHuman(minClean, PINTO.decimals);
      const max = TokenValue.fromHuman(maxClean, PINTO.decimals);

      // Check for zero values to avoid division by zero
      if (total.eq(0) || max.eq(0)) {
        return "~0";
      }

      // If min is zero, upper bound is infinity
      if (min.eq(0)) {
        // Calculate only the lower bound
        let lowerBound = Math.floor(total.div(max).toNumber());
        lowerBound = Math.max(1, lowerBound);
        return `~${lowerBound}-∞`;
      }

      // Calculate both bounds
      let lowerBound = Math.floor(total.div(max).toNumber());
      let upperBound = Math.ceil(total.div(min).toNumber());

      // Handle edge cases and ensure sensible values
      lowerBound = Math.max(1, lowerBound);
      upperBound = Math.max(lowerBound, upperBound);

      // Format the result
      if (lowerBound === upperBound) {
        return `~${lowerBound}`;
      } else {
        return `~${lowerBound}-${upperBound}`;
      }
    } catch (e) {
      console.error("Error calculating executions:", e);
      return "~0";
    }
  };

  // Also add a function to calculate the estimated total tip
  const calculateEstimatedTotalTip = () => {
    if (!operatorTip || !totalAmount || !maxPerSeason) {
      return "~0";
    }

    try {
      // Remove commas and convert to numbers
      const totalClean = totalAmount.replace(/,/g, "");
      const minClean = minSoil ? minSoil.replace(/,/g, "") : "0";
      const maxClean = maxPerSeason.replace(/,/g, "");

      // Convert to TokenValue for precision math
      const total = TokenValue.fromHuman(totalClean, PINTO.decimals);
      const min = TokenValue.fromHuman(minClean, PINTO.decimals);
      const max = TokenValue.fromHuman(maxClean, PINTO.decimals);

      // Parse the operator tip
      const tipValue = parseFloat(operatorTip);

      // Check for zero values
      if (total.eq(0) || max.eq(0) || Number.isNaN(tipValue)) {
        return "~0";
      }

      // Calculate lower bound (based on max per season)
      let lowerBound = Math.floor(total.div(max).toNumber());
      lowerBound = Math.max(1, lowerBound);
      const lowerTip = lowerBound * tipValue;

      // If min is zero, upper bound is infinity
      if (min.eq(0)) {
        return `~${lowerTip.toFixed(2)}-∞`;
      }

      // Calculate upper bound
      let upperBound = Math.ceil(total.div(min).toNumber());
      upperBound = Math.max(lowerBound, upperBound);
      const upperTip = upperBound * tipValue;

      // Format the result
      if (lowerTip === upperTip) {
        return `~${lowerTip.toFixed(2)}`;
      } else {
        return `~${lowerTip.toFixed(2)}-${upperTip.toFixed(2)}`;
      }
    } catch (e) {
      console.error("Error calculating total tip:", e);
      return "~0";
    }
  };

  // Function to handle temperature input and ensure it displays with %
  const handleTemperatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Get the cursor position before making changes
    const cursorPosition = e.target.selectionStart || 0;
    const value = e.target.value;
    const hadPercentSign = value.includes("%");

    // Check if user is deleting the % sign
    if (value.endsWith("%") && cursorPosition === value.length) {
      // If cursor is at the end (after %), move it back one position
      setTimeout(() => {
        if (temperatureInputRef.current) {
          temperatureInputRef.current.setSelectionRange(cursorPosition - 1, cursorPosition - 1);
        }
      }, 0);
      return;
    }

    // Remove % and any non-numeric characters except decimal
    const cleanValue = value.replace(/[^0-9.,]/g, "");
    setTemperature(cleanValue); // Store clean value without %

    // Add % for display
    const newDisplayValue = `${cleanValue}%`;
    setDisplayTemperature(newDisplayValue);

    // Calculate where the cursor should be
    let newPosition = cursorPosition;

    // If we're deleting a character (current value is shorter than previous + adjustment for % sign)
    if (cleanValue.length < temperature.length) {
      newPosition = cursorPosition;
    } else if (!hadPercentSign && cleanValue.length > 0) {
      // If we didn't have a % sign before but now we do, adjust accordingly
      newPosition = cursorPosition;
    }

    // Ensure cursor position is clamped to a valid range and before %
    newPosition = Math.min(newPosition, cleanValue.length);

    // Set cursor position with a timeout to ensure it happens after React's rendering
    setTimeout(() => {
      if (temperatureInputRef.current) {
        temperatureInputRef.current.setSelectionRange(newPosition, newPosition);
      }
    }, 0);
  };

  // Function to handle temperature input blur
  const handleTemperatureBlur = () => {
    if (temperature) {
      setDisplayTemperature(`${temperature}%`);
    }
  };

  // Function to handle temperature input focus
  const handleTemperatureFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // If cursor is at the end, move it before the % sign
    if (e.target.value.endsWith("%")) {
      setTimeout(() => {
        if (temperatureInputRef.current) {
          const pos = e.target.value.length - 1;
          temperatureInputRef.current.setSelectionRange(pos, pos);
        }
      }, 0);
    }
  };

  // Function to handle temperature input keydown
  const handleTemperatureKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const cursorPosition = e.currentTarget.selectionStart || 0;
    const value = e.currentTarget.value;

    // If backspace is pressed and cursor is after the last number (right before or at %)
    if (e.key === "Backspace" && cursorPosition >= value.length - 1) {
      const newValue = temperature.slice(0, -1);
      setTemperature(newValue);
      setDisplayTemperature(newValue ? `${newValue}%` : "");

      // Position cursor at the end of the number portion
      setTimeout(() => {
        if (temperatureInputRef.current) {
          temperatureInputRef.current.setSelectionRange(newValue.length, newValue.length);
        }
      }, 0);

      e.preventDefault();
    }
    // If delete key is pressed and cursor is right before %
    else if (e.key === "Delete" && cursorPosition === value.length - 1) {
      e.preventDefault();
    }
  };

  if (!open) return null;

  const inputIds = {
    totalAmount: "total-amount-input",
    minPerSeason: "min-per-season-input",
    maxPerSeason: "max-per-season-input",
    fundOrder: "fund-order-select",
    temperature: "temperature-input",
    podLineLength: "pod-line-length-input",
    morningAuction: "morning-auction-input",
    operatorTip: "operator-tip-input",
  };

  return (
    <>
      <div className="h-auto w-full flex flex-col">
        <div className="py-4 pb-0">
          <div className="flex flex-col gap-6">
            {/* Form Fields */}
            <div className="flex flex-col gap-6">
              {formStep === 0 ? (
                // Step 0 - Deposits need combining
                <div className="flex flex-col gap-4 py-2 h-[280px]">
                  <div className="flex items-center justify-center">
                    <WarningIcon color="#DC2626" width={40} height={40} />
                  </div>
                  <h3 className="text-center pinto-h3 font-antarctica mt-4 mb-4">Fragmented Silo Deposits</h3>
                  <p className="text-center pinto-body text-gray-700">
                    Pinto does not combine and sort deposits by default, due to gas costs. A one-time claim and combine
                    will optimize your deposits and allow you to create Tractor orders.
                  </p>
                  {/* The Claim & Combine button has been moved to the footer (replacing the Next button) */}
                </div>
              ) : formStep === 1 ? (
                // Step 1 - Main Form
                <>
                  {/* I want to Sow up to */}
                  <div className="flex flex-col gap-2">
                    <label htmlFor={inputIds.totalAmount} className="text-[#9C9C9C] text-base font-light">
                      I want to Sow up to
                    </label>
                    <div className="flex rounded-[12px] group focus-within:ring-1 focus-within:ring-[#2F8957] focus-within:border-[#2F8957]">
                      <div className="flex-1 border border-[#D9D9D9] border-r-0 rounded-l-[12px] group-focus-within:border-[#2F8957]">
                        <Input
                          id={inputIds.totalAmount}
                          className="h-12 px-3 py-1.5 border-0 rounded-l-[12px] flex-1 focus-visible:ring-0 focus-visible:ring-offset-0"
                          placeholder="0.00"
                          value={totalAmount}
                          onChange={(e) => setTotalAmount(e.target.value.replace(/[^0-9.,]/g, ""))}
                          type="text"
                        />
                      </div>
                      <div className="flex items-center gap-2 px-4 border border-[#D9D9D9] border-l-0 rounded-r-[12px] bg-white group-focus-within:border-[#2F8957]">
                        <img src="/src/assets/tokens/PINTO.png" alt="PINTO" className="w-6 h-6" />
                        <span className="text-black">PINTO</span>
                      </div>
                    </div>
                  </div>

                  {/* Min and Max per Season - combined in a single row */}
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-4">
                      {/* Min per Season */}
                      <div className="flex flex-col gap-2 flex-1">
                        <label htmlFor={inputIds.minPerSeason} className="text-[#9C9C9C] text-base font-light">
                          Min per Season
                        </label>
                        <div className="flex rounded-[12px] group focus-within:ring-1 focus-within:ring-[#2F8957] focus-within:border-[#2F8957]">
                          <div className="flex-1 border border-[#D9D9D9] border-r-0 rounded-l-[12px] group-focus-within:border-[#2F8957]">
                            <Input
                              id={inputIds.minPerSeason}
                              className={`h-12 px-3 py-1.5 border-0 rounded-l-[12px] flex-1 focus-visible:ring-0 focus-visible:ring-offset-0 ${
                                error ? "bg-red-50" : ""
                              }`}
                              placeholder="0.00"
                              value={minSoil}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9.,]/g, "");
                                setMinSoil(value);
                              }}
                              type="text"
                            />
                          </div>
                          <div className="flex items-center gap-2 px-4 border border-[#D9D9D9] border-l-0 rounded-r-[12px] bg-white group-focus-within:border-[#2F8957]">
                            <img src="/src/assets/tokens/PINTO.png" alt="PINTO" className="w-6 h-6" />
                            <span className="text-black">PINTO</span>
                          </div>
                        </div>
                      </div>

                      {/* Max per Season */}
                      <div className="flex flex-col gap-2 flex-1">
                        <label htmlFor={inputIds.maxPerSeason} className="text-[#9C9C9C] text-base font-light">
                          Max per Season
                        </label>
                        <div className="flex rounded-[12px] group focus-within:ring-1 focus-within:ring-[#2F8957] focus-within:border-[#2F8957]">
                          <div className="flex-1 border border-[#D9D9D9] border-r-0 rounded-l-[12px] group-focus-within:border-[#2F8957]">
                            <Input
                              id={inputIds.maxPerSeason}
                              className={`h-12 px-3 py-1.5 border-0 rounded-l-[12px] flex-1 focus-visible:ring-0 focus-visible:ring-offset-0 ${
                                error ? "bg-red-50" : ""
                              }`}
                              placeholder="0.00"
                              value={maxPerSeason}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9.,]/g, "");
                                setMaxPerSeason(value);
                              }}
                              type="text"
                            />
                          </div>
                          <div className="flex items-center gap-2 px-4 border border-[#D9D9D9] border-l-0 rounded-r-[12px] bg-white group-focus-within:border-[#2F8957]">
                            <img src="/src/assets/tokens/PINTO.png" alt="PINTO" className="w-6 h-6" />
                            <span className="text-black">PINTO</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Error message */}
                  {error && <div className="text-red-500 text-sm mt-1">{error}</div>}

                  {/* Fund order using */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <div className="text-[#9C9C9C] text-base font-light">Fund order using</div>
                      <Button
                        variant="outline-gray-shadow"
                        size="xl"
                        rounded="full"
                        onClick={() => setShowTokenSelectionDialog(true)}
                      >
                        <div className="flex items-center gap-2">
                          {selectedTokenStrategy.type === "SPECIFIC_TOKEN" && (
                            <IconImage
                              src={
                                whitelistedTokens.find((t) => t.address === selectedTokenStrategy.address)?.logoURI ||
                                ""
                              }
                              alt="token"
                              size={6}
                              className="rounded-full"
                            />
                          )}
                          <div className="pinto-body-light">{getSelectedTokenDisplay()}</div>
                          <IconImage src={arrowDown} size={3} alt="open token select dialog" />
                        </div>
                      </Button>
                    </div>
                  </div>

                  {/* Execute when Temperature is at least */}
                  <div className="flex flex-row items-center justify-between gap-4">
                    <label htmlFor={inputIds.temperature} className="text-[#9C9C9C] text-base font-light">
                      Execute when Temperature is at least
                    </label>
                    <Input
                      id={inputIds.temperature}
                      className="h-12 px-3 py-1.5 border border-[#D9D9D9] rounded-[12px] w-[140px]"
                      placeholder={`${Math.max(10, Math.floor(currentTemperature.scaled?.toNumber() || 0) + 1)}%`}
                      value={displayTemperature}
                      onChange={handleTemperatureChange}
                      onBlur={handleTemperatureBlur}
                      onFocus={handleTemperatureFocus}
                      onKeyDown={handleTemperatureKeyDown}
                      ref={temperatureInputRef}
                      type="text"
                    />
                  </div>

                  {/* Execute when the length of the Pod Line is at most */}
                  <div className="flex flex-col gap-2">
                    <label htmlFor={inputIds.podLineLength} className="text-[#9C9C9C] text-base font-light">
                      Execute when the length of the Pod Line is at most
                    </label>
                    <Input
                      id={inputIds.podLineLength}
                      className="h-12 px-3 py-1.5 border border-[#D9D9D9] rounded-[12px]"
                      placeholder="9,000,000"
                      value={podLineLength}
                      onChange={(e) => {
                        // Allow numbers, commas, and at most one decimal point
                        const value = e.target.value.replace(/[^\d,\.]/g, "");
                        // Ensure at most one decimal point
                        const decimalCount = (value.match(/\./g) || []).length;
                        const sanitizedValue =
                          decimalCount > 1
                            ? value.replace(/\./g, (match, index) => (index === value.indexOf(".") ? match : ""))
                            : value;

                        // Store raw input and update displayed value
                        setRawPodLineLength(sanitizedValue.replace(/,/g, ""));
                        setPodLineLength(sanitizedValue);
                      }}
                    />
                    
                    <div className="flex justify-between gap-2 mt-1 w-full">
                      <Button
                        variant="outline"
                        size="sm"
                        className={`rounded-full px-4 py-2 flex items-center justify-center transition-colors h-[2rem] sm:h-[2.25rem] text-[1rem] leading-[1.1rem] -tracking-[0.02em] font-[400] whitespace-nowrap ${
                          isButtonActive(5)
                            ? "bg-[#D8F1E2] border border-[#387F5C] text-[#387F5C] hover:bg-[#D8F1E2] hover:text-[#387F5C] hover:border-[#387F5C]"
                            : "bg-pinto-gray-1 border-pinto-gray-3 text-black hover:bg-pinto-green-1/50 hover:border-pinto-green-2/50"
                        } flex-1`}
                        onClick={() => handlePodLineSelect(5)}
                      >
                        5% ↑
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`rounded-full px-4 py-2 flex items-center justify-center transition-colors h-[2rem] sm:h-[2.25rem] text-[1rem] leading-[1.1rem] -tracking-[0.02em] font-[400] whitespace-nowrap ${
                          isButtonActive(10)
                            ? "bg-[#D8F1E2] border border-[#387F5C] text-[#387F5C] hover:bg-[#D8F1E2] hover:text-[#387F5C] hover:border-[#387F5C]"
                            : "bg-pinto-gray-1 border-pinto-gray-3 text-black hover:bg-pinto-green-1/50 hover:border-pinto-green-2/50"
                        } flex-1`}
                        onClick={() => handlePodLineSelect(10)}
                      >
                        10% ↑
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`rounded-full px-4 py-2 flex items-center justify-center transition-colors h-[2rem] sm:h-[2.25rem] text-[1rem] leading-[1.1rem] -tracking-[0.02em] font-[400] whitespace-nowrap ${
                          isButtonActive(25)
                            ? "bg-[#D8F1E2] border border-[#387F5C] text-[#387F5C] hover:bg-[#D8F1E2] hover:text-[#387F5C] hover:border-[#387F5C]"
                            : "bg-pinto-gray-1 border-pinto-gray-3 text-black hover:bg-pinto-green-1/50 hover:border-pinto-green-2/50"
                        } flex-1`}
                        onClick={() => handlePodLineSelect(25)}
                      >
                        25% ↑
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`rounded-full px-4 py-2 flex items-center justify-center transition-colors h-[2rem] sm:h-[2.25rem] text-[1rem] leading-[1.1rem] -tracking-[0.02em] font-[400] whitespace-nowrap ${
                          isButtonActive(50)
                            ? "bg-[#D8F1E2] border border-[#387F5C] text-[#387F5C] hover:bg-[#D8F1E2] hover:text-[#387F5C] hover:border-[#387F5C]"
                            : "bg-pinto-gray-1 border-pinto-gray-3 text-black hover:bg-pinto-green-1/50 hover:border-pinto-green-2/50"
                        } flex-1`}
                        onClick={() => handlePodLineSelect(50)}
                      >
                        50% ↑
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`rounded-full px-4 py-2 flex items-center justify-center transition-colors h-[2rem] sm:h-[2.25rem] text-[1rem] leading-[1.1rem] -tracking-[0.02em] font-[400] whitespace-nowrap ${
                          isButtonActive(100)
                            ? "bg-[#D8F1E2] border border-[#387F5C] text-[#387F5C] hover:bg-[#D8F1E2] hover:text-[#387F5C] hover:border-[#387F5C]"
                            : "bg-pinto-gray-1 border-pinto-gray-3 text-black hover:bg-pinto-green-1/50 hover:border-pinto-green-2/50"
                        } flex-1`}
                        onClick={() => handlePodLineSelect(100)}
                      >
                        100% ↑
                      </Button>
                    </div>
                  </div>

                  {/* Execute during the Morning Auction */}
                  <div className="flex flex-col gap-2">
                    <label htmlFor={inputIds.morningAuction} className="text-[#9C9C9C] text-base font-light">
                      Execute during the Morning Auction
                    </label>
                    <div className="flex justify-between gap-2 w-full">
                      <Button
                        variant="outline"
                        size="sm"
                        className={`rounded-full px-4 py-2 flex items-center justify-center transition-colors h-[2rem] sm:h-[2.25rem] text-[1rem] leading-[1.1rem] -tracking-[0.02em] font-[400] whitespace-nowrap ${
                          morningAuction
                            ? "bg-[#D8F1E2] border border-[#387F5C] text-[#387F5C] hover:bg-[#D8F1E2] hover:text-[#387F5C] hover:border-[#387F5C]"
                            : "bg-pinto-gray-1 border-pinto-gray-3 text-black hover:bg-pinto-green-1/50 hover:border-pinto-green-2/50"
                        } flex-1`}
                        onClick={() => setMorningAuction(true)}
                      >
                        Yes
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`rounded-full px-4 py-2 flex items-center justify-center transition-colors h-[2rem] sm:h-[2.25rem] text-[1rem] leading-[1.1rem] -tracking-[0.02em] font-[400] whitespace-nowrap ${
                          !morningAuction
                            ? "bg-[#D8F1E2] border border-[#387F5C] text-[#387F5C] hover:bg-[#D8F1E2] hover:text-[#387F5C] hover:border-[#387F5C]"
                            : "bg-pinto-gray-1 border-pinto-gray-3 text-black hover:bg-pinto-green-1/50 hover:border-pinto-green-2/50"
                        } flex-1`}
                        onClick={() => setMorningAuction(false)}
                      >
                        No
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                // Step 2 - Operator Tip
                <div className="flex flex-col gap-6 mt-6">
                  <div className="flex flex-col">
                    <div className="text-[#9C9C9C] text-base font-light mb-4">I'm willing to pay someone</div>

                    <div className="flex rounded-[12px] border border-[#D9D9D9] mb-4">
                      <input
                        className="h-12 px-3 py-1.5 flex-1 rounded-l-[12px] focus:outline-none text-base font-light"
                        placeholder="0.00"
                        value={operatorTip}
                        onChange={(e) => {
                          const newValue = e.target.value.replace(/[^0-9.,]/g, "");
                          setOperatorTip(newValue);
                          // Check if the new value matches any of our buttons
                          const activeButton = checkActiveTipButton(newValue);
                          setActiveTipButton(activeButton);
                        }}
                        type="text"
                      />
                      <div className="flex items-center gap-2 px-4 rounded-r-[12px] bg-white">
                        <img src="/src/assets/tokens/PINTO.png" alt="PINTO" className="w-6 h-6" />
                        <span className="text-base font-normal">PINTO</span>
                      </div>
                    </div>

                    <div className="flex justify-between gap-2 mb-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className={`rounded-full px-4 py-2 flex items-center justify-center transition-colors h-[2rem] sm:h-[2.25rem] text-[1rem] leading-[1.1rem] -tracking-[0.02em] font-[400] whitespace-nowrap flex-1 ${
                          activeTipButton === "down5"
                            ? "bg-[#D8F1E2] border border-[#387F5C] text-[#387F5C] hover:bg-[#D8F1E2] hover:text-[#387F5C] hover:border-[#387F5C]"
                            : "bg-pinto-gray-1 border-pinto-gray-3 text-black hover:bg-pinto-green-1/50 hover:border-pinto-green-2/50"
                        }`}
                        onClick={() => handleTipButtonClick("down5")}
                      >
                        5% ↓
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`rounded-full px-4 py-2 flex items-center justify-center transition-colors h-[2rem] sm:h-[2.25rem] text-[1rem] leading-[1.1rem] -tracking-[0.02em] font-[400] whitespace-nowrap flex-1 ${
                          activeTipButton === "down1"
                            ? "bg-[#D8F1E2] border border-[#387F5C] text-[#387F5C] hover:bg-[#D8F1E2] hover:text-[#387F5C] hover:border-[#387F5C]"
                            : "bg-pinto-gray-1 border-pinto-gray-3 text-black hover:bg-pinto-green-1/50 hover:border-pinto-green-2/50"
                        }`}
                        onClick={() => handleTipButtonClick("down1")}
                      >
                        1% ↓
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`rounded-full px-4 py-2 flex items-center justify-center transition-colors h-[2rem] sm:h-[2.25rem] text-[1rem] leading-[1.1rem] -tracking-[0.02em] font-[400] whitespace-nowrap flex-1 ${
                          activeTipButton === "average"
                            ? "bg-[#D8F1E2] border border-[#387F5C] text-[#387F5C] hover:bg-[#D8F1E2] hover:text-[#387F5C] hover:border-[#387F5C]"
                            : "bg-pinto-gray-1 border-pinto-gray-3 text-black hover:bg-pinto-green-1/50 hover:border-pinto-green-2/50"
                        }`}
                        onClick={() => handleTipButtonClick("average")}
                      >
                        Average
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`rounded-full px-4 py-2 flex items-center justify-center transition-colors h-[2rem] sm:h-[2.25rem] text-[1rem] leading-[1.1rem] -tracking-[0.02em] font-[400] whitespace-nowrap flex-1 ${
                          activeTipButton === "up1"
                            ? "bg-[#D8F1E2] border border-[#387F5C] text-[#387F5C] hover:bg-[#D8F1E2] hover:text-[#387F5C] hover:border-[#387F5C]"
                            : "bg-pinto-gray-1 border-pinto-gray-3 text-black hover:bg-pinto-green-1/50 hover:border-pinto-green-2/50"
                        }`}
                        onClick={() => handleTipButtonClick("up1")}
                      >
                        1% ↑
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`rounded-full px-4 py-2 flex items-center justify-center transition-colors h-[2rem] sm:h-[2.25rem] text-[1rem] leading-[1.1rem] -tracking-[0.02em] font-[400] whitespace-nowrap flex-1 ${
                          activeTipButton === "up5"
                            ? "bg-[#D8F1E2] border border-[#387F5C] text-[#387F5C] hover:bg-[#D8F1E2] hover:text-[#387F5C] hover:border-[#387F5C]"
                            : "bg-pinto-gray-1 border-pinto-gray-3 text-black hover:bg-pinto-green-1/50 hover:border-pinto-green-2/50"
                        }`}
                        onClick={() => handleTipButtonClick("up5")}
                      >
                        5% ↑
                      </Button>
                    </div>

                    <div className="text-[#9C9C9C] text-base font-light mb-6">
                      each time they Sow part of my Tractor Order.
                    </div>

                    <div className="flex flex-col gap-2 mb-6">
                      <div className="flex justify-between">
                        <div className="text-[#9C9C9C] text-base font-light">Estimated total number of executions</div>
                        <div className="text-black text-base font-light">{calculateEstimatedExecutions()}</div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-[#9C9C9C] text-base font-light">Estimated total tip</div>
                        <div className="flex items-center text-black text-base font-light">
                          {calculateEstimatedTotalTip()}
                          <img src="/src/assets/tokens/PINTO.png" alt="PINTO" className="w-5 h-5 mx-1" />
                          PINTO
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className={`flex gap-6 ${formStep === 0 ? "mt-24" : "mt-6"}`}>
                <Button
                  variant="outline"
                  className="flex-1 h-[60px] rounded-full text-2xl font-medium text-[#404040] bg-[#F8F8F8]"
                  onClick={handleBack}
                >
                  ← Back
                </Button>
                {formStep === 0 ? (
                  <SmartSubmitButton
                    variant="gradient"
                    submitFunction={handleCombineAndSortAll}
                    disabled={sortingAllTokens || submitting}
                    submitButtonText={sortingAllTokens || submitting ? "Optimizing..." : "Combine & Sort"}
                    className="flex-1 h-[60px] rounded-full text-2xl font-medium"
                  />
                ) : (
                  <Button
                    className={`flex-1 h-[60px] rounded-full text-2xl font-medium ${
                      (formStep === 1 && (!areRequiredFieldsFilled() || !!error)) || isLoading
                        ? "bg-[#D9D9D9] text-[#9C9C9C]"
                        : "bg-[#2F8957] text-white"
                    }`}
                    disabled={(formStep === 1 && (!areRequiredFieldsFilled() || !!error)) || isLoading}
                    onClick={handleNext}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                      </div>
                    ) : formStep === 1 ? (
                      "Next"
                    ) : (
                      "Review"
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Token Selection Dialog */}
      <Dialog open={showTokenSelectionDialog} onOpenChange={setShowTokenSelectionDialog}>
        <DialogPortal>
          <DialogOverlay className="fixed inset-0 backdrop-blur-sm bg-black/30" />
          <DialogContent
            className="sm:max-w-[700px] mx-auto p-0 bg-white rounded-2xl border border-[#D9D9D9]"
            style={{ padding: 0, gap: 0 }}
          >
            <div className="p-3">
              <div className="flex justify-between items-center mb-2">
                <h2 className="font-antarctica font-medium text-[20px] leading-[115%] text-black">
                  Select Token from Silo Deposits
                </h2>
              </div>
              <p className="text-gray-500 mb-2">Tractor allows you to fund Orders for Soil using Deposits</p>
              <div className="w-full h-[1px] bg-[#D9D9D9] mb-6" />

              {/* Dynamic funding source options */}
              <div className="flex flex-col gap-4 mb-6">
                <div className="text-gray-500">Dynamic funding source</div>
                <div className="grid grid-cols-2 gap-4">
                  <div
                    className={`flex items-center px-6 py-4 gap-2 rounded-[36px] cursor-pointer ${
                      selectedTokenStrategy.type === "LOWEST_PRICE"
                        ? "bg-[#F8F8F8] border border-[#D9D9D9]"
                        : "bg-[#F8F8F8] border border-[#D9D9D9]"
                    }`}
                    onClick={() => {
                      setSelectedTokenStrategy({ type: "LOWEST_PRICE" });
                      setShowTokenSelectionDialog(false);
                    }}
                  >
                    <div
                      className={`w-10 h-10 rounded-full ${
                        selectedTokenStrategy.type === "LOWEST_PRICE"
                          ? "bg-[#D8F1E2] border border-dashed border-[#387F5C]"
                          : "border border-[#D9D9D9]"
                      }`}
                    />
                    <div className="flex flex-col gap-1">
                      <span className="font-antarctica text-base font-normal leading-[110%] text-black">
                        Token with Best Price
                      </span>
                      <span className="font-antarctica text-base font-normal leading-[110%] text-[#9C9C9C]">
                        at time of execution
                      </span>
                    </div>
                  </div>

                  <div
                    className={`flex items-center px-6 py-4 gap-2 rounded-[36px] cursor-pointer ${
                      selectedTokenStrategy.type === "LOWEST_SEEDS"
                        ? "bg-[#F8F8F8] border border-[#D9D9D9]"
                        : "bg-[#F8F8F8] border border-[#D9D9D9]"
                    }`}
                    onClick={() => {
                      setSelectedTokenStrategy({ type: "LOWEST_SEEDS" });
                      setShowTokenSelectionDialog(false);
                    }}
                  >
                    <div
                      className={`w-10 h-10 rounded-full ${
                        selectedTokenStrategy.type === "LOWEST_SEEDS"
                          ? "bg-[#D8F1E2] border border-dashed border-[#387F5C]"
                          : "border border-[#D9D9D9]"
                      }`}
                    />
                    <div className="flex flex-col gap-1">
                      <span className="font-antarctica text-base font-normal leading-[110%] text-black">
                        Token with Least Seeds
                      </span>
                      <span className="font-antarctica text-base font-normal leading-[110%] text-[#9C9C9C]">
                        at time of execution
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Deposited Tokens */}
              <div className="flex flex-col gap-2">
                <div className="text-gray-500">Deposited Tokens</div>
                <div className="flex flex-col space-y-1 bg-white rounded-xl">
                  {whitelistedTokens.map((token) => {
                    const deposit = farmerDeposits.get(token);
                    const amount = deposit?.amount || TokenValue.ZERO;

                    // Calculate dollar value - use price for PINTO, swap results for LP tokens
                    const pintoAmount =
                      token.symbol === "PINTO"
                        ? amount.mul(priceData.price)
                        : swapResults.get(token.address) || TokenValue.ZERO;

                    const isSelected =
                      selectedTokenStrategy.type === "SPECIFIC_TOKEN" &&
                      selectedTokenStrategy.address === token.address;

                    return (
                      <div
                        key={token.address}
                        className={`flex items-center justify-between py-4 cursor-pointer rounded-lg ${
                          isSelected ? "bg-green-50" : "bg-white"
                        }`}
                        onClick={() => {
                          setSelectedTokenStrategy({
                            type: "SPECIFIC_TOKEN",
                            address: token.address as `0x${string}`,
                          });
                          setShowTokenSelectionDialog(false);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <IconImage src={token.logoURI} alt={token.symbol} size={12} className="rounded-full" />
                          <div className="flex flex-col">
                            <div className="font-medium text-lg mb-1">{token.symbol}</div>
                            <div className="flex items-center text-xs text-gray-500 gap-1">
                              <IconImage src={stalkIcon} size={3} alt="Stalk" />{" "}
                              {formatter.number(deposit?.stalk?.total || 0)} Stalk
                              <IconImage src={seedIcon} size={3} alt="Seeds" className="ml-1" />{" "}
                              {formatter.number(deposit?.seeds || 0)} Seeds
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="text-right text-xl font-medium">
                            {amount.toNumber() > 0 && amount.toNumber() < 0.01
                              ? formatter.number(amount, { minDecimals: 4, maxDecimals: 8 })
                              : formatter.number(amount)}
                          </div>
                          <div className="text-right text-gray-500 text-sm">
                            ${formatter.number(pintoAmount, { minDecimals: 2, maxDecimals: 2 })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-1 mt-2">
                  <InfoOutlinedIcon width={14} height={14} />
                  Deposits with the least Grown Stalk will always be used first
                </div>
              </div>
            </div>
          </DialogContent>
        </DialogPortal>
      </Dialog>

      {showReview && encodedData && operatorPasteInstructions && blueprint && (
        <ReviewTractorOrderDialog
          open={showReview}
          onOpenChange={setShowReview}
          onSuccess={() => onOpenChange(false)}
          orderData={{
            totalAmount,
            temperature,
            podLineLength,
            minSoil,
            operatorTip,
            tokenStrategy: selectedTokenStrategy.type,
            tokenSymbol: selectedTokenStrategy.type === "SPECIFIC_TOKEN" 
              ? whitelistedTokens.find(t => t.address === selectedTokenStrategy.address)?.symbol 
              : undefined,
            morningAuction
          }}
          encodedData={encodedData}
          operatorPasteInstrs={operatorPasteInstructions}
          blueprint={blueprint}
        />
      )}
    </>
  );
}
