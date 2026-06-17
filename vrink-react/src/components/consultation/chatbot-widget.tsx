"use client";

import { useEffect } from "react";

/**
 * 자체 상담 챗봇 위젯 로더.
 * - 매크로 데이터(macros.js)를 먼저 로드한 뒤 위젯(widget.js)을 로드한다(순서 보장).
 * - 위젯은 /api/chat (AI 상담) · /api/handoff (상담사 연결 슬랙) 를 호출한다.
 * - 채널톡(ChannelTalk) 대체. 채널톡 컴포넌트 파일은 보존하되 layout 에서만 교체.
 */
export function ChatbotWidget() {
  useEffect(() => {
    if (document.getElementById("vk-widget-script")) return;

    const v = "20260617l"; // 캐시 무효화 버전 — 위젯 변경 시 갱신
    const macros = document.createElement("script");
    macros.src = `/chatbot/macros.js?v=${v}`;
    macros.onload = () => {
      const widget = document.createElement("script");
      widget.id = "vk-widget-script";
      widget.src = `/chatbot/widget.js?v=${v}`;
      document.body.appendChild(widget);
    };
    document.body.appendChild(macros);
  }, []);

  return null;
}
