import { API_SERVICES } from "@/constants/endpoints";
import { deployedCommitHash, exists, isDev, isObject } from "./utils";

interface ErrorIsh {
  message: string;
}
interface ErrorWithShortMessage {
  shortMessage: string;
}

type MayError = Record<string, unknown> | any;

export const isErrorIsh = (val: unknown): val is ErrorIsh => {
  if (!exists(val) || !isObject(val)) return false;
  return "message" in val && typeof val.message === "string";
};

export const isShortMessageErrorIsh = (val: unknown): val is ErrorWithShortMessage => {
  if (!exists(val) || !isObject(val)) return false;
  return "shortMessage" in val && typeof val.shortMessage === "string";
};

export const tryExtractErrorMessage = (value: unknown, defaultMessage: string): string => {
  if (value instanceof Error || isObject(value)) {
    if (isShortMessageErrorIsh(value)) {
      return value.shortMessage;
    }
    if (isErrorIsh(value)) {
      return value.message;
    }
  }

  return defaultMessage;
};

// Discord webhook for logging site-wide errors
export const activateDiscordLogging = () => {
  // Dont send messages with this content
  const WEBHOOK_BLACKLIST = [
    "validateDOMNesting",
    "UserRejectedRequestError",
    `"level":50,"context":`,
    "User rejected the request",
  ];

  const originalConsoleError = console.error;

  // biome-ignore lint/suspicious/noExplicitAny:
  console.error = (...args: any[]) => {
    // Keep printing errors in the console
    originalConsoleError.apply(console, args);

    if (!isDev()) {
      const content =
        `🚨 ${(deployedCommitHash() ?? "").slice(0, 7)} Console error on ${window.location.href}:\n${args.map((arg) => (arg instanceof Error ? arg.message : typeof arg === "object" ? JSON.stringify(arg) : String(arg))).join(" ")}`
          // Prevent discord link previews
          .replace(/(https?:\/\/[^\s]+)/g, "<$1>")
          // Hide wallet addresses
          .replace(/0x[a-fA-F0-9]{40}(?=[^a-fA-F0-9]|$)/g, "ADDR");

      if (WEBHOOK_BLACKLIST.some((blacklist) => content.includes(blacklist))) {
        return;
      }

      // Send to Discord
      fetch(`${API_SERVICES.pinto}/proxy/ui-errors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.slice(0, 1950),
        }),
      }).catch(() => {});
    }
  };
};
