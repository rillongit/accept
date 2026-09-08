import { describe, expect, it } from "vitest";
import {
  signWebhookPayload,
  verifyWebhookSignature,
} from "./webhook-signing.js";

describe("webhook signing", () => {
  it("signs event id, timestamp, and raw body", () => {
    const signature = signWebhookPayload(
      "whsec_test",
      "evt_1",
      "1700000000",
      '{"ok":true}',
    );
    expect(signature.startsWith("v1,")).toBe(true);
    expect(
      verifyWebhookSignature(
        "whsec_test",
        "evt_1",
        "1700000000",
        '{"ok":true}',
        signature,
        1700000000,
      ),
    ).toBe(true);
  });

  it("rejects expired timestamps", () => {
    const signature = signWebhookPayload(
      "whsec_test",
      "evt_1",
      "1700000000",
      "{}",
    );
    expect(
      verifyWebhookSignature(
        "whsec_test",
        "evt_1",
        "1700000000",
        "{}",
        signature,
        1700000000 + 301,
      ),
    ).toBe(false);
  });

  it("rejects tampered bodies", () => {
    const signature = signWebhookPayload(
      "whsec_test",
      "evt_1",
      "1700000000",
      '{"a":1}',
    );
    expect(
      verifyWebhookSignature(
        "whsec_test",
        "evt_1",
        "1700000000",
        '{"a":2}',
        signature,
        1700000000,
      ),
    ).toBe(false);
  });
});
