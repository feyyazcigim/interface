import { TokenValue } from "@/classes/TokenValue";
import { sowBlueprintv0ABI } from "@/constants/abi/SowBlueprintv0ABI";
import { tractorHelpersABI } from "@/constants/abi/TractorHelpersABI";
import { diamondABI } from "@/constants/abi/diamondABI";
import { SOW_BLUEPRINT_V0_ADDRESS, SOW_BLUEPRINT_V0_SELECTOR, TRACTOR_HELPERS_ADDRESS } from "@/constants/address";
import { PINTO } from "@/constants/tokens";
import { beanstalkAbi } from "@/generated/contractHooks";
import { useProtocolAddress } from "@/hooks/pinto/useProtocolAddress";
import { FarmFromMode } from "@/utils/types";
import {
  Address,
  SignableMessage,
  decodeEventLog,
  decodeFunctionData,
  encodeAbiParameters,
  encodeFunctionData,
  keccak256,
} from "viem";
import { PublicClient } from "viem";
import { type BaseError, useContractWrite } from "wagmi";
import { Requisition } from "./types";

// Block number at which Tractor was deployed - use this as starting point for event queries
export const TRACTOR_DEPLOYMENT_BLOCK = 28930876n;

/**
 * Encodes three uint80 values into a bytes32 value in the format:
 * [ Padding (2 bytes) | copyByteIndex (10 bytes) | pasteCallIndex (10 bytes) | pasteByteIndex (10 bytes) ]
 */
/*function encodePasteInstruction(copyByteIndex: bigint, pasteCallIndex: bigint, pasteByteIndex: bigint): `0x${string}` {
  // Each value should be uint80 (10 bytes)
  const maxUint80 = BigInt("1208925819614629174706176"); // 2^80
  if (copyByteIndex >= maxUint80 || pasteCallIndex >= maxUint80 || pasteByteIndex >= maxUint80) {
    throw new Error("Values must be less than 2^80");
  }

  // Convert each value to a hex string padded to 10 bytes (20 hex chars)
  const copyByteHex = copyByteIndex.toString(16).padStart(20, "0");
  const callByteHex = pasteCallIndex.toString(16).padStart(20, "0");
  const pasteByteHex = pasteByteIndex.toString(16).padStart(20, "0");

  // Combine with 2 bytes of padding at the start
  const combined = `0x0000${copyByteHex}${callByteHex}${pasteByteHex}`;

  return combined as `0x${string}`;
}*/

// Add the TokenStrategy type
export type TokenStrategy =
  | { type: "LOWEST_SEEDS" }
  | { type: "LOWEST_PRICE" }
  | { type: "SPECIFIC_TOKEN"; address: `0x${string}` };

// Add this helper function outside createSowTractorData
async function getTokenIndex(publicClient: PublicClient, tokenAddress: `0x${string}`): Promise<number> {
  const index = await publicClient.readContract({
    address: TRACTOR_HELPERS_ADDRESS,
    abi: tractorHelpersABI,
    functionName: "getTokenIndex",
    args: [tokenAddress],
  });

  return Number(index);
}

/**
 * Creates blueprint data from Tractor inputs
 */
