import {
  RiShieldStarLine,
  RiShieldCheckLine,
  RiShieldCrossLine,
  type RemixiconComponentType,
} from "@remixicon/react";
import type { AssignRoleInput } from "../-shared/schemas";

export type AssignableRole = AssignRoleInput["role"];

export const roleOptions: Array<{
  value: AssignableRole;
  label: string;
  description: string;
  Icon: RemixiconComponentType;
}> = [
  {
    value: "admin",
    Icon: RiShieldStarLine,
    label: "Admin",
    description: "Moderate reviews and manage users.",
  },
  {
    value: "maintainer",
    Icon: RiShieldCheckLine,
    label: "Maintainer",
    description: "Moderate lecturer reviews.",
  },
  {
    value: "user",
    Icon: RiShieldCrossLine,
    label: "User",
    description: "No moderation access.",
  },
];
