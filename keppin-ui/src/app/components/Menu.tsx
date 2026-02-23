import { useState, useRef, useEffect, useCallback, useId } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check } from 'lucide-react';
import { MOTION_TIMING } from './useMotionConfig';

/**
 * TDS Menu — §3.2 가이드 작성 규칙 적용 + 아티클 2편 근거
 *
 * ═══ 1) 상위 타입 (§3.2B: 큰 구조) ═══
 * - 용도: 옵션 3~6개 선택 (§1.1 물리적 거리 최소화)
 * - API 스타일: Flat (§1.4 — 구조 고정, 고빈도)
 * - 비교: 7개+ 또는 복잡 UI → BottomSheet, 확인/선택 필수 → Dialog
 *
 * ═══ 2) Worst case (§3.2C: 모든 옵션 사용) ═══
 * <Menu items={[{value,label,icon,disabled,destructive},...8개]}
 *   value="selected" onSelect={fn} placement="bottom-end"
 *   aria-label="메뉴 이름"
 *   trigger={({ref,onClick,isOpen}) => <TextButton ref={ref} onClick={onClick}>트리거</TextButton>}
 * />
 *
 * ═══ 3) 구성 요소 (§3.2B: 상세) ═══
 * - 블러 배경(20px) + 밝은 외곽선 = 유리 같은 가벼움 (§2.5)
 * - 트리거 위치 기준 transform-origin 모션 (spring, 175ms)
 * - 체크형 패턴: 좌측 배치 (§2.4A — 50% 이상 사용 → 독립 패턴)
 * - 너비 정책: min 160px / max 280px (§2.4B — 5자+ 대응)
 * - 7개+ 아이템: 상/하단 스크롤 페이드 (§2.4C)
 * - placement: bottom-start | bottom-end | top-start | top-end
 *
 * ═══ 4) 상태 변화 디테일 ═══
 * - value 지정 시: 체크마크 좌측 표시 (선택형 메뉴)
 * - disabled 아이템: opacity 40%, 클릭/포커스 불가
 * - destructive 아이템: 빨간색 텍스트 + 빨간색 체크
 * - 7개+ 스크롤 시: 상/하단 그라디언트 페이드 자동 등장
 *
 * ═══ 5) 의사결정 근거 (§1.3~1.4) ═══
 * - A/B 실험 10일, Android CTR 바텀시트 대비 +10%
 * - 제작 속도 약 3~5배 향상 (§2.7)
 * - 처음부터 완벽 집착 금지, OS 기본 → 나중 디벨롭 (§1.5)
 *
 * ═══ 6) 접근성 — §3.2D 하단 고정 ═══
 * - 열림: 포커스를 현재 선택 또는 첫 아이템으로 이동
 * - 닫힘: 트리거로 포커스 복귀
 * - 스크린리더용 투명 닫기 영역 (role="button")
 * - 장식 아이콘 aria-hidden="true"
 * - Arrow key ↑↓ 내비게이션 + Enter/Space 선택 + ESC 닫기
 * - 큰 텍스트: word-break:keep-all + 아이콘 스케일
 * - VoiceOver: aria-checked로 선택 상태 전달
 */

/* ─── 타입 ─── */
export interface MenuItem {
  value: string;
  label: string;
  icon?: React.ReactNode;
  /** 비활성화 */
  disabled?: boolean;
  /** 위험 액션 (빨간색) */
  destructive?: boolean;
}

type MenuPlacement = 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';

interface MenuProps {
  /** 메뉴 아이템 목록 */
  items: MenuItem[];
  /** 현재 선택된 값 — 체크 표시에 사용 */
  value?: string;
  /** 아이템 선택 콜백 */
  onSelect: (value: string) => void;
  /** 트리거 버튼 렌더링 */
  trigger: (props: { ref: React.Ref<HTMLButtonElement>; onClick: () => void; isOpen: boolean }) => React.ReactNode;
  /** 배치 방향 */
  placement?: MenuPlacement;
  /** aria-label */
  'aria-label'?: string;
}

