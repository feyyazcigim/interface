import { TokenValue } from "@/classes/TokenValue";
import { beanstalkAbi } from "@/generated/contractHooks";
import { calculateConvertData } from "@/utils/convert";
import { Token, TokenDepositData } from "@/utils/types";
import { encodeClaimRewardCombineCalls } from "@/utils/utils";
import { encodeFunctionData, PublicClient, decodeAbiParameters } from "viem";
import { tractorHelpersABI } from "@/constants/abi/TractorHelpersABI";
import { TRACTOR_HELPERS_ADDRESS } from "@/constants/address";

// Constants for deposit management
const MIN_DEPOSITS_FOR_COMBINING = 25; // Minimum deposits to trigger combining logic
const MIN_DEPOSITS_FOR_ELIGIBILITY = 20; // Combine down to this many deposits
const PROCESS_SINGLE_TOKEN_ONLY_THRESHOLD = 200; // If a single token has more than this many deposits, process it alone
const LARGE_DEPOSITS_THRESHOLD = 100; // If a single token has more than this many deposits, process it along with not more than the next variable's worth of tokens at time
const MAX_TOKENS_WITH_LARGE_DEPOSITS = 3; // Maximum number of tokens to process when large deposits are present
const MAX_TOP_DEPOSITS = 10; // Maximum number of deposits to L2L update in regular Claim
const MIN_BDV_THRESHOLD = TokenValue.ONE; // Minimum BDV difference threshold for regular updates, this filters out "dust" updates that are not worth L2L'ing

/**
 * Determines if deposits need combining based on deposit counts
 * @param deposits Map of token to deposit data
 * @returns boolean indicating if any token has 25+ deposits
 */
export function needsCombining(deposits: Map<Token, TokenDepositData>): boolean {
  return Array.from(deposits.entries()).some(
    ([_, depositData]) => depositData.deposits.length >= MIN_DEPOSITS_FOR_COMBINING,
  );
}

/**
 * Generates smart conversion calls for updating deposits (L2L)
 * @param farmerDeposits Map of token to deposit data
 * @param isRaining Weather condition that affects conversion strategy
 * @returns Array of encoded function calls
 */
export function generateCombineAndL2LCallData(
  farmerDeposits: Map<Token, TokenDepositData>,
  isRaining: boolean,
): `0x${string}`[] {
  // Prevents L2L converts when it's raining, don't want to lose rain roots
  if (isRaining) return [];

  const tokenEntries = Array.from(farmerDeposits.entries());

  // First check if any tokens need combining
  if (!needsCombining(farmerDeposits)) {
    // If no tokens need combining, use the top deposits logic
    console.log(
      `No tokens need combining, processing top ${MAX_TOP_DEPOSITS} deposits by BDV difference (regular L2L update)`,
    );

    // Collect all eligible deposits into a flat array with their token info
    const allDeposits = tokenEntries.flatMap(([token, depositData]) =>
      depositData.deposits
        .filter((deposit) => {
          const bdvDiff = deposit.currentBdv.sub(deposit.depositBdv);
          const onePercent = deposit.depositBdv.mul(0.01);
          const minThreshold = TokenValue.min(onePercent, MIN_BDV_THRESHOLD);
          return bdvDiff.gt(minThreshold) && !deposit.isGerminating;
        })
        .map((deposit) => ({
          token,
          deposit,
          bdvDifference: deposit.currentBdv.sub(deposit.depositBdv),
        })),
    );

    // Sort by BDV difference and take top deposits
    const topDeposits = allDeposits
      .filter((deposit) => deposit.bdvDifference.gte(MIN_BDV_THRESHOLD))
      .sort((a, b) => (b.bdvDifference.gt(a.bdvDifference) ? 1 : -1))
      .slice(0, MAX_TOP_DEPOSITS);

    return topDeposits.map(({ token, deposit }) => {
      const convertData = calculateConvertData(token, token, deposit.amount, deposit.amount);
      if (!convertData) {
        throw new Error("Invalid convert data");
      }
      return encodeFunctionData({
        abi: beanstalkAbi,
        functionName: "convert",
        args: [convertData, [deposit.stem.toBigInt()], [deposit.amount.toBigInt()]],
      });
    });
  }

  console.log(`Combining logic triggered (${MIN_DEPOSITS_FOR_COMBINING}+ deposits of a single token)`);

  // Check if any token has more than PROCESS_SINGLE_TOKEN_ONLY_THRESHOLD deposits
  const highVolumeToken = tokenEntries.find(
    ([_, depositData]) => depositData.deposits.length >= PROCESS_SINGLE_TOKEN_ONLY_THRESHOLD,
  );

  if (highVolumeToken) {
    console.log("Processing single high-volume token:", {
      name: highVolumeToken[0].name,
      depositCount: highVolumeToken[1].deposits.length,
    });
    return encodeClaimRewardCombineCalls(highVolumeToken[1].deposits, highVolumeToken[0]);
  }

  // Check if any token has more than LARGE_DEPOSITS_THRESHOLD deposits
  const hasLargeToken = tokenEntries.some(
    ([_, depositData]) => depositData.deposits.length >= LARGE_DEPOSITS_THRESHOLD,
  );

  const eligibleTokens = tokenEntries.filter(([_token, depositData]) => {
    const hasEnoughDeposits = depositData.deposits.length >= MIN_DEPOSITS_FOR_ELIGIBILITY;
    if (!hasEnoughDeposits) {
      console.log("Skipping token:", {
        name: _token.name,
        symbol: _token.symbol,
        depositCount: depositData.deposits.length,
      });
    }
    return hasEnoughDeposits;
  });

  if (hasLargeToken) {
    console.log(`Limiting to ${MAX_TOKENS_WITH_LARGE_DEPOSITS} tokens due to large deposit count`);
    return eligibleTokens
      .slice(0, MAX_TOKENS_WITH_LARGE_DEPOSITS)
      .flatMap(([token, depositData]) => encodeClaimRewardCombineCalls(depositData.deposits, token));
  }

  return eligibleTokens.flatMap(([token, depositData]) => encodeClaimRewardCombineCalls(depositData.deposits, token));
}

