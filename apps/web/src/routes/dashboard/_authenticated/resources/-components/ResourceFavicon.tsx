import { useEffect, useState } from "react";
import { RiLinkM } from "@remixicon/react";

export function resourceHost(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function faviconUrl(url: string): string {
  return `https://${resourceHost(url)}/favicon.ico`;
}

/** The site's own favicon with a neutral fallback, so a missing icon never leaves a broken image. */
export function ResourceFavicon({
  url,
  className = "size-4",
}: {
  url: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [url]);

  if (failed) {
    return <RiLinkM aria-hidden="true" className={`${className} shrink-0 text-text-sub-600`} />;
  }

  return (
    <img
      src={faviconUrl(url)}
      alt=""
      width={16}
      height={16}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      className={`${className} shrink-0 rounded-sm object-contain`}
      onError={() => setFailed(true)}
    />
  );
}
