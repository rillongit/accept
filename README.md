# @rill/accept

Paywall helpers and receipt verification for Rill Accept.

The hosted gate at `/r/{id}` needs no SDK. Use this kit when you want to protect a route in your own app and verify `X-Rill-Receipt` against `POST /access/verify`. Prefer a `payment.succeeded` webhook for fulfillment.

Docs: [userill.com/docs/accept](https://userill.com/docs/accept)

## Install

```bash
npm i @rill/accept
```

## Usage

```ts
import express from "express";
import { rillPaywallExpress, createVerifyReceipt } from "@rill/accept";

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

Example app: [rillongit/accept-echo](https://github.com/rillongit/accept-echo)

## Publish

```bash
pnpm test:unit && pnpm publish --access public
```

## License

MIT
