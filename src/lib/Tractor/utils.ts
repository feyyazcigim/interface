import { Address, SignableMessage, decodeFunctionData, encodeAbiParameters, encodeFunctionData, keccak256 } from "viem";
import { useContractWrite, type BaseError } from "wagmi";
import { Requisition } from "./types";
import { useProtocolAddress } from "@/hooks/pinto/useProtocolAddress";
import { FarmFromMode } from "@/utils/types";
import { beanstalkAbi } from "@/generated/contractHooks";
import { TokenValue } from "@/classes/TokenValue";
import { PINTO } from "@/constants/tokens";
import { PublicClient } from "viem";
import { diamondABI } from "@/constants/abi/diamondABI";
import { siloHelpersABI } from "@/constants/abi/SiloHelpersABI";
import { sowBlueprintv0ABI } from "@/constants/abi/SowBlueprintv0ABI";

// Add this constant definition at the top level of the file:
const SILO_HELPERS_ADDRESS = "0x207b78B23Ee4b9F9D9b07102Ed5bBf8573004B8A" as `0x${string}`;

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
  | { type: "SPECIFIC_TOKEN"; address: string };

/**
 * Creates blueprint data from Tractor inputs
 */
export function createSowTractorData({
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
}): { data: `0x${string}`; operatorPasteInstrs: `0x${string}`[]; rawCall: `0x${string}` } {
  // Add debug logs
  console.log("tokenStrategy received:", tokenStrategy);
  console.log("tokenStrategy.type:", tokenStrategy.type);
  console.log("LOWEST_SEEDS check:", tokenStrategy.type === "LOWEST_SEEDS");
  console.log("LOWEST_PRICE check:", tokenStrategy.type === "LOWEST_PRICE");

  // Convert inputs to appropriate types
  const totalAmount = BigInt(Math.floor(parseFloat(totalAmountToSow) * 1e6));
  const minAmount = BigInt(Math.floor(parseFloat(minAmountPerSeason) * 1e6));
  const maxAmount = BigInt(Math.floor(parseFloat(maxAmountToSowPerSeason) * 1e6));
  const maxPodline = BigInt(Math.floor(parseFloat(maxPodlineLength) * 1e6));
  const maxGrownStalk = BigInt(Math.floor(parseFloat(maxGrownStalkPerBdv) * 1e6));
  const runBlocks = BigInt(runBlocksAfterSunrise === "true" ? 0 : 300); // 0 for morning auction, 300 otherwise
  const temp = BigInt(Math.floor(parseFloat(temperature) * 1e6));
  const tip = BigInt(Math.floor(parseFloat(operatorTip) * 1e6));

  // Create the TokenSelectionStrategy
  let tokenSelectionStrategy: { type: number; token: `0x${string}` };
  switch (tokenStrategy.type) {
    case "LOWEST_SEEDS":
      tokenSelectionStrategy = { type: 0, token: "0x" as `0x${string}` };
      break;
    case "LOWEST_PRICE":
      tokenSelectionStrategy = { type: 1, token: "0x" as `0x${string}` };
      break;
    case "SPECIFIC_TOKEN":
      tokenSelectionStrategy = { type: 2, token: tokenStrategy.address as `0x${string}` };
      break;
  }

  // Create the SowBlueprintStruct
  const sowBlueprintStruct = {
    sowParams: {
      sourceTokenIndices:
        tokenStrategy.type === "LOWEST_SEEDS"
          ? [255]
          : tokenStrategy.type === "LOWEST_PRICE"
            ? [254]
            : ([] as number[]),
      sowAmounts: {
        totalAmountToSow: totalAmount,
        minAmountToSowPerSeason: minAmount,
        maxAmountToSowPerSeason: maxAmount,
      },
      minTemp: temp,
      maxPodlineLength: maxPodline,
      maxGrownStalkPerBdv: maxGrownStalk,
      runBlocksAfterSunrise: runBlocks,
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
          target: SILO_HELPERS_ADDRESS, // Use the constant directly
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
    rawCall: sowBlueprintCall  // Return the raw call data
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

export interface SowBlueprintData {
  sourceTokenIndices: readonly number[];
  sowAmounts: {
    totalAmountToSow: string;
    minAmountToSowPerSeason: string;
    maxAmountToSowPerSeason: string;
  };
  minTemp: string;
  maxPodlineLength: string;
  maxGrownStalkPerBdv: string;
  runBlocksAfterSunrise: string;
  operatorParams: {
    whitelistedOperators: readonly `0x${string}`[];
    tipAddress: `0x${string}`;
    operatorTipAmount: string;
  };
  fromMode: FarmFromMode;
}

/**
 * Decodes sow data from encoded function call
 */
export function decodeSowTractorData(encodedData: `0x${string}`): SowBlueprintData | null {
  try {
    console.log("Decoding data:", encodedData);
    let sowBlueprintData: `0x${string}` | null = null;
    
    // Step 1: Try to decode as advancedFarm call first
    try {
      const advancedFarmDecoded = decodeFunctionData({
        abi: beanstalkAbi,
        data: encodedData,
      });
      
      if (advancedFarmDecoded.functionName === "advancedFarm" && advancedFarmDecoded.args[0]) {
        // Extract the calls array from advancedFarm
        const farmCalls = advancedFarmDecoded.args[0] as { callData: `0x${string}`; clipboard: `0x${string}` }[];
        
        if (farmCalls.length > 0) {
          // Step 2: Try to decode the inner call as advancedPipe
          try {
            const pipeCallData = farmCalls[0].callData;
            const advancedPipeDecoded = decodeFunctionData({
              abi: beanstalkAbi,
              data: pipeCallData,
            });
            
            if (advancedPipeDecoded.functionName === "advancedPipe" && advancedPipeDecoded.args[0]) {
              // Extract the calls array from advancedPipe
              const pipeCalls = advancedPipeDecoded.args[0] as { 
                target: `0x${string}`; 
                callData: `0x${string}`; 
                clipboard: `0x${string}` 
              }[];
              
              if (pipeCalls.length > 0) {
                // Step 3: Get the sowBlueprintv0 call data
                sowBlueprintData = pipeCalls[0].callData;
                console.log("Found sowBlueprintData in advancedPipe:", sowBlueprintData);
              }
            }
          } catch (error) {
            console.log("Failed to decode as advancedPipe, trying direct:", error);
            // If decoding as advancedPipe fails, try to decode the farm call directly as sowBlueprintv0
            sowBlueprintData = farmCalls[0].callData;
          }
        }
      }
    } catch (error) {
      console.log("Failed to decode as advancedFarm, trying direct:", error);
      // If decoding as advancedFarm fails, try direct decode as sowBlueprintv0
      sowBlueprintData = encodedData;
    }
    
    // If we haven't found the sowBlueprintData yet, use the original data as fallback
    if (!sowBlueprintData) {
      sowBlueprintData = encodedData;
    }
    
    // Final step: Decode as sowBlueprintv0
    const SOW_BLUEPRINT_V0_SELECTOR = "0x1e08d5c0";
    const selector = sowBlueprintData.slice(0, 10);
    
    if (selector === SOW_BLUEPRINT_V0_SELECTOR) {
      try {
        const decoded = decodeFunctionData({
          abi: sowBlueprintv0ABI,
          data: sowBlueprintData,
        });
        
        if (decoded.functionName === "sowBlueprintv0" && decoded.args[0]) {
          const params = decoded.args[0];
          
          // Convert all BigInt values to strings and maintain the full structure
          return {
            sourceTokenIndices: params.sowParams.sourceTokenIndices,
            sowAmounts: {
              totalAmountToSow: TokenValue.fromBlockchain(params.sowParams.sowAmounts.totalAmountToSow, 6).toHuman(),
              minAmountToSowPerSeason: TokenValue.fromBlockchain(
                params.sowParams.sowAmounts.minAmountToSowPerSeason,
                6,
              ).toHuman(),
              maxAmountToSowPerSeason: TokenValue.fromBlockchain(
                params.sowParams.sowAmounts.maxAmountToSowPerSeason,
                6,
              ).toHuman(),
            },
            minTemp: TokenValue.fromBlockchain(params.sowParams.minTemp, 6).toHuman(),
            maxPodlineLength: TokenValue.fromBlockchain(params.sowParams.maxPodlineLength, 6).toHuman(),
            maxGrownStalkPerBdv: TokenValue.fromBlockchain(params.sowParams.maxGrownStalkPerBdv, 6).toHuman(),
            runBlocksAfterSunrise: params.sowParams.runBlocksAfterSunrise.toString(),
            operatorParams: {
              whitelistedOperators: params.opParams.whitelistedOperators,
              tipAddress: params.opParams.tipAddress,
              operatorTipAmount: TokenValue.fromBlockchain(params.opParams.operatorTipAmount, 6).toHuman(),
            },
            fromMode: FarmFromMode.INTERNAL, // Default for blueprint
          };
        }
      } catch (error) {
        console.error("Failed to decode sowBlueprintv0 data:", error);
      }
    } else {
      console.log("Not a sowBlueprintv0 call, selector:", selector);
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
    fromBlock: BigInt(0),
    toBlock: "latest",
  });

  // Get cancelled blueprints
  const cancelEvents = await publicClient.getContractEvents({
    address: protocolAddress,
    abi: diamondABI,
    eventName: "CancelBlueprint",
    fromBlock: BigInt(0),
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

export async function loadPublishedRequisitions(
  address: string | undefined,
  protocolAddress: `0x${string}` | undefined,
  publicClient: PublicClient | null,
  latestBlock?: { number: bigint; timestamp: bigint } | null,
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

        let requisitionType: "sowBlueprintv0" | "unknown" = "unknown";
        // Try to decode the data
        const decodedData = decodeSowTractorData(requisition.blueprint.data);
        if (decodedData) {
          requisitionType = "sowBlueprintv0";
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
          requisitionType,
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
      calls = [{ 
        callData: requisition.requisition.blueprint.data, 
        clipboard: "0x" as `0x${string}` 
      }];
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
  operatorTip: string;
  whitelistedOperators: readonly `0x${string}`[];
  tipAddress: `0x${string}`;
}

// Add a helper function to convert SowBlueprintData to display data
export function getSowBlueprintDisplayData(data: SowBlueprintData): SowBlueprintDisplayData {
  return {
    totalAmount: data.sowAmounts.totalAmountToSow,
    minAmount: data.sowAmounts.minAmountToSowPerSeason,
    maxAmount: data.sowAmounts.maxAmountToSowPerSeason,
    minTemp: data.minTemp,
    maxPodlineLength: data.maxPodlineLength,
    maxGrownStalkPerBdv: data.maxGrownStalkPerBdv,
    runBlocksAfterSunrise: data.runBlocksAfterSunrise,
    operatorTip: data.operatorParams.operatorTipAmount,
    whitelistedOperators: data.operatorParams.whitelistedOperators,
    tipAddress: data.operatorParams.tipAddress
  };
}
