import { AlignModal } from "../../../ui/modal";
import {
  ReviewSubmissionForm,
  type ReviewDraft,
  type ReviewFormData,
} from "./ReviewSubmissionForm";

export function ReviewSubmissionDialog({
  data,
  draft,
  onClose,
  onPublished,
}: {
  data: ReviewFormData;
  draft: ReviewDraft | null;
  onClose: () => void;
  onPublished: (reviewId: string) => Promise<void>;
}) {
  return (
    <AlignModal.Root
      open={Boolean(draft)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <AlignModal.Content className="max-h-[calc(100dvh-2rem)] max-w-[600px] overflow-hidden p-0">
        {draft && (
          <ReviewSubmissionForm
            key={draft.request}
            data={data}
            initialLecturerId={draft.lecturerId}
            initialCourseId={draft.courseId ?? ""}
            onClose={onClose}
            onPublished={onPublished}
          />
        )}
      </AlignModal.Content>
    </AlignModal.Root>
  );
}
