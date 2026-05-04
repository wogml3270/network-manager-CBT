import { describe, expect, it } from "vitest";
import { questionBank } from "@/lib/question-bank";
import {
  filterQuestions,
  selectCbtQuestions,
  shuffleQuestionChoices,
  shuffleQuestions,
} from "@/lib/quiz";
import type { Question } from "@/lib/types";

describe("quiz helpers", () => {
  it("filters questions by subject", () => {
    expect(filterQuestions(questionBank, "tcp-ip")).toHaveLength(50);
    expect(filterQuestions(questionBank, "all")).toHaveLength(200);
  });

  it("selects only the requested number of questions", () => {
    const picked = selectCbtQuestions(questionBank, "all", 30, () => 0.5);

    expect(picked).toHaveLength(30);
  });

  it("does not mutate the original question order when shuffling", () => {
    const originalFirstId = questionBank[0]?.id;

    shuffleQuestions(questionBank, () => 0);

    expect(questionBank[0]?.id).toBe(originalFirstId);
  });

  it("shuffles choices while keeping the correct answer aligned", () => {
    const question: Question = {
      id: "choice-order",
      subject: "tcp-ip",
      prompt: "정답 위치 테스트",
      choices: ["오답 A", "정답", "오답 B", "오답 C"],
      answerIndex: 1,
      explanation: "선택지가 섞여도 정답 텍스트를 가리켜야 한다.",
      tags: ["test"],
    };

    const shuffled = shuffleQuestionChoices(question, () => 0);

    expect(shuffled.choices).not.toEqual(question.choices);
    expect(shuffled.choices[shuffled.answerIndex]).toBe("정답");
    expect(question.choices).toEqual(["오답 A", "정답", "오답 B", "오답 C"]);
  });
});
