import {
  enforceRillPaywall,
  type RillPaywallOptions,
} from "./middleware.js";
import { createVerifyReceipt } from "./verify.js";

export type RillPaywallConfig = {
  apiBaseUrl: string;
  resource_id: string;
  amount: string;
  currency_code?: string;
  path?: string;
};

/**
 * Ready-made Accept-kit paywall: verifies X-Rill-Receipt against Rill API.
 * Hosted `/r/{id}` gates also emit native MPP + x402 challenges; prefer those
 * for open-world agents. This helper covers SDK sellers using Rill receipts
 * (including `rcpt_mpp_*` / `rcpt_x402_*` minted after open-rail success).
 */
export function rillPaywall(config: RillPaywallConfig) {
  const verifyReceipt = createVerifyReceipt(config.apiBaseUrl);
  const options: RillPaywallOptions = {
    resource_id: config.resource_id,
    amount: config.amount,
    currency_code: config.currency_code ?? "USD",
    path: config.path,
    api_base_url: config.apiBaseUrl,
    verifyReceipt,
  };

  return async function middleware(
    headers: Record<string, string | string[] | undefined>,
  ) {
    return enforceRillPaywall(headers, options);
  };
}
