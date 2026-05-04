import type { SubjectArea } from "@/lib/types";

export const PASSING_SCORE = 60;
export const CBT_QUESTION_COUNT = 50;
export const CBT_MINUTES = 50;
export const QUESTION_COUNT_OPTIONS = [20, 30, 50] as const;

export const SUBJECT_LABELS: Record<SubjectArea, string> = {
  "network-general": "네트워크 일반",
  "tcp-ip": "TCP/IP",
  nos: "NOS",
  "network-operation": "네트워크 운용기기",
};

export const SUBJECT_ORDER: SubjectArea[] = [
  "network-general",
  "tcp-ip",
  "nos",
  "network-operation",
];
