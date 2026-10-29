import type { Node } from "@xyflow/react";
import type { Course } from "@g13/curriculum";
import type { MapCourseState } from "./map-state";
export type CourseNodeData = {
  kind: "course";
  course: Course;
  state: MapCourseState;
  incoming: string[];
  outgoing: string[];
  choose: (id: string) => void;
};
export type LaneNodeData = {
  kind: "lane";
  title: string;
  active: boolean;
};
export type MapNode = Node<CourseNodeData, "course"> | Node<LaneNodeData, "lane">;

export const LANE_X = 48;
export const LANE_STEP = 360;
export const LANE_WIDTH = 270;
