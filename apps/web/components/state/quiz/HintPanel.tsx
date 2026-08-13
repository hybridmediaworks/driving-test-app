import { useEffect, useRef, useState } from "react";
import { ChevronDown, Lightbulb, SendHorizontal } from "lucide-react";
import type { QuizAssistResponse } from "@driving-test-app/shared";
import Button from "@/components/ui/Button";
import { api, ApiError } from "@/lib/api";

type HintMessage = { role: "hint" | "user" | "tutor"; text: string };

/**
 * AI tutor panel for a single question. Kept as its own component and keyed by question id in the
 * parent so its conversation state resets automatically when the learner moves to another question
 * (no reset effect needed). Collapse state lives in the parent and is passed in.
 */
export default function HintPanel({
  quizId,
  questionId,
  open,
  onToggle,
}: {
  quizId: number;
  questionId: number;
  open: boolean;
  onToggle: () => void;
}) {
  const [messages, setMessages] = useState<HintMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // One hint per question — the button disappears after it's used (state resets per question
  // since this panel is keyed by questionId in the parent).
  const [hintUsed, setHintUsed] = useState(false);

  // Keep the newest message in view: scroll the body to the bottom whenever it changes.
  const scrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  async function requestAssist(mode: "hint" | "ask", message?: string) {
    setError(null);
    setLoading(true);
    if (mode === "ask" && message) {
      setMessages((m) => [...m, { role: "user", text: message }]);
    }
    try {
      const res = await api.post<QuizAssistResponse>(`/quizzes/${quizId}/questions/${questionId}/assist`, {
        mode,
        message,
      });
      setMessages((m) => [...m, { role: mode === "hint" ? "hint" : "tutor", text: res.reply }]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "The AI tutor is unavailable right now.");
    } finally {
      setLoading(false);
    }
  }

  function submit() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    void requestAssist("ask", text);
  }

  const hasMessages = messages.length > 0;

  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-[0_16px_50px_-26px_rgba(23,37,84,0.20)]">
      <button
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-2 text-left text-sm text-neutral-600"
      >
        Need a hint or a quick explanation? Tap the button or type a question for instant help.
        <ChevronDown
          className={`mt-0.5 h-4 w-4 shrink-0 text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {hasMessages && (
            <div ref={scrollRef} className="h-44 space-y-2 overflow-y-auto">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                      m.role === "user" ? "bg-blue-600 text-white" : "bg-blue-50 text-neutral-700"
                    }`}
                  >
                    {m.role === "hint" && (
                      <span className="mb-1 flex items-center gap-1 text-xs font-semibold text-blue-600">
                        <Lightbulb className="h-3.5 w-3.5" /> Hint
                      </span>
                    )}
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!hintUsed && (
            <Button
              variant="secondary"
              size="sm"
              disabled={loading}
              onClick={() => {
                setHintUsed(true);
                void requestAssist("hint");
              }}
            >
              <Lightbulb className="h-4 w-4" /> Get a Hint
            </Button>
          )}

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex items-center gap-2 rounded-full border border-neutral-200 px-4 py-2 focus-within:border-blue-300">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
              disabled={loading}
              placeholder="Ask your question here"
              className="w-full text-sm outline-none placeholder:text-neutral-400"
            />
            <Button
              onClick={submit}
              disabled={loading || !input.trim()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-primary p-0! text-white"
            >
              <SendHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