export async function createSowTractorData({
  totalAmountToSow,
  temperature,
  minAmountPerSeason,
  maxAmountToSowPerSeason,
  maxPodlineLength,
  maxGrownStalkPerBdv,
  runBlocksAfterSunrise,
  operatorTip,
  whitelistedOperators,
  tokenStrategy,
  publicClient, // Add this parameter
}: {
  totalAmountToSow: string;
  temperature: string;
  minAmountPerSeason: string;
  maxAmountToSowPerSeason: string;
  maxPodlineLength: string;
  maxGrownStalkPerBdv: string;
  runBlocksAfterSunrise: string;
  operatorTip: string;
  whitelistedOperators: `0x${string}`[];
  tokenStrategy: TokenStrategy;
  publicClient: PublicClient;
}): Promise<{ data: `0x${string}`; operatorPasteInstrs: `0x${string}`[]; rawCall: `0x${string}` }> {
  // Add more detailed debug logs
  console.log("tokenStrategy received:", tokenStrategy);
  console.log("tokenStrategy.type:", tokenStrategy.type);
  console.log("tokenStrategy.address:", tokenStrategy.type === "SPECIFIC_TOKEN" ? tokenStrategy.address : "N/A");

  // Convert inputs to appropriate types
  const totalAmount = BigInt(Math.floor(parseFloat(totalAmountToSow) * 1e6));
  const minAmount = BigInt(Math.floor(parseFloat(minAmountPerSeason) * 1e6));
  const maxAmount = BigInt(Math.floor(parseFloat(maxAmountToSowPerSeason) * 1e6));

  // Fix for maxPodlineLength - convert to a full number without truncation
  // Remove commas, parse as float, multiply by 1e6 to get the raw value without truncation
  const cleanMaxPodlineLength = maxPodlineLength.replace(/,/g, "");
  // Use string operations to avoid floating point precision issues
  const [whole, decimal = ""] = cleanMaxPodlineLength.split(".");
  const paddedDecimal = decimal.padEnd(6, "0").slice(0, 6); // Ensure 6 decimal places
  const maxPodlineBigInt = BigInt(whole + paddedDecimal);

  const maxGrownStalk = BigInt(Math.floor(parseFloat(maxGrownStalkPerBdv) * 1e6));
  const runBlocks = BigInt(runBlocksAfterSunrise === "true" ? 0 : 300); // 0 for morning auction, 300 otherwise
  const temp = BigInt(Math.floor(parseFloat(temperature) * 1e6));
  const tip = BigInt(Math.floor(parseFloat(operatorTip) * 1e6));

  // Get source token indices based on strategy
  let sourceTokenIndices: number[];
  if (tokenStrategy.type === "LOWEST_SEEDS") {
    console.log("Using LOWEST_SEEDS strategy");
    sourceTokenIndices = [255];
  } else if (tokenStrategy.type === "LOWEST_PRICE") {
    console.log("Using LOWEST_PRICE strategy");
    sourceTokenIndices = [254];
  } else if (tokenStrategy.type === "SPECIFIC_TOKEN") {
    console.log("Using SPECIFIC_TOKEN strategy with address:", tokenStrategy.address);
    const index = await getTokenIndex(publicClient, tokenStrategy.address as `0x${string}`);
    console.log("Got token index:", index);
    sourceTokenIndices = [index];
  } else {
    console.log("Unknown strategy type:", tokenStrategy);
    sourceTokenIndices = [];
  }

  // Log the final indices
  console.log("Final sourceTokenIndices:", sourceTokenIndices);

  // Create the SowBlueprintStruct
  const sowBlueprintStruct = {
    sowParams: {
      sourceTokenIndices,
      sowAmounts: {
        totalAmountToSow: totalAmount,
        minAmountToSowPerSeason: minAmount,
        maxAmountToSowPerSeason: maxAmount,
      },
      minTemp: temp,
      maxPodlineLength: maxPodlineBigInt,
      maxGrownStalkPerBdv: maxGrownStalk,
      runBlocksAfterSunrise: runBlocks,
      slippageRatio: BigInt(1e18),
    },
    opParams: {
      whitelistedOperators: whitelistedOperators as readonly `0x${string}`[],
      tipAddress: "0x0000000000000000000000000000000000000000" as `0x${string}`,
      operatorTipAmount: tip,
    },
  };

  console.log("Struct before encoding:", {
    sowParams: {
      sourceTokenIndices: sowBlueprintStruct.sowParams.sourceTokenIndices,
      sowAmounts: {
        totalAmountToSow: sowBlueprintStruct.sowParams.sowAmounts.totalAmountToSow.toString(),
        minAmountToSowPerSeason: sowBlueprintStruct.sowParams.sowAmounts.minAmountToSowPerSeason.toString(),
        maxAmountToSowPerSeason: sowBlueprintStruct.sowParams.sowAmounts.maxAmountToSowPerSeason.toString(),
      },
      minTemp: sowBlueprintStruct.sowParams.minTemp.toString(),
      maxPodlineLength: sowBlueprintStruct.sowParams.maxPodlineLength.toString(),
      maxGrownStalkPerBdv: sowBlueprintStruct.sowParams.maxGrownStalkPerBdv.toString(),
      runBlocksAfterSunrise: sowBlueprintStruct.sowParams.runBlocksAfterSunrise.toString(),
    },
    opParams: {
      whitelistedOperators: sowBlueprintStruct.opParams.whitelistedOperators,
      tipAddress: sowBlueprintStruct.opParams.tipAddress,
      operatorTipAmount: sowBlueprintStruct.opParams.operatorTipAmount.toString(),
    },
  });

  // Encode the raw sowBlueprintv0 call
  const sowBlueprintCall = encodeFunctionData({
    abi: sowBlueprintv0ABI,
    functionName: "sowBlueprintv0",
    args: [sowBlueprintStruct],
  });

  // Step 1: Wrap the sowBlueprintv0 call in an advancedPipe call
  const pipeCall = encodeFunctionData({
    abi: beanstalkAbi,
    functionName: "advancedPipe",
    args: [
      [
        {
          target: SOW_BLUEPRINT_V0_ADDRESS, // Use the constant directly
          callData: sowBlueprintCall,
          clipboard: "0x0000" as `0x${string}`, // Minimal clipboard data
        },
      ],
      0n, // outputIndex parameter as BigInt
    ],
  });

  // Step 2: Wrap the advancedPipe call in an advancedFarm call
  const data = encodeFunctionData({
    abi: beanstalkAbi,
    functionName: "advancedFarm",
    args: [
      [
        {
          callData: pipeCall,
          clipboard: "0x" as `0x${string}`, // Empty clipboard
        },
      ],
    ],
  });

  console.log("Raw sowBlueprintv0 call:", sowBlueprintCall);
  console.log("advancedPipe call:", pipeCall);
  console.log("Final advancedFarm call:", data);

  return {
    data,
    operatorPasteInstrs: [], // TODO: Update if needed
    rawCall: sowBlueprintCall, // Return the raw call data
  };
}

/**
 * Signs a requisition using the publisher's wallet
 */
export async function signRequisition(
  requisition: Requisition,
  signer: { signMessage: (args: { message: SignableMessage }) => Promise<`0x${string}`> },
): Promise<`0x${string}`> {
  const signature = await signer.signMessage({ message: { raw: requisition.blueprintHash } });
  requisition.signature = signature;
  return signature;
}

