import { expect, test } from "bun:test";
import { companyLogo } from "./company-logo";

test("matches known company names without assigning unrelated logos", () => {
  expect(companyLogo("PT. Bukalapak.com Tbk")).toBe("/company-logos/bukalapak.svg");
  expect(companyLogo("Samsung Research Indonesia")).toBe("/company-logos/samsung.svg");
  expect(companyLogo("PT. Bank Mandiri (Persero) Tbk")).toBeUndefined();
  expect(companyLogo("Shopee")).toBe("/company-logos/shopee.svg");
  expect(companyLogo("PT GOTO GOJEK TOKOPEDIA TBK")).toBeUndefined();
  expect(companyLogo("Sinar Perdana Motor")).toBeUndefined();
  expect(companyLogo("")).toBeUndefined();
});
