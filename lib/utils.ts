import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// 조건부 className 값을 Tailwind 충돌 없이 병합합니다.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
