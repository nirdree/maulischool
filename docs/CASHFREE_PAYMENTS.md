# Cashfree Fee Payments

## Configuration

Copy the Cashfree settings from `.env.example` into the ignored local `.env` file. Keep `CASHFREE_ENV=sandbox` for testing. Set the sandbox App ID and Secret Key from the Cashfree test dashboard; do not commit credentials. `CASHFREE_API_VERSION` defaults to `2026-01-01`. `NEXT_PUBLIC_APP_URL` must be the application origin. `CASHFREE_RETURN_URL` is optional; when set, it must be an absolute URL containing Cashfree's `{order_id}` placeholder. Otherwise the app returns to `/parent/fees?payment=return&order_id={order_id}` on `NEXT_PUBLIC_APP_URL`.

The signature check uses `CASHFREE_SECRET_KEY` as required by Cashfree's current webhook signature instructions. No separate webhook secret is required by this implementation.

Cashfree order IDs are unique in the database. On first startup after deploying the model updates, allow Mongoose to create the model indexes. If automatic index creation is disabled in the production MongoDB configuration, create the sparse unique indexes for `FeePayment.gatewayOrderId`, `CashfreePayment.orderId`, and `CashfreePayment.activeFeeKey` before accepting payments. Existing FeePayment documents do not need a data migration because the new gateway field is sparse.

## Local Sandbox Test

1. Configure the sandbox App ID and Secret Key, local MongoDB URI, `CASHFREE_ENV=sandbox`, and `NEXT_PUBLIC_APP_URL`.
2. Ensure the selected student's parent account has a usable guardian phone number and an outstanding Fee record for the current academic year.
3. Start the app with `npm run dev`. Use a public HTTPS tunnel for the webhook URL, for example `https://<tunnel-host>/api/payments/cashfree/webhook`.
4. In Cashfree's sandbox merchant dashboard, create a webhook subscribed to payment success, failure, and refund events and point it to the tunnel URL. Set the webhook API version to `2026-01-01`.
5. Log in as the linked parent, open **Fees & Payments**, choose an outstanding installment, review the summary, and continue through Cashfree's sandbox checkout using its current test payment instruments.
6. Confirm success only appears after the return endpoint or webhook retrieves the order and its successful payment from Cashfree. Check the receipt in payment history and verify its PDF contents.
7. Repeat with a declined test payment, close/cancel checkout, refresh the return page, resend a webhook, and try to pay an unrelated student's fee. Confirm failures remain unpaid, duplicate attempts do not post multiple receipts, and the unrelated request is rejected.

There is no automated test framework configured in this repository; sandbox transactions and real webhook delivery require Cashfree dashboard credentials and a reachable HTTPS endpoint.

## Production Deployment

Whitelist the production site domain in Cashfree. Configure production App ID and Secret Key only in the deployment platform's encrypted environment settings, set `CASHFREE_ENV=production`, and set `NEXT_PUBLIC_APP_URL` to the canonical HTTPS origin. Register `https://<production-domain>/api/payments/cashfree/webhook` in the live Cashfree dashboard with the supported payment events and the same webhook API version. Verify webhook delivery and signature checks before enabling parent payments. Never reuse sandbox credentials in production.

## Routes

- `POST /api/payments/cashfree/orders`: parent-only; calculates the outstanding amount from FeePayment records and creates a Cashfree order.
- `GET /api/payments/cashfree/verify?order_id=...`: owner-checked server-side verification after redirect.
- `POST /api/payments/cashfree/webhook`: raw-body signature verification and idempotent confirmation.
- `GET /api/payments/cashfree/mine`: parent's own online payment attempts.
- `GET /api/payments/cashfree/admin`: admin/principal transaction list and filters.
- `GET /api/payments/cashfree/:id/receipt`: PDF receipt for a verified payment, restricted to its parent or admin/principal.
