import { z } from "zod";
import type { ReviewPendingReason } from "@g13/db/schema/lecturer-reviews";

const nonEmpty = z.string().trim().min(1);
const requiredId = () => nonEmpty.max(100);

export const moderateReviewSchema = z.object({
  reviewId: requiredId(),
  action: z.enum(["approve", "hide", "restore", "delete"]),
});

export type ModerateReviewInput = z.infer<typeof moderateReviewSchema>;

const pendingReasonText = {
  "low-rating": "A rating of 2 or lower",
  "contact-details": "Contact details or a link",
  moderation: "Flagged by text moderation",
  profanity: "Profanity",
  unscorable: "Moderation could not score the text",
} satisfies Record<ReviewPendingReason, string>;

/** Why a pending review was held. Empty for reviews submitted before reasons were stored. */
export function pendingReasonLabels(reasons: readonly ReviewPendingReason[] | null): string[] {
  return (reasons ?? []).map((reason) => pendingReasonText[reason]);
}
