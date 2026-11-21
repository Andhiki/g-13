import { useState } from "react";
import { RiGithubFill } from "@remixicon/react";
import { canModerate } from "@g13/auth";
import { AlignButton } from "@/ui/button";
import { Typography } from "@/ui/typography";
import { authClient } from "@/routes/-auth/client/auth";
import type { loadAdminIdentity } from "@/routes/-auth/server/identity";

type Identity = Awaited<ReturnType<typeof loadAdminIdentity>>;

export function LoginPage({ identity }: { identity: Identity }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  if (canModerate(identity?.role)) return null;

  if (identity) {
    return (
      <main className="flex min-h-dvh w-full items-center justify-center bg-bg-white-0 px-4 py-12">
        <div className="max-w-sm space-y-1.5 text-center">
          <Typography variant="paragraph" color="strong">
            Your account is awaiting approval.
          </Typography>
          <Typography variant="caption" color="muted">
            Contact maintainers or admin to help get your account approved.
          </Typography>
        </div>
      </main>
    );
  }

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
    <main className="flex min-h-dvh w-full items-center justify-center bg-bg-white-0 px-4 py-12">
      <div className="w-full max-w-[380px] overflow-hidden rounded-2xl border border-stroke-soft-200 bg-bg-white-0 shadow-regular-sm">
        <div className="border-b border-stroke-soft-200 px-6 py-4 text-center">
          <Typography as="h1" variant="label" color="strong">
            Sign in
          </Typography>
        </div>
        <div className="space-y-3 p-6">
          <AlignButton.Root
            size="medium"
            variant="neutral"
            mode="lighter"
            className="w-full gap-2 text-text-strong-950"
            isLoading={pending}
            icon={<RiGithubFill className="size-4.5" />}
            onClick={() => void signIn()}
          >
            Sign in with GitHub
          </AlignButton.Root>
          {error && (
            <Typography role="alert" variant="caption" color="danger" className="block text-center">
              Sign-in failed. Please try again.
            </Typography>
          )}
        </div>
      </div>
    </main>
  );
}
