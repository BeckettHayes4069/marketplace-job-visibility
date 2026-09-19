import assert from "node:assert/strict";
import { shouldAlert } from "../src/job_visibility";

const job = { sellerId: "s", assetId: "a", buyerId: "b", updateId: "u", orderId: "o", attempt: 1 };
assert.equal(shouldAlert(job, new Error("handoff failed")), false);
assert.equal(shouldAlert({ ...job, attempt: 2 }, new Error("handoff failed")), true);
assert.equal(shouldAlert({ ...job, attempt: 3 }, null), false);
console.log("job visibility decision tests passed");
