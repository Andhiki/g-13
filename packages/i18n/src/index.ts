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
        loadFailed: "Bahasa gagal dimuat. Periksa koneksi dan muat ulang untuk mencoba lagi.",
        reload: "Muat ulang",
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
        loadFailed:
          "The language could not be loaded. Check your connection and reload to try again.",
        reload: "Reload",
      },
    },
  },
} as const;

export const resources: Resource = resourcesData;

export const i18nOptions: {
  resources: Resource;
  fallbackLng: typeof defaultLanguage;
  supportedLngs: Language[];
  defaultNS: "translation";
  interpolation: { escapeValue: false };
  fallbackNS: string;
  nsSeparator: false;
} = {
  resources,
  fallbackLng: defaultLanguage,
  supportedLngs: [...supportedLanguages],
  defaultNS: "translation",
  interpolation: { escapeValue: false },
  fallbackNS: "common",
  nsSeparator: false,
};

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: {
      translation: (typeof resourcesData)["id"]["translation"];
      common: Record<string, string>;
      roadmap: Record<string, string>;
      exam: Record<string, string>;
      resources: Record<string, string>;
      alumni: Record<string, string>;
    };
  }
}

export function resolveLanguage(cookie?: string, acceptLanguage = ""): Language {
  if (cookie === "id" || cookie === "en") return cookie;
  const preferences = acceptLanguage
    .split(",")
    .map((entry) => {
      const [code, ...parameters] = entry.trim().toLowerCase().split(";");
      const quality = parameters.find((parameter) => parameter.trim().startsWith("q="));
      return { code: code.split("-")[0], quality: quality ? Number(quality.trim().slice(2)) : 1 };
    })
    .filter((entry) => Number.isFinite(entry.quality) && entry.quality > 0);
  preferences.sort((left, right) => right.quality - left.quality);
  for (const { code } of preferences) if (code === "id" || code === "en") return code;
  return defaultLanguage;
}

export function courseTitle(
  course: { title: string; englishTitle: string },
  language: Language,
): string {
  return language === "en" && course.englishTitle.trim() ? course.englishTitle : course.title;
}
