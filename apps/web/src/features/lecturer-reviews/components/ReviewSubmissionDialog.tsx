import { AlignModal } from "../../../ui/modal";
import { ReviewSubmissionForm, type ReviewFormData } from "./ReviewSubmissionForm";

export function ReviewSubmissionDialog({
  courses,
  lecturerId,
  lecturerName,
  courseId,
  open,
  onClose,
  onPublished,
}: ReviewFormData & {
  lecturerId: string;
  lecturerName: string;
  courseId: string;
  open: boolean;
  onClose: () => void;
  onPublished: (reviewId: string) => Promise<void>;
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
        onEscapeKeyDown={(event) => {
          if (document.activeElement?.matches('input[role="combobox"][aria-expanded="true"]')) {
            event.preventDefault();
          }
        }}
      >
        {open && (
          <ReviewSubmissionForm
            courses={courses}
            lecturerId={lecturerId}
            lecturerName={lecturerName}
            initialCourseId={courseId}
            onClose={onClose}
            onPublished={onPublished}
          />
        )}
      </AlignModal.Content>
    </AlignModal.Root>
  );
}
