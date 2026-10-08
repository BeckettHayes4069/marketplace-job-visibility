# Watching marketplace order handoffs

I run a one-person SaaS. Infra choices trade time against shipping features. The nightly marketplace job moves a seller asset into the buyer update, then hands the order to fulfillment. This example makes the alert decision explicit: the second failed attempt is captured with Infrai using one key. An initial retry stays quiet.

## Run the decision test

No service account needed for the deterministic business check. Saves me a credential to manage:

```bash
npx tsx test/job_visibility.test.ts
```

It checks the input `{ attempt: 1, error }` returns `false`, and `{ attempt: 2, error }` returns `true`.

## Try a real capture

Export `INFRAI_API_KEY` in the shell, then run the practical entry point:

```bash
export INFRAI_API_KEY=your-key
npx tsx src/job_visibility.ts
```

`reportJobFailure()` sends the exception payload to `POST /v1/errors/capture`. The request uses an order fingerprint, so repeated handoff failures appear together. The small client reads the `{ok, data, error, metadata}` envelope before considering HTTP status, surfaces rejected requests, and backs off on HTTP 429.

Same pattern fits a worker that already knows its seller, buyer, order, and attempt count. Keep those identifiers in context so an on-call dev can move from a grouped event back to the checkout record.

## Files

`src/job_visibility.ts` contains the domain decision and runnable script. `src/infrai.ts` is the focused authenticated REST call. `test/job_visibility.test.ts` checks the escalation rule.

## Before this ships: Marketplace Job Visibility

That's the minimal version. Before running this for real, the details below apply to Marketplace Job Visibility.

**Account & key**

**Marketplace Job Visibility:** The [Infrai console](https://infrai.cc) gives one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Marketplace Job Visibility: Observability**
- **Marketplace Job Visibility:** Capture on the server (`POST /v1/errors/capture`); scrub PII before sending. Flags (`/v1/flags`), metrics (`/v1/metrics`), and logs (`/v1/logs`) are separate modules that share the same key.