import { TV } from "@/classes/TokenValue";
import { ConversionQuotationError, InvalidAmountError, SimulationError } from "@/lib/siloConvert/SiloConvertErrors";

/**
 * ConvertStrategyErrorHandler
 *
 * Architecture notes:
 *
 * The ConvertStrategyErrorHandler provides centralized error handling for all
 * conversion strategies, ensuring consistent error reporting and debugging context.
 *
 * [Error Wrapping Strategy]
 * The handler wraps all strategy operations with try-catch blocks that:
 * 1. Capture the original error context
 * 2. Add strategy-specific metadata
 * 3. Transform errors into user-friendly messages
 * 4. Preserve stack traces for debugging
 *
 * [Validation Framework]
 * The handler provides validation utilities for:
 * - Token amounts and balance sufficiency
 * - Slippage tolerance limits
 * - Simulation result integrity
 * - Type-safe assertions with detailed error messages
 *
 * [Strategy Integration]
 * Each conversion strategy uses the error handler to:
 * - Wrap quote generation operations
 * - Validate input parameters
 * - Handle simulation failures
 * - Provide consistent error reporting
 */
export class ConvertStrategyErrorHandler {
  constructor(
    private sourceToken: string,
    private targetToken: string,
  ) {}

  /**
   * Wraps synchronous operations with error handling
   */
  wrap<T>(operation: () => T, operationName: string, context?: Record<string, any>): T {
    try {
      return operation();
    } catch (error) {
      // Re-throw custom errors as-is
      if (
        error instanceof ConversionQuotationError ||
        error instanceof InvalidAmountError ||
        error instanceof SimulationError
      ) {
        throw error;
      }

      // Wrap other errors
      throw new ConversionQuotationError(`${operationName} failed for ${this.sourceToken} -> ${this.targetToken}`, {
        sourceToken: this.sourceToken,
        targetToken: this.targetToken,
        operation: operationName,
        error: error instanceof Error ? error.message : "Unknown error",
        ...context,
      });
    }
  }

  /**
   * Wraps asynchronous operations with error handling
   */
  async wrapAsync<T>(operation: () => Promise<T>, operationName: string, context?: Record<string, any>): Promise<T> {
    try {
      return operation();
    } catch (error) {
      // Re-throw custom errors as-is
      if (
        error instanceof ConversionQuotationError ||
        error instanceof InvalidAmountError ||
        error instanceof SimulationError
      ) {
        throw error;
      }

      // Wrap simulation errors specially
      if (operationName.includes("simulation")) {
        throw new SimulationError(operationName, error instanceof Error ? error.message : "Unknown error", {
          sourceToken: this.sourceToken,
          targetToken: this.targetToken,
          ...context,
        });
      }

      // Wrap other errors
      throw new ConversionQuotationError(`${operationName} failed for ${this.sourceToken} -> ${this.targetToken}`, {
        sourceToken: this.sourceToken,
        targetToken: this.targetToken,
        operation: operationName,
        error: error instanceof Error ? error.message : "Unknown error",
        ...context,
      });
    }
  }

  validateSimulation(
    sim: { result: readonly `0x${string}`[] } | undefined,
    operationName: string,
    minLength: number = 1,
    context?: Record<string, any>,
  ) {
    if (!sim || !sim.result) {
      throw new SimulationError(operationName, "Simulation returned empty results", {
        sourceToken: this.sourceToken,
        targetToken: this.targetToken,
        ...context,
      });
    }

    if (sim.result.length < minLength) {
      throw new SimulationError(operationName, `Simulation returned less than ${minLength} results`, {
        sourceToken: this.sourceToken,
        targetToken: this.targetToken,
        ...context,
      });
    }
  }

  /**
   * Validates amounts with appropriate error messages
   */
  validateAmount(amount: TV | number, name: string, context?: Record<string, any>) {
    const value = typeof amount === "number" ? amount : amount.toNumber();
    const displayValue = typeof amount === "number" ? amount.toString() : amount.toHuman();

    if ((amount instanceof TV && amount.lte(0)) || (typeof amount === "number" && amount <= 0)) {
      throw new InvalidAmountError(displayValue, `${name} must be greater than zero`, {
        sourceToken: this.sourceToken,
        targetToken: this.targetToken,
        amount: amount instanceof TV ? amount.toHuman() : amount,
        ...context,
      });
    }

    if (name.includes("slippage") && (value < 0 || value > 100)) {
      throw new InvalidAmountError(displayValue, "Slippage must be between 0 and 100", {
        sourceToken: this.sourceToken,
        targetToken: this.targetToken,
        slippage: value,
        ...context,
      });
    }
  }

  /**
   * Simple assertion with conversion context
   */
  assert(condition: boolean, message: string, context?: Record<string, any>) {
    if (!condition) {
      throw new ConversionQuotationError(message, {
        sourceToken: this.sourceToken,
        targetToken: this.targetToken,
        ...context,
      });
    }
  }

  /**
   * Type-safe assertion that ensures a value is defined and narrows the type
   * This is useful for values that might be undefined but should be defined at runtime
   */
  assertDefined<T>(value: T | undefined | null, message: string, context?: Record<string, any>): T {
    if (value === undefined || value === null) {
      throw new ConversionQuotationError(message, {
        sourceToken: this.sourceToken,
        targetToken: this.targetToken,
        valueType: typeof value,
        ...context,
      });
    }
    return value;
  }
}
