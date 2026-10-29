# @g13/i18n

Shared Indonesian (`id`) and English (`en`) resources and language helpers. This
package has no React or browser dependency. UI bindings live in `apps/web`.

Navigation is bundled in `i18nOptions`. Load `common` and the current feature's
namespace with `@g13/i18n/messages`; other pages and the other language remain
separate chunks. Add corresponding keys and interpolation placeholders to both
locale files. Phrase keys use `keySeparator: false`.

An API can create an instance for each request:

```ts
import { createInstance } from "i18next";
import { i18nOptions, resources, resolveLanguage } from "@g13/i18n";
import { loadMessages } from "@g13/i18n/messages";

const language = resolveLanguage(cookieLanguage, acceptLanguage);
const instance = createInstance();
await instance.init({
  ...i18nOptions,
  lng: language,
  resources: {
    [language]: {
      ...resources[language],
      common: await loadMessages(language, "common"),
    },
  },
});
const message = instance.t("navigation.examArchive");
```

The web app resolves language from a cookie, then weighted `Accept-Language`
preferences, with Indonesian as fallback. The initial language and loaded messages
are included in route data for hydration. Switching language loads the target
dictionaries before updating the cookie
and route data. A failed download leaves the current language and page intact,
with a reload action. When cookies are unavailable, the router retains the
selection in the current tab until reload. Course display names use
`englishTitle` in English and
`title` in Indonesian; source records and identifiers retain their original text.
Syllabus quotations and original archive filenames remain as published.

Browser regressions: build the app, start `bun run --cwd apps/web preview --host 127.0.0.1 --port 4173`, then run `bun run --cwd apps/web test:i18n-browser`. Set `I18N_TEST_URL` when
using a different address.
