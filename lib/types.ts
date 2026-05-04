export type SubjectArea =
  | "network-general"
  | "tcp-ip"
  | "nos"
  | "network-operation";

export interface Question {
  id: string;
  subject: SubjectArea;
  prompt: string;
  choices: string[];
  answerIndex: number;
  explanation: string;
  tags: string[];
}

export type SubjectFilter = SubjectArea | "all";

export type QuestionCountOption = 20 | 30 | 50;

export interface CbtQuestionResult {
  question: Question;
  selectedIndex?: number;
  isAnswered: boolean;
  isCorrect: boolean;
}

export interface CbtResult {
  totalCount: number;
  answeredCount: number;
  correctCount: number;
  score: number;
  passed: boolean;
  questionResults: CbtQuestionResult[];
}