// Update the interface to include both raw and formatted values
export interface SowBlueprintData {
  sourceTokenIndices: readonly number[];
  sowAmounts: {
    totalAmountToSow: bigint;
    totalAmountToSowAsString: string;
    minAmountToSowPerSeason: bigint;
    minAmountToSowPerSeasonAsString: string;
    maxAmountToSowPerSeason: bigint;
    maxAmountToSowPerSeasonAsString: string;
  };
  minTemp: bigint;
  minTempAsString: string;
  maxPodlineLength: bigint;
  maxPodlineLengthAsString: string;
  maxGrownStalkPerBdv: bigint;
  maxGrownStalkPerBdvAsString: string;
  runBlocksAfterSunrise: bigint;
  runBlocksAfterSunriseAsString: string;
  slippageRatio: bigint;
  slippageRatioAsString: string;
  operatorParams: {
    whitelistedOperators: readonly `0x${string}`[];
    tipAddress: `0x${string}`;
    operatorTipAmount: bigint;
    operatorTipAmountAsString: string;
  };
  fromMode: FarmFromMode;
}

/**
 * Decodes sow data from encoded function call
 */
export function decodeSowTractorData(encodedData: `0x${string}`): SowBlueprintData | null {
  try {
    // console.log("Decoding data:", encodedData);
    let sowBlueprintData: `0x${string}` | null = null;

    // Step 1: Try to decode as advancedFarm call first
    try {
      const advancedFarmDecoded = decodeFunctionData({
        abi: beanstalkAbi,
        data: encodedData,
      });

      // console.log("Advanced Farm decoded:", advancedFarmDecoded);

      if (advancedFarmDecoded.functionName === "advancedFarm" && advancedFarmDecoded.args[0]) {
        const farmCalls = advancedFarmDecoded.args[0] as { callData: `0x${string}`; clipboard: `0x${string}` }[];

        if (farmCalls.length > 0) {
          // Step 2: Try to decode the inner call as advancedPipe
          try {
            const pipeCallData = farmCalls[0].callData;
            const advancedPipeDecoded = decodeFunctionData({
              abi: beanstalkAbi,
              data: pipeCallData,
            });

            // console.log("Advanced Pipe decoded:", advancedPipeDecoded);

            if (advancedPipeDecoded.functionName === "advancedPipe" && advancedPipeDecoded.args[0]) {
              const pipeCalls = advancedPipeDecoded.args[0] as {
                target: `0x${string}`;
                callData: `0x${string}`;
                clipboard: `0x${string}`;
              }[];

              if (pipeCalls.length > 0) {
                // Step 3: Get the sowBlueprintv0 call data
                sowBlueprintData = pipeCalls[0].callData;
                // console.log("Found sowBlueprintData in advancedPipe:", sowBlueprintData);

                // Try to decode the sowBlueprintv0 data directly
                try {
                  const sowDecoded = decodeFunctionData({
                    abi: sowBlueprintv0ABI,
                    data: sowBlueprintData,
                  });
                  // console.log("Sow Blueprint decoded:", sowDecoded);

                  if (sowDecoded.args && typeof sowDecoded.args[0] === "object" && sowDecoded.args[0] !== null) {
                    const params = sowDecoded.args[0] as {
                      sowParams: {
                        sourceTokenIndices: readonly number[];
                        sowAmounts: {
                          totalAmountToSow: bigint;
                          minAmountToSowPerSeason: bigint;
                          maxAmountToSowPerSeason: bigint;
                        };
                        minTemp: bigint;
                        maxPodlineLength: bigint;
                        maxGrownStalkPerBdv: bigint;
                        runBlocksAfterSunrise: bigint;
                        slippageRatio: bigint;
                      };
                      opParams: {
                        whitelistedOperators: readonly `0x${string}`[];
                        tipAddress: `0x${string}`;
                        operatorTipAmount: bigint;
                      };
                    };

                    return {
                      sourceTokenIndices: params.sowParams.sourceTokenIndices,
                      sowAmounts: {
                        totalAmountToSow: params.sowParams.sowAmounts.totalAmountToSow,
                        totalAmountToSowAsString: TokenValue.fromBlockchain(
                          params.sowParams.sowAmounts.totalAmountToSow,
                          6,
                        ).toHuman(),
                        minAmountToSowPerSeason: params.sowParams.sowAmounts.minAmountToSowPerSeason,
                        minAmountToSowPerSeasonAsString: TokenValue.fromBlockchain(
                          params.sowParams.sowAmounts.minAmountToSowPerSeason,
                          6,
                        ).toHuman(),
                        maxAmountToSowPerSeason: params.sowParams.sowAmounts.maxAmountToSowPerSeason,
                        maxAmountToSowPerSeasonAsString: TokenValue.fromBlockchain(
                          params.sowParams.sowAmounts.maxAmountToSowPerSeason,
                          6,
                        ).toHuman(),
                      },
                      minTemp: params.sowParams.minTemp,
                      minTempAsString: TokenValue.fromBlockchain(params.sowParams.minTemp, 6).toHuman(),
                      maxPodlineLength: params.sowParams.maxPodlineLength,
                      maxPodlineLengthAsString: TokenValue.fromBlockchain(
                        params.sowParams.maxPodlineLength,
                        6,
                      ).toHuman(),
                      maxGrownStalkPerBdv: params.sowParams.maxGrownStalkPerBdv,
                      maxGrownStalkPerBdvAsString: TokenValue.fromBlockchain(
                        params.sowParams.maxGrownStalkPerBdv,
                        6,
                      ).toHuman(),
                      runBlocksAfterSunrise: params.sowParams.runBlocksAfterSunrise,
                      runBlocksAfterSunriseAsString: params.sowParams.runBlocksAfterSunrise.toString(),
                      slippageRatio: params.sowParams.slippageRatio,
                      slippageRatioAsString: TokenValue.fromBlockchain(params.sowParams.slippageRatio, 18).toHuman(),
                      operatorParams: {
                        whitelistedOperators: params.opParams.whitelistedOperators,
                        tipAddress: params.opParams.tipAddress,
                        operatorTipAmount: params.opParams.operatorTipAmount,
                        operatorTipAmountAsString: TokenValue.fromBlockchain(
                          params.opParams.operatorTipAmount,
                          6,
                        ).toHuman(),
                      },
                      fromMode: FarmFromMode.INTERNAL,
                    };
                  }
                } catch (error) {
                  console.error("Failed to decode sowBlueprintv0 data:", error);
                }
              }
            }
          } catch (error) {
            console.log("Failed to decode as advancedPipe:", error);
          }
        }
      }
    } catch (error) {
      console.log("Failed to decode as advancedFarm:", error);
    }

    return null;
  } catch (error) {
    console.error("Failed to decode sow data:", error);
    return null;
  }
}

