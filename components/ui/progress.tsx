import { cn } from "@/lib/utils";

// 현재 CBT 진행률을 0~100 범위의 막대로 표시합니다.
export function Progress({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const safeValue = Math.min(100, Math.max(0, value));

  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full bg-slate-200", className)}
      aria-label={`진행률 ${safeValue}%`}
    >
      <div
        className="h-full rounded-full bg-teal-700 transition-all"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}
