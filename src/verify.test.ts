import { afterEach, describe, expect, it, vi } from "vitest";
import { createVerifyReceipt, verifyReceipt } from "./verify.js";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("createVerifyReceipt", () => {
  it("returns true when API reports valid", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ valid: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    const verify = createVerifyReceipt("https://api.example.com/");
    await expect(verify("rcpt_1", "res_1")).resolves.toBe(true);

    expect(fetch).toHaveBeenCalledWith(
      "https://api.example.com/access/verify",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          receipt_id: "rcpt_1",
          resource_id: "res_1",
        }),
      }),
    );
  });

  it("returns false on non-OK response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("nope", { status: 404 })),
    );

    const verify = createVerifyReceipt("https://api.example.com");
    await expect(verify("rcpt_1", "res_1")).resolves.toBe(false);
  });

  it("returns false when fetch throws", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network");
      }),
    );

    await expect(
      verifyReceipt({
        apiBaseUrl: "https://api.example.com",
        receiptId: "rcpt_1",
        resourceId: "res_1",
      }),
    ).resolves.toBe(false);
  });
});
