import { TokenValue } from "@/classes/TokenValue";
import { beanstalkAbi } from "@/generated/contractHooks";
import { calculateConvertData } from "@/utils/convert";
import { TokenDepositData, Token } from "@/utils/types";
import { encodeClaimRewardCombineCalls } from "@/utils/utils";
import { encodeFunctionData } from "viem";

// Constants for deposit management
const MIN_DEPOSITS_FOR_COMBINING = 25;   // Minimum deposits to trigger combining logic
const MIN_DEPOSITS_FOR_ELIGIBILITY = 20; // Combine down to this many deposits
const PROCESS_SINGLE_TOKEN_ONLY_THRESHOLD = 200; // If a single token has more than this many deposits, process it alone
const LARGE_DEPOSITS_THRESHOLD = 100;    // If a single token has more than this many deposits, process it along with not more than the next variable's worth of tokens at time
const MAX_TOKENS_WITH_LARGE_DEPOSITS = 3; // Maximum number of tokens to process when large deposits are present
const MAX_TOP_DEPOSITS = 10;             // Maximum number of deposits to L2L update in regular Claim
const MIN_BDV_THRESHOLD = TokenValue.ONE; // Minimum BDV difference threshold for regular updates, this filters out "dust" updates that are not worth L2L'ing

/**
 * Determines if deposits need combining based on deposit counts
 * @param deposits Map of token to deposit data
 * @returns boolean indicating if any token has 25+ deposits
 */
export function needsCombining(deposits: Map<Token, TokenDepositData>): boolean {
  return Array.from(deposits.entries()).some(([_, depositData]) => 
    depositData.deposits.length >= MIN_DEPOSITS_FOR_COMBINING
  );
}

/**
 * Generates smart conversion calls for updating deposits
 * @param farmerDeposits Map of token to deposit data
 * @param isRaining Weather condition that affects conversion strategy
 * @returns Array of encoded function calls
 */
export function generateUpdateCalls(
  farmerDeposits: Map<Token, TokenDepositData>,
  isRaining: boolean
): `0x${string}`[] {
  // Prevents L2L converts when it's raining
  if (isRaining) return [];

  const tokenEntries = Array.from(farmerDeposits.entries());
  
  // First check if any tokens need combining
  if (!needsCombining(farmerDeposits)) {
    // If no tokens need combining, use the top deposits logic
    console.log(`No tokens need combining, processing top ${MAX_TOP_DEPOSITS} deposits by BDV difference (regular L2L update)`);
    
    // Collect all eligible deposits into a flat array with their token info
    const allDeposits = tokenEntries
      .flatMap(([token, depositData]) =>
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
  const highVolumeToken = tokenEntries.find(([_, depositData]) => 
    depositData.deposits.length >= PROCESS_SINGLE_TOKEN_ONLY_THRESHOLD
  );
  
  if (highVolumeToken) {
    console.log("Processing single high-volume token:", {
      name: highVolumeToken[0].name,
      depositCount: highVolumeToken[1].deposits.length
    });
    return encodeClaimRewardCombineCalls(highVolumeToken[1].deposits, highVolumeToken[0]);
  }

  // Check if any token has more than LARGE_DEPOSITS_THRESHOLD deposits
  const hasLargeToken = tokenEntries.some(([_, depositData]) => 
    depositData.deposits.length >= LARGE_DEPOSITS_THRESHOLD
  );

  const eligibleTokens = tokenEntries
    .filter(([_token, depositData]) => {
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
      .flatMap(([token, depositData]) => 
        encodeClaimRewardCombineCalls(depositData.deposits, token)
      );
  }

  return eligibleTokens
    .flatMap(([token, depositData]) => 
      encodeClaimRewardCombineCalls(depositData.deposits, token)
    );
} 