/**
 * Finds the offset of the operator placeholder address in the encoded data
 * Returns the offset where the placeholder slot begins
 */
export function findOperatorPlaceholderOffset(encodedData: `0x${string}`): number {
  // Remove 0x prefix for easier searching
  const data = encodedData.slice(2);

  // The placeholder address without 0x prefix, padded to 32 bytes (64 hex chars)
  const PLACEHOLDER = "0000000000000000000000004242424242424242424242424242424242424242";

  // Search for the placeholder in the data
  const index = data.toLowerCase().indexOf(PLACEHOLDER.toLowerCase());

  if (index === -1) {
    throw new Error("Operator placeholder not found in encoded data");
  }
  return index / 2; // Convert from hex characters to bytes
}

export async function fetchTractorEvents(publicClient: PublicClient, protocolAddress: `0x${string}`) {
  // Get published requisitions
  const publishEvents = await publicClient.getContractEvents({
    address: protocolAddress,
    abi: diamondABI,
    eventName: "PublishRequisition",
    fromBlock: TRACTOR_DEPLOYMENT_BLOCK,
    toBlock: "latest",
  });

  // Get cancelled blueprints
  const cancelEvents = await publicClient.getContractEvents({
    address: protocolAddress,
    abi: diamondABI,
    eventName: "CancelBlueprint",
    fromBlock: TRACTOR_DEPLOYMENT_BLOCK,
    toBlock: "latest",
  });

  // Create a set of cancelled blueprint hashes
  const cancelledHashes = new Set(
    cancelEvents
      .map((event) => event.args?.blueprintHash)
      .filter((hash): hash is NonNullable<typeof hash> => hash !== undefined),
  );

  return { publishEvents, cancelledHashes };
}

export interface RequisitionData {
  blueprint: {
    publisher: `0x${string}`;
    data: `0x${string}`;
    operatorPasteInstrs: readonly `0x${string}`[];
    maxNonce: bigint;
    startTime: bigint;
    endTime: bigint;
  };
  blueprintHash: `0x${string}`;
  signature: `0x${string}`;
}

export interface RequisitionEvent {
  requisition: RequisitionData;
  blockNumber: number;
  timestamp?: number;
  isCancelled?: boolean;
  requisitionType: "sowBlueprintv0" | "unknown";
  decodedData: SowBlueprintData | null;
}

// First, export the requisition type as a standalone type for reuse
export type RequisitionType = "sowBlueprintv0" | "unknown";

export async function loadPublishedRequisitions(
  address: string | undefined,
  protocolAddress: `0x${string}` | undefined,
  publicClient: PublicClient | null,
  latestBlock?: { number: bigint; timestamp: bigint } | null,
  requisitionType?: RequisitionType | RequisitionType[], // Add requisition type filter
) {
  if (!protocolAddress || !publicClient) return [];

  try {
    const { publishEvents, cancelledHashes } = await fetchTractorEvents(publicClient, protocolAddress);

    const filteredEvents = publishEvents
      .map((event) => {
        const requisition = event.args?.requisition as RequisitionData;
        if (!requisition?.blueprint || !requisition?.blueprintHash || !requisition?.signature) return null;

        // Only filter by address if one is provided
        if (address && requisition.blueprint.publisher.toLowerCase() !== address.toLowerCase()) {
          return null;
        }

        let eventRequisitionType: RequisitionType = "unknown";
        // Try to decode the data
        const decodedData = decodeSowTractorData(requisition.blueprint.data);
        if (decodedData) {
          eventRequisitionType = "sowBlueprintv0";
        }

        // Filter by requisition type if provided
        if (requisitionType) {
          const typeArray = Array.isArray(requisitionType) ? requisitionType : [requisitionType];
          if (!typeArray.includes(eventRequisitionType)) {
            return null;
          }
        }

        // Calculate timestamp if we have the latest block info
        let timestamp: number | undefined = undefined;
        if (latestBlock) {
          // Convert all BigInt values to Number before arithmetic operations
          const latestTimestamp = Number(latestBlock.timestamp);
          const latestBlockNumber = Number(latestBlock.number);
          const eventBlockNumber = Number(event.blockNumber);

          // Calculate timestamp (approximately 2 seconds per block)
          timestamp = latestTimestamp * 1000 - (latestBlockNumber - eventBlockNumber) * 2000;
        }

        return {
          requisition,
          blockNumber: Number(event.blockNumber),
          timestamp,
          isCancelled: cancelledHashes.has(requisition.blueprintHash),
          requisitionType: eventRequisitionType,
          decodedData,
        } as RequisitionEvent;
      })
      .filter((event): event is NonNullable<typeof event> => event !== null);

    return filteredEvents;
  } catch (error) {
    console.error("Error loading published requisitions:", error);
    throw new Error("Failed to load published requisitions");
  }
}

