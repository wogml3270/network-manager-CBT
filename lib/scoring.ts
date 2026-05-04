import { PASSING_SCORE } from "@/lib/constants";
import type { CbtResult, Question } from "@/lib/types";

// 정답 수와 전체 문항 수를 100점 만점 점수로 환산합니다.
export function calculateScore(correctCount: number, totalCount: number) {
  if (totalCount <= 0) {
    return 0;
  }

  return Math.round((correctCount / totalCount) * 100);
}

// 점수가 합격 기준 이상인지 판정합니다.
export function isPassingScore(score: number) {
  return score >= PASSING_SCORE;
}

// 세션 문제와 답안 기록을 바탕으로 CBT 결과를 채점합니다.
export function gradeCbt(
  questions: Question[],
  answers: Record<string, number | undefined>,
): CbtResult {
  const answeredCount = questions.filter((question) => answers[question.id] !== undefined).length;
  const correctCount = questions.filter(
    (question) => answers[question.id] === question.answerIndex,
  ).length;
  const score = calculateScore(correctCount, questions.length);
  const questionResults = questions.map((question) => {
    const selectedIndex = answers[question.id];

    return {
      question,
      selectedIndex,
      isAnswered: selectedIndex !== undefined,
      isCorrect: selectedIndex === question.answerIndex,
    };
  });

  return {
    totalCount: questions.length,
    answeredCount,
    correctCount,
    score,
    passed: isPassingScore(score),
    questionResults,
  };
}
