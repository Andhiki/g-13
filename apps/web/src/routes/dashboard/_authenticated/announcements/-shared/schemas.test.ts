import { expect, it } from "bun:test";
import {
  ANNOUNCEMENT_BODY_MAX_LENGTH,
  ANNOUNCEMENT_CTA_LABEL_MAX_LENGTH,
  ANNOUNCEMENT_CTA_LINK_MAX_LENGTH,
  ANNOUNCEMENT_TITLE_MAX_LENGTH,
  createAnnouncementSchema,
  updateAnnouncementSchema,
  type CreateAnnouncementInput,
} from "./schemas";

const atLimitInput: CreateAnnouncementInput = {
  titleId: "a".repeat(ANNOUNCEMENT_TITLE_MAX_LENGTH),
  titleEn: "a".repeat(ANNOUNCEMENT_TITLE_MAX_LENGTH),
  bodyId: "a".repeat(ANNOUNCEMENT_BODY_MAX_LENGTH),
  bodyEn: "a".repeat(ANNOUNCEMENT_BODY_MAX_LENGTH),
  ctaLabelId: "a".repeat(ANNOUNCEMENT_CTA_LABEL_MAX_LENGTH),
  ctaLabelEn: "a".repeat(ANNOUNCEMENT_CTA_LABEL_MAX_LENGTH),
  ctaHref: `/${"a".repeat(ANNOUNCEMENT_CTA_LINK_MAX_LENGTH - 1)}`,
  ctaOpenInNewTab: false,
  startsAt: 1,
  endsAt: null,
  countdownAt: null,
  variant: "primary",
  enabled: true,
};

const writeSchemas = [
  { name: "create", schema: createAnnouncementSchema },
  { name: "update", schema: updateAnnouncementSchema },
] as const;

const cappedFields = [
  {
    field: "titleId",
    locale: "Indonesian",
    limit: ANNOUNCEMENT_TITLE_MAX_LENGTH,
    messageLabel: "Indonesian title",
  },
  {
    field: "titleEn",
    locale: "English",
    limit: ANNOUNCEMENT_TITLE_MAX_LENGTH,
    messageLabel: "English title",
  },
  {
    field: "bodyId",
    locale: "Indonesian",
    limit: ANNOUNCEMENT_BODY_MAX_LENGTH,
    messageLabel: "Indonesian message",
  },
  {
    field: "bodyEn",
    locale: "English",
    limit: ANNOUNCEMENT_BODY_MAX_LENGTH,
    messageLabel: "English message",
  },
  {
    field: "ctaLabelId",
    locale: "Indonesian",
    limit: ANNOUNCEMENT_CTA_LABEL_MAX_LENGTH,
    messageLabel: "CTA label",
  },
  {
    field: "ctaLabelEn",
    locale: "English",
    limit: ANNOUNCEMENT_CTA_LABEL_MAX_LENGTH,
    messageLabel: "CTA label",
  },
] as const;

for (const { name, schema } of writeSchemas) {
  it(`${name} accepts announcement copy exactly at each character cap`, () => {
    expect(
      schema.safeParse({ ...atLimitInput, announcementId: "existing-announcement" }).success,
    ).toBe(true);
  });

  it(`${name} keeps the CTA link cap at ${ANNOUNCEMENT_CTA_LINK_MAX_LENGTH} characters`, () => {
    const result = schema.safeParse({
      ...atLimitInput,
      ctaHref: `/${"a".repeat(ANNOUNCEMENT_CTA_LINK_MAX_LENGTH)}`,
      announcementId: "existing-announcement",
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues).toContainEqual({
      code: "too_big",
      origin: "string",
      maximum: ANNOUNCEMENT_CTA_LINK_MAX_LENGTH,
      inclusive: true,
      path: ["ctaHref"],
      message: `The CTA link must be ${ANNOUNCEMENT_CTA_LINK_MAX_LENGTH} characters or fewer.`,
    });
  });

  for (const { field, locale, limit, messageLabel } of cappedFields) {
    it(`${name} rejects an over-limit ${locale} ${field} with its limit`, () => {
      const result = schema.safeParse({
        ...atLimitInput,
        [field]: "a".repeat(limit + 1),
        announcementId: "existing-announcement",
      });

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error.issues).toContainEqual({
        code: "too_big",
        origin: "string",
        maximum: limit,
        inclusive: true,
        path: [field],
        message: `The ${messageLabel} must be ${limit} characters or fewer.`,
      });
    });
  }
}
