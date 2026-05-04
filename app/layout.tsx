import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "네트워크관리사 2급 CBT",
  description: "네트워크관리사 2급 자체 제작 유사문제 CBT 앱",
};

// 모든 페이지에 공통 HTML 구조와 전역 스타일을 적용합니다.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