/* ─── 스크롤 페이드 임계값 ─── */
const SCROLL_FADE_THRESHOLD = 7;
const MAX_VISIBLE_HEIGHT = 6.5 * 44; // 6.5 items * 44px

export function Menu({
  items,
  value,
  onSelect,
  trigger,
  placement = 'bottom-end',
  'aria-label': ariaLabel = '메뉴',
}: MenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [focusIndex, setFocusIndex] = useState(-1);
  const uniqueId = useId();

  /* 스크롤 페이드 상태 */
  const needsScroll = items.length >= SCROLL_FADE_THRESHOLD;
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);

  const updateScrollFade = useCallback(() => {
    const el = listRef.current;
    if (!el || !needsScroll) return;
    setShowTopFade(el.scrollTop > 4);
    setShowBottomFade(el.scrollTop + el.clientHeight < el.scrollHeight - 4);
  }, [needsScroll]);

  /* 열기/닫기 */
  const open = useCallback(() => {
    setIsOpen(true);
    setFocusIndex(value ? items.findIndex(i => i.value === value) : 0);
  }, [value, items]);

  const close = useCallback(() => {
    setIsOpen(false);
    setFocusIndex(-1);
    // §2.6 닫힘 시 트리거로 포커스 복귀
    requestAnimationFrame(() => {
      triggerRef.current?.focus();
    });
  }, []);

  const handleSelect = useCallback((item: MenuItem) => {
    if (item.disabled) return;
    onSelect(item.value);
    close();
  }, [onSelect, close]);

  /* ESC 키 닫기 + 외부 클릭 닫기 */
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          close();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setFocusIndex(prev => {
            let next = prev + 1;
            while (next < items.length && items[next].disabled) next++;
            return next < items.length ? next : prev;
          });
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusIndex(prev => {
            let next = prev - 1;
            while (next >= 0 && items[next].disabled) next--;
            return next >= 0 ? next : prev;
          });
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (focusIndex >= 0 && focusIndex < items.length) {
            handleSelect(items[focusIndex]);
          }
          break;
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        close();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, close, focusIndex, items, handleSelect]);

  /* 포커스된 아이템이 보이도록 스크롤 */
  useEffect(() => {
    if (!isOpen || focusIndex < 0) return;
    const el = listRef.current?.children[focusIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [focusIndex, isOpen]);

  /* 스크롤 페이드 감지 */
  useEffect(() => {
    if (!isOpen || !needsScroll) return;
    const el = listRef.current;
    if (!el) return;
    // 초기 상태 세팅
    requestAnimationFrame(updateScrollFade);
    el.addEventListener('scroll', updateScrollFade, { passive: true });
    return () => el.removeEventListener('scroll', updateScrollFade);
  }, [isOpen, needsScroll, updateScrollFade]);

  /* 배치 계산 */
  const getPlacementStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = { position: 'absolute', zIndex: 65 };
    switch (placement) {
      case 'bottom-start': return { ...base, top: '100%', left: 0, marginTop: 4 };
      case 'bottom-end': return { ...base, top: '100%', right: 0, marginTop: 4 };
      case 'top-start': return { ...base, bottom: '100%', left: 0, marginBottom: 4 };
      case 'top-end': return { ...base, bottom: '100%', right: 0, marginBottom: 4 };
    }
  };

  const getTransformOrigin = (): string => {
    switch (placement) {
      case 'bottom-start': return 'top left';
      case 'bottom-end': return 'top right';
      case 'top-start': return 'bottom left';
      case 'top-end': return 'bottom right';
    }
  };

  const hasChecked = value !== undefined;

  return (
    <div className="relative inline-flex">
      {/* 트리거 */}
      {trigger({
        ref: triggerRef,
        onClick: () => (isOpen ? close() : open()),
        isOpen,
      })}

      <AnimatePresence>
        {isOpen && (
          <>
            {/* §2.6 스크린리더용 투명 닫기 영역 */}
            <div
              className="fixed inset-0 z-[64]"
              onClick={close}
              aria-label="메뉴 닫기"
              role="button"
              tabIndex={-1}
            />
            {/* 메뉴 패널 */}
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{
                type: 'spring',
                damping: 28,
                stiffness: 400,
                duration: MOTION_TIMING.small.default / 1000,
              }}
              style={{
                ...getPlacementStyle(),
                transformOrigin: getTransformOrigin(),
                minWidth: 'var(--tds-menu-min-width, 160px)',
                maxWidth: 'var(--tds-menu-max-width, 280px)',
                borderRadius: 'var(--tds-menu-radius, 14px)',
                backgroundColor: 'var(--tds-menu-bg)',
                backdropFilter: 'blur(var(--tds-menu-blur, 20px))',
                WebkitBackdropFilter: 'blur(var(--tds-menu-blur, 20px))',
                border: '1px solid var(--tds-menu-border)',
                boxShadow: 'var(--tds-menu-shadow)',
                overflow: 'hidden',
              }}
              role="menu"
              aria-label={ariaLabel}
              id={`menu-${uniqueId}`}
            >
              {/* §2.4C 상단 스크롤 페이드 (7개+ 일 때) */}
              {needsScroll && showTopFade && (
                <div
                  className="absolute top-0 left-0 right-0 z-10 pointer-events-none"
                  style={{
                    height: 24,
                    background: 'linear-gradient(to bottom, var(--tds-menu-bg), transparent)',
                    borderRadius: 'var(--tds-menu-radius, 14px) var(--tds-menu-radius, 14px) 0 0',
                  }}
                  aria-hidden="true"
                />
              )}

              {/* 아이템 목록 */}
              <div
                ref={listRef}
                className="overflow-y-auto"
                style={{
                  maxHeight: needsScroll ? MAX_VISIBLE_HEIGHT : undefined,
                  padding: '6px 0',
                }}
              >
                {items.map((item, i) => {
                  const isSelected = value === item.value;
                  const isFocused = focusIndex === i;

                  return (
                    <button
                      key={item.value}
                      role="menuitem"
                      id={`menu-item-${uniqueId}-${i}`}
                      aria-checked={hasChecked ? isSelected : undefined}
                      aria-disabled={item.disabled || undefined}
                      tabIndex={isFocused ? 0 : -1}
                      onClick={() => handleSelect(item)}
                      className={`
                        w-full flex items-center gap-3 transition-colors text-left
                        ${item.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                        ${isFocused && !item.disabled ? 'bg-[var(--toss-grey-opacity-100)]' : ''}
                        ${!item.disabled ? 'active:bg-[var(--toss-grey-opacity-200)]' : ''}
                      `}
                      style={{
                        minHeight: 'var(--tds-menu-item-height, 44px)',
                        padding: `0 var(--tds-menu-item-padding, 16px)`,
                        fontSize: 15,
                        fontWeight: isSelected ? 600 : 400,
                        color: item.destructive
                          ? 'var(--toss-red-500)'
                          : 'var(--toss-text-primary)',
                      }}
                    >
                      {/* §2.4A 체크형 패턴: 좌측 배치로 인지성 향상 */}
                      {hasChecked && (
                        <span
                          className="shrink-0 flex items-center justify-center"
                          style={{ width: 20, height: 20 }}
                          aria-hidden="true"
                        >
                          {isSelected && (
                            <Check
                              size={16}
                              strokeWidth={2.5}
                              className={item.destructive ? 'text-toss-red' : 'text-toss-blue'}
                            />
                          )}
                        </span>
                      )}
                      {/* 아이콘 (장식용 — aria-hidden) */}
                      {item.icon && (
                        <span className="shrink-0 flex items-center" aria-hidden="true">
                          {item.icon}
                        </span>
                      )}
                      {/* §2.4B 라벨: word-break 글자 단위 개행 허용 */}
                      <span className="flex-1" style={{ wordBreak: 'keep-all', overflowWrap: 'break-word' }}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* §2.4C 하단 스크롤 페이드 */}
              {needsScroll && showBottomFade && (
                <div
                  className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none"
                  style={{
                    height: 24,
                    background: 'linear-gradient(to top, var(--tds-menu-bg), transparent)',
                    borderRadius: '0 0 var(--tds-menu-radius, 14px) var(--tds-menu-radius, 14px)',
                  }}
                  aria-hidden="true"
                />
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}