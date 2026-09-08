# @userill/accept

Paywall helpers and receipt verification for Rill Accept.

The hosted gate at `/r/{id}` needs no SDK. Use this kit when you want to protect a route in your own app and verify `X-Rill-Receipt` against `POST /access/verify`. Prefer a `payment.succeeded` webhook for fulfillment. Verify deliveries with `verifyWebhookSignature` (HMAC-SHA256 of `{X-Rill-Webhook-Id}.{X-Rill-Timestamp}.{raw body}`, header `X-Rill-Signature: v1,<hex>`, 300s window). Do not re-serialize the JSON before verify.

Docs: [userill.com/docs/accept](https://userill.com/docs/accept)

## Install

```bash
npm i @userill/accept
```

## Usage

```ts
import express from "express";
import { rillPaywallExpress, createVerifyReceipt } from "@userill/accept";

const app = express();
const verifyReceipt = createVerifyReceipt("https://api.userill.com");

app.get(
  "/echo",
  rillPaywallExpress({
    resource_id: "res_your_sku",
    amount: "0.10",
    currency_code: "USD",
    path: "/echo",
    api_base_url: "https://api.userill.com",
    verifyReceipt,
  }),
  (_req, res) => {
    res.json({ ok: true, echo: "paid" });
  },
);
```

Unpaid requests get `402` with `payment_terms` (`gate_url`, `spend_pay_url`, `receipt_header`). A valid receipt unlocks the handler.

```ts
import {
  verifyWebhookSignature,
  RILL_WEBHOOK_ID_HEADER,
  RILL_WEBHOOK_TIMESTAMP_HEADER,
  RILL_WEBHOOK_SIGNATURE_HEADER,
} from "@userill/accept";

app.post("/webhooks", express.raw({ type: "application/json" }), (req, res) => {
  const rawBody = req.body.toString("utf8");
  const ok = verifyWebhookSignature(
    process.env.RILL_WEBHOOK_SECRET ?? "",
    String(req.header(RILL_WEBHOOK_ID_HEADER) ?? ""),
    String(req.header(RILL_WEBHOOK_TIMESTAMP_HEADER) ?? ""),
    rawBody,
    String(req.header(RILL_WEBHOOK_SIGNATURE_HEADER) ?? ""),
  );
  if (!ok) {
    res.status(401).json({ ok: false });
    return;
  }
  res.json({ ok: true });
});
```

Example app: [rillongit/accept-echo](https://github.com/rillongit/accept-echo)

## Publish

Scope is `@userill` (not `@rill`). First publish is manual with `--otp`. After that, set Trusted Publisher on the npm package to GitHub `rillongit/accept` workflow `publish.yml`. Then bump the patch in `package.json` and push `main`.

```bash
pnpm test:unit && pnpm publish --access public --otp=XXXXXX
```

## License

MIT
