import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

// CBT 설정 화면에서 사용하는 공통 셀렉트 입력 컴포넌트입니다.
export function SelectInput({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "focus-ring h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950",
        className,
      )}
      {...props}
    />
  );
}
