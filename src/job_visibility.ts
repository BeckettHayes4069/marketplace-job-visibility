import { infrai } from "./infrai";

export type MarketplaceJob = { sellerId: string; assetId: string; buyerId: string; updateId: string; orderId: string; attempt: number };

export function shouldAlert(job: MarketplaceJob, error: unknown): boolean {
  return job.attempt >= 2 && Boolean(error);
}

export async function reportJobFailure(job: MarketplaceJob, error: unknown): Promise<boolean> {
  if (!shouldAlert(job, error)) return false;
  await infrai.errors.capture({
    title: "Marketplace order handoff failed",
    message: error instanceof Error ? error.message : String(error),
    level: "error",
    fingerprint: ["order-handoff", job.orderId],
    exception: String(error),
    context: { sellerId: job.sellerId, assetId: job.assetId, buyerId: job.buyerId, updateId: job.updateId, orderId: job.orderId, attempt: job.attempt },
  });
  return true;
}

if (process.argv[1]?.endsWith("job_visibility.ts")) {
  const job = { sellerId: "seller-17", assetId: "sku-81", buyerId: "buyer-42", updateId: "update-301", orderId: "order-9001", attempt: 2 };
  reportJobFailure(job, new Error("inventory handoff returned no confirmation"))
    .then(alerted => console.log(alerted ? "failure captured" : "retry recorded"))
    .catch(error => { console.error(error.message); process.exitCode = 1; });
}
