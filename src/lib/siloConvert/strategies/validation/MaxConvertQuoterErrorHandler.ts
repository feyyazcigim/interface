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
}
