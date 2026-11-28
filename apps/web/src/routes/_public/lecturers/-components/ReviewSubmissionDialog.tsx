import { AlignModal } from "@/ui/modal";
import type { SubmittedReview } from "../-client/mutations";
import type { ReviewCourseOption } from "../-shared/course-search";
import { ReviewSubmissionForm } from "./ReviewSubmissionForm";

export function ReviewSubmissionDialog({
  initialCourse,
  lecturerId,
  lecturerName,
  courseId,
  browserId,
  open,
  onClose,
  onSubmitted,
}: {
  initialCourse?: ReviewCourseOption;
  lecturerId: string;
  lecturerName: string;
  courseId: string;
  browserId: string | null;
  open: boolean;
  onClose: () => void;
  onSubmitted: (result: SubmittedReview) => void;
}) {
  return (
    <AlignModal.Root
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
      <AlignModal.Content aria-describedby={undefined} className="max-w-[760px]">
        {open && (
          <ReviewSubmissionForm
            initialCourse={initialCourse}
            lecturerId={lecturerId}
            lecturerName={lecturerName}
            initialCourseId={courseId}
            browserId={browserId}
            onClose={onClose}
            onSubmitted={onSubmitted}
          />
        )}
      </AlignModal.Content>
    </AlignModal.Root>
  );
}
