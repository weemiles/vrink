import { useEffect } from 'react';

/**
 * A11y: 페이지별 document.title 업데이트 훅
 *
 * 스크린리더 사용자는 document.title로 현재 페이지를 인지합니다.
 * 모든 페이지에서 이 훅을 호출하여 컨텍스트를 제공합니다.
 *
 * @param pageTitle 페이지 제목 (예: "인연 목록")
 * @param appName 앱 이름 (기본: "keppin")
 */
export function useDocumentTitle(pageTitle: string, appName: string = 'keppin') {
  useEffect(() => {
    const prev = document.title;
    document.title = pageTitle ? `${pageTitle} — ${appName}` : appName;
    return () => {
      document.title = prev;
    };
  }, [pageTitle, appName]);
}
