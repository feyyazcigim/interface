import { Token } from "@/utils/types";
import { AnyRecord } from "@/utils/types.generic";
import { BaseErrorHandler } from "./BaseErrorHandler";
import { SiloConvertError, StrategizerError } from "./SiloConvertErrors";

export class StrategizerErrorHandler extends BaseErrorHandler<Token, AnyRecord> {
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

  createDomainError(operationName: string, originalError: unknown, context: AnyRecord): SiloConvertError {
    const errorMessage = originalError instanceof Error ? originalError.message : "Unknown error";
    return new StrategizerError("operationName", {
      operation: operationName,
      error: errorMessage,
      ...context,
    });
  }
}
