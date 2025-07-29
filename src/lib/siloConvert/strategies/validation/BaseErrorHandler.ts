import { TV } from "@/classes/TokenValue";
import {
  CacheError,
  InvalidConversionTokensError,
  SiloConvertError,
} from "@/lib/siloConvert/strategies/validation/SiloConvertErrors";
import { Token } from "@/utils/types";
import { AnyRecord } from "@/utils/types.generic";

/**
 * BaseErrorHandler
 *
 * Architecture notes:
 *
 * The BaseErrorHandler provides a foundation for all error handling in the siloConvert
 * system, ensuring consistent error wrapping, context management, and validation patterns.
 *
 * [Generic Design]
 * The handler uses generic types to support different token representations:
 * - TTokenContext: The type used for token context (Token objects, strings, etc.)
 * - TContext: Additional context data specific to each implementation
 *
 * [Error Wrapping Strategy]
 * Common error wrapping patterns for:
 * 1. Synchronous operations
 * 2. Asynchronous operations
 * 3. Cache operations (with graceful fallbacks)
 * 4. Re-throwing of custom SiloConvertError instances
 *
 * [Validation Framework]
 * Shared validation utilities for:
 * - Amount validation (positive, non-NaN, non-zero)
 * - Scalar value bounds checking
 * - Type-safe assertions with detailed error context
 * - Contract response validation
 *
 * [Context Management]
 * Provides flexible context building with:
 * - Additional context accumulation
 * - Token-specific context extraction
 * - Operation-specific context merging
 */
export abstract class BaseErrorHandler<TTokenContext = unknown, TContext extends AnyRecord = AnyRecord> {
  protected additionalContext: TContext = {} as TContext;

  constructor(
    protected sourceToken: TTokenContext,
    protected targetToken: TTokenContext,
  ) {}

  /**
   * Add additional context that will be included in all error reports
   */
  addCtx(context: Partial<TContext>) {
    this.additionalContext = {
      ...this.additionalContext,
      ...context,
    } as TContext;
  }

  /**
   * Build complete context object for error reporting
   * Subclasses should override this to provide domain-specific context
   */
  protected buildContext(operationContext?: AnyRecord): TContext & AnyRecord {
    return {
      ...this.additionalContext,
      ...this.getTokenContext(),
      ...(operationContext ?? {}),
    } as TContext & AnyRecord;
  }

  /**
   * Extract token-specific context - subclasses must implement
   */
  protected abstract getTokenContext(): AnyRecord;

  /**
   * Create domain-specific error - subclasses must implement
   */
  protected abstract createDomainError(
    operationName: string,
    originalError: unknown,
    context: AnyRecord,
  ): SiloConvertError;

  /**
   * Create domain-specific cache error - subclasses can override
   */
  protected createCacheError(operationName: string, originalError: unknown, context: AnyRecord): SiloConvertError {
    return new CacheError(
      operationName,
      originalError instanceof Error ? originalError.message : "Unknown cache error",
      context,
    );
  }

  /**
   * Create domain-specific simulation/pipeline error - subclasses can override
   */
  protected createExecutionError(operationName: string, originalError: unknown, context: AnyRecord): SiloConvertError {
    return this.createDomainError(operationName, originalError, context);
  }

  /**
   * Wraps synchronous operations with error handling
   */
  wrap<T>(operation: () => T, operationName: string, context?: AnyRecord): T {
    try {
      return operation();
    } catch (error) {
      // Re-throw custom errors as-is
      if (error instanceof SiloConvertError) {
        throw error;
      }

      // Wrap other errors
      throw this.createDomainError(operationName, error, this.buildContext(context));
    }
  }

  /**
   * Wraps asynchronous operations with error handling
   */
  async wrapAsync<T>(operation: () => Promise<T>, operationName: string, context?: AnyRecord): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      // Re-throw custom errors as-is
      if (error instanceof SiloConvertError) {
        throw error;
      }

      // Handle special operation types
      if (operationName.includes("simulation") || operationName.includes("pipeline")) {
        throw this.createExecutionError(operationName, error, this.buildContext(context));
      }

      if (operationName.includes("cache")) {
        throw this.createCacheError(operationName, error, this.buildContext(context));
      }

