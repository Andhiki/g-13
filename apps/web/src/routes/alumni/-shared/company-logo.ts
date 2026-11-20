// Match specific subsidiaries before their parent companies.
const companyLogos: [RegExp, string][] = [
  [/\bbni\s+life\b/i, "bni-life.svg"],
  [/\bshopee\b/i, "shopee.svg"],
  [/\bbukalapak\b/i, "bukalapak.svg"],
  [/^gojek$/i, "gojek.svg"],
  [/^grab$/i, "grab.svg"],
  [/\bsamsung\b/i, "samsung.svg"],
  [/bytedance/i, "bytedance.svg"],
  [/\bgoto\s+gojek\s+tokopedia\b/i, "goto.svg"],
  [/tiket\.com|global tiket network/i, "tiket.svg"],
  [/amazon web services/i, "aws.svg"],
  [/rakuten/i, "rakuten.svg"],
  [/mitsubishi/i, "mitsubishi.svg"],
  [/bank rakyat indonesia|\bbri\b(?!\s+asuransi)/i, "bri.svg"],
  [/bank negara indonesia|\bbni\b/i, "bni.svg"],
  [/\bbca\b/i, "bca.svg"],
  [/cimb/i, "cimb-niaga.svg"],
  [/bank syariah indonesia|\bbsi\b/i, "bsi.svg"],
  [/\bmufg\b/i, "mufg.svg"],
  [/bank mandiri/i, "mandiri.svg"],
  [/\bdanamon\b/i, "danamon.svg"],
  [/\bbank\s+smbc\s+indonesia\b/i, "smbc.svg"],
  [/pertamina/i, "pertamina.svg"],
  [/telkomsel|telekomunikasi selular/i, "telkomsel.svg"],
  [/indosat/i, "indosat.svg"],
];

export function companyLogo(employer: string): string | undefined {
  const match = companyLogos.find(([pattern]) => pattern.test(employer.trim()));
  return match && `/company-logos/${match[1]}`;
}
