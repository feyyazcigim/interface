import { Token } from "@/utils/types";
import { Address } from "viem";

/**
 * Base error class for all SiloConvert-related errors
 */
export abstract class SiloConvertError extends Error {
  abstract readonly code: string;
  abstract readonly category: "validation" | "quotation" | "execution" | "network" | "configuration";

  constructor(
    message: string,
    public readonly context?: Record<string, any>,
  ) {
    super(message);
    this.name = this.constructor.name;

    // Maintain proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Returns a structured error object for logging
   */
  toLogObject() {
    return {
      name: this.name,
      code: this.code,
      category: this.category,
      message: this.message,
      context: this.context,
      stack: this.stack,
    };
  }
}

/**
 * Thrown when invalid tokens are provided for conversion
 */
export class InvalidConversionTokensError extends SiloConvertError {
  readonly code = "INVALID_CONVERSION_TOKENS";
  readonly category = "validation" as const;

  constructor(source: Token, target: Token, expectedType: "default" | "LP2LP", reason?: string) {
    const baseMessage = `Invalid conversion tokens: source=${source.symbol}(${source.address}), target=${target.symbol}(${target.address}), expected=${expectedType}`;
    const message = reason ? `${baseMessage}. Reason: ${reason}` : baseMessage;

    super(message, {
      source: {
        symbol: source.symbol,
        address: source.address,
        isMain: source.isMain,
        isLP: source.isLP,
      },
      target: {
        symbol: target.symbol,
        address: target.address,
        isMain: target.isMain,
        isLP: target.isLP,
      },
      expectedType,
      reason,
    });
  }
}

/**
 * Thrown when strategy selection fails
 */
export class StrategySelectionError extends SiloConvertError {
  readonly code = "STRATEGY_SELECTION_FAILED";
  readonly category = "quotation" as const;

  constructor(source: Token, target: Token, reason: string, context?: Record<string, any>) {
    super(`Failed to select conversion strategy for ${source.symbol} -> ${target.symbol}: ${reason}`, {
      source: source.symbol,
      target: target.symbol,
      reason,
      ...context,
    });
  }
}

/**
 * Thrown when max convert quotation fails
 */
export class MaxConvertQuotationError extends SiloConvertError {
  readonly code = "MAX_CONVERT_QUOTATION_FAILED";
  readonly category = "quotation" as const;

  constructor(source: Token, target: Token, reason: string, context?: Record<string, any>) {
    super(`Failed to quote max convert for ${source.symbol} -> ${target.symbol}: ${reason}`, {
      source: source.symbol,
      target: target.symbol,
      reason,
      ...context,
    });
  }
}

/**
 * Thrown when conversion quotation fails
 */
export class ConversionQuotationError extends SiloConvertError {
  readonly code = "CONVERSION_QUOTATION_FAILED";
  readonly category = "quotation" as const;
}

/**
 * Thrown when swap quotation fails
 */
export class SwapQuotationError extends SiloConvertError {
  readonly code = "SWAP_QUOTATION_FAILED";
  readonly category = "network" as const;

  constructor(sellToken: Token, buyToken: Token, amount: string, reason: string, context?: Record<string, any>) {
    super(`Failed to quote swap ${sellToken.symbol} -> ${buyToken.symbol} for amount ${amount}: ${reason}`, {
      sellToken: sellToken.symbol,
      buyToken: buyToken.symbol,
      amount,
      reason,
      ...context,
    });
  }
}

/**
 * Thrown when cache operations fail
 */
export class CacheError extends SiloConvertError {
  readonly code = "CACHE_ERROR";
  readonly category = "network" as const;

  constructor(operation: string, reason: string, context?: Record<string, any>) {
    super(`Cache operation '${operation}' failed: ${reason}`, {
      operation,
      reason,
      ...context,
    });
  }
}

/**
 * Thrown when well data is not found or invalid
 */
export class WellDataError extends SiloConvertError {
  readonly code = "WELL_DATA_ERROR";
  readonly category = "configuration" as const;

  constructor(wellAddress: Address, reason: string, context?: Record<string, any>) {
    super(`Well data error for ${wellAddress}: ${reason}`, {
      wellAddress,
      reason,
      ...context,
    });
  }
}

/**
 * Thrown when pipeline execution fails
 */
export class PipelineExecutionError extends SiloConvertError {
  readonly code = "PIPELINE_EXECUTION_FAILED";
  readonly category = "execution" as const;

  constructor(operation: string, reason: string, context?: Record<string, any>) {
    super(`Pipeline execution failed for '${operation}': ${reason}`, {
      operation,
      reason,
      ...context,
    });
  }
}

/**
 * Thrown when simulation fails
 */
export class SimulationError extends SiloConvertError {
  readonly code = "SIMULATION_FAILED";
  readonly category = "execution" as const;

  constructor(operation: string, reason: string, context?: Record<string, any>) {
    super(`Simulation failed for '${operation}': ${reason}`, {
      operation,
      reason,
      ...context,
    });
  }
}

/**
 * Thrown when invalid amounts are provided
 */
export class InvalidAmountError extends SiloConvertError {
  readonly code = "INVALID_AMOUNT";
  readonly category = "validation" as const;

  constructor(amount: string, reason: string, context?: Record<string, any>) {
    super(`Invalid amount '${amount}': ${reason}`, {
      amount,
      reason,
      ...context,
    });
  }
}

/**
 * Thrown when aggregator is disabled for a token
 */
export class AggregatorDisabledError extends SiloConvertError {
  readonly code = "AGGREGATOR_DISABLED";
  readonly category = "configuration" as const;

  constructor(token: Token, context?: Record<string, any>) {
    super(`Aggregator is disabled for token ${token.symbol} (${token.address})`, {
      token: {
        symbol: token.symbol,
        address: token.address,
      },
      ...context,
    });
  }
}
