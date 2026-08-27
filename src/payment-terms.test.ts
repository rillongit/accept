import { describe, expect, it } from "vitest";
import { enforceRillPaywall } from "./middleware.js";
import { buildPaymentTerms, paymentRequiredBody } from "./payment-terms.js";

const hostedApi = "https://api.userill.com";

describe("402 payment_terms contract", () => {
  it("freezes the hosted-gate JSON shape", async () => {
    const result = await enforceRillPaywall(
      {},
      {
        resource_id: "res_echo",
        amount: "0.10",
        currency_code: "USD",
        path: "/echo",
        api_base_url: hostedApi,
        verifyReceipt: async () => false,
      },
    );

    expect(result).not.toBeNull();
    expect(result?.status).toBe(402);
    expect(result?.body).toEqual(
      paymentRequiredBody(
        buildPaymentTerms({
          resource_id: "res_echo",
          amount: "0.10",
          currency_code: "USD",
          path: "/echo",
          api_base_url: hostedApi,
        }),
      ),
    );
    expect(result?.body.payment_terms).toMatchObject({
      resource_id: "res_echo",
      amount: "0.10",
      currency_code: "USD",
      path: "/echo",
      gate_url: `${hostedApi}/r/res_echo`,
      spend_pay_url: `${hostedApi}/spend/pay-url`,
      pay_url: `${hostedApi}/pay`,
      receipt_header: "X-Rill-Receipt",
      rails: ["rill"],
    });
  });

  it("orders open rails first when the seller lists them", () => {
    const terms = buildPaymentTerms({
      resource_id: "res_echo",
      short_id: "echo",
      amount: "0.10",
      currency_code: "USD",
      api_base_url: hostedApi,
      rails: ["rill", "x402", "mpp"],
    });

    expect(terms.gate_url).toBe(`${hostedApi}/r/echo`);
    expect(terms.spend_pay_url).toBe(`${hostedApi}/spend/pay-url`);
    expect(terms.receipt_header).toBe("X-Rill-Receipt");
    expect(terms.rails).toEqual(["mpp", "x402", "rill"]);
    expect(terms.ledger_rail).toBe("background");
  });
});
