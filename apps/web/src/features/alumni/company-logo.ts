const companyLogos: [RegExp, string][] = [
  [/\bshopee\b/i, "shopee.svg"],
  [/\bbukalapak\b/i, "bukalapak.svg"],
  [/^gojek$/i, "gojek.svg"],
  [/^grab$/i, "grab.svg"],
  [/\bsamsung\b/i, "samsung.svg"],
];

export function companyLogo(employer: string): string | undefined {
  const match = companyLogos.find(([pattern]) => pattern.test(employer.trim()));
  return match && `/company-logos/${match[1]}`;
}