interface PasteField {
  name: string;
  type: "address" | string; // Add more types as needed
}

interface PasteInstructions {
  fields: PasteField[];
  calls: { callData: `0x${string}`; clipboard: `0x${string}` }[];
  operatorPasteInstrs: readonly `0x${string}`[];
}

/**
 * Parses the paste instructions from the requisition, returns fields with descriptions and types
 */
export function parsePasteInstructions(requisition: RequisitionEvent): PasteInstructions | null {
  try {
    // Try to decode as advancedFarm first
    let calls: { callData: `0x${string}`; clipboard: `0x${string}` }[] | undefined;

    try {
      const decoded = decodeFunctionData({
        abi: beanstalkAbi,
        data: requisition.requisition.blueprint.data,
      });

      if (decoded.functionName === "advancedFarm") {
        calls = decoded.args?.[0] as { callData: `0x${string}`; clipboard: `0x${string}` }[] | undefined;
      }
    } catch (error) {
      console.log("Not an advancedFarm call, trying direct approach:", error);
      // Not an advancedFarm call, will try the original approach next
    }

    // If we couldn't decode as advancedFarm or didn't find the calls
    if (!calls) {
      // Try the original approach - assume it's a direct call
      calls = [
        {
          callData: requisition.requisition.blueprint.data,
          clipboard: "0x" as `0x${string}`,
        },
      ];
    }

    if (!calls || calls.length === 0) {
      console.error("No calls found in blueprint data");
      return null;
    }

    const fields: PasteField[] = [];
    if (requisition.requisitionType === "sowBlueprintv0") {
      fields.push({ name: "Operator Address", type: "address" });
    }

    return {
      fields,
      calls: calls.map((call) => ({
        callData: call.callData,
        clipboard: call.clipboard,
      })),
      operatorPasteInstrs: requisition.requisition.blueprint.operatorPasteInstrs,
    };
  } catch (error) {
    console.error("Failed to decode paste instructions:", error);
    return null;
  }
}

/**
 * Generates operator data by padding and concatenating field values
 */
export function generateOperatorData(fields: PasteField[], values: string[]): `0x${string}` {
  try {
    if (fields.length !== values.length) {
      throw new Error(`Expected ${fields.length} values but got ${values.length}`);
    }

    // For each field, pad the value to 32 bytes
    const paddedValues = fields.map((field, index) => {
      const value = values[index];
      if (!value) throw new Error(`Missing value for field: ${field.name}`);

      if (field.type === "address") {
        // Remove 0x prefix if present and pad to 32 bytes (64 hex chars)
        const cleanAddr = value.toLowerCase().replace("0x", "");
        return cleanAddr.padStart(64, "0");
      }
      // Add other field types here as needed
      throw new Error(`Unsupported field type: ${field.type}`);
    });

    // Concatenate all padded values
    const operatorData = `0x${paddedValues.join("")}`;
    return operatorData as `0x${string}`;
  } catch (error) {
    console.error("Failed to generate operator data:", error);
    throw error;
  }
}

// Add this interface to make it easier to use in components
export interface SowBlueprintDisplayData {
  totalAmount: string;
  minAmount: string;
  maxAmount: string;
  minTemp: string;
  maxPodlineLength: string;
  maxGrownStalkPerBdv: string;
  runBlocksAfterSunrise: string;
  slippageRatio: string;
  operatorTip: string;
  whitelistedOperators: readonly `0x${string}`[];
  tipAddress: `0x${string}`;
}

// Add a helper function to convert SowBlueprintData to display data
export function getSowBlueprintDisplayData(data: SowBlueprintData): SowBlueprintDisplayData {
  return {
    totalAmount: data.sowAmounts.totalAmountToSowAsString,
    minAmount: data.sowAmounts.minAmountToSowPerSeasonAsString,
    maxAmount: data.sowAmounts.maxAmountToSowPerSeasonAsString,
    minTemp: data.minTempAsString,
    maxPodlineLength: data.maxPodlineLengthAsString,
    maxGrownStalkPerBdv: data.maxGrownStalkPerBdvAsString,
    runBlocksAfterSunrise: data.runBlocksAfterSunriseAsString,
    slippageRatio: data.slippageRatioAsString,
    operatorTip: data.operatorParams.operatorTipAmountAsString,
    whitelistedOperators: data.operatorParams.whitelistedOperators,
    tipAddress: data.operatorParams.tipAddress,
  };
}

interface SowEventArgs {
  account: `0x${string}`;
  fieldId: bigint;
  index: bigint;
  beans: bigint;
  pods: bigint;
}