/**
 * Decodes the raw result data from a getSortedDeposits simulation
 * @param resultData The raw hex data from the simulation result
 * @returns Object containing the decoded stems and amounts, or undefined if decoding fails
 */
function decodeSortedDepositsResult(
  resultData: `0x${string}` | undefined
): { stems: bigint[]; amounts: bigint[]; } | undefined {
  if (!resultData) return undefined;

  try {
    // Parse out the hex data without the 0x prefix
    const hexData = resultData.slice(2);

    // For the pipe function's response format:
    // The stem count is at position 256 (hex index) based on the debugging
    const stemCountPosition = 256;
    const stemCount = parseInt(hexData.slice(stemCountPosition, stemCountPosition + 64), 16);

    if (stemCount > 0 && stemCount < 1000) { // Sanity check on the count
      console.log(`Decoding ${stemCount} sorted deposits`);

      // Start position for stem array elements (after the length field)
      const stemStartPos = stemCountPosition + 64;
      const stems: bigint[] = [];
      const amounts: bigint[] = [];

      // Extract stems
      for (let i = 0; i < stemCount; i++) {
        const stemHex = hexData.slice(stemStartPos + i * 64, stemStartPos + (i + 1) * 64);
        const stemValue = BigInt('0x' + stemHex);
        stems.push(stemValue);
      }

      // The amount array starts after all stems
      // Add 64 bytes for the array length field
      const amountCountPosition = stemStartPos + (stemCount * 64);
      const amountCount = parseInt(hexData.slice(amountCountPosition, amountCountPosition + 64), 16);

      // Verify the amount count matches the stem count
      if (amountCount === stemCount) {
        // Extract amounts
        const amountStartPos = amountCountPosition + 64;
        for (let i = 0; i < amountCount; i++) {
          const amountHex = hexData.slice(amountStartPos + i * 64, amountStartPos + (i + 1) * 64);
          const amountValue = BigInt('0x' + amountHex);
          amounts.push(amountValue);
        }

        console.log(`Successfully decoded ${stems.length} stems and ${amounts.length} amounts`);
        return { stems, amounts };
      } else {
        console.error(`Amount count (${amountCount}) doesn't match stem count (${stemCount})`);
      }
    } else {
      console.error(`Invalid stem count: ${stemCount}`);
    }
  } catch (error) {
    console.error("Error decoding simulation result:", error);
  }

  return undefined;
}

