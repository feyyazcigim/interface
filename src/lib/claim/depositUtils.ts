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
 * Generates farm calls to get sorted deposits and simulates the call
 * @param account The user's account address
 * @param token The token for which to sort deposits
 * @param publicClient The viem public client for blockchain interaction
 * @param protocolAddress The Beanstalk protocol address
 * @param fromAddress The address to simulate the call from
 * @returns A Promise containing simulation result and sorted deposit data
 */
export async function generateSortDepositsFarmCalls(
  account: `0x${string}`,
  token: Token,
  publicClient: PublicClient,
  protocolAddress: `0x${string}`,
  fromAddress: `0x${string}`,
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

  // Simulate the farm call 
  const simulationResult = await publicClient.simulateContract({
    address: protocolAddress,
    abi: beanstalkAbi,
    functionName: "farm",
    args: [[pipeCall]],  // Farm takes an array of encoded function calls
    account: fromAddress
  });

  console.log("Simulation result:", simulationResult);

  // Attempt to decode the result data
  let decodedResult;
  try {
    // The result is in the first item of the result array
    const resultData = simulationResult.result?.[0] as `0x${string}` | undefined;
    console.log("Raw result data:", resultData);

    if (resultData) {
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

          decodedResult = { stems, amounts };
          console.log(`Successfully decoded ${stems.length} stems and ${amounts.length} amounts`);
        } else {
          console.error(`Amount count (${amountCount}) doesn't match stem count (${stemCount})`);
        }
      } else {
        console.error(`Invalid stem count: ${stemCount}`);
      }
    }
  } catch (error) {
    console.error("Error decoding simulation result:", error);
  }

  // Return a complete result object
  return {
    simulationResult,
    decodedResult
  };
}
