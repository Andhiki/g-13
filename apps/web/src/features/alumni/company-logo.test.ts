import { expect, test } from "bun:test";
import { companyLogo } from "./company-logo";

test("matches known company names without assigning unrelated logos", () => {
  expect(companyLogo("PT. Bukalapak.com Tbk")).toBe("/company-logos/bukalapak.svg");
  expect(companyLogo("Grab")).toBe("/company-logos/grab.svg");
  expect(companyLogo("PT. Bank Mandiri (Persero) Tbk")).toBe("/company-logos/mandiri.svg");
  expect(companyLogo("Shopee")).toBe("/company-logos/shopee.svg");
  expect(companyLogo("PT GOTO GOJEK TOKOPEDIA TBK")).toBe("/company-logos/goto.svg");
  expect(companyLogo("Sinar Perdana Motor")).toBeUndefined();
  expect(companyLogo("")).toBeUndefined();
});

test("matches banks across the spellings used upstream", () => {
  expect(companyLogo("PT Bank Rakyat Indonesia")).toBe("/company-logos/bri.svg");
  expect(companyLogo("PT. Bank Rakyat Indonesia")).toBe("/company-logos/bri.svg");
  expect(companyLogo("BRI")).toBe("/company-logos/bri.svg");
  expect(companyLogo("Bank Negara Indonesia")).toBe("/company-logos/bni.svg");
  expect(companyLogo("PT.Bank Negara Indonesia")).toBe("/company-logos/bni.svg");
  expect(companyLogo("PT. BCA, Tbk")).toBe("/company-logos/bca.svg");
  expect(companyLogo("Bank CIMB Niaga")).toBe("/company-logos/cimb-niaga.svg");
  expect(companyLogo("PT. CIMB NIAGA")).toBe("/company-logos/cimb-niaga.svg");
  expect(companyLogo("PT Bank Syariah Indonesia")).toBe("/company-logos/bsi.svg");
  expect(companyLogo("MUFG Bank, Ltd.")).toBe("/company-logos/mufg.svg");
  expect(companyLogo("PT. Bank SMBC Indonesia")).toBe("/company-logos/smbc.svg");
  expect(companyLogo("Bank Danamon Indonesia")).toBe("/company-logos/danamon.svg");
});

test("prefers the more specific company over its parent", () => {
  expect(companyLogo("BNI Life Insurance")).toBe("/company-logos/bni-life.svg");
  expect(companyLogo("PT. BRI Asuransi Indonesia")).toBeUndefined();
});

test("matches unicorns and large employers", () => {
  expect(companyLogo("DANA Indonesia")).toBeUndefined();
  expect(companyLogo("tiket.com")).toBe("/company-logos/tiket.svg");
  expect(companyLogo("PT Global Tiket Network (tiket.com)")).toBe("/company-logos/tiket.svg");
  expect(companyLogo("PT Telkomsel")).toBe("/company-logos/telkomsel.svg");
  expect(companyLogo("PT. Telekomunikasi Selular Indonesia")).toBe("/company-logos/telkomsel.svg");
  expect(companyLogo("Indosat Ooredoo Hutchison")).toBe("/company-logos/indosat.svg");
  expect(companyLogo("XLSmart")).toBeUndefined();
  expect(companyLogo("PT Pertamina (Persero)")).toBe("/company-logos/pertamina.svg");
  expect(companyLogo("Mitsubishi Motors")).toBe("/company-logos/mitsubishi.svg");
  expect(companyLogo("Rakuten Group")).toBe("/company-logos/rakuten.svg");
  expect(companyLogo("Amazon Web Services")).toBe("/company-logos/aws.svg");
  expect(companyLogo("ByteDance")).toBe("/company-logos/bytedance.svg");
});

test("leaves unmapped employers without a logo", () => {
  expect(companyLogo("Traveloka Indonesia")).toBeUndefined();
  expect(companyLogo("Mamikos")).toBeUndefined();
  expect(companyLogo("PT. Deloitte Consulting")).toBeUndefined();
  expect(companyLogo("KPMG")).toBeUndefined();
  expect(companyLogo("PT. NESTLE INDONESIA")).toBeUndefined();
  expect(companyLogo("PT Freeport Indonesia")).toBeUndefined();
  expect(companyLogo("Universitas Gadjah Mada")).toBeUndefined();
});
