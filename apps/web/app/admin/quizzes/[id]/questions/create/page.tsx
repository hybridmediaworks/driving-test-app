"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState, type FormEvent } from "react";
import type { Quiz } from "@driving-test-app/shared";
import AdminGuard from "@/components/admin/AdminGuard";
import AppLayout from "@/components/app/AppLayout";
import { Button } from "@/components/ui/ShadcnButton";
import { Input } from "@/components/ui/Input";
import InputError from "@/components/ui/InputError";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/textarea";
import { api, ApiError } from "@/lib/api";

type AnswerForm = { answer_text: string; explanation: string };

export default function CreateQuizQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz | null>(null);

  const [questionText, setQuestionText] = useState("");
  const [explanation, setExplanation] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [topic, setTopic] = useState("");
  const [answers, setAnswers] = useState<AnswerForm[]>([
    { answer_text: "", explanation: "" },
    { answer_text: "", explanation: "" },
  ]);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [images, setImages] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    api.get<{ quiz: Quiz }>(`/admin/quizzes/${id}`).then((res) => setQuiz(res.quiz));
  }, [id]);

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

  async function submit(e: FormEvent) {
    e.preventDefault();
    setProcessing(true);
    setErrors({});

    const formData = new FormData();
    formData.append("question_text", questionText);
    if (explanation) formData.append("explanation", explanation);
    formData.append("difficulty", difficulty);
    if (topic) formData.append("topic", topic);
    answers.forEach((a, i) => {
      formData.append(`answers[${i}][answer_text]`, a.answer_text);
      if (a.explanation.trim()) formData.append(`answers[${i}][explanation]`, a.explanation);
      formData.append(`answers[${i}][is_correct]`, i === correctIndex ? "1" : "0");
    });
    images.forEach((file) => formData.append("images[]", file));

    try {
      await api.post(`/admin/quizzes/${id}/questions`, formData);
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

  return (
    <AdminGuard>
      <AppLayout breadcrumbs={[{ title: "Dashboard", href: "/dashboard" }, { title: "Quizzes", href: "/admin/quizzes" }]}>
        <div className="app-page">
          <div className="space-y-0.5">
            <h1 className="text-lg font-semibold">New question</h1>
            <p className="text-sm text-muted-foreground">{quiz?.title}</p>
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
              <Label htmlFor="question_images">Images (optional)</Label>
              <p className="text-xs text-muted-foreground">Up to 10 images (JPEG, PNG, GIF, WebP, max 5 MB each). Shown with the question for learners.</p>
              <input
                id="question_images"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                multiple
                className="text-sm"
                onChange={(e) => setImages(e.target.files ? Array.from(e.target.files) : [])}
              />
              {images.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {images.length} new file(s) selected.{" "}
                  <button type="button" className="text-foreground underline" onClick={() => setImages([])}>
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
              <Textarea
                id="explanation"
                rows={3}
                placeholder="Shown after the learner submits (app)"
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
              />
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
              <p className="text-xs text-muted-foreground">
                Select the radio button for the one correct answer. Optional feedback is shown when the learner picks that option (correct
                or incorrect).
              </p>
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
