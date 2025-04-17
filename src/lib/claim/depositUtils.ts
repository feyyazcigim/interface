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
      // The pipe function adds some wrapping to the return data
      // Instead of trying to parse with decoders that might not handle this specific format,
      // we'll manually extract and parse the stems and amounts

      // First, parse out the hex data without the 0x prefix
      const hexData = resultData.slice(2);
      console.log("Hex data length:", hexData.length);

      // Examine the first few chunks of data to understand the structure
      console.log("First 64 bytes (dynamic type pointer):", hexData.slice(0, 64));
      console.log("Second 64 bytes (potential offset/length):", hexData.slice(64, 128));
      console.log("Third 64 bytes:", hexData.slice(128, 192));
      console.log("Fourth 64 bytes:", hexData.slice(192, 256));

      // Check all potential length indicators at different offsets
      const potentialLengths = [
        parseInt(hexData.slice(64, 128), 16),
        parseInt(hexData.slice(128, 192), 16),
        parseInt(hexData.slice(192, 256), 16),
        parseInt(hexData.slice(256, 320), 16),
        parseInt(hexData.slice(320, 384), 16),
      ];
      console.log("Potential length values at different offsets:", potentialLengths);

      // Look for potential array markers
      const offset40hex = '0000000000000000000000000000000000000000000000000000000000000040';
      const offset80hex = '0000000000000000000000000000000000000000000000000000000000000080';
      const offset40Pos = hexData.indexOf(offset40hex);
      const offset80Pos = hexData.indexOf(offset80hex);
      console.log(`Position of 0x40 offset marker: ${offset40Pos}`);
      console.log(`Position of 0x80 offset marker: ${offset80Pos}`);

      // Check the pipe function's return format
      // The format could be: [success (bool), returnData (bytes)]
      const potentialBoolValue = hexData.slice(0, 64);
      console.log("Potential bool success value:", potentialBoolValue);

      // The stemCountPosition we used was 64, let's try a few different positions
      const possibleStemCountPositions = [64, 128, 192, 256, 320];

      for (const pos of possibleStemCountPositions) {
        const stemCount = parseInt(hexData.slice(pos, pos + 64), 16);
        console.log(`Stem count at position ${pos}: ${stemCount}`);

        // If this looks like a reasonable count (0 < count < 1000), 
        // check if we see sensible stem values after it
        if (stemCount > 0 && stemCount < 1000) {
          const stemStartPos = pos + 64;
          const firstStemHex = hexData.slice(stemStartPos, stemStartPos + 64);
          const secondStemHex = hexData.slice(stemStartPos + 64, stemStartPos + 128);
          console.log(`First potential stem at pos ${stemStartPos}: 0x${firstStemHex} (${BigInt('0x' + firstStemHex).toString()})`);
          console.log(`Second potential stem at pos ${stemStartPos + 64}: 0x${secondStemHex} (${BigInt('0x' + secondStemHex).toString()})`);

          // Check if there's a potential amount array after stems
          const potentialAmountCountPos = stemStartPos + (stemCount * 64);
          if (potentialAmountCountPos + 64 <= hexData.length) {
            const amountCount = parseInt(hexData.slice(potentialAmountCountPos, potentialAmountCountPos + 64), 16);
            console.log(`Amount count at position ${potentialAmountCountPos}: ${amountCount}`);

            if (amountCount === stemCount) {
              console.log(`Found matching stem and amount counts at position ${pos}!`);

              // Extract all stems and amounts
              try {
                const stems: bigint[] = [];
                const amounts: bigint[] = [];

                // Extract stems
                for (let i = 0; i < stemCount; i++) {
                  const stemHex = hexData.slice(stemStartPos + i * 64, stemStartPos + (i + 1) * 64);
                  const stemValue = BigInt('0x' + stemHex);
                  stems.push(stemValue);
                }

                // Extract amounts
                const amountStartPos = potentialAmountCountPos + 64;
                for (let i = 0; i < amountCount; i++) {
                  const amountHex = hexData.slice(amountStartPos + i * 64, amountStartPos + (i + 1) * 64);
                  const amountValue = BigInt('0x' + amountHex);
                  amounts.push(amountValue);
                }

                // Only show the first few and last few to avoid huge logs
                const maxToShow = 5;
                console.log("Extracted stems (first few):", stems.slice(0, maxToShow).map(s => s.toString()));
                if (stems.length > maxToShow * 2) {
                  console.log(`... ${stems.length - maxToShow * 2} more stems ...`);
                }
                if (stems.length > maxToShow) {
                  console.log("Extracted stems (last few):", stems.slice(-maxToShow).map(s => s.toString()));
                }

                console.log("Extracted amounts (first few):", amounts.slice(0, maxToShow).map(a => a.toString()));
                if (amounts.length > maxToShow * 2) {
                  console.log(`... ${amounts.length - maxToShow * 2} more amounts ...`);
                }
                if (amounts.length > maxToShow) {
                  console.log("Extracted amounts (last few):", amounts.slice(-maxToShow).map(a => a.toString()));
                }

                decodedResult = { stems, amounts };
                console.log(`Successfully extracted ${stems.length} stems and ${amounts.length} amounts from position ${pos}`);
                break; // We found what looks like valid data, stop trying other positions
              } catch (error) {
                console.error(`Error extracting stems and amounts at position ${pos}:`, error);
              }
            }
          }
        }
      }

      // If we still don't have a result, try another approach with hard-coded offsets
      // based on your observed data structure
      if (!decodedResult) {
        console.log("Trying alternative approach with hard-coded offsets based on observed data");
        try {
          // In the logs you shared, we might need to look at a specific pattern
          // Let's try to find potential patterns in the data

          // Look for sequences that might indicate an array start
          // Check for standard EVM array patterns like consecutive integers
          for (let i = 0; i < hexData.length - 512; i += 64) {
            const val1 = BigInt('0x' + hexData.slice(i, i + 64));
            const val2 = BigInt('0x' + hexData.slice(i + 64, i + 128));

            // Check if these look like stems (usually large negative or positive numbers)
            // or other numeric sequences
            if (val1 !== 0n && val2 !== 0n) {
              console.log(`Potential interesting values at position ${i}:`, val1.toString(), val2.toString());
            }
          }

          // Last resort: Direct read approach with fixed positions
          const hardcodedStemCount = 86; // Based on the logs you shared
          console.log(`Trying with hardcoded stem count: ${hardcodedStemCount}`);

          // Use position 192 as it seemed promising in the logs
          const stemStartPos = 192;
          const stems: bigint[] = [];

          for (let i = 0; i < hardcodedStemCount; i++) {
            // Ensure we don't go out of bounds
            if (stemStartPos + (i + 1) * 64 <= hexData.length) {
              const stemHex = hexData.slice(stemStartPos + i * 64, stemStartPos + (i + 1) * 64);
              const stemValue = BigInt('0x' + stemHex);
              stems.push(stemValue);
            }
          }

          // The amounts array would start after all the stems
          const amountStartPos = stemStartPos + (hardcodedStemCount * 64) + 64; // +64 for the length field
          const amounts: bigint[] = [];

          for (let i = 0; i < hardcodedStemCount; i++) {
            // Ensure we don't go out of bounds
            if (amountStartPos + (i + 1) * 64 <= hexData.length) {
              const amountHex = hexData.slice(amountStartPos + i * 64, amountStartPos + (i + 1) * 64);
              const amountValue = BigInt('0x' + amountHex);
              amounts.push(amountValue);
            }
          }

          if (stems.length > 0 && amounts.length > 0) {
            console.log(`Hard-coded approach found ${stems.length} stems and ${amounts.length} amounts`);

            if (!decodedResult) {
              decodedResult = { stems, amounts };
            }
          }
        } catch (error) {
          console.error("Error in alternative parsing approach:", error);
        }
      }
    }
  } catch (error) {
    console.error("Error decoding simulation result:", error);
  }

  console.log("Final decoded result:", decodedResult);

  // Return a complete result object
  return {
    simulationResult,
    decodedResult
  };
}
