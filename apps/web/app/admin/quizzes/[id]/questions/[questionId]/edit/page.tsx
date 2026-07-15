"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState, type FormEvent } from "react";
import type { Quiz, QuizQuestion } from "@driving-test-app/shared";
import AdminGuard from "@/components/admin/AdminGuard";
import AppLayout from "@/components/app/AppLayout";
import { Button } from "@/components/ui/ShadcnButton";
import { Input } from "@/components/ui/Input";
import InputError from "@/components/ui/InputError";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/textarea";
import { api, ApiError } from "@/lib/api";

type AnswerForm = { answer_text: string; explanation: string };

export default function EditQuizQuestionPage({ params }: { params: Promise<{ id: string; questionId: string }> }) {
  const { id, questionId } = use(params);
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [question, setQuestion] = useState<QuizQuestion | null>(null);

  const [questionText, setQuestionText] = useState("");
  const [explanation, setExplanation] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [topic, setTopic] = useState("");
  const [answers, setAnswers] = useState<AnswerForm[]>([]);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [retainedImages, setRetainedImages] = useState<{ path: string; url: string }[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    api.get<{ quiz: Quiz; question: QuizQuestion }>(`/admin/quizzes/${id}/questions/${questionId}`).then((res) => {
      setQuiz(res.quiz);
      setQuestion(res.question);
      setQuestionText(res.question.question_text);
      setExplanation(res.question.explanation ?? "");
      setDifficulty(res.question.difficulty);
      setTopic(res.question.topic ?? "");
      setAnswers((res.question.answers ?? []).map((a) => ({ answer_text: a.answer_text, explanation: a.explanation ?? "" })));
      const correctIdx = (res.question.answers ?? []).findIndex((a) => a.is_correct);
      setCorrectIndex(Math.max(0, correctIdx));
      const paths = res.question.images ?? [];
      const urls = res.question.image_urls ?? [];
      setRetainedImages(paths.map((path, i) => ({ path, url: urls[i] ?? "" })));
    });
  }, [id, questionId]);

  function addAnswer() {
    setAnswers((prev) => [...prev, { answer_text: "", explanation: "" }]);
  }

  function removeAnswer(i: number) {
    if (answers.length <= 2) return;
    setAnswers((prev) => prev.filter((_, idx) => idx !== i));
    setCorrectIndex((prev) => (prev >= answers.length - 1 ? answers.length - 2 : prev));
  }

  function updateAnswer(i: number, field: keyof AnswerForm, value: string) {
    setAnswers((prev) => prev.map((a, idx) => (idx === i ? { ...a, [field]: value } : a)));
  }

  function removeExistingImage(path: string) {
    setRetainedImages((prev) => prev.filter((img) => img.path !== path));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setProcessing(true);
    setErrors({});

    const formData = new FormData();
    formData.append("_method", "PUT");
    formData.append("question_text", questionText);
    if (explanation) formData.append("explanation", explanation);
    formData.append("difficulty", difficulty);
    if (topic) formData.append("topic", topic);
    answers.forEach((a, i) => {
      formData.append(`answers[${i}][answer_text]`, a.answer_text);
      if (a.explanation.trim()) formData.append(`answers[${i}][explanation]`, a.explanation);
      formData.append(`answers[${i}][is_correct]`, i === correctIndex ? "1" : "0");
    });
    newImages.forEach((file) => formData.append("images[]", file));
    formData.append("keep_images", JSON.stringify(retainedImages.map((img) => img.path)));

    try {
      await api.post(`/admin/quizzes/${id}/questions/${questionId}`, formData);
      router.push(`/admin/quizzes/${id}/questions`);
    } catch (err) {
      if (err instanceof ApiError && err.errors) setErrors(err.errors);
    } finally {
      setProcessing(false);
    }
  }

  const imageFieldErrors = Object.entries(errors)
    .filter(([k]) => k.startsWith("images"))
    .flatMap(([, v]) => v);

  if (!quiz || !question) {
    return (
      <AdminGuard>
        <AppLayout breadcrumbs={[{ title: "Dashboard", href: "/dashboard" }, { title: "Quizzes", href: "/admin/quizzes" }]}>
          <div className="app-page text-sm text-muted-foreground">Loading…</div>
        </AppLayout>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <AppLayout breadcrumbs={[{ title: "Dashboard", href: "/dashboard" }, { title: "Quizzes", href: "/admin/quizzes" }]}>
        <div className="app-page">
          <div className="space-y-0.5">
            <h1 className="text-lg font-semibold">Edit question</h1>
            <p className="text-sm text-muted-foreground">{quiz.title}</p>
          </div>

          <form className="w-full max-w-2xl space-y-6" onSubmit={submit}>
            <div className="grid gap-2">
              <Label htmlFor="question_text" className="gap-1">
                Question <span className="text-destructive">*</span>
              </Label>
              <Textarea id="question_text" rows={4} value={questionText} onChange={(e) => setQuestionText(e.target.value)} />
              <InputError message={errors.question_text?.[0]} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="question_images">Images</Label>
              {retainedImages.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {retainedImages.map((img) => (
                    <div key={img.path} className="relative overflow-hidden rounded-md border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt="" className="size-20 object-cover" />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(img.path)}
                        className="absolute top-0.5 right-0.5 rounded bg-black/70 px-1 text-xs text-white"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">Add more images (JPEG, PNG, GIF, WebP, max 5 MB each, up to 10 total).</p>
              <input
                id="question_images"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                multiple
                className="text-sm"
                onChange={(e) => setNewImages(e.target.files ? Array.from(e.target.files) : [])}
              />
              {newImages.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {newImages.length} new file(s) selected.{" "}
                  <button type="button" className="text-foreground underline" onClick={() => setNewImages([])}>
                    Clear
                  </button>
                </p>
              )}
              <InputError message={errors.images?.[0]} />
              {imageFieldErrors.map((err, i) => (
                <InputError key={i} message={err} />
              ))}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="explanation">Overall explanation (optional)</Label>
              <Textarea id="explanation" rows={3} value={explanation} onChange={(e) => setExplanation(e.target.value)} />
              <InputError message={errors.explanation?.[0]} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="difficulty" className="gap-1">
                  Difficulty <span className="text-destructive">*</span>
                </Label>
                <select
                  id="difficulty"
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as "easy" | "medium" | "hard")}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
                <InputError message={errors.difficulty?.[0]} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="topic">Topic (optional)</Label>
                <Input id="topic" maxLength={255} value={topic} onChange={(e) => setTopic(e.target.value)} />
                <InputError message={errors.topic?.[0]} />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="gap-1">
                Answers <span className="text-destructive">*</span>
              </Label>
              <div className="space-y-3">
                {answers.map((a, i) => (
                  <div key={i} className="space-y-2 rounded-md border border-border p-3">
                    <div className="flex flex-wrap items-start gap-2">
                      <input
                        type="radio"
                        className="mt-2 border-input"
                        checked={correctIndex === i}
                        onChange={() => setCorrectIndex(i)}
                        name="correct-answer"
                      />
                      <Input
                        className="min-w-[12rem] max-w-xl flex-1"
                        placeholder="Answer text"
                        value={a.answer_text}
                        onChange={(e) => updateAnswer(i, "answer_text", e.target.value)}
                      />
                      {answers.length > 2 && (
                        <Button variant="ghost" size="sm" type="button" onClick={() => removeAnswer(i)}>
                          Remove
                        </Button>
                      )}
                    </div>
                    <div className="sm:pl-7">
                      <InputError message={errors[`answers.${i}.answer_text`]?.[0]} />
                    </div>
                    <div className="grid min-w-0 gap-1 sm:pl-7">
                      <Label htmlFor={`answer-explanation-${i}`} className="text-xs font-normal text-muted-foreground">
                        Feedback if learner picks this option (optional)
                      </Label>
                      <Textarea
                        id={`answer-explanation-${i}`}
                        rows={2}
                        maxLength={20000}
                        value={a.explanation}
                        onChange={(e) => updateAnswer(i, "explanation", e.target.value)}
                      />
                      <InputError message={errors[`answers.${i}.explanation`]?.[0]} />
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" type="button" onClick={addAnswer}>
                Add answer
              </Button>
              <InputError message={errors.answers?.[0]} />
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={processing}>
                Save question
              </Button>
              <Button variant="outline" type="button" render={<Link href={`/admin/quizzes/${id}/questions`} />}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </AppLayout>
    </AdminGuard>
  );
}
