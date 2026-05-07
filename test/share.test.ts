import { describe, expect, it } from "vitest";
import {
  buildShareMessage,
  buildShareUrl,
  createShareResultPayload,
  decodeShareResultToken,
  encodeShareResultPayload,
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
    const resultToken = new URL(shareUrl).searchParams.get("r");

    expect(shareUrl).toMatch(/^https:\/\/example\.com\/share\?r=[0-9A-Za-z.]+$/);
    expect(resultToken).not.toContain("score");
    expect(parsed).toEqual(payload);
  });

  it("encodes and decodes share results with Base62", () => {
    const payload = createShareResultPayload(cbtResult, "tcp-ip");
    const token = encodeShareResultPayload(payload);
    const parsed = decodeShareResultToken(token);

    expect(token).toMatch(/^[0-9A-Za-z.]+$/);
    expect(parsed).toEqual(payload);
  });

  it("rejects tampered Base62 share result tokens", () => {
    const token = encodeShareResultPayload(createShareResultPayload(cbtResult, "tcp-ip"));
    const tampered = token.replace(/^[^.]+/, "65");

    expect(decodeShareResultToken(tampered)).toBeNull();
  });

  it("rejects legacy plain query parameters and invalid tokens", () => {
    expect(
      parseShareResultSearchParams({
        score: "60",
        correct: "30",
        total: "50",
        subject: "all",
      }),
    ).toBeNull();
    expect(
      parseShareResultSearchParams({
        r: "not-a-valid-token",
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
