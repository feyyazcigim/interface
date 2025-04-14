import { TokenValue } from "@/classes/TokenValue";
import { beanstalkAbi } from "@/generated/contractHooks";
import { calculateConvertData } from "@/utils/convert";
import { TokenDepositData, Token } from "@/utils/types";
import { encodeClaimRewardCombineCalls } from "@/utils/utils";
import { encodeFunctionData } from "viem";

/**
 * Determines if deposits need combining based on deposit counts
 * @param deposits Map of token to deposit data
 * @returns boolean indicating if any token has 25+ deposits
 */
export function needsCombining(deposits: Map<Token, TokenDepositData>): boolean {
  return Array.from(deposits.entries()).some(([_, depositData]) => 
    depositData.deposits.length >= 25
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
  
  // First check if any tokens need combining (25+ deposits)
  if (!needsCombining(farmerDeposits)) {
    // If no tokens need combining, use the top 10 deposits logic
    console.log("No tokens need combining, processing top 10 deposits by BDV difference (regular L2L update)");
    
    // Collect all eligible deposits into a flat array with their token info
    const allDeposits = tokenEntries
      .flatMap(([token, depositData]) =>
        depositData.deposits
          .filter((deposit) => {
            const bdvDiff = deposit.currentBdv.sub(deposit.depositBdv);
            const onePercent = deposit.depositBdv.mul(0.01);
            const minThreshold = TokenValue.min(onePercent, TokenValue.ONE);
            return bdvDiff.gt(minThreshold) && !deposit.isGerminating;
          })
          .map((deposit) => ({
            token,
            deposit,
            bdvDifference: deposit.currentBdv.sub(deposit.depositBdv),
          })),
      );

    // Sort by BDV difference and take top 10
    const top10Deposits = allDeposits
      .filter((deposit) => deposit.bdvDifference.gte(TokenValue.ONE))
      .sort((a, b) => (b.bdvDifference.gt(a.bdvDifference) ? 1 : -1))
      .slice(0, 10);

    return top10Deposits.map(({ token, deposit }) => {
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
  
  console.log("Combining logic triggered (25+ deposits of a single token)");
  
  // Check if any token has more than 200 deposits
  const highVolumeToken = tokenEntries.find(([_, depositData]) => 
    depositData.deposits.length >= 200
  );
  
  if (highVolumeToken) {
    console.log("Processing single high-volume token:", {
      name: highVolumeToken[0].name,
      depositCount: highVolumeToken[1].deposits.length
    });
    return encodeClaimRewardCombineCalls(highVolumeToken[1].deposits, highVolumeToken[0]);
  }

  // Check if any token has more than 100 deposits
  const hasLargeToken = tokenEntries.some(([_, depositData]) => 
    depositData.deposits.length >= 100
  );

  const eligibleTokens = tokenEntries
    .filter(([_token, depositData]) => {
      const hasEnoughDeposits = depositData.deposits.length >= 20;
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
    console.log("Limiting to 3 tokens due to large deposit count");
    return eligibleTokens
      .slice(0, 3)
      .flatMap(([token, depositData]) => 
        encodeClaimRewardCombineCalls(depositData.deposits, token)
      );
  }

  return eligibleTokens
    .flatMap(([token, depositData]) => 
      encodeClaimRewardCombineCalls(depositData.deposits, token)
    );
} 