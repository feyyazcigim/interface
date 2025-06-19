import { Token } from "@/utils/types";

/**
 * Interface for caching scalar values used in convert quotations
 */
export interface IConvertScalarCache {
  /**
   * Get a cached scalar value for a token pair
   */
  get(source: Token, target: Token): number | undefined;

  /**
   * Set a scalar value for a token pair
   */
  set(source: Token, target: Token, scalar: number): void;

  /**
   * Check if the cache is stale and needs refresh
   */
  isStale(): boolean;

  /**
   * Clear all cached values
   */
  clear(): void;

  /**
   * Get cache metrics for monitoring
   */
  getMetrics(): ConvertScalarCacheMetrics;
}

export interface ConvertScalarCacheMetrics {
  cachedPairCount: number;
  lastUpdateTime: number | null;
  isStale: boolean;
  hitCount: number;
  missCount: number;
  hitRate: number;
}

/**
   * IConvertScalarCache Interface & Implementations
   * 
   * Architecture notes:
   * 
   * The scalar cache system provides efficient caching for expensive calculations
   * used in conversion quotations, particularly for iterative algorithms like
   * the jump search used in max convert calculations.
   * 
   * [Cache Implementations]
   * Two implementations are provided:
   * 1. InMemoryConvertScalarCache: Full-featured caching with metrics
   * 
   * [Metrics and Monitoring]
   * The in-memory implementation tracks:
   * - Cache hit/miss ratios for performance analysis
   * - Staleness detection for cache invalidation
   */
export class InMemoryConvertScalarCache implements IConvertScalarCache {
  private scalars: Record<string, number> = {};
  private lastUpdateTime: number = 0;
  private hitCount = 0;
  private missCount = 0;

  constructor(private readonly staleThresholdMs: number = 15_000) {}

  get(source: Token, target: Token): number | undefined {
    const key = this.generateKey(source, target);
    const value = this.scalars[key];

    if (value !== undefined) {
      this.hitCount++;
      return value;
    }

    this.missCount++;
    return undefined;
  }

  set(source: Token, target: Token, scalar: number): void {
    const key = this.generateKey(source, target);
    this.scalars[key] = scalar;
    this.lastUpdateTime = Date.now();
  }

  isStale(): boolean {
    if (this.lastUpdateTime === 0) return false; // No data cached yet
    return Date.now() - this.lastUpdateTime > this.staleThresholdMs;
  }

  clear(): void {
    this.scalars = {};
    this.lastUpdateTime = 0;
    this.hitCount = 0;
    this.missCount = 0;
  }

  getMetrics(): ConvertScalarCacheMetrics {
    const totalRequests = this.hitCount + this.missCount;
    return {
      cachedPairCount: Object.keys(this.scalars).length,
      lastUpdateTime: this.lastUpdateTime || null,
      isStale: this.isStale(),
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: totalRequests > 0 ? (this.hitCount / totalRequests) * 100 : 0,
    };
  }

  private generateKey(source: Token, target: Token): string {
    return `${source.address.toLowerCase()}-${target.address.toLowerCase()}`;
  }
}


// Keeping for testing purposes
// /**
//  * No-op cache implementation for testing or when caching is disabled
//  */
// export class NoOpConvertScalarCache implements IConvertScalarCache {
//   get(): undefined {
//     return undefined;
//   }

//   set(): void {
//     // No-op
//   }

//   isStale(): boolean {
//     return false;
//   }

//   clear(): void {
//     // No-op
//   }

//   getMetrics(): ConvertScalarCacheMetrics {
//     return {
//       cachedPairCount: 0,
//       lastUpdateTime: null,
//       isStale: false,
//       hitCount: 0,
//       missCount: 0,
//       hitRate: 0,
//     };
//   }
// }
