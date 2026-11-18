import { useState } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { RiGithubFill } from "@remixicon/react";
import { canModerate } from "@g13/auth";
import { AlignFancyButton } from "@/ui/fancy-button";
import { AlignButton } from "@/ui/button";
import { Typography } from "@/ui/typography";
import { authClient } from "@/routes/-auth/client/auth";
import type { loadAdminIdentity } from "@/routes/-auth/server/identity";

type Identity = Awaited<ReturnType<typeof loadAdminIdentity>>;

export function LoginPage({ identity }: { identity: Identity }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const router = useRouter();
  const approved = canModerate(identity?.role);

  async function signIn() {
    setPending(true);
    setError(false);
    try {
      const result = await authClient.signIn.social({
        provider: "github",
        callbackURL: "/dashboard/lecturer-reviews",
      });
      if (result.error) {
        setError(true);
        setPending(false);
      }
    } catch {
      setError(true);
      setPending(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-md px-5 py-12 sm:py-20">
      <Typography as="h1" variant="subtitle1">
        Admin access
      </Typography>
      <Typography className="mt-2 text-text-sub-600">
        {identity && !approved
          ? "Your account is awaiting administrator approval. GitHub sign-in alone does not grant access."
          : "Sign in with GitHub to moderate lecturer reviews. Access requires administrator approval."}
      </Typography>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {approved ? (
          <AlignFancyButton.Root asChild className="h-9 text-label-xs">
            <Link to="/dashboard/lecturer-reviews">Open admin</Link>
          </AlignFancyButton.Root>
        ) : (
          !identity && (
            <AlignFancyButton.Root
              className="h-9 text-label-xs"
              disabled={pending}
              onClick={() => void signIn()}
            >
              <RiGithubFill className="size-4" />
              {pending ? "Redirecting…" : "Continue with GitHub"}
            </AlignFancyButton.Root>
          )
        )}
        {identity && (
          <AlignButton.Root
            size="small"
            variant="neutral"
            mode="stroke"
            onClick={async () => {
              const result = await authClient.signOut();
              if (result.error) {
                setError(true);
                return;
              }
              router.options.context.queryClient.clear();
              await router.invalidate();
            }}
          >
            Sign out
          </AlignButton.Root>
        )}
      </div>
      {error && (
        <Typography role="alert" className="mt-4 text-error-base">
          Sign-in failed. Please try again.
        </Typography>
      )}
      <Typography variant="caption" className="mt-6 text-text-sub-600">
        Public reviews never require an account.
      </Typography>
    </main>
  );
}
