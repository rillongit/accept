import { RECEIPT_HEADER } from "./constants.js";
import {
  buildPaymentTerms,
  paymentRequiredBody,
  type RillPaymentTerms,
} from "./payment-terms.js";

export type RillPaywallOptions = {
  resource_id: string;
  amount: string;
  currency_code: string;
  path?: string;
  api_base_url?: string;
  /** Async check: return true if receipt unlocks the resource. */
  verifyReceipt: (receiptId: string, resourceId: string) => Promise<boolean>;
  getReceiptHeader?: (
    headers: Record<string, string | string[] | undefined>,
  ) => string | undefined;
};

function headerValue(
  headers: Record<string, string | string[] | undefined>,
  name: string,
): string | undefined {
  const raw = headers[name] ?? headers[name.toLowerCase()];
  if (Array.isArray(raw)) return raw[0];
  return raw;
}

/**
 * Framework-agnostic paywall helper for sellers.
 * Returns null when access is granted; otherwise a 402 payload.
 */
export async function enforceRillPaywall(
  headers: Record<string, string | string[] | undefined>,
  options: RillPaywallOptions,
): Promise<
  | { status: 402; body: ReturnType<typeof paymentRequiredBody> }
  | {
      status: 403;
      body: { ok: false; error: { code: string; message: string } };
    }
  | null
> {
  const terms: RillPaymentTerms = buildPaymentTerms({
    resource_id: options.resource_id,
    amount: options.amount,
    currency_code: options.currency_code,
    path: options.path,
    api_base_url: options.api_base_url,
  });

  const receipt =
    options.getReceiptHeader?.(headers) ??
    headerValue(headers, RECEIPT_HEADER) ??
    headerValue(headers, "x-rill-receipt");

  if (!receipt?.trim()) {
    return {
      status: 402,
      body: paymentRequiredBody(terms),
    };
  }

  const ok = await options.verifyReceipt(receipt.trim(), options.resource_id);
  if (!ok) {
    return {
      status: 403,
      body: {
        ok: false,
        error: {
          code: "invalid_receipt",
          message: "Receipt invalid for this resource",
        },
      },
    };
  }
  return null;
}
