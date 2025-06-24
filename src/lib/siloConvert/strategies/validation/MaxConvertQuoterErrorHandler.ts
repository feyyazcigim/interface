import { BaseErrorHandler } from "@/lib/siloConvert/strategies/validation/BaseErrorHandler";
import {
  CacheError,
  InvalidConversionTokensError,
  MaxConvertQuotationError,
  PipelineExecutionError,
  SiloConvertError,
} from "@/lib/siloConvert/strategies/validation/SiloConvertErrors";
import { Token } from "@/utils/types";
import { AnyRecord } from "@/utils/types.generic";

/**
 * MaxConvertQuoterErrorHandler
 *
 * Architecture notes:
 *
 * The MaxConvertQuoterErrorHandler extends BaseErrorHandler to provide specialized
 * error handling for max convert quotation operations with token-specific validation.
 *
 * [Specialized Features]
 * Beyond the base error handling capabilities, this handler provides:
 * - Token pair validation for conversion types (default vs LP2LP)
 * - MaxConvert-specific error creation with detailed token context
 * - Cache error handling optimized for quotation operations
 * - Pipeline execution error handling for convert simulations
 *
 * [Token Validation]
 * Validates conversion patterns including:
 * - Source/target token compatibility
 * - LP token conversion rules (LP2LP vs default)
 * - Main token conversion constraints
 * - Address validation and same-token prevention
 */
export class MaxConvertQuoterErrorHandler extends BaseErrorHandler<Token, AnyRecord> {
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

  protected createDomainError(operationName: string, originalError: unknown, context: AnyRecord): SiloConvertError {
    const errorMessage = originalError instanceof Error ? originalError.message : "Unknown error";
    return new MaxConvertQuotationError(this.sourceToken, this.targetToken, `${operationName} failed`, {
      operation: operationName,
      error: errorMessage,
      ...context,
    });
  }

  protected createCacheError(operationName: string, originalError: unknown, context: AnyRecord): SiloConvertError {
    const errorMessage = originalError instanceof Error ? originalError.message : "Unknown error";
    return new CacheError(operationName, errorMessage, context);
  }

  protected createExecutionError(operationName: string, originalError: unknown, context: AnyRecord): SiloConvertError {
    const errorMessage = originalError instanceof Error ? originalError.message : "Unknown error";
    return new PipelineExecutionError(operationName, errorMessage, context);
  }

  /**
   * Legacy method for backwards compatibility
   * @deprecated Use buildContext() instead
   */
  getCtx(ctx?: AnyRecord) {
    return this.buildContext(ctx);
  }

  /**
   * Validates token conversion patterns
   */
  validateConversionTokens(expectedType: "default" | "LP2LP") {
    const { sourceToken, targetToken } = this;

    // Basic token validation
    if (!sourceToken || !targetToken) {
      throw new InvalidConversionTokensError(sourceToken, targetToken, expectedType, "Missing source or target token");
    }

    if (!sourceToken.address || !targetToken.address) {
      throw new InvalidConversionTokensError(sourceToken, targetToken, expectedType, "Invalid token addresses");
    }

    if (sourceToken.address === targetToken.address) {
      throw new InvalidConversionTokensError(
        sourceToken,
        targetToken,
        expectedType,
        "Source and target cannot be the same token",
      );
    }

    // Type-specific validation
    if (expectedType === "LP2LP") {
      if (sourceToken.isMain || targetToken.isMain) {
        throw new InvalidConversionTokensError(
          sourceToken,
          targetToken,
          expectedType,
          `Expected both tokens to be LP tokens but got source: ${sourceToken.symbol}(isMain:${sourceToken.isMain}) and target: ${targetToken.symbol}(isMain:${targetToken.isMain})`,
        );
      }

      if (!sourceToken.isLP || !targetToken.isLP) {
        throw new InvalidConversionTokensError(
          sourceToken,
          targetToken,
          expectedType,
          `Both tokens must be LP tokens but got source: ${sourceToken.symbol}(isLP:${sourceToken.isLP}) and target: ${targetToken.symbol}(isLP:${targetToken.isLP})`,
        );
      }
    }

    if (expectedType === "default") {
      if (sourceToken.isLP && targetToken.isLP) {
        throw new InvalidConversionTokensError(
          sourceToken,
          targetToken,
          expectedType,
          `Expected only one LP token for default convert but got source: ${sourceToken.symbol}(isLP:${sourceToken.isLP}) and target: ${targetToken.symbol}(isLP:${targetToken.isLP})`,
        );
      }

      if (!(sourceToken.isMain || targetToken.isMain)) {
        throw new InvalidConversionTokensError(
          sourceToken,
          targetToken,
          expectedType,
          `Default convert requires one main token but got source: ${sourceToken.symbol}(isMain:${sourceToken.isMain}) and target: ${targetToken.symbol}(isMain:${targetToken.isMain})`,
        );
      }
    }

    if (sourceToken.isMain && targetToken.isMain) {
      throw new InvalidConversionTokensError(
        sourceToken,
        targetToken,
        expectedType,
        `Cannot convert between two main tokens: source: ${sourceToken.symbol} and target: ${targetToken.symbol}`,
      );
    }
  }
}
