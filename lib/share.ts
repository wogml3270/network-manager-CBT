import { SUBJECT_LABELS } from "@/lib/constants";
import type { CbtResult, SubjectFilter } from "@/lib/types";

export const DEFAULT_SITE_URL = "https://network-manager-cbt.vercel.app";
const BASE62_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const SUBJECT_CODES: Record<SubjectFilter, number> = {
  all: 0,
  "network-general": 1,
  "tcp-ip": 2,
  nos: 3,
  "network-operation": 4,
};
const SUBJECT_BY_CODE = Object.fromEntries(
  Object.entries(SUBJECT_CODES).map(([subject, code]) => [code, subject]),
) as Record<number, SubjectFilter>;

export interface ShareResultPayload {
  score: number;
  correctCount: number;
  totalCount: number;
  passed: boolean;
  subject: SubjectFilter;
}

export interface ShareMessage {
  title: string;
  description: string;
  text: string;
  buttonTitle: string;
}

type ShareSearchParams = URLSearchParams | Record<string, string | string[] | undefined>;

// 공유 payload 숫자 배열을 Base62 문자열로 인코딩합니다.
function encodeBase62(values: number[]) {
  return values
    .map((value) => {
      if (!Number.isInteger(value) || value < 0) {
        throw new Error("Base62 can encode only non-negative integers.");
      }

      if (value === 0) {
        return BASE62_ALPHABET[0];
      }

      let rest = value;
      let encoded = "";

      while (rest > 0) {
        encoded = BASE62_ALPHABET[rest % BASE62_ALPHABET.length] + encoded;
        rest = Math.floor(rest / BASE62_ALPHABET.length);
      }

      return encoded;
    })
    .join(".");
}

// Base62 공유 토큰을 숫자 배열로 디코딩합니다.
function decodeBase62(token: string) {
  if (!token || !/^[0-9A-Za-z.]+$/.test(token)) {
    return null;
  }

  return token.split(".").map((chunk) => {
    let value = 0;

    for (const character of chunk) {
      const index = BASE62_ALPHABET.indexOf(character);

      if (index < 0) {
        return Number.NaN;
      }

      value = value * BASE62_ALPHABET.length + index;
    }

    return value;
  });
}

// 공유 토큰의 단순 조작을 걸러내기 위한 체크섬을 계산합니다.
function calculateShareChecksum(values: number[]) {
  return values.reduce(
    (checksum, value, index) => (checksum + value * (index + 17)) % 3844,
    97,
  );
}

// URL 끝의 슬래시를 제거해 공유 링크를 안정적으로 이어 붙입니다.
function trimTrailingSlash(url: string) {
  return url.replace(/\/+$/, "");
}

// 배포 환경변수나 현재 origin을 기준으로 공유 링크의 기준 URL을 정합니다.
export function resolveSiteUrl(origin?: string) {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configuredUrl) {
    return trimTrailingSlash(configuredUrl);
  }

  if (origin) {
    return trimTrailingSlash(origin);
  }

  return DEFAULT_SITE_URL;
}

// CBT 채점 결과를 공유 가능한 최소 결과 payload로 변환합니다.
export function createShareResultPayload(
  result: Pick<CbtResult, "score" | "correctCount" | "totalCount" | "passed">,
  subject: SubjectFilter,
): ShareResultPayload {
  return {
    score: result.score,
    correctCount: result.correctCount,
    totalCount: result.totalCount,
    passed: result.passed,
    subject,
  };
}

// 공유 URL에 사용할 query 문자열을 CBT 결과에서 만듭니다.
export function buildShareUrl(payload: ShareResultPayload, baseUrl = resolveSiteUrl()) {
  const url = new URL("/share", baseUrl);

  url.searchParams.set("r", encodeShareResultPayload(payload));

  return url.toString();
}

// 공유 메시지에 표시할 과목명을 사람이 읽기 좋은 한국어로 바꿉니다.
export function getShareSubjectLabel(subject: SubjectFilter) {
  return subject === "all" ? "전체" : SUBJECT_LABELS[subject];
}

// 카카오톡과 Web Share API에 공통으로 사용할 공유 문구를 만듭니다.
export function buildShareMessage(payload: ShareResultPayload): ShareMessage {
  const passText = payload.passed ? "합격권입니다" : "복습이 필요합니다";
  const subjectLabel = getShareSubjectLabel(payload.subject);
  const title = `네트워크관리사 2급 CBT ${payload.score}점`;
  const description = `${subjectLabel} ${payload.correctCount}/${payload.totalCount} 정답, ${passText}.`;

  return {
    title,
    description,
    text: `${title}\n${description}`,
    buttonTitle: "나도 풀기",
  };
}

// URLSearchParams와 Next searchParams 객체에서 동일하게 값을 꺼냅니다.
function getSearchParam(params: ShareSearchParams, key: string) {
  if (params instanceof URLSearchParams) {
    return params.get(key);
  }

  const value = params[key];

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

// 공유 결과 payload를 Base62 토큰으로 변환합니다.
export function encodeShareResultPayload(payload: ShareResultPayload) {
  const values = [
    payload.score,
    payload.correctCount,
    payload.totalCount,
    payload.passed ? 1 : 0,
    SUBJECT_CODES[payload.subject],
  ];

  return encodeBase62([...values, calculateShareChecksum(values)]);
}

// Base62 토큰을 공유 결과 payload로 복원합니다.
export function decodeShareResultToken(token: string): ShareResultPayload | null {
  const values = decodeBase62(token);

  if (!values || values.length !== 6 || values.some((value) => !Number.isInteger(value))) {
    return null;
  }

  const [score, correctCount, totalCount, passedCode, subjectCode, checksum] = values;
  const expectedChecksum = calculateShareChecksum(values.slice(0, 5));
  const subject = SUBJECT_BY_CODE[subjectCode];

  if (
    checksum !== expectedChecksum ||
    score > 100 ||
    correctCount > totalCount ||
    totalCount <= 0 ||
    (passedCode !== 0 && passedCode !== 1) ||
    !subject
  ) {
    return null;
  }

  return {
    score,
    correctCount,
    totalCount,
    passed: Boolean(passedCode),
    subject,
  };
}

// 공유 페이지 query 문자열을 안전하게 읽어 결과 payload로 복원합니다.
export function parseShareResultSearchParams(
  params: ShareSearchParams,
): ShareResultPayload | null {
  const encodedResult = getSearchParam(params, "r");

  if (!encodedResult) {
    return null;
  }

  return decodeShareResultToken(encodedResult);
}
