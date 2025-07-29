import { Token } from "@/utils/types";
import { AnyRecord } from "@/utils/types.generic";
import { BaseErrorHandler } from "./BaseErrorHandler";
import * as SCE from "./SiloConvertErrors";

/**
 * ErrorHandlerFactory
 *
 * Centralized factory for creating error handlers with consistent configuration.
 * Eliminates repetitive error handler instantiation and provides a single
 * point of configuration for all error handling in the silo convert system.
 */
export class ErrorHandlerFactory {
  /**
   * Creates a ConvertStrategyErrorHandler for strategy operations
   */
  static createStrategyHandler(sourceToken: string, targetToken: string): ConvertStrategyErrorHandler {
    return new ConvertStrategyErrorHandler(sourceToken, targetToken);
  }

  /**
   * Creates a MaxConvertQuoterErrorHandler for max convert quotation operations
   */
  static createMaxConvertQuoterHandler(sourceToken: Token, targetToken: Token): MaxConvertQuoterErrorHandler {
    return new MaxConvertQuoterErrorHandler(sourceToken, targetToken);
  }

  /**
   * Creates a StrategizerErrorHandler for strategy selection operations
   */
  static createStrategizerHandler(sourceToken: Token, targetToken: Token): StrategizerErrorHandler {
    return new StrategizerErrorHandler(sourceToken, targetToken);
  }
}

/**
 * StrategizerErrorHandler
 *
 * Specialized error handler for strategy selection operations.
 * Provides token-specific error creation and context building.
 */
class StrategizerErrorHandler extends BaseErrorHandler<Token, AnyRecord> {
  protected getTokenContext(): AnyRecord {
    return {
      source: {
        symbol: this.sourceToken.symbol,
        address: this.sourceToken.address,
        isMain: this.sourceToken.isMain,
        isLP: this.sourceToken.isLP,
      },
      target: {
        symbol: this.targetToken.symbol,
        address: this.targetToken.address,
        isMain: this.targetToken.isMain,
        isLP: this.targetToken.isLP,
      },
    };
  }

  protected createDomainError(operationName: string, originalError: unknown, context: AnyRecord): SCE.SiloConvertError {
    const errorMessage = originalError instanceof Error ? originalError.message : "Unknown error";
    return new SCE.StrategizerError(operationName, {
      operation: operationName,
      error: errorMessage,
      ...context,
    });
  }
}

/**
 * MaxConvertQuoterErrorHandler
 *
 * Specialized error handler for max convert quotation operations.
 * Provides token-specific error creation and context building.
 */
class MaxConvertQuoterErrorHandler extends BaseErrorHandler<Token, AnyRecord> {
  protected getTokenContext(): AnyRecord {
    return {
      source: {
        symbol: this.sourceToken.symbol,
        address: this.sourceToken.address,
        isMain: this.sourceToken.isMain,
        isLP: this.sourceToken.isLP,
      },
      target: {
        symbol: this.targetToken.symbol,
        address: this.targetToken.address,
        isMain: this.targetToken.isMain,
        isLP: this.targetToken.isLP,
      },
    };
  }

  protected createDomainError(operationName: string, originalError: unknown, context: AnyRecord): SCE.SiloConvertError {
    const errorMessage = originalError instanceof Error ? originalError.message : "Unknown error";
    return new SCE.MaxConvertQuotationError(this.sourceToken, this.targetToken, `${operationName} failed`, {
      operation: operationName,
      error: errorMessage,
      ...context,
    });
  }
}

/**
 * ConvertStrategyErrorHandler
 *
 * Specialized error handler for conversion strategies.
 * Provides simulation validation and strategy-specific error creation.
 */
class ConvertStrategyErrorHandler extends BaseErrorHandler<string, AnyRecord> {
  protected getTokenContext(): AnyRecord {
    return {
      sourceToken: this.sourceToken,
      targetToken: this.targetToken,
    };
  }

  protected createDomainError(operationName: string, originalError: unknown, context: AnyRecord): SCE.SiloConvertError {
    const errorMessage = originalError instanceof Error ? originalError.message : "Unknown error";
    return new SCE.ConversionQuotationError(`${operationName} failed for ${this.sourceToken} -> ${this.targetToken}`, {
      operation: operationName,
      error: errorMessage,
      ...context,
    });
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
      throw this.createExecutionError(`${operationName}_simulation`, "Simulation returned empty results", {
        ...this.buildContext(context),
      });
    }

    if (sim.result.length < minLength) {
      throw this.createExecutionError(
        `${operationName}_simulation`,
        `Simulation returned less than ${minLength} results`,
        {
          expectedMinLength: minLength,
          actualLength: sim.result.length,
          ...this.buildContext(context),
        },
      );
    }
  }
}