/**
 * Simulates and prepares farm calls for token deposits in one comprehensive function
 * 
 * @param token Token to process
 * @param address User's address 
 * @param publicClient Public client for blockchain interaction
 * @param protocolAddress Protocol contract address
 * @param farmerDeposits Map of token to deposit data
 * @param isRaining Weather condition
 * @returns Array of farm calls or null if simulation failed
 */
export async function simulateAndPrepareFarmCalls(
  token: Token,
  address: `0x${string}`,
  publicClient: PublicClient,
  protocolAddress: `0x${string}`,
  farmerDeposits: Map<Token, TokenDepositData>,
  isRaining: boolean
): Promise<`0x${string}`[] | null> {
  console.log(`Simulating and preparing farm calls for ${token.symbol}`);

  try {
    // Create a call to getSortedDeposits from the TractorHelpers contract
    const getSortedDepositsCall = encodeFunctionData({
      abi: tractorHelpersABI,
      functionName: "getSortedDeposits",
      args: [address, token.address as `0x${string}`]
    });

    // Create a pipe call that calls getSortedDeposits
    const pipeCall = encodeFunctionData({
      abi: beanstalkAbi,
      functionName: "pipe",
      args: [
        {
          target: TRACTOR_HELPERS_ADDRESS as `0x${string}`,  // Target contract for the call
          data: getSortedDepositsCall  // The call data for getSortedDeposits
        }
      ]
    });

    // Prepare the farm calls array
    const farmCalls: `0x${string}`[] = [];

    // If farmer deposits are provided, add combine and L2L calls first
    if (farmerDeposits && farmerDeposits.size > 0) {
      // Generate convert calls with smart limits using our utility function
      const combineCalls = generateCombineAndL2LCallData(farmerDeposits, isRaining || false);
      if (combineCalls.length > 0) {
        console.log(`Adding ${combineCalls.length} combine/L2L calls to execute before sort deposits`);
        farmCalls.push(...combineCalls);
      } else {
        console.log('No combine/L2L calls needed');
      }
    } else {
      console.log('No farmer deposits provided, skipping combine/L2L calls');
    }

    // Add the pipe call last so we can capture its result
    farmCalls.push(pipeCall);
    console.log(`Total farm calls to execute in simulation: ${farmCalls.length}`);

    // Simulate the farm call
    const simulationResult = await publicClient.simulateContract({
      address: protocolAddress,
      abi: beanstalkAbi,
      functionName: "farm",
      args: [farmCalls],  // Farm takes an array of encoded function calls
      account: address
    });

    console.log("Simulation completed successfully");
    console.log("Number of results:", simulationResult.result?.length || 0);

    // The getSortedDeposits result will be the last item in the results array
    const sortDepositsResult = simulationResult.result?.[simulationResult.result.length - 1];

    if (!sortDepositsResult) {
      console.error("Sort deposits result is undefined");
      return null;
    }

    console.log(`Sort deposits result length: ${(sortDepositsResult as `0x${string}`).length}`);

    // Decode the result data
    const decodedResult = decodeSortedDepositsResult(sortDepositsResult as `0x${string}`);

    if (!decodedResult || !decodedResult.stems || decodedResult.stems.length === 0) {
      console.error("Failed to decode sorted deposits result");
      return null;
    }

    console.log(`Successfully decoded ${decodedResult.stems.length} stems and amounts`);

    // Extract the combine/L2L calls from the simulation result
    // Note: We want all calls except the last one (the pipe call)
    const combineCalls: `0x${string}`[] = [];

    // Only add combine calls if we have them in the simulation
    if (farmCalls.length > 1) {
      combineCalls.push(...farmCalls.slice(0, -1));
      console.log(`Extracted ${combineCalls.length} combine/L2L calls`);
    }

    // Convert the sorted stems to deposit IDs and reverse them for storage optimization
    const reversedDepositIds = createReversedDepositIds(token.address, decodedResult.stems);

    console.log(`Generated ${reversedDepositIds.length} deposit IDs from sorted stems`);

    // Create the updateSortedDepositIds call
    const updateSortedIdsCall = encodeFunctionData({
      abi: beanstalkAbi,
      functionName: 'updateSortedDepositIds',
      args: [address, token.address as `0x${string}`, reversedDepositIds]
    });

    // Prepare the final farm calls: combine/L2L calls followed by updateSortedDepositIds
    const finalFarmCalls = [...combineCalls, updateSortedIdsCall];

    // Log details about the operations
    console.log(`Final farm calls: ${finalFarmCalls.length} total (${combineCalls.length} combine + 1 update)`);

    return finalFarmCalls;
  } catch (error) {
    console.error(`Error simulating and preparing farm calls for ${token.symbol}:`, error);
    return null;
  }
}

