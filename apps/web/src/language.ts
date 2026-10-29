import { createIsomorphicFn } from "@tanstack/react-start";
import { appendResponseHeader, getCookie, getRequestHeader } from "@tanstack/react-start/server";
import { resolveLanguage } from "@g13/i18n";

export const readLanguage = createIsomorphicFn()
  .server(() => {
    appendResponseHeader("Vary", "Cookie, Accept-Language");
    return resolveLanguage(getCookie("g13-language"), getRequestHeader("accept-language"));
  })
  .client(() => {
    const cookie = document.cookie
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith("g13-language="))
      ?.slice("g13-language=".length);
    return resolveLanguage(cookie, navigator.languages.join(","));
  });
