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
 * Generates sort deposits farm calls and simulates them
 * @param account Address of the user account
 * @param token Token to sort deposits for
 * @param publicClient Public client instance
 * @param protocolAddress Protocol contract address
 * @param fromAddress Address to simulate from
 * @param farmerDeposits Optional map of token to deposit data
 * @param isRaining Optional weather condition
 * @returns Object with simulation result and decoded result
 */
export async function generateSortDepositsFarmCalls(
  account: `0x${string}`,
  token: Token,
  publicClient: PublicClient,
  protocolAddress: `0x${string}`,
  fromAddress: `0x${string}`,
  farmerDeposits?: Map<Token, TokenDepositData>,
  isRaining?: boolean
): Promise<{
  simulationResult: any;
  decodedResult?: {
    stems: bigint[];
    amounts: bigint[];
  };
}> {
  console.log(`Generating and simulating farm calls for ${token.symbol}`);

  // Create a call to getSortedDeposits from the TractorHelpers contract
  const getSortedDepositsCall = encodeFunctionData({
    abi: tractorHelpersABI,
    functionName: "getSortedDeposits",
    args: [account, token.address as `0x${string}`]
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
  console.log(`Total farm calls to execute: ${farmCalls.length}`);

  try {
    // Simulate the farm call 
    const simulationResult = await publicClient.simulateContract({
      address: protocolAddress,
      abi: beanstalkAbi,
      functionName: "farm",
      args: [farmCalls],  // Farm takes an array of encoded function calls
      account: fromAddress
    });

    console.log("Simulation completed successfully");
    console.log("Number of results:", simulationResult.result?.length || 0);

    // The getSortedDeposits result will be the last item in the results array
    const sortDepositsResult = simulationResult.result?.[simulationResult.result.length - 1];

    if (sortDepositsResult) {
      console.log(`Sort deposits result length: ${(sortDepositsResult as `0x${string}`).length}`);
      console.log(`Raw sort deposits result: ${sortDepositsResult}`);
    } else {
      console.error("Sort deposits result is undefined");
    }

    // Decode the result data using our helper function
    const decodedResult = decodeSortedDepositsResult(sortDepositsResult as `0x${string}` | undefined);

    if (decodedResult) {
      console.log(`Successfully decoded ${decodedResult.stems.length} stems and amounts`);
      console.log(`Decoded stems: ${decodedResult.stems}`);
      console.log(`Decoded amounts: ${decodedResult.amounts}`);
    } else {
      console.error("Failed to decode sorted deposits result");
    }

    // Return a complete result object
    return {
      simulationResult,
      decodedResult
    };
  } catch (error) {
    console.error("Error simulating farm calls:", error);
    return {
      simulationResult: { error },
      decodedResult: undefined
    };
  }
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
      // Get sorted deposits through simulation
      const result = await generateSortDepositsFarmCalls(
        account,
        token,
        publicClient,
        protocolAddress,
        account,
        farmerDeposits,
        isRaining
      );

      // Check if we have decoded result data
      if (!result.decodedResult) {
        console.error(`Failed to get sorted deposits for ${token.symbol}`);
        continue;
      }

      const { stems } = result.decodedResult;

      // Convert stems to deposit IDs using the packing function
      const depositIds = stems.map(stem => packAddressAndStem(token.address, stem));

      // Reverse the order of deposit IDs for optimal storage in the contract
      const reversedDepositIds = [...depositIds].reverse();

      console.log(`Generated ${reversedDepositIds.length} deposit IDs for ${token.symbol}`);

      // Create the calldata for updateSortedDepositIds
      const updateCall = encodeFunctionData({
        abi: beanstalkAbi,
        functionName: 'updateSortedDepositIds',
        args: [account, token.address as `0x${string}`, reversedDepositIds]
      });

      callData.push(updateCall);

    } catch (error) {
      console.error(`Error processing ${token.symbol}:`, error);
    }
  }

  console.log(`Generated ${callData.length} sort deposit calls`);
  return callData;
}