export async function fetchTractorExecutions(
  publicClient: PublicClient,
  protocolAddress: `0x${string}`,
  publisher: `0x${string}`,
) {
  // Get Tractor events
  const tractorEvents = await publicClient.getContractEvents({
    address: protocolAddress,
    abi: diamondABI,
    eventName: "Tractor",
    args: {
      publisher: publisher,
    },
    fromBlock: TRACTOR_DEPLOYMENT_BLOCK,
    toBlock: "latest",
  });

  // Process transaction receipts and collect block numbers
  const blockNumbers = new Set<bigint>();
  const processingResults = await Promise.all(
    tractorEvents.map(async (event) => {
      const receipt = await publicClient.getTransactionReceipt({
        hash: event.transactionHash,
      });

      // Add block number to the set for batch fetching
      blockNumbers.add(receipt.blockNumber);

      // Find the Sow event in the transaction logs
      const sowEvent = receipt.logs.find((log) => {
        try {
          const decoded = decodeEventLog({
            abi: diamondABI,
            data: log.data,
            topics: log.topics,
          });
          return decoded.eventName === "Sow";
        } catch {
          return false;
        }
      });

      // Decode the Sow event if found
      let sowData: SowEventArgs | undefined;
      if (sowEvent) {
        try {
          const decoded = decodeEventLog({
            abi: diamondABI,
            data: sowEvent.data,
            topics: sowEvent.topics,
          }) as { args: SowEventArgs };

          sowData = {
            account: decoded.args.account,
            fieldId: decoded.args.fieldId,
            index: decoded.args.index,
            beans: decoded.args.beans,
            pods: decoded.args.pods,
          };
        } catch (error) {
          console.error("Failed to decode Sow event:", error);
        }
      }

      return {
        blockNumber: receipt.blockNumber,
        event,
        receipt,
        sowData,
      };
    }),
  );

  // Fetch all required blocks in a batch
  const blocks = await Promise.all(
    Array.from(blockNumbers).map((blockNumber) => publicClient.getBlock({ blockNumber })),
  );

  // Build a map of block numbers to timestamps
  const blockTimestamps = new Map<string, number>();
  blocks.forEach((block) => {
    blockTimestamps.set(block.number.toString(), Number(block.timestamp) * 1000);
  });

  // Assemble the final result
  return processingResults.map((result) => {
    return {
      blockNumber: Number(result.blockNumber),
      operator: result.event.args?.operator as `0x${string}`,
      publisher: result.event.args?.publisher as `0x${string}`,
      blueprintHash: result.event.args?.blueprintHash as `0x${string}`,
      transactionHash: result.event.transactionHash,
      timestamp: blockTimestamps.get(result.blockNumber.toString()),
      sowEvent: result.sowData,
    };
  });
}

// Add interface for tracking deposits
interface Deposit {
  stem: bigint;
  amount: bigint;
  used: boolean;
}

interface AccountDeposits {
  [account: string]: {
    [token: string]: Deposit[];
  };
}

// Update the interface to make decodedData optional
export interface OrderbookEntry extends Omit<RequisitionEvent, "decodedData"> {
  pintosLeftToSow: TokenValue;
  totalAvailablePinto: TokenValue;
  currentlySowable: TokenValue;
  amountSowableNextSeason: TokenValue;
  estimatedPlaceInLine: TokenValue;
  withdrawalPlan?: WithdrawalPlan;
}

// Then update the processing interface
interface OrderbookEntryWithProcessingData extends Omit<OrderbookEntry, "decodedData"> {
  decodedData: SowBlueprintData | null;
  withdrawalPlan?: WithdrawalPlan;
}

// Add this type definition after the OrderbookEntryWithProcessingData interface
export interface WithdrawalPlan {
  sourceTokens: readonly `0x${string}`[];
  stems: readonly (readonly bigint[])[];
  amounts: readonly (readonly bigint[])[];
  availableBeans: readonly bigint[];
  totalAvailableBeans: bigint;
}

