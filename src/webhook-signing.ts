import { createHmac, timingSafeEqual } from "node:crypto";

export const RILL_WEBHOOK_ID_HEADER = "X-Rill-Webhook-Id";
export const RILL_WEBHOOK_TIMESTAMP_HEADER = "X-Rill-Timestamp";
export const RILL_WEBHOOK_SIGNATURE_HEADER = "X-Rill-Signature";

/** Default replay window for webhook signature verification (5 minutes). */
export const RILL_WEBHOOK_TOLERANCE_SECONDS = 300;

/**
 * HMAC-SHA256 of `{eventId}.{timestamp}.{rawBody}`, returned as `v1,<hex>`.
 * `rawBody` must be the exact request bytes, not re-serialized JSON.
 */
export function signWebhookPayload(
  secret: string,
  eventId: string,
  timestamp: string,
  rawBody: string,
): string {
  const digest = createHmac("sha256", secret)
    .update(`${eventId}.${timestamp}.${rawBody}`)
    .digest("hex");
  return `v1,${digest}`;
}

export function verifyWebhookSignature(
  secret: string,
  eventId: string,
  timestamp: string,
  rawBody: string,
  signature: string,
  nowSeconds: number = Math.floor(Date.now() / 1000),
  toleranceSeconds: number = RILL_WEBHOOK_TOLERANCE_SECONDS,
): boolean {
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  if (Math.abs(nowSeconds - ts) > toleranceSeconds) return false;

  const expected = Buffer.from(
    signWebhookPayload(secret, eventId, timestamp, rawBody),
  );
  const presented = Buffer.from(signature);
  return (
    expected.length === presented.length && timingSafeEqual(expected, presented)
  );
}
