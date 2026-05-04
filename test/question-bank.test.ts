import { describe, expect, it } from "vitest";
import { SUBJECT_ORDER } from "@/lib/constants";
import { questionBank } from "@/lib/question-bank";

describe("question bank", () => {
  it("loads 200 JSON CBT questions split evenly by subject", () => {
    expect(questionBank).toHaveLength(200);

    SUBJECT_ORDER.forEach((subject) => {
      expect(questionBank.filter((question) => question.subject === subject)).toHaveLength(50);
    });
  });

  it("has valid choices, answer indexes, detailed explanations, and unique ids", () => {
    const ids = new Set(questionBank.map((question) => question.id));

    expect(ids.size).toBe(questionBank.length);

    questionBank.forEach((question) => {
      expect(question.prompt.trim().length).toBeGreaterThan(8);
      expect(question.choices).toHaveLength(4);
      expect(question.answerIndex).toBeGreaterThanOrEqual(0);
      expect(question.answerIndex).toBeLessThan(question.choices.length);
      expect(question.explanation.trim().length).toBeGreaterThan(180);
    });
  });
});
