export function reviewRateLimitIp(ip: string): string {
  if (!ip.includes(":") || !/^[0-9a-f:.]+$/i.test(ip)) return ip;

  const address = URL.parse(`http://[${ip}]/`);
  if (!address) return ip;

  const [leading, trailing] = address.hostname.slice(1, -1).split("::");
  const head = leading ? leading.split(":") : [];
  const tail = trailing ? trailing.split(":") : [];
  const segments =
    trailing === undefined
      ? head
      : [...head, ...Array(8 - head.length - tail.length).fill("0"), ...tail];

  // Mapped addresses share the existing IPv4 bucket.
  if (segments.slice(0, 6).join(":") === "0:0:0:0:0:ffff") {
    const high = Number.parseInt(segments[6]!, 16);
    const low = Number.parseInt(segments[7]!, 16);
    return [high >> 8, high & 255, low >> 8, low & 255].join(".");
  }

  return `${segments.slice(0, 4).join(":")}::/64`;
}
