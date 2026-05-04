import questions from "@/data/questions.json";
import { SUBJECT_ORDER } from "@/lib/constants";
import type { Question, SubjectArea } from "@/lib/types";

type RawQuestion = Omit<Question, "subject"> & {
  subject: string;
};

const subjectSet = new Set<string>(SUBJECT_ORDER);

// JSON의 문자열 과목 값이 앱에서 지원하는 과목인지 확인합니다.
function isSubjectArea(subject: string): subject is SubjectArea {
  return subjectSet.has(subject);
}

// JSON 문항을 런타임 과목 검증을 거친 Question 타입으로 변환합니다.
function toQuestion(rawQuestion: RawQuestion): Question {
  if (!isSubjectArea(rawQuestion.subject)) {
    throw new Error(`Invalid question subject: ${rawQuestion.subject}`);
  }

  return {
    ...rawQuestion,
    subject: rawQuestion.subject,
  };
}

// JSON 파일에서 불러온 전체 CBT 문제은행입니다.
export const questionBank: Question[] = (questions as RawQuestion[]).map(toQuestion);
