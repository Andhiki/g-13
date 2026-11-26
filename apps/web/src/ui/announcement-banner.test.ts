import { describe, expect, test } from "bun:test";
import { resolveAnnouncementCopy, type AnnouncementCopySource } from "./announcement-banner";

const baseAnnouncement: AnnouncementCopySource = {
  titleId: "Jadwal UTS",
  titleEn: "Midterm schedule",
  bodyId: "Jadwal UTS sudah terbit, cek arsip ujian.",
  bodyEn: "Midterm schedule is out, check the exam archive.",
  ctaHref: "/exam",
  ctaOpenInNewTab: false,
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
      ctaOpenInNewTab: false,
    });

    expect(resolveAnnouncementCopy(baseAnnouncement, "en", "Learn more")).toEqual({
      title: "Midterm schedule",
      body: "Midterm schedule is out, check the exam archive.",
      ctaHref: "/exam",
      ctaLabel: "Open archive",
      ctaOpenInNewTab: false,
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
      ctaOpenInNewTab: false,
    });

    expect(
      resolveAnnouncementCopy({ ...baseAnnouncement, ctaHref: "   " }, "en", "Learn more"),
    ).toEqual({
      title: "Midterm schedule",
      body: "Midterm schedule is out, check the exam archive.",
      ctaHref: null,
      ctaLabel: null,
      ctaOpenInNewTab: false,
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
      ctaOpenInNewTab: false,
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
      ctaOpenInNewTab: false,
    });
  });

  test("opens internal or external links in a new tab only when requested", () => {
    for (const ctaHref of ["/exam", "https://ugm.ac.id/uts"]) {
      expect(
        resolveAnnouncementCopy({ ...baseAnnouncement, ctaHref }, "en", "Learn more")
          .ctaOpenInNewTab,
      ).toBe(false);
      expect(
        resolveAnnouncementCopy(
          { ...baseAnnouncement, ctaHref, ctaOpenInNewTab: true },
          "en",
          "Learn more",
        ).ctaOpenInNewTab,
      ).toBe(true);
    }
  });
});
