import { TV } from "@/classes/TokenValue";

/**
 * The rate at which grown stalk penalty is applied. Refer to:
 * https://github.com/pinto-org/protocol/blob/master/contracts/beanstalk/init/InitalizeDiamond.sol
 *
 * Rate has 6 decimals of precision.
 */
export const CONVERT_DOWN_PENALTY_RATE = TV.fromHuman(1.005, 6);

/**
 * Rate with a 0.00004 buffer.
 *
 * This is to minimize the risk of running into issues with price volatility.
 */
export const CONVERT_DOWN_PENALTY_RATE_WITH_BUFFER = TV.fromHuman(1.00504, 6);

/**
 *
 */
export const NO_MAX_CONVERT_AMOUNT = 1_000_000_000;