export async function loadOrderbookData(
  address: string | undefined,
  protocolAddress: `0x${string}` | undefined,
  publicClient: PublicClient | null,
  latestBlock?: { number: bigint; timestamp: bigint } | null,
): Promise<OrderbookEntry[]> {
  if (!protocolAddress || !publicClient) return [];

  try {
    // First, get the current pod line from the protocol
    let currentPodLine = TokenValue.ZERO;
    try {
      // Get the current pod index and harvestable index to calculate the current pod line
      const podIndexResult = await publicClient.readContract({
        address: protocolAddress,
        abi: diamondABI,
        functionName: "podIndex",
        args: [0n],
      });

      const harvestableIndexResult = await publicClient.readContract({
        address: protocolAddress,
        abi: diamondABI,
        functionName: "harvestableIndex",
        args: [0n],
      });

      if (podIndexResult && harvestableIndexResult) {
        // Pod line is podIndex - harvestableIndex
        currentPodLine = TokenValue.fromBlockchain(podIndexResult - harvestableIndexResult, 6);
        console.log(`Current Pod Line: ${currentPodLine.toHuman()}`);
      }
    } catch (error) {
      console.error("Failed to get current pod line:", error);
      // Continue with zero if we can't get the current pod line
    }

    const requisitions = await loadPublishedRequisitions(
      address,
      protocolAddress,
      publicClient,
      latestBlock,
      "sowBlueprintv0",
    );

    const activeRequisitions = requisitions.filter((req) => !req.isCancelled);

    // Decode data and sort requisitions by temperature (lowest first)
    const requisitionsWithTemperature = activeRequisitions.map((requisition) => {
      const decodedData = decodeSowTractorData(requisition.requisition.blueprint.data);
      return {
        requisition,
        temperature: decodedData?.minTemp || 0n,
        decodedData,
      };
    });

    // Sort requisitions by temperature
    requisitionsWithTemperature.sort((a, b) => Number(a.temperature - b.temperature));

    // Track used withdrawal plans per publisher for allocation priority
    const publisherWithdrawalPlans: { [publisher: string]: any[] } = {};

    // Process requisitions in a single loop (already sorted by temperature)
    const orderbookData: OrderbookEntry[] = [];

    console.log("\nProcessing orderbook data:");

    // Running total of place in line, starting with current pod line
    let runningPlaceInLine = currentPodLine;

    for (let i = 0; i < requisitionsWithTemperature.length; i++) {
      const { requisition, decodedData } = requisitionsWithTemperature[i];
      const publisher = requisition.requisition.blueprint.publisher;

      console.log(`\n--- Processing Order #${i + 1} ---`);
      if (decodedData) {
        console.log(`Temperature: ${decodedData.minTempAsString}%`);
      }
      console.log(`Publisher: ${publisher}`);

      try {
        // Get pintos left to sow
        const pintosLeft = await publicClient.readContract({
          address: SOW_BLUEPRINT_V0_ADDRESS,
          abi: sowBlueprintv0ABI,
          functionName: "getPintosLeftToSow",
          args: [requisition.requisition.blueprintHash],
        });

        // If pintosLeft is zero, this means the storage slot hasn't been initialized yet
        const finalPintosLeft =
          pintosLeft === 0n && decodedData
            ? TokenValue.fromBlockchain(decodedData.sowAmounts.totalAmountToSow, 6)
            : TokenValue.fromBlockchain(pintosLeft, 6);

        console.log(`Pintos Left to Sow: ${finalPintosLeft.toHuman()}`);

        // Handle withdrawal plan calculation with temperature priority
        let withdrawalPlan: WithdrawalPlan | null = null;
        let totalAvailablePinto = TokenValue.ZERO;

        if (decodedData) {
          // Get existing withdrawal plans for this publisher
          const existingPlans = publisherWithdrawalPlans[publisher] || [];
          console.log("Existing plans for publisher:", existingPlans.length);

          let combinedExistingPlan = null;

          // If we have existing plans, combine them
          if (existingPlans.length > 0) {
            try {
              // Combine all existing withdrawal plans for this publisher
              const combinedPlan = (await publicClient.readContract({
                address: TRACTOR_HELPERS_ADDRESS,
                abi: tractorHelpersABI,
                functionName: "combineWithdrawalPlans",
                args: [existingPlans],
              })) as any;

              combinedExistingPlan = combinedPlan;

              console.log("Combined existing plans for publisher:", publisher);
              console.log(
                "Total available PINTO in combined plan:",
                TokenValue.fromBlockchain(combinedPlan.totalAvailableBeans, 6).toHuman(),
              );
            } catch (error) {
              console.error("Failed to combine withdrawal plans:", error);
              combinedExistingPlan = null;
            }
          }

          // Get a new withdrawal plan that excludes deposits already allocated to other orders
          try {
            const emptyPlan = {
              sourceTokens: [] as readonly `0x${string}`[],
              stems: [] as readonly (readonly bigint[])[],
              amounts: [] as readonly (readonly bigint[])[],
              availableBeans: [] as readonly bigint[],
              totalAvailableBeans: 0n,
            };

            withdrawalPlan = await publicClient.readContract({
              address: TRACTOR_HELPERS_ADDRESS,
              abi: tractorHelpersABI,
              functionName: "getWithdrawalPlanExcludingPlan",
              args: [
                publisher,
                decodedData.sourceTokenIndices,
                decodedData.sowAmounts.totalAmountToSow,
                decodedData.maxGrownStalkPerBdv,
                combinedExistingPlan || emptyPlan,
              ],
            });

            console.log("Got updated withdrawal plan excluding existing orders");
            totalAvailablePinto = TokenValue.fromBlockchain(withdrawalPlan.totalAvailableBeans, 6);

            // Add this plan to the list of existing plans for future orders
            if (withdrawalPlan.sourceTokens.length > 0) {
              if (!publisherWithdrawalPlans[publisher]) {
                publisherWithdrawalPlans[publisher] = [];
              }
              publisherWithdrawalPlans[publisher].push(withdrawalPlan);
            }
          } catch (error) {
            console.error("Failed to get updated withdrawal plan:", error);
            // If the error is "No beans available", set the plan to empty
            if (error instanceof Error && error.message?.includes("No beans available")) {
              console.log("No beans available for this order, setting available PINTO to 0");
              withdrawalPlan = {
                sourceTokens: [] as readonly `0x${string}`[],
                stems: [] as readonly (readonly bigint[])[],
                amounts: [] as readonly (readonly bigint[])[],
                availableBeans: [] as readonly bigint[],
                totalAvailableBeans: 0n,
              };
              totalAvailablePinto = TokenValue.ZERO;
            }
          }
        }

        // Calculate how much PINTO this order can use
        const currentlySowable = TokenValue.min(finalPintosLeft, totalAvailablePinto);
        console.log(`Total available PINTO: ${totalAvailablePinto.toHuman()}`);
        console.log(`Currently sowable: ${currentlySowable.toHuman()}`);

        // Calculate amountSowableNextSeason as the lesser of currentlySowable and minAmountToSowPerSeason
        let amountSowableNextSeason = currentlySowable;
        if (decodedData && decodedData.sowAmounts.minAmountToSowPerSeason) {
          const minAmountPerSeason = TokenValue.fromBlockchain(decodedData.sowAmounts.minAmountToSowPerSeason, 6);
          amountSowableNextSeason = TokenValue.min(currentlySowable, minAmountPerSeason);
          console.log(`Min amount to sow per season: ${minAmountPerSeason.toHuman()}`);
          console.log(`Amount sowable next season: ${amountSowableNextSeason.toHuman()}`);
        }

        // Calculate the place in line for this order
        const estimatedPlaceInLine = TokenValue.fromBlockchain(runningPlaceInLine.toBigInt(), 6);
        console.log(`Estimated place in line: ${estimatedPlaceInLine.toHuman()}`);

        // If this order will have some pods sown next season, update the running place in line
        // for future orders by adding this order's pod amount
        if (amountSowableNextSeason.gt(0)) {
          // Get the temperature for this order
          const temp = decodedData ? parseFloat(decodedData.minTempAsString) : 0;

          // Calculate the pods that will be minted (PINTO amount * (1 + temperature/100))
          const podsToMint = amountSowableNextSeason.mul(1 + temp / 100);
          console.log(`Estimated pods to mint: ${podsToMint.toHuman()} (temp: ${temp}%)`);

          // Update the running place in line for the next order
          runningPlaceInLine = runningPlaceInLine.add(podsToMint);
          console.log(`Updated running place in line: ${runningPlaceInLine.toHuman()}`);
        }

        if (!withdrawalPlan) {
          throw new Error("Failed to get withdrawal plan");
        }

        orderbookData.push({
          ...requisition,
          pintosLeftToSow: finalPintosLeft,
          totalAvailablePinto,
          currentlySowable,
          amountSowableNextSeason,
          estimatedPlaceInLine,
          withdrawalPlan,
        });
      } catch (error) {
        console.error(`Failed to get data for requisition ${requisition.requisition.blueprintHash}:`, error);
        orderbookData.push({
          ...requisition,
          pintosLeftToSow: TokenValue.ZERO,
          totalAvailablePinto: TokenValue.ZERO,
          currentlySowable: TokenValue.ZERO,
          amountSowableNextSeason: TokenValue.ZERO,
          estimatedPlaceInLine: TokenValue.fromBlockchain(runningPlaceInLine.toBigInt(), 6),
          withdrawalPlan: undefined,
        });
      }
    }

    return orderbookData;
  } catch (error) {
    console.error("Error loading orderbook data:", error);
    throw new Error("Failed to load orderbook data");
  }
}

