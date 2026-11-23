export const courseSearch = /cari mata kuliah|search courses/i;
export const notFound = /halaman tidak ditemukan|page not found/i;

export const publicRoutes = [
  { path: "/", primary: courseSearch },
  { path: "/roadmap", primary: /kurikulum mana|which curriculum/i, navigation: /^roadmap$/i },
  { path: "/exam", primary: /arsip ujian|exam archive/i, navigation: /arsip ujian|exam archive/i },
  { path: "/alumni", primary: /kenali alumni|meet our alumni/i, navigation: /^alumni$/i },
  { path: "/faq", primary: /^faq$/i, navigation: /^faq$/i },
  {
    path: "/resources",
    primary: /bingung harus|looking for a place/i,
    navigation: /sumber belajar|learning resources/i,
  },
  {
    path: "/lecturers",
    primary: /dosen dan ulasan|ulasan dosen|lecturers and reviews/i,
    navigation: /^dosen$|^lecturers$/i,
  },
] as const;

export const protectedRoutes = [
  "/dashboard",
  "/dashboard/lecturer-reviews",
  "/dashboard/courses",
  "/dashboard/lecturers",
  "/dashboard/notifications",
  "/dashboard/users",
  "/dashboard/announcements",
];
