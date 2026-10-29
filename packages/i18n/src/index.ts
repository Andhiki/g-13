import type { Resource } from "i18next";

export const defaultLanguage = "id";
export const supportedLanguages = ["id", "en"] as const;
export type Language = (typeof supportedLanguages)[number];

const resourcesData = {
  id: {
    translation: {
      navigation: {
        label: "Navigasi aplikasi",
        mobileLabel: "Navigasi seluler",
        curriculum: "Kurikulum",
        examArchive: "Arsip Ujian",
        alumni: "Alumni",
        resources: "Sumber Belajar",
        roadmap: "Roadmap",
        open: "Buka navigasi",
        close: "Tutup navigasi",
        home: "OmahTI dan HIMAKOM UGM — beranda",
        github: "Buka repositori GitHub (tab baru)",
      },
      notFound: {
        title: "Halaman tidak ditemukan",
        home: "Kembali ke peta kurikulum",
      },
      language: {
        switchTo: "Beralih ke bahasa Inggris",
      },
    },
  },
  en: {
    translation: {
      navigation: {
        label: "App navigation",
        mobileLabel: "Mobile navigation",
        curriculum: "Curriculum",
        examArchive: "Exam archive",
        alumni: "Alumni",
        resources: "Learning resources",
        roadmap: "Roadmap",
        open: "Open navigation",
        close: "Close navigation",
        home: "OmahTI and HIMAKOM UGM — home",
        github: "Open GitHub repository (new tab)",
      },
      notFound: {
        title: "Page not found",
        home: "Back to the curriculum map",
      },
      language: {
        switchTo: "Switch to Indonesian",
      },
    },
  },
} as const;

export const resources: typeof resourcesData = resourcesData;

export const i18nOptions: {
  resources: Resource;
  fallbackLng: typeof defaultLanguage;
  supportedLngs: Language[];
  defaultNS: "translation";
  interpolation: { escapeValue: false };
} = {
  resources: resources as Resource,
  fallbackLng: defaultLanguage,
  supportedLngs: [...supportedLanguages],
  defaultNS: "translation",
  interpolation: { escapeValue: false },
};

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: (typeof resources)["id"];
  }
}
