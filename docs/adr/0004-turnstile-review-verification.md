# Verify lecturer reviews with Cloudflare Turnstile

Anonymous review submissions are gated by Cloudflare Turnstile (invisible widget) in
addition to the existing per-IP hourly rate limit. The check is fail-closed: when
`TURNSTILE_SECRET_KEY` is empty, invalid, or Siteverify is unreachable, the submission
is rejected. The secret is server-only and verification runs in the worker that serves
the app; the site key is delivered to the browser through a server function so the
client bundle stays free of configuration. This adds a Cloudflare dependency and a
hostname requirement (every public domain must be listed on the widget), traded for
spam protection that does not depend on the rate limit alone. See
[docs/lecturer-reviews.md](../lecturer-reviews.md) for configuration and operation.