      // Wrap other errors
      throw this.createDomainError(operationName, error, this.buildContext(context));
    }
  }

  /**
   * Wraps cache operations with graceful error handling (non-fatal)
   * Cache failures should not break the main flow, just log and continue
   */
  wrapCache<T>(operation: () => T, operationName: string, fallback: T, context?: AnyRecord): T {
    try {
      return operation();
    } catch (error) {
      // Log cache errors but don't throw - return fallback instead
      const errorMessage = error instanceof Error ? error.message : String(error);
      const fullContext = this.buildContext(context);

      console.debug(`[${this.constructor.name}/${operationName}]: cache operation failed, using fallback`, {
        error: errorMessage,
        fallback,
        ...fullContext,
      });
      return fallback;
    }
  }

  /**
   * Wraps async cache operations with graceful error handling (non-fatal)
   */
  async wrapCacheAsync<T>(
    operation: () => Promise<T>,
    operationName: string,
    fallback: T,
    context?: AnyRecord,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      // Log cache errors but don't throw - return fallback instead
      const errorMessage = error instanceof Error ? error.message : String(error);
      const fullContext = this.buildContext(context);

      console.debug(`[${this.constructor.name}/${operationName}]: async cache operation failed, using fallback`, {
        error: errorMessage,
        fallback,
        ...fullContext,
      });
      return fallback;
    }
  }

  /**
   * Validates token conversion patterns
   */
  validateConversionTokens(expectedType: "default" | "LP2LP" | "default-down", sourceToken: Token, targetToken: Token) {
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

    if (expectedType === "default-down") {
      if (!sourceToken.isMain || !targetToken.isLP) {
        const msg = !sourceToken.isMain
          ? `Default down convert requires source token to be a main token but got source: ${sourceToken.symbol}(isMain:${sourceToken.isMain})`
          : `Default down convert requires target token to be a LP token but got target: ${targetToken.symbol}(isLP:${targetToken.isLP})`;

        throw new InvalidConversionTokensError(sourceToken, targetToken, expectedType, msg);
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

  /**
   * Validates amounts with appropriate error messages
   */
  validateAmount(amount: TV | number | undefined | null, name: string, context?: AnyRecord) {
    if (!amount && amount !== 0) {
      throw this.createDomainError(`${name}_validation`, new Error(`${name} is required`), {
        amountType: name,
        value: amount,
        ...this.buildContext(context),
      });
    }

    const numericValue = typeof amount === "number" ? amount : amount.toNumber();
    const displayValue = typeof amount === "number" ? amount.toString() : amount.toHuman();

    if (Number.isNaN(numericValue)) {
      throw this.createDomainError(`${name}_validation`, new Error(`${name} is NaN`), {
        amountType: name,
        value: displayValue,
        ...this.buildContext(context),
      });
    }

    if (numericValue < 0) {
      throw this.createDomainError(`${name}_validation`, new Error(`${name} must be positive`), {
        amountType: name,
        value: displayValue,
        ...this.buildContext(context),
      });
    }

    // Special validation for slippage values
    if (name.toLowerCase().includes("slippage") && (numericValue < 0 || numericValue > 100)) {
      throw this.createDomainError(`${name}_validation`, new Error("Slippage must be between 0 and 100"), {
        amountType: name,
        value: displayValue,
        validRange: "0-100",
        ...this.buildContext(context),
      });
    }
  }

  /**
   * Validates scalar values (should be between 0 and 1)
   */
  validateScalar(scalar: number | undefined, name: string, context?: AnyRecord) {
    if (scalar === undefined || scalar === null) {
      throw this.createDomainError(`${name}_validation`, new Error(`${name} is required`), {
        scalarType: name,
        value: scalar,
        ...this.buildContext(context),
      });
    }

    if (Number.isNaN(scalar)) {
      throw this.createDomainError(`${name}_validation`, new Error(`${name} is NaN`), {
        scalarType: name,
        value: scalar,
        ...this.buildContext(context),
      });
    }

    if (scalar <= 0 || scalar > 1) {
      throw this.createDomainError(`${name}_validation`, new Error(`${name} must be between 0 and 1`), {
        scalarType: name,
        value: scalar,
        validRange: "0 < scalar <= 1",
        ...this.buildContext(context),
      });
    }
  }

  /**
   * Validates contract responses
   */
  validateContractResponse<T>(response: T | undefined | null, operationName: string, context?: AnyRecord): T {
    if (response === undefined || response === null) {
      throw this.createDomainError(
        operationName,
        new Error(`Contract returned invalid response for ${operationName}`),
        { operation: operationName, response, ...this.buildContext(context) },
      );
    }
    return response;
  }

  /**
   * Simple assertion with domain-specific context
   */
  assert(condition: boolean, message: string, context?: AnyRecord) {
    if (!condition) {
      throw this.createDomainError("assertion", new Error(message), {
        assertion: "failed",
        ...this.buildContext(context),
      });
    }
  }

  /**
   * Type-safe assertion that ensures a value is defined and narrows the type
   */
  assertDefined<T>(value: T | undefined | null, message: string, context?: AnyRecord): T {
    if (value === undefined || value === null) {
      throw this.createDomainError("assertion", new Error(message), {
        valueType: typeof value,
        ...this.buildContext(context),
      });
    }
    return value;
  }
}
