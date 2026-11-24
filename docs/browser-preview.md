# Local browser preview fallback

When Playwright's cached Chromium cannot start because Linux shared libraries such as `libatk-1.0.so.0` are missing, use the libraries bundled with the local JetBrains RemoteDev/WebStorm runtime.

1. Locate the active `selfcontained/lib` directory under `/home/molly/.cache/JetBrains/RemoteDev/dist/`. Verify with `ldd` that Chromium has no unresolved libraries when that directory is supplied through `LD_LIBRARY_PATH`.
2. Scope both overrides to the browser command:

```bash
LD_PRELOAD=/usr/lib/libstdc++.so.6 \
LD_LIBRARY_PATH=/home/molly/.cache/JetBrains/RemoteDev/dist/<active-runtime>/plugins/remote-dev-server/selfcontained/lib \
node <playwright-script>.mjs
```

`LD_PRELOAD` prevents the JetBrains runtime's older `libstdc++.so.6` from breaking the system Node binary. Keep these overrides out of project configuration. Remove temporary preview files after verification.
