import { describe, expect, it } from "vitest";
import { gradeCbt, calculateScore, isPassingScore } from "@/lib/scoring";
import type { Question } from "@/lib/types";

const questions: Question[] = [
  {
    id: "q1",
    subject: "tcp-ip",
    prompt: "IPv4 주소 길이는?",
    choices: ["16비트", "32비트", "48비트", "128비트"],
    answerIndex: 1,
    explanation: "IPv4는 32비트 주소 체계이므로 보기 중 32비트를 골라야 한다.",
    tags: ["IPv4"],
  },
  {
    id: "q2",
    subject: "nos",
    prompt: "Windows IP 확인 명령은?",
    choices: ["ipconfig", "chmod", "ls", "grep"],
    answerIndex: 0,
    explanation: "Windows에서 IP 설정을 확인할 때는 ipconfig를 사용한다.",
    tags: ["Windows"],
  },
];

describe("scoring", () => {
  it("calculates percentage scores and passing threshold", () => {
    expect(calculateScore(30, 50)).toBe(60);
    expect(calculateScore(0, 0)).toBe(0);
    expect(isPassingScore(60)).toBe(true);
    expect(isPassingScore(59)).toBe(false);
  });

  it("grades CBT answers and includes wrong questions", () => {
    const result = gradeCbt(questions, {
      q1: 1,
      q2: 2,
    });

    expect(result.totalCount).toBe(2);
    expect(result.answeredCount).toBe(2);
    expect(result.correctCount).toBe(1);
    expect(result.score).toBe(50);
    expect(result.passed).toBe(false);
    expect(result.questionResults).toHaveLength(2);
    expect(result.questionResults[0]?.isCorrect).toBe(true);
    expect(result.questionResults[1]?.isCorrect).toBe(false);
  });
});
