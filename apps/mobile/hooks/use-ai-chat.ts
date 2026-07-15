import { useRef, useState } from "react";
import { ScrollView } from "react-native";

export type Message = { id: string; role: "ai" | "user"; text: string };

const WELCOME: Message = {
  id: "welcome",
  role: "ai",
  text: "Hey there 👋\nNeed help with a question? I'm your AI coach, here to offer clear explanations and examples to help you pass the exam. Pick one of the options below, or ask your own question.",
};

export function useAiChat(explanation?: string) {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<ScrollView>(null);

  const addUserMessage = (text: string) => {
    const userMsg: Message = { id: Date.now().toString(), role: "user", text };
    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: "ai",
      text: explanation ?? "Here's a tip: re-read the question carefully and eliminate obviously wrong answers first.",
    };
    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setInput("");
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleSend = () => {
    if (input.trim()) addUserMessage(input.trim());
  };

  const handleQuickAction = (key: string) => {
    addUserMessage(key === "hint" ? "Give me a hint" : "Help me understand this");
  };

  const handleClear = () => setMessages([WELCOME]);

  return { messages, input, setInput, scrollRef, handleSend, handleQuickAction, handleClear };
}
