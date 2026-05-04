import { PASSING_SCORE, SUBJECT_LABELS, SUBJECT_ORDER } from "@/lib/constants";
import type { CbtResult, SubjectFilter } from "@/lib/types";

export const DEFAULT_SITE_URL = "https://network-manager-cbt.vercel.app";

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

  url.searchParams.set("score", String(payload.score));
  url.searchParams.set("correct", String(payload.correctCount));
  url.searchParams.set("total", String(payload.totalCount));
  url.searchParams.set("passed", payload.passed ? "1" : "0");
  url.searchParams.set("subject", payload.subject);

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

// 숫자 query 값을 정수로 파싱하고 유효하지 않으면 null을 반환합니다.
function parseIntegerParam(value: string | null) {
  if (!value || !/^\d+$/.test(value)) {
    return null;
  }

  return Number(value);
}

// 합격 여부 query 값을 boolean으로 파싱합니다.
function parseBooleanParam(value: string | null) {
  if (value === "1" || value === "true") {
    return true;
  }

  if (value === "0" || value === "false") {
    return false;
  }

  return null;
}

// query의 과목 값이 앱에서 지원하는 필터인지 확인합니다.
function isSubjectFilter(value: string | null): value is SubjectFilter {
  return value === "all" || SUBJECT_ORDER.includes(value as never);
}

// 공유 페이지 query 문자열을 안전하게 읽어 결과 payload로 복원합니다.
export function parseShareResultSearchParams(
  params: ShareSearchParams,
): ShareResultPayload | null {
  const score = parseIntegerParam(getSearchParam(params, "score"));
  const correctCount = parseIntegerParam(getSearchParam(params, "correct"));
  const totalCount = parseIntegerParam(getSearchParam(params, "total"));
  const passed = parseBooleanParam(getSearchParam(params, "passed"));
  const subject = getSearchParam(params, "subject");

  if (
    score === null ||
    correctCount === null ||
    totalCount === null ||
    score > 100 ||
    correctCount > totalCount ||
    totalCount <= 0 ||
    !isSubjectFilter(subject)
  ) {
    return null;
  }

  return {
    score,
    correctCount,
    totalCount,
    passed: passed ?? score >= PASSING_SCORE,
    subject,
  };
}
