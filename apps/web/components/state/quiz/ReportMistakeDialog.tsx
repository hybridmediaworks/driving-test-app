import { useState } from "react";
import type { PublicQuizQuestion } from "@driving-test-app/shared";
import Button from "@/components/ui/Button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import { api, ApiError } from "@/lib/api";

function CheckRow({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 py-1.5 text-sm text-neutral-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-blue-600"
      />
      <span>{label}</span>
    </label>
  );
}

/**
 * "Report a mistake" modal — lets the learner tick which parts of the question look wrong, add a
 * comment, and optionally leave a name/email. Submits to the report endpoint.
 */
export default function ReportMistakeDialog({
  open,
  onOpenChange,
  quizId,
  question,
  onToast,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quizId: number;
  question: PublicQuizQuestion;
  onToast: (message: string, variant: "success" | "error") => void;
}) {
  const hasImage = question.image_urls.length > 0 || question.assets.some((a) => a.type === "lottie");

  const [flagQuestion, setFlagQuestion] = useState(false);
  const [flagImage, setFlagImage] = useState(false);
  const [flagHint, setFlagHint] = useState(false);
  const [flagAnswerIds, setFlagAnswerIds] = useState<Set<number>>(new Set());
  const [comment, setComment] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function toggleAnswer(id: number, checked: boolean) {
    setFlagAnswerIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function submit() {
    if (submitting) return;
    if (!comment.trim()) {
      onToast("Please describe the mistake before sending.", "error");
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/quizzes/${quizId}/questions/${question.id}/report`, {
        comment: comment.trim(),
        flagged: {
          question: flagQuestion,
          image: flagImage,
          hint: flagHint,
          answers: [...flagAnswerIds],
        },
        reporter_name: name.trim() || null,
        reporter_email: email.trim() || null,
      });
      onOpenChange(false);
      onToast("Thanks! Your report has been submitted.", "success");
    } catch (err) {
      onToast(
        err instanceof ApiError ? err.message : "Couldn't send your report. Please try again.",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg! overflow-y-auto rounded-3xl p-6 sm:p-8">
        <Heading size="xs" className="pr-6 text-center">
          Report a mistake in this question
        </Heading>
        <Paragraph size="sm" color="muted" className="mt-2">
          Please check the box with the mistake or typo and provide a comment in the form below.
          Remember to read through the hint and explanation (check for words like &quot;NOT&quot; and
          &quot;EXCEPT&quot;), and double-check your answer. Thanks for your help!
        </Paragraph>

        <div className="mt-4 space-y-1">
          <p className="text-sm font-semibold text-neutral-900">Question:</p>
          <CheckRow checked={flagQuestion} onChange={setFlagQuestion} label={question.question_text} />

          {hasImage && (
            <CheckRow checked={flagImage} onChange={setFlagImage} label="Sign / Image" />
          )}

          <p className="pt-2 text-sm font-semibold text-neutral-900">Answers:</p>
          {question.answers.map((a) => (
            <CheckRow
              key={a.id}
              checked={flagAnswerIds.has(a.id)}
              onChange={(v) => toggleAnswer(a.id, v)}
              label={a.answer_text}
            />
          ))}

          <p className="pt-2 text-sm font-semibold text-neutral-900">Hint:</p>
          <CheckRow checked={flagHint} onChange={setFlagHint} label="The hint / explanation for this question" />
        </div>

        <label className="mt-4 block text-sm text-neutral-600">
          Please describe what is wrong with the sentence you have ticked:
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="mt-2 w-full resize-y rounded-xl bg-background2 p-3 text-sm outline-none focus:ring-2 focus:ring-blue-300"
          />
        </label>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          className="mt-3 w-full rounded-xl bg-background2 px-4 py-3 text-sm outline-none placeholder:text-neutral-400 focus:ring-2 focus:ring-blue-300"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your e-mail address"
          className="mt-3 w-full rounded-xl bg-background2 px-4 py-3 text-sm outline-none placeholder:text-neutral-400 focus:ring-2 focus:ring-blue-300"
        />

        <div className="mt-5 flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="flex-1 border border-blue-300 hover:bg-blue-50"
          >
            Cancel
          </Button>
          <Button onClick={submit} disabled={submitting} className="flex-1">
            {submitting ? "Sending…" : "Send"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
