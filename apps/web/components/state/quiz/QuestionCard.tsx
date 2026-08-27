import { useEffect, useRef } from "react";
import { CheckCircle2, Volume2, XCircle } from "lucide-react";
import type { PublicQuizQuestion, QuizAnswerCheckResponse } from "@driving-test-app/shared";
import Paragraph from "@/components/ui/Paragraph";
import QuestionAnimation from "@/components/quiz/QuestionAnimation";
import type { TFunction } from "@/lib/i18n/quiz";

/**
 * A small canvas confetti burst that fires once from the center of the correct answer's letter
 * circle. Same physics as the results-screen `ConfettiBurst` (radial spray, gravity, spin, fade),
 * just scaled down and localized. Mounts only while the correct option is revealed.
 */
function CorrectConfetti() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 220;
    const H = 190;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const palette = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#eab308", "#8b5cf6", "#06b6d4", "#ec4899"];
    const cx = W / 2;
    const cy = H * 0.58;
    let parts = Array.from({ length: 60 }, (_, i) => {
      const a = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      return {
        x: cx,
        y: cy,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed - 4,
        g: 0.14 + Math.random() * 0.08,
        s: 4 + Math.random() * 4,
        c: palette[i % palette.length],
        rot: Math.random() * 6,
        vr: -0.35 + Math.random() * 0.7,
        life: 1,
      };
    });

    let raf: number;
    const tick = () => {
      ctx.clearRect(0, 0, W, H);
      parts.forEach((p) => {
        p.vy += p.g;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.life -= 0.02;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.5);
        ctx.restore();
      });
      parts = parts.filter((p) => p.life > 0 && p.y < H + 20);
      if (parts.length) raf = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, W, H);
    };
    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2"
      style={{ width: 220, height: 190 }}
    />
  );
}

/**
 * Renders a question during play. In practice mode the parent grades each answer the moment it's
 * picked (via the `check` endpoint) and passes the result back as `checkResult`, which drives the
 * green/red reveal, the correct/your-answer pills, and the inline explanation. Until `checkResult`
 * exists the options behave as a plain single-select; once it does, selection is locked.
 */
export default function QuestionCard({
  question,
  selectedOptionId,
  checkResult,
  voiceOver = false,
  isSpeaking = false,
  onToggleSpeak,
  answerPopularity = false,
  fontScale = 1,
  onSelectOption,
  t,
}: {
  question: PublicQuizQuestion;
  selectedOptionId: number | undefined;
  checkResult: QuizAnswerCheckResponse | undefined;
  voiceOver?: boolean;
  /** Whether the parent's speech synthesizer is currently reading (drives the speaker pulse). */
  isSpeaking?: boolean;
  /** Start/stop reading this question aloud — owned by the parent (QuizExperience). */
  onToggleSpeak?: () => void;
  answerPopularity?: boolean;
  fontScale?: number;
  onSelectOption: (optionId: number) => void;
  t: TFunction;
}) {
  const lottieAsset = question.assets.find((asset) => asset.type === "lottie");
  const isChecked = checkResult !== undefined;

  return (
    <div className="space-y-4">
      <div className="relative" style={{ zoom: fontScale }}>
        {voiceOver && (
          <button
            type="button"
            onClick={onToggleSpeak}
            aria-label={isSpeaking ? "Stop reading question aloud" : "Read question aloud"}
            className={`absolute top-1 -left-9 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-blue-600 p-1.5 text-white ${
              isSpeaking ? "animate-pulse" : ""
            }`}
          >
            <Volume2 className="h-full w-full" />
          </button>
        )}
        <Paragraph size="2xl" className="font-semibold font-sora" color="dark">
          {question.question_text}
        </Paragraph>
      </div>

      {lottieAsset ? (
        <QuestionAnimation asset={lottieAsset} />
      ) : (
        question.image_urls[0] && (
          <div className="overflow-hidden rounded-2xl border border-border bg-background2/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={question.image_urls[0]}
              alt={question.question_text}
              className="block max-h-80 w-full object-cover"
            />
          </div>
        )
      )}

      <div style={{ zoom: fontScale }}>
        <div className="space-y-3">
          {question.answers.map((option, index) => {
            const optionLetter = String.fromCharCode(65 + index);
            const isSelected = option.id === selectedOptionId;

            const isCorrectOption = isChecked && option.id === checkResult.correct_answer_id;
            const isChosenWrong =
              isChecked && option.id === checkResult.selected_answer_id && !checkResult.is_correct;
            const celebrateCorrect = isCorrectOption && checkResult?.is_correct === true;
            const showExplanation =
              !!checkResult?.explanation && (isChosenWrong || celebrateCorrect);

            const popularity = checkResult?.answer_popularity?.find((p) => p.answer_id === option.id)?.percentage;

            const boxClass = isCorrectOption
              ? "border-green-300 bg-green-50"
              : isChosenWrong
                ? "border-red-300 bg-red-50"
                : isSelected && !isChecked
                  ? "border-blue-500 bg-blue-50"
                  : "border-border hover:bg-neutral-50";

            const badgeClass = isCorrectOption
              ? "bg-green-500 text-white"
              : isChosenWrong
                ? "bg-red-500 text-white"
                : isSelected && !isChecked
                  ? "bg-blue-600 text-white"
                  : "bg-neutral-100 text-neutral-500";

            return (
              <div
                key={option.id}
                onClick={() => !isChecked && onSelectOption(option.id)}
                className={`group rounded-lg border p-3 transition-colors ${boxClass} ${
                  isChecked ? "cursor-default" : "cursor-pointer"
                } ${celebrateCorrect ? "correct-glow" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`relative flex min-h-7.5 min-w-7.5 items-center justify-center rounded-full text-sm font-bold ${badgeClass}`}
                    >
                      {optionLetter}
                      {isCorrectOption && checkResult.is_correct && <CorrectConfetti />}
                    </div>
                    <Paragraph className="flex min-h-7.5 items-center font-medium">
                      {option.answer_text}
                    </Paragraph>
                  </div>

                  {isChecked && (answerPopularity || isCorrectOption || isChosenWrong) && (
                    <div className="flex shrink-0 items-center gap-2">
                      {answerPopularity && popularity !== undefined && (
                        <span className="text-xs font-semibold text-neutral-500">{popularity}%</span>
                      )}
                      {isCorrectOption && (
                        <>
                          <span className="hidden rounded-full border border-green-300 px-3 py-1 text-xs font-semibold text-green-600 sm:inline">
                            {t("correctAnswerBadge")}
                          </span>
                          <CheckCircle2 className="h-6 w-6 text-green-500" />
                        </>
                      )}
                      {isChosenWrong && (
                        <>
                          <span className="hidden rounded-full border border-red-300 px-3 py-1 text-xs font-semibold text-red-600 sm:inline">
                            {t("yourAnswerBadge")}
                          </span>
                          <XCircle className="h-6 w-6 text-red-500" />
                        </>
                      )}
                    </div>
                  )}
                </div>

                {showExplanation && (
                  <Paragraph size="sm" className="mt-2 pl-10.5" color="muted">
                    {checkResult.explanation}
                  </Paragraph>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
