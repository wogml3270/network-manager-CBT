import type { Question, QuestionCountOption, SubjectFilter } from "@/lib/types";

// 선택한 과목에 맞는 문제만 추립니다.
export function filterQuestions(questions: Question[], subject: SubjectFilter) {
  return subject === "all"
    ? questions
    : questions.filter((question) => question.subject === subject);
}

// 원본 문제 배열을 유지한 채 문제 순서를 무작위로 섞습니다.
export function shuffleQuestions(questions: Question[], random = Math.random) {
  const items = [...questions];

  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }

  return items;
}

// 선택지 순서를 섞고 정답 인덱스를 새 위치에 맞게 재계산합니다.
export function shuffleQuestionChoices(question: Question, random = Math.random): Question {
  const choices = question.choices.map((choice, originalIndex) => ({
    choice,
    originalIndex,
  }));

  for (let index = choices.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [choices[index], choices[swapIndex]] = [choices[swapIndex], choices[index]];
  }

  const answerIndex = choices.findIndex(
    (choice) => choice.originalIndex === question.answerIndex,
  );

  return {
    ...question,
    choices: choices.map((choice) => choice.choice),
    answerIndex,
  };
}

// 과목과 문항 수 기준으로 CBT 세션에 사용할 문제를 랜덤 선택합니다.
export function selectCbtQuestions(
  questions: Question[],
  subject: SubjectFilter,
  count: QuestionCountOption,
  random = Math.random,
) {
  return shuffleQuestions(filterQuestions(questions, subject), random)
    .slice(0, count)
    .map((question) => shuffleQuestionChoices(question, random));
}
