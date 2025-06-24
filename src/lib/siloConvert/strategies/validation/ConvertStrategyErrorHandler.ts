import { TV } from "@/classes/TokenValue";
import { BaseErrorHandler } from "@/lib/siloConvert/strategies/validation/BaseErrorHandler";
import {
  ConversionQuotationError,
  InvalidAmountError,
  SiloConvertError,
  SimulationError,
} from "@/lib/siloConvert/strategies/validation/SiloConvertErrors";
import { AnyRecord } from "@/utils/types.generic";

/**
 * ConvertStrategyErrorHandler
 *
 * Architecture notes:
 *
 * The ConvertStrategyErrorHandler extends BaseErrorHandler to provide specialized
 * error handling for conversion strategies with simulation-specific validation.
 *
 * [Specialized Features]
 * Beyond the base error handling capabilities, this handler provides:
 * - Simulation result validation with configurable minimum result lengths
 * - Strategy-specific error creation with string-based token representation
 * - Enhanced amount validation including slippage tolerance checking
 * - InvalidAmountError and SimulationError specializations
 *
 * [Strategy Integration]
 * Each conversion strategy uses the error handler to:
 * - Wrap quote generation operations
 * - Validate input parameters and simulation results
 * - Handle simulation failures with detailed context
 * - Provide consistent error reporting across all strategies
 */
export class ConvertStrategyErrorHandler extends BaseErrorHandler<string, AnyRecord> {
  protected getTokenContext(): AnyRecord {
    return {
      sourceToken: this.sourceToken,
      targetToken: this.targetToken,
    };
  }

  protected createDomainError(operationName: string, originalError: unknown, context: AnyRecord): SiloConvertError {
    const errorMessage = originalError instanceof Error ? originalError.message : "Unknown error";
    return new ConversionQuotationError(`${operationName} failed for ${this.sourceToken} -> ${this.targetToken}`, {
      operation: operationName,
      error: errorMessage,
      ...context,
    });
  }

  protected createExecutionError(operationName: string, originalError: unknown, context: AnyRecord): SiloConvertError {
    const errorMessage = originalError instanceof Error ? originalError.message : "Unknown error";
    return new SimulationError(operationName, errorMessage, context);
  }

  /**
   * Validates simulation results with configurable requirements
   */
  validateSimulation(
    sim: { result: readonly `0x${string}`[] } | undefined,
    operationName: string,
    minLength: number = 1,
    context?: AnyRecord,
  ) {
    if (!sim || !sim.result) {
      throw new SimulationError(operationName, "Simulation returned empty results", {
        ...this.buildContext(context),
      });
    }

    if (sim.result.length < minLength) {
      throw new SimulationError(operationName, `Simulation returned less than ${minLength} results`, {
        expectedMinLength: minLength,
        actualLength: sim.result.length,
        ...this.buildContext(context),
      });
    }
  }

  /**
   * Enhanced amount validation with strategy-specific logic
   * Overrides base implementation to provide InvalidAmountError for strategy context
   */
  validateAmount(amount: TV | number, name: string, context?: AnyRecord) {
    const value = typeof amount === "number" ? amount : amount.toNumber();
    const displayValue = typeof amount === "number" ? amount.toString() : amount.toHuman();

    if ((amount instanceof TV && amount.lte(0)) || (typeof amount === "number" && amount <= 0)) {
      throw new InvalidAmountError(displayValue, `${name} must be greater than zero`, {
        amount: amount instanceof TV ? amount.toHuman() : amount,
        ...this.buildContext(context),
      });
    }

    // Special validation for slippage values in strategy context
    if (name.includes("slippage") && (value < 0 || value > 100)) {
      throw new InvalidAmountError(displayValue, "Slippage must be between 0 and 100", {
        slippage: value,
        validRange: "0-100",
        ...this.buildContext(context),
      });
    }
  }

  /**
   * Strategy-specific assertion that creates ConversionQuotationError
   * Overrides base implementation for domain-specific error type
   */
  assert(condition: boolean, message: string, context?: AnyRecord) {
    if (!condition) {
      throw new ConversionQuotationError(message, {
        assertion: "failed",
        ...this.buildContext(context),
      });
    }
  }

  /**
   * Strategy-specific type-safe assertion
   * Overrides base implementation for domain-specific error type
   */
  assertDefined<T>(value: T | undefined | null, message: string, context?: AnyRecord): T {
    if (value === undefined || value === null) {
      throw new ConversionQuotationError(message, {
        valueType: typeof value,
        ...this.buildContext(context),
      });
    }
    return value;
  }
}
