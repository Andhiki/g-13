import { AlignModal } from "@/ui/modal";
import type { ReviewCourseOption } from "../-shared/course-search";
import { ReviewSubmissionForm } from "./ReviewSubmissionForm";

export function ReviewSubmissionDialog({
  initialCourse,
  lecturerId,
  lecturerName,
  courseId,
  open,
  onClose,
  onSubmitted,
}: {
  initialCourse?: ReviewCourseOption;
  lecturerId: string;
  lecturerName: string;
  courseId: string;
  open: boolean;
  onClose: () => void;
  onSubmitted: (status: "pending" | "published") => Promise<void>;
}) {
  return (
    <AlignModal.Root
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
      <AlignModal.Content
        aria-describedby={undefined}
        className="max-h-[calc(100dvh-2rem)] max-w-[760px] overflow-hidden p-0"
      >
        {open && (
          <ReviewSubmissionForm
            initialCourse={initialCourse}
            lecturerId={lecturerId}
            lecturerName={lecturerName}
            initialCourseId={courseId}
            onClose={onClose}
            onSubmitted={onSubmitted}
          />
        )}
      </AlignModal.Content>
    </AlignModal.Root>
  );
}
