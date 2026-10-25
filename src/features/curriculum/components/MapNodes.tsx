import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { creditsFor } from "../course-utils";
import type { CourseNodeData, LaneNodeData } from "../map-layout";

export function CourseNode({ data }: NodeProps<Node<CourseNodeData, "course">>) {
  const course = data.course;
  const credit = creditsFor(course);
  return (
    <div className={"course-node" + (data.state ? " " + data.state : "")}>
      {data.incoming.map((id) => (
        <Handle key={id} id={"in:" + id} type="target" position={Position.Left} />
      ))}
      <button
        type="button"
        onClick={() => data.choose(course.id)}
        aria-label={"Buka detail " + course.title}
        aria-pressed={data.state === "selected"}
      >
        <div className="course-node-top">
          <span>{course.code || "Slot pilihan"}</span>
          <span className="course-node-credits">{credit === null ? "—" : credit + " SKS"}</span>
        </div>
        <strong>{course.title}</strong>
      </button>
      {data.outgoing.map((id) => (
        <Handle key={id} id={"out:" + id} type="source" position={Position.Right} />
      ))}
    </div>
  );
}

export function LaneNode({ data }: NodeProps<Node<LaneNodeData, "lane">>) {
  return (
    <div className={"map-lane" + (data.active ? " active" : "")}>
      <strong>{data.title}</strong>
    </div>
  );
}
