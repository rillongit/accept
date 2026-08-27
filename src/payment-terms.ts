import { RECEIPT_HEADER } from "./constants.js";

/** Public pay rails advertised to agents (MPP + x402 first; rill ledger is background). */
export type RillPayRail = "mpp" | "x402" | "rill";

/** Legacy alias still accepted on input for one release. */
export type RillPayRailInput = RillPayRail | "stripe_mpp";

export function normalizePayRail(rail: RillPayRailInput): RillPayRail {
  return rail === "stripe_mpp" ? "mpp" : rail;
}

export function normalizePayRails(
  rails: readonly RillPayRailInput[] | undefined,
): RillPayRail[] {
  if (!rails?.length) return ["rill"];
  const out: RillPayRail[] = [];
  for (const r of rails) {
    const n = normalizePayRail(r);
    if (!out.includes(n)) out.push(n);
  }
  return out.length ? out : ["rill"];
}

/** Order rails for agent-facing JSON: open protocols first, ledger last. */
export function orderPublicRails(
  rails: Array<"mpp" | "x402" | "rill">,
): Array<"mpp" | "x402" | "rill"> {
  const rank = { mpp: 0, x402: 1, rill: 2 } as const;
  const uniq = [...new Set(rails)];
  return uniq.sort((a, b) => rank[a] - rank[b]);
}

export type RillPaymentTerms = {
  resource_id: string;
  amount: string;
  currency_code: string;
  path?: string;
  pay_url?: string;
  /** Open-world Spend: complete MPP/x402 402 on an arbitrary URL. */
  spend_pay_url?: string;
  gate_url?: string;
  pay_page_url?: string;
  receipt_header?: string;
  rails?: RillPayRail[];
  stripe_profile_id?: string | null;
  /** Background ledger rail still available when listed in rails. */
  ledger_rail?: "background" | "primary";
};

export function buildPaymentTerms(input: {
  resource_id: string;
  /** Public short code for URLs (falls back to resource_id). */
  short_id?: string;
  amount: string;
  currency_code: string;
  path?: string;
  api_base_url?: string;
  app_url?: string;
  rails?: RillPayRailInput[];
  stripe_profile_id?: string | null;
}): RillPaymentTerms {
  const api = (input.api_base_url ?? "").replace(/\/$/, "");
  const app = (input.app_url ?? "").replace(/\/$/, "");
  const rails = orderPublicRails(normalizePayRails(input.rails));
  const publicCode = (input.short_id ?? input.resource_id).trim();
  const openPrimary = rails.some((r) => r === "mpp" || r === "x402");
  return {
    resource_id: input.resource_id,
    amount: input.amount,
    currency_code: input.currency_code,
    path: input.path,
    pay_url: api ? `${api}/pay` : "/pay",
    spend_pay_url: api ? `${api}/spend/pay-url` : "/spend/pay-url",
    gate_url: api ? `${api}/r/${publicCode}` : `/r/${publicCode}`,
    pay_page_url: app ? `${app}/r/${publicCode}` : `/r/${publicCode}`,
    receipt_header: RECEIPT_HEADER,
    rails,
    stripe_profile_id: input.stripe_profile_id ?? null,
    ledger_rail: openPrimary ? "background" : "primary",
  };
}

/** Express/Nest-friendly 402 body. */
export function paymentRequiredBody(
  terms: RillPaymentTerms,
  message = "Payment required. Prefer MPP or x402 on the gate, or POST /spend/pay-url; legacy ledger: POST /pay then X-Rill-Receipt.",
) {
  return {
    ok: false,
    error: { code: "payment_required", message },
    payment_terms: terms,
  };
}
