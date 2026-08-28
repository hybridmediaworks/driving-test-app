import { askQuestionAssist } from "@/services/api/quizApi";
import { ApiError } from "@/lib/api";
import { useEffect, useRef, useState } from "react";
import { ScrollView } from "react-native";

export type Message = {
  id: string;
  role: "ai" | "user";
  text: string;
  // AI bubble awaiting the live reply — rendered as an animated typing indicator.
  pending?: boolean;
};

const WELCOME: Message = {
  id: "welcome",
  role: "ai",
  text: "Hey there 👋\nNeed help with a question? I'm your AI coach, here to offer clear explanations and examples to help you pass the exam. Pick one of the options below, or ask your own question.",
};

let messageSeq = 0;
const nextId = () => `m${Date.now()}-${messageSeq++}`;

type Options = {
  // When both are present the sheet talks to the live "assist" endpoint. The mock test bank has no
  // backing DB row, so it omits these and falls back to the static explanation instead.
  quizId?: number | string;
  questionId?: number;
  explanation?: string;
};

export function useAiChat({ quizId, questionId, explanation }: Options) {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const isLive = quizId !== undefined && questionId !== undefined;

  // The tutor is grounded on one specific question, so start a fresh chat whenever the learner
  // moves to a different question.
  useEffect(() => {
    setMessages([WELCOME]);
    setInput("");
    setPending(false);
  }, [quizId, questionId]);

  const scrollToEnd = () =>
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

  const fallbackReply = () =>
    explanation ??
    "Here's a tip: re-read the question carefully and eliminate obviously wrong answers first.";

  const runAssist = async (
    userText: string,
    mode: "hint" | "ask",
    message?: string,
  ) => {
    if (pending) return;

    const userMsg: Message = { id: nextId(), role: "user", text: userText };
    const typingId = nextId();
    const typingMsg: Message = { id: typingId, role: "ai", text: "", pending: true };
    setMessages((prev) => [...prev, userMsg, typingMsg]);
    setInput("");
    setPending(true);
    scrollToEnd();

    // Mock test bank — no live endpoint, so answer from the static explanation.
    if (!isLive) {
      setMessages((prev) =>
        prev.map((m) => (m.id === typingId ? { ...m, text: fallbackReply(), pending: false } : m)),
      );
      setPending(false);
      scrollToEnd();
      return;
    }

    try {
      const reply = await askQuestionAssist(quizId!, questionId!, mode, message);
      setMessages((prev) =>
        prev.map((m) => (m.id === typingId ? { ...m, text: reply, pending: false } : m)),
      );
    } catch (err) {
      const text =
        err instanceof ApiError && err.status === 503
          ? "The AI coach is taking a short break. Please try again in a moment."
          : err instanceof ApiError && err.status === 429
            ? "You're asking a bit fast — give it a few seconds and try again."
            : "Sorry, I couldn't reach the AI coach. Please check your connection and try again.";
      setMessages((prev) =>
        prev.map((m) => (m.id === typingId ? { ...m, text, pending: false } : m)),
      );
    } finally {
      setPending(false);
      scrollToEnd();
    }
  };

  const handleSend = () => {
    const text = input.trim();
    if (text) runAssist(text, "ask", text);
  };

  const handleQuickAction = (key: string) => {
    if (key === "hint") {
      runAssist("Give me a hint", "hint");
    } else {
      const text = "Help me understand this";
      runAssist(text, "ask", text);
    }
  };

  const handleClear = () => {
    setMessages([WELCOME]);
    setPending(false);
  };

  return { messages, input, setInput, pending, scrollRef, handleSend, handleQuickAction, handleClear };
}
