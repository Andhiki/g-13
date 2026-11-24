import { describe, expect, test } from "bun:test";
import { resolveAnnouncementCopy, type AnnouncementCopySource } from "./announcement-banner";

const baseAnnouncement: AnnouncementCopySource = {
  titleId: "Jadwal UTS",
  titleEn: "Midterm schedule",
  bodyId: "Jadwal UTS sudah terbit, cek arsip ujian.",
  bodyEn: "Midterm schedule is out, check the exam archive.",
  ctaHref: "/exam",
  ctaLabelId: "Buka arsip",
  ctaLabelEn: "Open archive",
};

describe("resolveAnnouncementCopy", () => {
  test("picks Indonesian and English titles, bodies, and CTA labels", () => {
    expect(resolveAnnouncementCopy(baseAnnouncement, "id", "Selengkapnya")).toEqual({
      title: "Jadwal UTS",
      body: "Jadwal UTS sudah terbit, cek arsip ujian.",
      ctaHref: "/exam",
      ctaLabel: "Buka arsip",
      external: false,
    });

    expect(resolveAnnouncementCopy(baseAnnouncement, "en", "Learn more")).toEqual({
      title: "Midterm schedule",
      body: "Midterm schedule is out, check the exam archive.",
      ctaHref: "/exam",
      ctaLabel: "Open archive",
      external: false,
    });
  });

  test("returns no CTA when href is null or blank", () => {
    expect(
      resolveAnnouncementCopy({ ...baseAnnouncement, ctaHref: null }, "id", "Selengkapnya"),
    ).toEqual({
      title: "Jadwal UTS",
      body: "Jadwal UTS sudah terbit, cek arsip ujian.",
      ctaHref: null,
      ctaLabel: null,
      external: false,
    });

    expect(
      resolveAnnouncementCopy({ ...baseAnnouncement, ctaHref: "   " }, "en", "Learn more"),
    ).toEqual({
      title: "Midterm schedule",
      body: "Midterm schedule is out, check the exam archive.",
      ctaHref: null,
      ctaLabel: null,
      external: false,
    });
  });

  test("falls back to the default CTA label when the active language label is blank", () => {
    expect(
      resolveAnnouncementCopy(
        { ...baseAnnouncement, ctaLabelId: " ", ctaLabelEn: "Open archive" },
        "id",
        "Selengkapnya",
      ),
    ).toEqual({
      title: "Jadwal UTS",
      body: "Jadwal UTS sudah terbit, cek arsip ujian.",
      ctaHref: "/exam",
      ctaLabel: "Selengkapnya",
      external: false,
    });

    expect(
      resolveAnnouncementCopy(
        { ...baseAnnouncement, ctaLabelId: "Buka arsip", ctaLabelEn: null },
        "en",
        "Learn more",
      ),
    ).toEqual({
      title: "Midterm schedule",
      body: "Midterm schedule is out, check the exam archive.",
      ctaHref: "/exam",
      ctaLabel: "Learn more",
      external: false,
    });
  });

  test("marks non-slash links as external", () => {
    expect(
      resolveAnnouncementCopy(
        { ...baseAnnouncement, ctaHref: "https://ugm.ac.id/uts" },
        "en",
        "Learn more",
      ).external,
    ).toBe(true);

    expect(
      resolveAnnouncementCopy({ ...baseAnnouncement, ctaHref: "/exam" }, "en", "Learn more")
        .external,
    ).toBe(false);
  });
});