/**
 * Calculates the average tip paid from OperatorReward events in the last 14 days.
 * Returns 1 if no events are found.
 */
export async function getAverageTipPaid(publicClient: PublicClient): Promise<number> {
  try {
    // Calculate blocks for 14 days (14 * 24 * 60 * 60 / 2 = 604800 blocks)
    const BLOCKS_PER_14_DAYS = 604800n;
    
    // Get current block number
    const currentBlock = await publicClient.getBlockNumber();
    
    // Calculate starting block (use max of deployment block or 14 days ago)
    const fourteenDaysAgoBlock = currentBlock > BLOCKS_PER_14_DAYS ? currentBlock - BLOCKS_PER_14_DAYS : 0n;
    const fromBlock = fourteenDaysAgoBlock > TRACTOR_DEPLOYMENT_BLOCK ? fourteenDaysAgoBlock : TRACTOR_DEPLOYMENT_BLOCK;
    
    // Query for OperatorReward events
    const events = await publicClient.getContractEvents({
      address: TRACTOR_HELPERS_ADDRESS,
      abi: tractorHelpersABI,
      eventName: "OperatorReward",
      fromBlock,
      toBlock: "latest",
    });
    
    // If no events found, return default value of 1
    if (events.length === 0) {
      return 1;
    }
    
    // Calculate average tip amount
    let totalTipAmount = 0n;
    let validEventCount = 0;
    
    for (const event of events) {
      try {
        // Get the event data
        const decodedEvent = decodeEventLog({
          abi: tractorHelpersABI,
          data: event.data,
          topics: event.topics,
        });
        
        // Extract and use the amount parameter
        if (decodedEvent.args && 'amount' in decodedEvent.args) {
          const amount = decodedEvent.args.amount;
          
          // Make sure it's a bigint and positive
          if (typeof amount === 'bigint' && amount > 0n) {
            totalTipAmount += amount;
            validEventCount++;
          }
        }
      } catch (error) {
        // Silently continue on error
      }
    }
    
    // If no valid events found, return default value
    if (validEventCount === 0) {
      return 1;
    }
    
    // Calculate average in human-readable form 
    const avgTipAmount = Number(totalTipAmount) / (validEventCount * 1e6);

    // If we somehow got a non-positive number, return the default
    return avgTipAmount > 0 ? avgTipAmount : 1;
  } catch (error) {
    console.error("Error getting average tip amount:", error);
    // Return default value in case of error
    return 1;
  }
}
