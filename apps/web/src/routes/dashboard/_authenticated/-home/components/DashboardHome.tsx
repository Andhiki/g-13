import { useId, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { AlignBadge } from "@/ui/badge";
import { AlignButton } from "@/ui/button";
import { HalftoneIllustration } from "@/ui/halftone";
import { Typography } from "@/ui/typography";
import { useLocale } from "@/useLocale";
import { formatAbsoluteTime, formatRelativeTime } from "@/date-format";
import { AdminPageHeader } from "../../-components/AdminPageHeader";
import { pendingReasonLabels } from "../../lecturer-reviews/-shared/moderation";
import { AccountAvatar } from "../../users/-components/AccountAvatar";
import { dashboardHomeQuery } from "../client/queries";
import { WelcomeBanner } from "./WelcomeBanner";
import type { loadDashboardHome } from "../server/handler";

type DashboardHomeData = Awaited<ReturnType<typeof loadDashboardHome>>;
type PendingReview = DashboardHomeData["pendingReviews"]["rows"][number];
type AccessRequest = NonNullable<DashboardHomeData["accessRequests"]>["rows"][number];

const rowClass =
  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 p-4 outline-none transition-colors hover:bg-bg-weak-50 focus-visible:bg-bg-weak-50 focus-visible:outline-[1.5px] focus-visible:-outline-offset-[1.5px] focus-visible:outline-stroke-strong-950/35 sm:grid-cols-[minmax(0,1fr)_minmax(0,15rem)_6rem]";

function QueueSection({
  title,
  total,
  link,
  empty,
  children,
}: {
  title: string;
  total: number;
  link: ReactNode;
  empty: { illustration: ReactNode; title: string; description: string };
  children: ReactNode;
}) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="space-y-2.5">
      <div className="flex h-7 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Typography as="h2" id={headingId} variant="label" color="strong">
            {title}
          </Typography>
          {total > 0 && (
            <AlignBadge.Root variant="lighter" size="medium">
              {total}
            </AlignBadge.Root>
          )}
        </div>
        <AlignButton.Root asChild size="xxsmall" variant="neutral" mode="ghost" compact>
          {link}
        </AlignButton.Root>
      </div>
      <div className="overflow-hidden rounded-xl border border-stroke-soft-200 bg-bg-white-0">
        {total === 0 ? (
          <div className="flex flex-col items-center px-4 py-10 text-center">
            {empty.illustration}
            <Typography as="h3" variant="label" color="strong" className="mt-4">
              {empty.title}
            </Typography>
            <Typography variant="caption" color="muted" wrap="pretty" className="mt-1">
              {empty.description}
            </Typography>
          </div>
        ) : (
          <ul className="divide-y divide-stroke-soft-200">{children}</ul>
        )}
      </div>
    </section>
  );
}

function QueueTime({ date }: { date: Date }) {
  const { language } = useLocale("notifications");
  const ms = date.getTime();
  return (
    <Typography
      as="time"
      variant="caption"
      color="muted"
      className="text-right tabular-nums"
      dateTime={date.toISOString()}
      title={formatAbsoluteTime(ms, language)}
    >
      {formatRelativeTime(ms, language)}
    </Typography>
  );
}

function PendingReviewRow({ review }: { review: PendingReview }) {
  const reasons = pendingReasonLabels(review.pendingReasons).join(", ");
  return (
    <li>
      <Link to="/dashboard/lecturer-reviews" search={{ review: review.id }} className={rowClass}>
        <span className="flex min-w-0 items-baseline gap-2">
          <Typography as="span" variant="labelSmall" color="strong" className="truncate">
            {review.lecturerName}
          </Typography>
          <Typography as="span" variant="code" color="muted" className="shrink-0">
            {review.courseCode}
          </Typography>
        </span>
        <Typography
          as="span"
          variant="caption"
          color="muted"
          className="col-span-2 row-start-2 truncate sm:col-span-1 sm:row-start-auto"
          title={reasons || undefined}
        >
          {reasons}
        </Typography>
        <QueueTime date={review.createdAt} />
      </Link>
    </li>
  );
}

function AccessRequestRow({ user }: { user: AccessRequest }) {
  return (
    <li>
      <Link to="/dashboard/users" className={rowClass}>
        <span className="flex min-w-0 items-center gap-2.5">
          <AccountAvatar name={user.name} image={user.image} />
          <span className="flex min-w-0 flex-col">
            <Typography as="span" variant="labelSmall" color="strong" className="truncate">
              {user.name}
            </Typography>
            <Typography as="span" variant="caption" color="muted" className="truncate sm:hidden">
              {user.email}
            </Typography>
          </span>
        </span>
        <Typography
          as="span"
          variant="caption"
          color="muted"
          className="hidden truncate sm:block"
          title={user.email}
        >
          {user.email}
        </Typography>
        <QueueTime date={user.createdAt} />
      </Link>
    </li>
  );
}

export function DashboardHome({ initialData }: { initialData: DashboardHomeData }) {
  const { data = initialData } = useQuery(dashboardHomeQuery());
  const { pendingReviews, accessRequests, identity } = data;
  return (
    <>
      <AdminPageHeader title="Home" />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-8 px-4 py-6 sm:px-6 sm:py-10">
          <WelcomeBanner
            name={identity.name}
            pendingReviews={pendingReviews.total}
            accessRequests={accessRequests?.total ?? 0}
          />
          <QueueSection
            title="Pending reviews"
            total={pendingReviews.total}
            link={<Link to="/dashboard/lecturer-reviews">All reviews</Link>}
            empty={{
              illustration: <HalftoneIllustration items={[{ glyph: "review" }]} done />,
              title: "No reviews waiting",
              description: "Reviews held for moderation show up here.",
            }}
          >
            {pendingReviews.rows.map((review) => (
              <PendingReviewRow key={review.id} review={review} />
            ))}
          </QueueSection>
          {accessRequests && (
            <QueueSection
              title="Access requests"
              total={accessRequests.total}
              link={<Link to="/dashboard/users">User access</Link>}
              empty={{
                illustration: <HalftoneIllustration items={[{ glyph: "person" }]} done />,
                title: "No access requests",
                description: "People who sign in and wait for a role show up here.",
              }}
            >
              {accessRequests.rows.map((user) => (
                <AccessRequestRow key={user.id} user={user} />
              ))}
            </QueueSection>
          )}
        </div>
      </div>
    </>
  );
}
