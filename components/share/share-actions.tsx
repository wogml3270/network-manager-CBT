"use client";

import { Copy, MessageCircle, Share2 } from "lucide-react";
import Script from "next/script";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  buildShareMessage,
  buildShareUrl,
  resolveSiteUrl,
  type ShareResultPayload,
} from "@/lib/share";
import { cn } from "@/lib/utils";

const KAKAO_SDK_URL = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.7/kakao.min.js";
const kakaoJavascriptKey = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY?.trim() ?? "";

interface KakaoShareLink {
  webUrl: string;
  mobileWebUrl: string;
}

interface KakaoSdk {
  isInitialized: () => boolean;
  init: (key: string) => void;
  Share?: {
    sendDefault: (payload: {
      objectType: "text";
      text: string;
      link: KakaoShareLink;
      buttonTitle: string;
    }) => void;
  };
}

declare global {
  interface Window {
    Kakao?: KakaoSdk;
  }
}

interface ShareActionsProps {
  payload: ShareResultPayload;
  className?: string;
}

// 결과 화면에서 카카오톡 공유, Web Share, 링크 복사 동작을 제공합니다.
export function ShareActions({ payload, className }: ShareActionsProps) {
  const [clientOrigin, setClientOrigin] = useState<string>();
  const [status, setStatus] = useState<string | null>(null);
  const shareUrl = useMemo(
    () => buildShareUrl(payload, resolveSiteUrl(clientOrigin)),
    [clientOrigin, payload],
  );
  const shareMessage = useMemo(() => buildShareMessage(payload), [payload]);

  useEffect(() => {
    setClientOrigin(window.location.origin);
  }, []);

  // Kakao JavaScript SDK가 로드되어 있으면 앱 키로 초기화합니다.
  const initializeKakao = useCallback(() => {
    if (!kakaoJavascriptKey || !window.Kakao) {
      return false;
    }

    if (!window.Kakao.isInitialized()) {
      window.Kakao.init(kakaoJavascriptKey);
    }

    return window.Kakao.isInitialized();
  }, []);

  // 브라우저 클립보드나 prompt를 이용해 공유 링크를 복사하게 합니다.
  const copyShareUrl = useCallback(async () => {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setStatus("공유 링크를 복사했습니다.");
        return;
      } catch {
        // 클립보드 권한이 없으면 아래 prompt fallback으로 이어집니다.
      }
    }

    window.prompt("공유 링크를 복사하세요.", shareUrl);
    setStatus("공유 링크를 직접 복사해 주세요.");
  }, [shareUrl]);

  // Kakao SDK가 없거나 Web Share가 실패하면 링크 복사로 대체합니다.
  const shareWithFallback = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareMessage.title,
          text: shareMessage.description,
          url: shareUrl,
        });
        setStatus("공유 창을 열었습니다.");
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          setStatus("공유를 취소했습니다.");
          return;
        }
      }
    }

    await copyShareUrl();
  }, [copyShareUrl, shareMessage.description, shareMessage.title, shareUrl]);

  // 카카오톡 공유를 시도하고 설정이 없으면 일반 공유로 자연스럽게 대체합니다.
  const shareWithKakao = useCallback(async () => {
    const isReady = initializeKakao();

    if (!isReady || !window.Kakao?.Share?.sendDefault) {
      setStatus("카카오 설정이 없어 링크 공유로 대체합니다.");
      await shareWithFallback();
      return;
    }

    try {
      window.Kakao.Share.sendDefault({
        objectType: "text",
        text: shareMessage.text,
        link: {
          webUrl: shareUrl,
          mobileWebUrl: shareUrl,
        },
        buttonTitle: shareMessage.buttonTitle,
      });
      setStatus("카카오톡 공유 창을 열었습니다.");
    } catch {
      setStatus("카카오톡 공유에 실패해 링크 공유로 대체합니다.");
      await shareWithFallback();
    }
  }, [initializeKakao, shareMessage.buttonTitle, shareMessage.text, shareUrl, shareWithFallback]);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {kakaoJavascriptKey && (
        <Script
          src={KAKAO_SDK_URL}
          strategy="afterInteractive"
          onReady={() => {
            initializeKakao();
          }}
        />
      )}
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={shareWithKakao}>
          <MessageCircle size={16} />
          카카오톡 공유
        </Button>
        <Button variant="secondary" onClick={shareWithFallback}>
          <Share2 size={16} />
          링크 공유
        </Button>
        <Button variant="ghost" onClick={copyShareUrl}>
          <Copy size={16} />
          링크 복사
        </Button>
      </div>
      {status && <p className="text-sm text-slate-500">{status}</p>}
    </div>
  );
}
