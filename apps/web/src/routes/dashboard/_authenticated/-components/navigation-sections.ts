import type { AbsoluteToPath, RegisteredRouter } from "@tanstack/react-router";
import {
  type RemixiconComponentType,
  RiBookOpenLine,
  RiChatCheckLine,
  RiGroupLine,
  RiHome5Line,
  RiLinksLine,
  RiMegaphoneLine,
  RiUserVoiceLine,
} from "@remixicon/react";
import { hasPermission, type Permission, type Role } from "@g13/auth";

export type ModerationSection = {
  to: AbsoluteToPath<RegisteredRouter, string>;
  label: string;
  Icon: RemixiconComponentType;
  permission: Permission;
};

export type ModerationSectionGroup = {
  heading?: string;
  items: ModerationSection[];
};

export const sectionGroups = [
  {
    items: [{ to: "/dashboard", label: "Home", Icon: RiHome5Line, permission: "moderate" }],
  },
  {
    heading: "Moderation",
    items: [
      {
        to: "/dashboard/lecturer-reviews",
        label: "Lecturer reviews",
        Icon: RiChatCheckLine,
        permission: "moderate",
      },
      {
        to: "/dashboard/users",
        label: "User access",
        Icon: RiGroupLine,
        permission: "manage-users",
      },
      {
        to: "/dashboard/announcements",
        label: "Announcements",
        Icon: RiMegaphoneLine,
        permission: "manage-users",
      },
    ],
  },
  {
    heading: "Catalog",
    items: [
      {
        to: "/dashboard/courses",
        label: "Courses",
        Icon: RiBookOpenLine,
        permission: "moderate",
      },
      {
        to: "/dashboard/lecturers",
        label: "Lecturers",
        Icon: RiUserVoiceLine,
        permission: "moderate",
      },
      {
        to: "/dashboard/resources",
        label: "Learning resources",
        Icon: RiLinksLine,
        permission: "moderate",
      },
    ],
  },
] satisfies ModerationSectionGroup[];

export function getVisibleSectionGroups(role: Role | null | undefined): ModerationSectionGroup[] {
  return sectionGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((section) => hasPermission(role, section.permission)),
    }))
    .filter((group) => group.items.length > 0);
}
