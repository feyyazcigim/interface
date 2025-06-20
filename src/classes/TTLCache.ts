import { MayArray } from "@/utils/types.generic";
import { arrayify } from "@/utils/utils";
/**
 * Generic cache interface with TTL (Time To Live) support
 * Can cache any type of data with automatic expiration and metrics tracking
 */
export interface ITTLCache<T> {
  /**
   * Get a cached value by key
   * @param key - Cache key (string)
   */
  get(key: string): T | undefined;

  /**
   * Set a value in the cache
   * @param key - Cache key (string)
   * @param value - Value to cache
   * @param customTTL - Optional custom TTL in milliseconds
   */
  set(key: string, value: T, customTTL?: number): void;

  /**
   * Check if the entire cache is stale and needs refresh
   */
  isStale(): boolean;

  /**
   * Check if a specific cache entry is stale
   * @param key - Cache key to check
   */
  isEntryStale(key: string): boolean;

  /**
   * Check if a key exists in the cache (regardless of staleness)
   * @param key - Cache key to check
   */
  has(key: string): boolean;

  /**
   * Clear all cached values
   */
  clear(): void;

  /**
   * Remove a specific cache entry
   * @param key - Cache key to remove
   */
  remove(key: string): void;

  /**
   * Get all cache keys
   */
  keys(): string[];

  /**
   * Get cache size (number of entries)
   */
  size(): number;

  /**
   * Get cache metrics for monitoring
   */
  getMetrics(): TTLCacheMetrics;
}

/**
 * Cache metrics interface for monitoring performance
 */
export interface TTLCacheMetrics {
  /** Number of cached entries */
  cachedEntryCount: number;
  /** Timestamp of last cache update */
  lastUpdateTime: number | null;
  /** Whether the entire cache is considered stale */
  isStale: boolean;
  /** Number of cache hits */
  hitCount: number;
  /** Number of cache misses */
  missCount: number;
  /** Hit rate as a percentage */
  hitRate: number;
  /** Number of entries that have expired */
  expiredEntryCount: number;
}

/**
 * Internal cache entry structure
 */
interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
}

/**
 * In-memory implementation of TTLCache with automatic expiration
 * Provides efficient caching with configurable TTL and comprehensive metrics
 */
export class InMemoryTTLCache<T> implements ITTLCache<T> {
  private cache: Record<string, CacheEntry<T>> = {};
  private lastUpdateTime: number = 0;
  private hitCount = 0;
  private missCount = 0;

  constructor(
    private readonly defaultTTL: number = 15_000, // 15 seconds default
    private readonly staleThresholdMs: number = 15_000, // When to consider entire cache stale
  ) {}

  get(key: string): T | undefined {
    const entry = this.cache[key];

    if (!entry) {
      this.missCount++;
      return undefined;
    }

    // Check if entry has expired
    if (this.isEntryExpired(entry)) {
      delete this.cache[key];
      this.missCount++;
      return undefined;
    }

    this.hitCount++;
    return entry.value;
  }

  set(key: string, value: T, customTTL?: number): void {
    const ttl = customTTL ?? this.defaultTTL;

    this.cache[key] = {
      value,
      timestamp: Date.now(),
      ttl,
    };

    this.lastUpdateTime = Date.now();
  }

  isStale(): boolean {
    if (this.lastUpdateTime === 0) return false; // No data cached yet
    return Date.now() - this.lastUpdateTime > this.staleThresholdMs;
  }

  isEntryStale(key: string): boolean {
    const entry = this.cache[key];

    if (!entry) return true; // Non-existent entries are considered stale
    return this.isEntryExpired(entry);
  }

  has(key: string): key is keyof typeof this.cache {
    return key in this.cache;
  }

  clear(): void {
    this.cache = {};
    this.lastUpdateTime = 0;
    this.hitCount = 0;
    this.missCount = 0;
  }

  remove(key: string): void {
    delete this.cache[key];
  }

  keys(): string[] {
    // Only return keys for non-expired entries
    const now = Date.now();
    return Object.keys(this.cache).filter((key) => {
      const entry = this.cache[key];
      return entry && !this.isEntryExpired(entry, now);
    });
  }

  size(): number {
    return this.keys().length;
  }

  getMetrics(): TTLCacheMetrics {
    const totalRequests = this.hitCount + this.missCount;
    const expiredEntries = this.countExpiredEntries();

    return {
      cachedEntryCount: Object.keys(this.cache).length - expiredEntries,
      lastUpdateTime: this.lastUpdateTime || null,
      isStale: this.isStale(),
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: totalRequests > 0 ? (this.hitCount / totalRequests) * 100 : 0,
      expiredEntryCount: expiredEntries,
    };
  }

  /**
   * Clean up expired entries from the cache
   * This can be called periodically to free memory
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of Object.entries(this.cache)) {
      if (this.isEntryExpired(entry, now)) {
        delete this.cache[key];
      }
    }
  }

  /**
   * Get all cache keys (useful for debugging)
   */
  getKeys(): string[] {
    return Object.keys(this.cache);
  }

  generateKey(args: MayArray<string>, additionalKey?: string): string {
    const baseKey = arrayify(args).join("-");
    return additionalKey ? `${baseKey}:${additionalKey}` : baseKey;
  }

  // Private helper methods
  private isEntryExpired(entry: CacheEntry<T>, currentTime: number = Date.now()): boolean {
    return currentTime - entry.timestamp > entry.ttl;
  }

  private countExpiredEntries(): number {
    const now = Date.now();
    return Object.values(this.cache).filter((entry) => this.isEntryExpired(entry, now)).length;
  }
}

/**
 * No-op cache implementation for testing or when caching is disabled
 */
export class NoOpTTLCache<T> implements ITTLCache<T> {
  get(): undefined {
    return undefined;
  }

  set(): void {
    // No-op
  }

  isStale(): boolean {
    return false;
  }

  isEntryStale(): boolean {
    return true;
  }

  has(): boolean {
    return false;
  }

  clear(): void {
    // No-op
  }

  remove(): void {
    // No-op
  }

  keys(): string[] {
    return [];
  }

  size(): number {
    return 0;
  }

  getMetrics(): TTLCacheMetrics {
    return {
      cachedEntryCount: 0,
      lastUpdateTime: null,
      isStale: false,
      hitCount: 0,
      missCount: 0,
      hitRate: 0,
      expiredEntryCount: 0,
    };
  }
}

// Utility functions for common key generation patterns

/**
 * Generate a cache key from token addresses
 * @param sourceAddress - Source token address
 * @param targetAddress - Target token address
 * @param additionalKey - Optional additional key component
 */
export function generateKey(args: string[], additionalKey?: string): string {
  const baseKey = args.join("-");
  return additionalKey ? `${baseKey}:${additionalKey}` : baseKey;
}

// Type aliases for common use cases
export type ScalarCache = ITTLCache<number>;
export type TokenValueCache = ITTLCache<import("@/classes/TokenValue").TokenValue>;
export type StringCache = ITTLCache<string>;
export type BooleanCache = ITTLCache<boolean>;
