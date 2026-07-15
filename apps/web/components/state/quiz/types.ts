export type QuizOption = {
  id: number;
  text: string;
  isCorrect: boolean;
  explanation: string;
};

export type QuizQuestionStatic = {
  id: number;
  category: string;
  question: string;
  options: QuizOption[];
  img?: string;
};
