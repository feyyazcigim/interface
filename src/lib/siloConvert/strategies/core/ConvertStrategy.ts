import { AdvancedFarmCall, Token } from "@/utils/types";

import { TV } from "@/classes/TokenValue";
import { AdvancedFarmWorkflow } from "@/lib/farm/workflow";
import { ConversionQuotationError, InvalidAmountError, SimulationError } from "@/lib/siloConvert/SiloConvertErrors";
import { SiloConvertContext } from "@/lib/siloConvert/types";
import { ExtendedPickedCratesDetails } from "@/utils/convert";
import { ConvertStrategyQuote, SiloConvertType } from "./types";

/**
 * Error handler utility for consistent error handling across all conversion strategies
 */
class StrategyErrorHandler {
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

    if (name.includes("slippage") && (value < 0 || value > 1)) {
      throw new InvalidAmountError(displayValue, "Slippage must be between 0 and 1", {
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

export abstract class SiloConvertStrategy<T extends SiloConvertType> {
  readonly context: SiloConvertContext;
  readonly sourceToken: Token;
  readonly targetToken: Token;

  // Error handler instance available to all strategies
  protected readonly errorHandler: StrategyErrorHandler;

  constructor(source: Token, target: Token, context: SiloConvertContext) {
    this.sourceToken = source;
    this.targetToken = target;
    this.context = context;
    this.errorHandler = new StrategyErrorHandler(source.symbol, target.symbol);
  }

  abstract quote(
    deposits: ExtendedPickedCratesDetails,
    advancedFarm: AdvancedFarmWorkflow,
    slippage: number,
  ): Promise<ConvertStrategyQuote<T>>;

  // ------------------------------ Validation Methods ------------------------------ //

  abstract encodeFromQuote(quote: ConvertStrategyQuote<T>): AdvancedFarmCall;

  protected validateSlippage(slippage: number) {
    this.errorHandler.validateAmount(slippage, "slippage");
  }

  protected validateAmountIn(amountIn: TV) {
    this.errorHandler.validateAmount(amountIn, "amount in");
  }

  protected validatePickedCrates(data: ExtendedPickedCratesDetails) {
    this.errorHandler.assert(data.crates.length > 0, "No crates provided for conversion", {
      cratesCount: data.crates.length,
    });

    this.errorHandler.validateAmount(data.totalAmount, "total crates amount", { cratesCount: data.crates.length });
  }

  protected validateQuoteArgs(deposits: ExtendedPickedCratesDetails, slippage: number) {
    this.validatePickedCrates(deposits);
    this.validateAmountIn(deposits.totalAmount);
    this.validateSlippage(slippage);
  }
}