/**
 * Creates reversed deposit IDs from stems for a token's storage optimization
 * @param tokenAddress The token address
 * @param stems Array of stem values
 * @returns Array of deposit IDs reversed for optimal storage
 */
export function createReversedDepositIds(tokenAddress: string, stems: readonly bigint[] | bigint[]): bigint[] {
  // Convert stems to depositIds using the packing function
  const depositIds = stems.map(stem => packAddressAndStem(tokenAddress, stem));

  // Reverse the order of deposit IDs (invert sorting order)
  return [...depositIds].reverse();
}

/**
 * Utility function to pack a token address and stem into a deposit ID
 * Matches the Solidity implementation:
 * function packAddressAndStem(address _address, int96 stem) internal pure returns (uint256) {
 *     return (uint256(uint160(_address)) << 96) | uint96(stem);
 * }
 * 
 * @param tokenAddress The token address
 * @param stem The stem value
 * @returns A packed deposit ID as a bigint
 */
export function packAddressAndStem(tokenAddress: string, stem: bigint): bigint {
  // In Solidity: uint256(uint160(_address)) << 96
  // We need to extract just the lower 160 bits of the address (20 bytes)
  const addressValue = BigInt(tokenAddress) & ((1n << 160n) - 1n);

  // Shift the address left by 96 bits
  const shiftedAddress = addressValue << 96n;

  // Convert stem to uint96 (mask with 2^96-1)
  const stemUint96 = stem & ((1n << 96n) - 1n);

  // Combine with bitwise OR
  return shiftedAddress | stemUint96;
}

/**
 * Generates calldata for updating sorted deposits for multiple tokens
 * 
 * @param account The user's account address
 * @param farmerDeposits Map of token to deposit data
 * @param publicClient The viem public client for blockchain interaction
 * @param protocolAddress The Beanstalk protocol address
 * @param isRaining Whether it's currently raining in the protocol
 * @returns Array of encoded function calls for updating sorted deposits
 */
export async function generateBatchSortDepositsCallData(
  account: `0x${string}`,
  farmerDeposits: Map<Token, TokenDepositData>,
  publicClient: PublicClient,
  protocolAddress: `0x${string}`,
  isRaining: boolean
): Promise<`0x${string}`[]> {
  console.log(`Generating batch sort deposits call data for ${farmerDeposits.size} tokens`);

  const callData: `0x${string}`[] = [];

  // Process each token in the farmer's deposits
  for (const [token, depositData] of farmerDeposits.entries()) {
    if (!depositData.deposits.length) {
      console.log(`Skipping ${token.symbol} - no deposits`);
      continue;
    }

    console.log(`Processing ${token.symbol} with ${depositData.deposits.length} deposits`);

    try {
      // Get sorted deposits through simulation and prepare farm calls
      const farmCalls = await simulateAndPrepareFarmCalls(
        token,
        account,
        publicClient,
        protocolAddress,
        farmerDeposits,
        isRaining
      );

      // If we got farm calls, add them to our callData array
      if (farmCalls && farmCalls.length > 0) {
        // We only want the updateSortedDepositIds call (the last one)
        // as we'll handle combines separately
        callData.push(farmCalls[farmCalls.length - 1]);
        console.log(`Added sort deposit call for ${token.symbol}`);
      }
    } catch (error) {
      console.error(`Error processing ${token.symbol}:`, error);
    }
  }

  console.log(`Generated ${callData.length} sort deposit calls`);
  return callData;
}