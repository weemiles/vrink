import { useEffect, useRef, useCallback } from 'react';

/**
 * TDS 제품 운영 확장 2-10, §1.3 — 모달/바텀시트 포커스 트랩 훅
 *
 * 오버레이가 열리면:
 *   - 최초 포커스는 "가장 중요한 제목" 또는 "첫 입력"으로 이동 (둘 중 1)
 *   - 오버레이 외부로 포커스가 나가면 0회여야 합격
 *
 * 닫힐 때:
 *   - 포커스는 오버레이를 연 트리거로 복귀
 *   - 복귀 실패 시: 화면 최상단(타이틀)으로 이동
 *
 * §1.2 포커스 순서(탐색) 규칙:
 *   - 시각적 읽기 순서(좌→우, 상→하)와 동일
 *   - 예외: 화면 상단 고정 CTA가 있을 때만(최대 1개) 포커스 순서를 앞당길 수 있음
 */

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

interface UseFocusTrapOptions {
  /** 활성 상태 */
  isActive: boolean;
  /** 컨테이너 ref */
  containerRef: React.RefObject<HTMLElement | null>;
  /** §1.3 최초 포커스 대상: 'title' | 'firstInput' | 'container' */
  initialFocus?: 'title' | 'firstInput' | 'container';
}

interface UseFocusTrapReturn {
  /** 트리거 요소에 연결할 ref (포커스 복귀용) */
  triggerRef: React.RefObject<HTMLElement | null>;
}

export function useFocusTrap(options: UseFocusTrapOptions): UseFocusTrapReturn {
  const { isActive, containerRef, initialFocus = 'title' } = options;
  const triggerRef = useRef<HTMLElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // 열릴 때: 이전 포커스 저장 + 초기 포커스 이동
  useEffect(() => {
    if (!isActive) return;

    // §1.3 이전 포커스 요소 저장 (트리거 복귀용)
    previousFocusRef.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    if (!container) return;

    // 짧은 딜레이 후 포커스 이동 (애니메이션 완료 대기)
    const timer = setTimeout(() => {
      if (!container) return;

      let target: HTMLElement | null = null;

      if (initialFocus === 'title') {
        // §1.3 "가장 중요한 제목"으로 이동
        target = container.querySelector<HTMLElement>(
          'h1, h2, h3, [role="heading"], [data-focus-initial]',
        );
      }

      if (!target && (initialFocus === 'firstInput' || initialFocus === 'title')) {
        // 제목 없으면 첫 입력으로 fallback
        target = container.querySelector<HTMLElement>(
          'input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled])',
        );
      }

      // 최종 fallback: 컨테이너 자체
      if (!target) {
        target = container;
      }

      target.focus({ preventScroll: true });
    }, 50);

    return () => clearTimeout(timer);
  }, [isActive, containerRef, initialFocus]);

  // 포커스 트랩: Tab 키 순환
  useEffect(() => {
    if (!isActive) return;

    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS),
      ).filter((el) => el.offsetParent !== null); // visible만

      if (focusableElements.length === 0) return;

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];

      // §1.3 외부로 포커스 탈출 방지
      if (e.shiftKey) {
        // Shift+Tab: 첫 요소에서 마지막으로 순환
        if (document.activeElement === first || document.activeElement === container) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // Tab: 마지막 요소에서 첫 요소로 순환
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    // 포커스가 컨테이너 바깥으로 빠지는 것을 방지
    const handleFocusIn = (e: FocusEvent) => {
      if (container && !container.contains(e.target as Node)) {
        e.stopPropagation();
        // 포커스를 다시 컨테이너 내부로
        const firstFocusable = container.querySelector<HTMLElement>(FOCUSABLE_SELECTORS);
        if (firstFocusable) {
          firstFocusable.focus();
        } else {
          container.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focusin', handleFocusIn);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusin', handleFocusIn);
    };
  }, [isActive, containerRef]);

  // §1.3 닫힐 때: 트리거로 포커스 복귀
  useEffect(() => {
    if (isActive) return;

    // 비활성화될 때 이전 포커스로 복귀
    const returnTarget = triggerRef.current || previousFocusRef.current;

    if (returnTarget && document.body.contains(returnTarget)) {
      // 트리거로 복귀
      returnTarget.focus({ preventScroll: true });
    } else {
      // §1.3 복귀 실패 시: 화면 최상단(타이틀)으로 이동
      const pageTitle = document.querySelector<HTMLElement>('h1, [data-page-title]');
      if (pageTitle) {
        pageTitle.setAttribute('tabindex', '-1');
        pageTitle.focus({ preventScroll: true });
      }
    }
  }, [isActive]);

  return { triggerRef };
}

/**
 * §1.2 포커스 순서 검증 유틸리티
 * 시각적 순서와 DOM 순서가 일치하는지 확인
 */
export function validateFocusOrder(container: HTMLElement): {
  valid: boolean;
  issues: string[];
} {
  const focusable = Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS),
  ).filter((el) => el.offsetParent !== null);

  const issues: string[] = [];

  // 세로 순서 확인: 각 요소의 offsetTop이 증가하는지
  for (let i = 1; i < focusable.length; i++) {
    const prev = focusable[i - 1].getBoundingClientRect();
    const curr = focusable[i].getBoundingClientRect();

    // 같은 행이면 왼쪽→오른쪽
    if (Math.abs(prev.top - curr.top) < 8) {
      if (curr.left < prev.left) {
        issues.push(
          `포커스 순서 역전: "${focusable[i - 1].textContent?.trim()}" → "${focusable[i].textContent?.trim()}"`,
        );
      }
    }
    // 다른 행이면 위→아래
    else if (curr.top < prev.top - 8) {
      issues.push(
        `포커스 순서 역전(행): "${focusable[i - 1].textContent?.trim()}" → "${focusable[i].textContent?.trim()}"`,
      );
    }
  }

  return { valid: issues.length === 0, issues };
}
