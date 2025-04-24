import React from "react";
import ReactDOM from "react-dom/client";

import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import Providers from "./Providers.tsx";

import "./index.css";

// biome-ignore lint/style/noNonNullAssertion:
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Providers>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </Providers>
  </React.StrictMode>,
);

// Discord webhook for logging site-wide errors

const webhookUrl =
  "https://discord.com/api/webhooks/1365024536386605210/vuTrpuicFeFYgpkPKoUcX34Whpii5crIIR9GFAwvsmy5LIvQLqiRxTam0wWH0SzQrZ7a";

const originalConsoleError = console.error;

// biome-ignore lint/suspicious/noExplicitAny:
console.error = (...args: any[]) => {
  // Keep printing errors in the console
  originalConsoleError.apply(console, args);

  const content = `🚨 Console error on ${window.location.href}:\n${args.map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : String(arg))).join(" ")}`;

  // Send to Discord
  fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: content.slice(0, 1950),
    }),
  }).catch(() => {});
};

// Also catch/log unhandled errors
window.addEventListener("error", (event) => {
  console.error("Unhandled error:", event.message, event.filename, event.lineno);
});
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled rejection:", event.reason);
});
