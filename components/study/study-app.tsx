"use client";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  ListRestart,
  Play,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ShareActions } from "@/components/share/share-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SelectInput } from "@/components/ui/field";
import { Progress } from "@/components/ui/progress";
import {
  CBT_MINUTES,
  CBT_QUESTION_COUNT,
  PASSING_SCORE,
  QUESTION_COUNT_OPTIONS,
  SUBJECT_LABELS,
  SUBJECT_ORDER,
} from "@/lib/constants";
import { questionBank } from "@/lib/question-bank";
import { selectCbtQuestions } from "@/lib/quiz";
import { gradeCbt } from "@/lib/scoring";
import { createShareResultPayload } from "@/lib/share";
import type { Question, QuestionCountOption, SubjectFilter } from "@/lib/types";
import { cn } from "@/lib/utils";

type Screen = "setup" | "quiz" | "result";

const subjectOptions: Array<{ value: SubjectFilter; label: string }> = [
  { value: "all", label: "전체" },
  ...SUBJECT_ORDER.map((subject) => ({
    value: subject,
    label: SUBJECT_LABELS[subject],
  })),
];

// 남은 CBT 시간을 분:초 형태로 표시합니다.
function formatSeconds(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const rest = safeSeconds % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

// CBT 설정, 풀이, 결과 화면을 전환하는 메인 앱 컴포넌트입니다.
export function StudyApp() {
  const [screen, setScreen] = useState<Screen>("setup");
  const [subject, setSubject] = useState<SubjectFilter>("all");
  const [questionCount, setQuestionCount] =
    useState<QuestionCountOption>(CBT_QUESTION_COUNT);
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number | undefined>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(CBT_MINUTES * 60);

  const availableCount = useMemo(
    () =>
      subject === "all"
        ? questionBank.length
        : questionBank.filter((question) => question.subject === subject).length,
    [subject],
  );

  const currentQuestion = sessionQuestions[currentIndex];
  const answeredCount = sessionQuestions.filter(
    (question) => answers[question.id] !== undefined,
  ).length;
  const result = useMemo(
    () => gradeCbt(sessionQuestions, answers),
    [answers, sessionQuestions],
  );

  useEffect(() => {
    if (screen !== "quiz") {
      return;
    }

    if (remainingSeconds <= 0) {
      setScreen("result");
      return;
    }

    const timer = window.setInterval(() => {
      setRemainingSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [remainingSeconds, screen]);

  // 선택한 설정으로 문제와 선택지를 랜덤 배치한 새 CBT 세션을 시작합니다.
  function startCbt() {
    const picked = selectCbtQuestions(questionBank, subject, questionCount);

    setSessionQuestions(picked);
    setAnswers({});
    setCurrentIndex(0);
    setRemainingSeconds(CBT_MINUTES * 60);
    setScreen("quiz");
  }

  // 진행 중인 세션을 비우고 CBT 설정 화면으로 돌아갑니다.
  function resetToSetup() {
    setScreen("setup");
    setSessionQuestions([]);
    setAnswers({});
    setCurrentIndex(0);
    setRemainingSeconds(CBT_MINUTES * 60);
  }

  // 현재 세션의 특정 문항 답안을 메모리에 기록합니다.
  function selectAnswer(questionId: string, answerIndex: number) {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: answerIndex,
    }));
  }

  // 답안 현황이나 이전/다음 버튼으로 이동할 문항 위치를 보정합니다.
  function goToQuestion(index: number) {
    setCurrentIndex(Math.min(sessionQuestions.length - 1, Math.max(0, index)));
  }

  // 미응답 문항이 있을 때 사용자 확인을 받은 뒤 결과 화면으로 이동합니다.
  function finishCbt() {
    const unansweredNumbers = sessionQuestions
      .map((question, index) => (answers[question.id] === undefined ? index + 1 : undefined))
      .filter((number): number is number => number !== undefined);

    if (unansweredNumbers.length > 0) {
      const questionList = unansweredNumbers.join(", ");
      const confirmed = window.confirm(
        `${questionList}번 문제를 선택하지 않았습니다. 제출하시겠습니까?`,
      );

      if (!confirmed) {
        goToQuestion(unansweredNumbers[0] - 1);
        return;
      }
    }

    setScreen("result");
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="mb-5 flex flex-col justify-between gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold uppercase text-teal-700">Network Manager CBT</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-950">
              네트워크관리사 2급 CBT 연습
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              공식 기출 원문을 복제하지 않은 자체 AI 제작 유사문제 200문항으로 빠르게 풉니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="blue">내장 {questionBank.length}문항</Badge>
            <Badge>{CBT_MINUTES}분</Badge>
            <Badge tone="success">{PASSING_SCORE}점 이상 합격</Badge>
          </div>
        </header>

        {screen === "setup" && (
          <SetupView
            availableCount={availableCount}
            onQuestionCountChange={setQuestionCount}
            onStart={startCbt}
            onSubjectChange={setSubject}
            questionCount={questionCount}
            subject={subject}
          />
        )}

        {screen === "quiz" && currentQuestion && (
          <QuizView
            answeredCount={answeredCount}
            answers={answers}
            currentIndex={currentIndex}
            onFinish={finishCbt}
            onGoToQuestion={goToQuestion}
            onSelectAnswer={selectAnswer}
            question={currentQuestion}
            questions={sessionQuestions}
            remainingSeconds={remainingSeconds}
          />
        )}

        {screen === "result" && (
          <ResultView
            onRestart={startCbt}
            onSetup={resetToSetup}
            result={result}
            subject={subject}
          />
        )}
      </div>
    </main>
  );
}

// 과목과 문항 수를 고르는 CBT 시작 설정 화면입니다.
function SetupView({
  availableCount,
  onQuestionCountChange,
  onStart,
  onSubjectChange,
  questionCount,
  subject,
}: {
  availableCount: number;
  onQuestionCountChange: (count: QuestionCountOption) => void;
  onStart: () => void;
  onSubjectChange: (subject: SubjectFilter) => void;
  questionCount: QuestionCountOption;
  subject: SubjectFilter;
}) {
  return (
    <section className="grid flex-1 gap-5 lg:grid-cols-[minmax(0,420px)_1fr] lg:items-start">
      <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-950">CBT 설정</h2>
        <p className="mt-1 text-sm text-slate-500">
          과목과 문항 수만 고르면 바로 시작합니다.
        </p>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="text-xs font-semibold uppercase text-slate-500">과목</span>
            <SelectInput
              className="mt-2"
              value={subject}
              onChange={(event) => onSubjectChange(event.target.value as SubjectFilter)}
            >
              {subjectOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectInput>
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase text-slate-500">문항 수</span>
            <SelectInput
              className="mt-2"
              value={questionCount}
              onChange={(event) =>
                onQuestionCountChange(Number(event.target.value) as QuestionCountOption)
              }
            >
              {QUESTION_COUNT_OPTIONS.map((count) => (
                <option key={count} value={count}>
                  {count}문항
                </option>
              ))}
            </SelectInput>
          </label>

          <Button
            className="w-full"
            disabled={availableCount === 0}
            variant="primary"
            onClick={onStart}
          >
            <Play size={17} />
            시작
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {subjectOptions.slice(1).map((option) => {
          const count = questionBank.filter(
            (question) => question.subject === option.value,
          ).length;

          return (
            <article
              key={option.value}
              className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm font-semibold text-slate-500">과목</p>
              <h3 className="mt-2 text-xl font-bold text-slate-950">{option.label}</h3>
              <p className="mt-3 text-sm text-slate-600">{count}문항 수록</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

// 제한 시간 안에 문항을 풀고 답안을 선택하는 CBT 풀이 화면입니다.
function QuizView({
  answeredCount,
  answers,
  currentIndex,
  onFinish,
  onGoToQuestion,
  onSelectAnswer,
  question,
  questions,
  remainingSeconds,
}: {
  answeredCount: number;
  answers: Record<string, number | undefined>;
  currentIndex: number;
  onFinish: () => void;
  onGoToQuestion: (index: number) => void;
  onSelectAnswer: (questionId: string, answerIndex: number) => void;
  question: Question;
  questions: Question[];
  remainingSeconds: number;
}) {
  const progress = Math.round(((currentIndex + 1) / questions.length) * 100);
  const selectedIndex = answers[question.id];

  return (
    <section className="grid flex-1 gap-5 lg:grid-cols-[1fr_260px]">
      <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="blue">
              {currentIndex + 1}/{questions.length}
            </Badge>
            <Badge>{SUBJECT_LABELS[question.subject]}</Badge>
          </div>
          <Badge tone={remainingSeconds < 300 ? "danger" : "warning"}>
            <Clock size={14} />
            {formatSeconds(remainingSeconds)}
          </Badge>
        </div>

        <Progress value={progress} className="mt-4" />

        <h2 className="mt-6 text-xl font-bold leading-8 text-slate-950">
          {question.prompt}
        </h2>

        <div className="mt-6 grid gap-3">
          {question.choices.map((choice, index) => (
            <button
              key={`${question.id}-${choice}`}
              type="button"
              className={cn(
                "focus-ring flex min-h-12 items-start gap-3 rounded-md border px-4 py-3 text-left text-sm font-semibold transition",
                selectedIndex === index
                  ? "border-teal-700 bg-teal-50 text-teal-950"
                  : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
              )}
              onClick={() => onSelectAnswer(question.id, index)}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  selectedIndex === index
                    ? "bg-teal-700 text-white"
                    : "bg-slate-100 text-slate-700",
                )}
              >
                {index + 1}
              </span>
              <span>{choice}</span>
            </button>
          ))}
        </div>

        <div className="mt-6 flex flex-col justify-between gap-3 sm:flex-row">
          <Button
            disabled={currentIndex === 0}
            variant="secondary"
            onClick={() => onGoToQuestion(currentIndex - 1)}
          >
            <ArrowLeft size={16} />
            이전
          </Button>
          <div className="flex gap-2 sm:justify-end">
            <Button variant="secondary" onClick={onFinish}>
              제출
            </Button>
            <Button
              disabled={currentIndex === questions.length - 1}
              variant="primary"
              onClick={() => onGoToQuestion(currentIndex + 1)}
            >
              다음
              <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </div>

      <aside className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-bold text-slate-950">답안 현황</p>
        <p className="mt-1 text-sm text-slate-500">
          {answeredCount}/{questions.length}문항 선택
        </p>
        <div className="mt-4 grid grid-cols-5 gap-2 lg:grid-cols-4">
          {questions.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={cn(
                "focus-ring h-9 rounded-md text-sm font-bold",
                index === currentIndex
                  ? "bg-slate-950 text-white"
                  : answers[item.id] !== undefined
                    ? "bg-teal-100 text-teal-800"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200",
              )}
              onClick={() => onGoToQuestion(index)}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </aside>
    </section>
  );
}

// 채점 결과와 전체 문항의 정답/풀이를 보여주는 결과 화면입니다.
function ResultView({
  onRestart,
  onSetup,
  result,
  subject,
}: {
  onRestart: () => void;
  onSetup: () => void;
  result: ReturnType<typeof gradeCbt>;
  subject: SubjectFilter;
}) {
  const sharePayload = createShareResultPayload(result, subject);

  return (
    <section className="space-y-5">
      <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              {result.passed ? (
                <CheckCircle2 className="text-green-700" size={24} />
              ) : (
                <XCircle className="text-red-700" size={24} />
              )}
              <h2 className="text-2xl font-bold text-slate-950">
                {result.passed ? "합격권입니다" : "조금 더 풀어봐야 합니다"}
              </h2>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              {result.correctCount}/{result.totalCount} 정답 · {result.answeredCount}문항 응답
            </p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-sm font-semibold text-slate-500">점수</p>
            <p className="text-4xl font-black text-slate-950">{result.score}점</p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="primary" onClick={onRestart}>
            <RotateCcw size={16} />
            같은 설정으로 다시
          </Button>
          <Button variant="secondary" onClick={onSetup}>
            <ListRestart size={16} />
            설정으로
          </Button>
        </div>
        <ShareActions className="mt-4" payload={sharePayload} />
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-bold text-slate-950">전체 문항 풀이</h3>
        <div className="mt-4 grid gap-4">
          {result.questionResults.map(({ question, selectedIndex, isAnswered, isCorrect }, index) => {
            return (
              <article
                key={question.id}
                className={cn(
                  "rounded-md border p-4",
                  isCorrect
                    ? "border-green-200 bg-green-50"
                    : isAnswered
                      ? "border-red-200 bg-red-50"
                      : "border-amber-200 bg-amber-50",
                )}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={isCorrect ? "success" : isAnswered ? "danger" : "warning"}>
                    {isCorrect ? "정답" : isAnswered ? "오답" : "미응답"} {index + 1}
                  </Badge>
                  <Badge>{SUBJECT_LABELS[question.subject]}</Badge>
                </div>
                <p className="mt-3 font-semibold leading-6 text-slate-950">
                  {question.prompt}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  선택:{" "}
                  {selectedIndex === undefined
                    ? "미응답"
                    : `${selectedIndex + 1}. ${question.choices[selectedIndex]}`}
                </p>
                <p className="mt-1 text-sm font-semibold text-green-800">
                  정답: {question.answerIndex + 1}. {question.choices[question.answerIndex]}
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  {question.explanation}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
