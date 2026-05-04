import { CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  buildShareMessage,
  getShareSubjectLabel,
  parseShareResultSearchParams,
  type ShareResultPayload,
} from "@/lib/share";

export const metadata: Metadata = {
  title: "네트워크관리사 2급 CBT 결과",
  description: "공유받은 네트워크관리사 2급 CBT 결과를 확인합니다.",
};

type SharePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// 공유 링크로 들어온 사용자가 CBT 결과 요약을 확인하는 페이지입니다.
export default async function SharePage({ searchParams }: SharePageProps) {
  const payload = parseShareResultSearchParams(await searchParams);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-4 py-8 sm:px-6">
        {payload ? <ShareResultCard payload={payload} /> : <InvalidShareView />}
      </div>
    </main>
  );
}

// 유효하지 않은 공유 링크일 때 홈으로 돌아가는 안내를 보여줍니다.
function InvalidShareView() {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
      <Badge tone="warning">공유 링크</Badge>
      <h1 className="mt-4 text-2xl font-bold text-slate-950">
        공유 결과를 확인할 수 없습니다
      </h1>
      <p className="mt-2 text-sm text-slate-500">링크 정보가 올바르지 않습니다.</p>
      <Link
        href="/"
        className="focus-ring mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-medium text-white transition hover:bg-teal-800"
      >
        <RotateCcw size={16} />
        CBT 풀기
      </Link>
    </section>
  );
}

// 공유된 점수와 합격 여부를 카드 형태로 렌더링합니다.
function ShareResultCard({ payload }: { payload: ShareResultPayload }) {
  const message = buildShareMessage(payload);
  const subjectLabel = getShareSubjectLabel(payload.subject);

  return (
    <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="blue">Network Manager CBT</Badge>
        <Badge>{subjectLabel}</Badge>
        <Badge tone={payload.passed ? "success" : "danger"}>
          {payload.passed ? "합격권" : "복습 필요"}
        </Badge>
      </div>

      <div className="mt-5 flex items-start gap-3">
        {payload.passed ? (
          <CheckCircle2 className="mt-1 shrink-0 text-green-700" size={28} />
        ) : (
          <XCircle className="mt-1 shrink-0 text-red-700" size={28} />
        )}
        <div>
          <h1 className="text-2xl font-bold text-slate-950">
            네트워크관리사 2급 CBT 결과
          </h1>
          <p className="mt-2 text-sm text-slate-600">{message.description}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-500">점수</p>
          <p className="mt-1 text-3xl font-black text-slate-950">{payload.score}점</p>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-500">정답</p>
          <p className="mt-1 text-3xl font-black text-slate-950">
            {payload.correctCount}/{payload.totalCount}
          </p>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-500">판정</p>
          <p className="mt-1 text-3xl font-black text-slate-950">
            {payload.passed ? "합격" : "불합격"}
          </p>
        </div>
      </div>

      <Link
        href="/"
        className="focus-ring mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-medium text-white transition hover:bg-teal-800"
      >
        <RotateCcw size={16} />
        나도 풀기
      </Link>
    </section>
  );
}
