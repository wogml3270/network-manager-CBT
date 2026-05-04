import { describe, expect, it } from "vitest";
import {
  buildShareMessage,
  buildShareUrl,
  createShareResultPayload,
  parseShareResultSearchParams,
} from "@/lib/share";
import type { CbtResult } from "@/lib/types";

const cbtResult: CbtResult = {
  totalCount: 50,
  answeredCount: 50,
  correctCount: 32,
  score: 64,
  passed: true,
  questionResults: [],
};

describe("share helpers", () => {
  it("creates a compact share payload from a CBT result", () => {
    const payload = createShareResultPayload(cbtResult, "tcp-ip");

    expect(payload).toEqual({
      score: 64,
      correctCount: 32,
      totalCount: 50,
      passed: true,
      subject: "tcp-ip",
    });
  });

  it("builds and parses share URLs", () => {
    const payload = createShareResultPayload(cbtResult, "tcp-ip");
    const shareUrl = buildShareUrl(payload, "https://example.com/");
    const parsed = parseShareResultSearchParams(new URL(shareUrl).searchParams);

    expect(shareUrl).toBe(
      "https://example.com/share?score=64&correct=32&total=50&passed=1&subject=tcp-ip",
    );
    expect(parsed).toEqual(payload);
  });

  it("parses Next searchParams objects and derives missing pass state", () => {
    const parsed = parseShareResultSearchParams({
      score: "58",
      correct: "29",
      total: "50",
      subject: "all",
    });

    expect(parsed).toMatchObject({
      score: 58,
      correctCount: 29,
      totalCount: 50,
      passed: false,
      subject: "all",
    });
  });

  it("rejects invalid share result parameters", () => {
    expect(
      parseShareResultSearchParams({
        score: "70",
        correct: "60",
        total: "50",
        subject: "all",
      }),
    ).toBeNull();
    expect(
      parseShareResultSearchParams({
        score: "70",
        correct: "35",
        total: "50",
        subject: "unknown",
      }),
    ).toBeNull();
  });

  it("builds Korean share text for Kakao and Web Share", () => {
    const message = buildShareMessage(createShareResultPayload(cbtResult, "tcp-ip"));

    expect(message.title).toBe("네트워크관리사 2급 CBT 64점");
    expect(message.description).toContain("TCP/IP 32/50 정답");
    expect(message.buttonTitle).toBe("나도 풀기");
  });
});
