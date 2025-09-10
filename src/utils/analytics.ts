import { isProd } from "./utils";

// Global gtag function declaration for TypeScript
declare global {
  function gtag(...args: any[]): void;
  interface Window {
    gtag?: typeof gtag;
    dataLayer?: any[];
  }
}

/**
 * [Analytics/GA] Utility for Pinto Interface
 *
 * Handles [Analytics/GA] integration with proper TypeScript typing
 * and production environment checks. Designed for React SPA tracking.
 */

export const GA_TRACKING_ID = import.meta.env.VITE_GA_TRACKING_ID || "";

/**
 * Check if [Analytics/GA] is available and environment is production
 */
export function isAnalyticsEnabled(): boolean {
  if (!isProd()) return false;
  if (!GA_TRACKING_ID) return false;
  return isProd() && typeof window !== "undefined" && typeof window.gtag === "function";
}

/**
 * Initialize [Analytics/GA] with proper configuration
 * Called once when the app starts (if in production)
 */
export function initializeGA(): void {
  if (!isAnalyticsEnabled()) {
    return;
  }

  // GA script should already be loaded via index.html in production
  // This is just a safety check
  if (!window.gtag) {
    console.warn("[Analytics/GA]: gtag function not found");
    return;
  }
}

/**
 * Track a page view event for React SPA navigation
 *
 * @param title - Page title from meta data
 * @param url - Full URL of the page
 * @param metaKey - Page category from meta constants (silo, field, swap, etc.)
 * @param customData - Optional additional tracking data
 */
export function trackPageView(title: string, url: string, metaKey: string, customData?: Record<string, any>): void {
  if (!isAnalyticsEnabled()) {
    return;
  }

  try {
    const pathname = new URL(url).pathname;

    if (!window.gtag) {
      console.warn("[Analytics/GA]: gtag function not available");
      return;
    }

    // Send page view with enhanced data
    window.gtag("config", GA_TRACKING_ID, {
      page_title: title,
      page_location: url,
      page_path: pathname,
      custom_map: {
        custom_dimension_1: "page_category", // metaKey mapping
      },
      ...customData,
    });

    // Send custom event for page category tracking
    window.gtag("event", "page_view", {
      page_title: title,
      page_location: url,
      page_path: pathname,
      page_category: metaKey,
      ...customData,
    });

    console.debug(`[GA] Page view tracked: ${pathname} (${metaKey})`);
  } catch (error) {
    console.error("[Analytics/GA] tracking error:", error);
  }
}

/**
 * Track custom events for user interactions
 *
 * @param eventName - Name of the event (e.g., 'wallet_connect', 'transaction_start')
 * @param eventData - Additional event parameters
 */
export function trackEvent(eventName: string, eventData?: Record<string, any>): void {
  if (!isAnalyticsEnabled()) {
    return;
  }

  try {
    if (!window.gtag) {
      console.warn("[Analytics/GA]: gtag function not available");
      return;
    }

    window.gtag("event", eventName, {
      ...eventData,
    });

    console.debug(`[GA] Event tracked: ${eventName}`, eventData);
  } catch (error) {
    console.error("[Analytics/GA] event tracking error:", error);
  }
}

/**
 * Track ecommerce/transaction events for DeFi operations
 *
 * @param transactionType - Type of DeFi operation (deposit, swap, harvest, etc.)
 * @param transactionData - Aggregate transaction details (no user-specific data)
 */
export function trackTransaction(
  transactionType: string,
  transactionData: {
    value_range?: string; // e.g., "0-100", "100-1000", "1000+"
    currency?: string;
    token_symbol?: string;
    success?: boolean;
    page_category?: string;
    [key: string]: any;
  },
): void {
  if (!isAnalyticsEnabled()) {
    return;
  }

  try {
    if (!window.gtag) {
      console.warn("[Analytics/GA]: gtag function not available");
      return;
    }

    window.gtag("event", "transaction", {
      transaction_type: transactionType,
      ...transactionData,
    });

    console.debug(`[GA] Transaction tracked: ${transactionType}`, transactionData);
  } catch (error) {
    console.error("[Analytics/GA] transaction tracking error:", error);
  }
}

/**
 * Set user properties for segmentation
 *
 * @param properties - User properties to set
 */
export function setUserProperties(properties: Record<string, any>): void {
  if (!isAnalyticsEnabled()) {
    return;
  }

  try {
    if (!window.gtag) {
      console.warn("[Analytics/GA]: gtag function not available");
      return;
    }

    window.gtag("config", GA_TRACKING_ID, {
      custom_map: properties,
    });

    console.debug("[GA] User properties set:", properties);
  } catch (error) {
    console.error("[Analytics/GA] user properties error:", error);
  }
}

/**
 * Categorize transaction value into privacy-safe ranges
 *
 * @param value - Transaction value in USD or token amount
 * @returns Range string for analytics (no exact values)
 */
export function categorizeTransactionValue(value: number): string {
  if (value < 10) return "0-10";
  if (value < 100) return "10-100";
  if (value < 1000) return "100-1k";
  if (value < 10000) return "1k-10k";
  if (value < 100000) return "10k-100k";
  return "100k+";
}

/**
 * Debug utility to check analytics status
 */
export function getAnalyticsStatus(): {
  enabled: boolean;
  isProd: boolean;
  gtagAvailable: boolean;
} {
  return {
    enabled: isAnalyticsEnabled(),
    isProd: isProd(),
    gtagAvailable: typeof window !== "undefined" && typeof window.gtag === "function",
  };
}
