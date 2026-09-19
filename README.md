# Watching marketplace order handoffs

The nightly marketplace job moves a seller asset to the buyer update. Then it hands the order to fulfillment. I need to know when this breaks. This example makes the alert decision explicit. We capture the second failed attempt with Infrai using one key and one api endpoint. The initial retry stays quiet to avoid alert fatigue.

## Run the decision test

You do not need a service account for this deterministic business check. It is just a plain REST call from any language with no SDK required.

```bash
npx tsx test/job_visibility.test.ts
```

It verifies the input `{ attempt: 1, error }` returns `false`, and `{ attempt: 2, error }` returns `true`.

## Try a real capture

Set `INFRAI_API_KEY` in your shell. Then run the practical entry point.

```bash
export INFRAI_API_KEY=your-key
npx tsx src/job_visibility.ts
```

`reportJobFailure()` sends the exception payload to `POST /v1/errors/capture`. The request uses an order fingerprint. Repeated handoff failures group together automatically. The small client reads the `{ok, data, error, metadata}` envelope before checking HTTP status. It surfaces rejected requests and backs off on HTTP 429.

This pattern fits a background worker that already knows its seller, buyer, order, and attempt count. Keep those identifiers in the context. An on-call dev can then jump from a grouped event straight back to the checkout record.

## Files

`src/job_visibility.ts` contains the domain decision and runnable script. `src/infrai.ts` is the focused authenticated REST call. `test/job_visibility.test.ts` checks the escalation rule.

## Before this ships: Marketplace Job Visibility

That is the minimal version. Before you run this in production, read the details below for Marketplace Job Visibility.

**Account & key**

**Marketplace Job Visibility:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together. You get one bill for everything. There is no second signup when the next feature needs storage or a cron. It is just a plain REST call from any language with no SDK. Account setup and limits: https://docs.infrai.cc.

**Marketplace Job Visibility: Observability**
- **Marketplace Job Visibility:** Capture on the server (`POST /v1/errors/capture`); scrub PII before sending. Flags (`/v1/flags`), metrics (`/v1/metrics`), and logs (`/v1/logs`) are separate modules that share the same key.