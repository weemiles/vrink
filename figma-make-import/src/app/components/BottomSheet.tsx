import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { useFocusTrap } from './useFocusTrap';
import { MOTION_TIMING } from './useMotionConfig';

/* TDS Bottom Sheet — §3.2 가이드 작성 규칙 적용
 *
 * ═══ 1) 상위 타입 (§3.2B: 큰 구조) ═══
 * - 용도: 여러 옵션 탐색, 보조 정보, 추가 설정
 * - API 스타일: Hybrid (§1.4 — children 슬롯으로 다양한 내부 구조 조립)
 *
 * ═══ 2) Worst case (§3.2C: 모든 옵션 사용) ═══
 * <BottomSheet isOpen title="제목" height="60vh"
 *   closeOnDimmerClick={false} onClose={fn}
 *   onExited={fn} onEntered={fn}
 *   footer={<TossButton>확인</TossButton>}>
 *   {children — 복잡한 폼/리스트/필터 등}
 * </BottomSheet>
 *
 * ═══ 3) 구성 요소 (§3.2B: 상세) ═══
 * - Top border-radius: 16px, Inner padding: 24px
 * - Safe Area bottom margin 필수
 * - Drag indicator (handle) 상단 표시
 * - title + X 닫기 버튼 (선택적)
 * - footer 슬롯 (하단 고정 버튼)
 *
 * ═══ 4) 상태 변화 디테일 ═══
 * - closeOnDimmerClick: 기본 true (탐색용이므로 자유 닫기)
 * - 닫히면 안 되는 플로우(결제, 법적 동의) → closeOnDimmerClick=false 잠금
 * - "확인/선택 필수" 흐름이면 → Dialog(Popup) 사용
 * - 닫힘 후 정리 작업 → 반드시 onExited에서만 처리
 * - 콘텐츠 스크롤 시: 상/하단 페이드 효과 (§2.4C 스크롤 인지)
 *
 * ═══ 5) Overlay 선택 기준 (§3.2E: position 추가) ═══
 * - 옵션 3~6개 + 트리거 명확 → Menu 사용 (물리적 거리 최소화)
 * - 옵션 7개+ 또는 보조 정보/필터 → BottomSheet 유지
 * - position: 화면 하단 고정 (fixed bottom), maxHeight: 80vh
 *
 * ═══ 6) 접근성 — §3.2D 하단 고정 ═══
 * - role="dialog", aria-modal, aria-hidden 오버레이
 * - §1.3 포커스 트랩: 열릴 때 제목/첫 입력 포커스, 외부 탈출 0회, 닫힐 때 트리거 복귀
 * - ESC 키 닫기
 * - 큰 텍스트: 콘텐츠 overflow-y-auto 보장
 * - VoiceOver: title이 aria-label로 제공
 */
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  height?: string;
  closeOnDimmerClick?: boolean;
  onExited?: () => void;
  onEntered?: () => void;
  footer?: React.ReactNode;
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  height = 'auto',
  closeOnDimmerClick = true,
  onExited,
  onEntered,
  footer,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  /* §2.4C 스크롤 콘텐츠 페이드 — 콘텐츠가 스크롤 가능하면 상/하단 페이드 표시 */
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);

  const updateContentFade = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;
    const hasScroll = el.scrollHeight > el.clientHeight + 4;
    setShowTopFade(el.scrollTop > 4);
    setShowBottomFade(hasScroll && el.scrollTop + el.clientHeight < el.scrollHeight - 4);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const el = contentRef.current;
    if (!el) return;
    // 초기 페이드 상태 + 애니메이션 후 업데이트
    const timer = setTimeout(updateContentFade, 100);
    el.addEventListener('scroll', updateContentFade, { passive: true });
    return () => {
      clearTimeout(timer);
      el.removeEventListener('scroll', updateContentFade);
    };
  }, [isOpen, updateContentFade]);

  // §1.3 포커스 트랩 — 열릴 때 제목/입력으로 포커스, 닫힐 때 트리거 복귀
  const { triggerRef } = useFocusTrap({
    isActive: isOpen,
    containerRef: sheetRef,
    initialFocus: 'title',
  });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  /* A11y: ESC 키로 바텀시트 닫기 */
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleDimmerClick = () => {
    if (closeOnDimmerClick) {
      onClose();
    }
  };

  return (
    <AnimatePresence onExitComplete={onExited}>
      {isOpen && (
        <>
          {/* Overlay — TDS: dimmer, aria-hidden for screen readers */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: MOTION_TIMING.screen.default / 1000 }} /* §1.2 화면 전환 250ms */
            className="fixed inset-0 z-[60]"
            style={{ backgroundColor: 'var(--toss-overlay-dim)' }}
            onClick={handleDimmerClick}
            aria-hidden="true"
          />
          <motion.div
            ref={sheetRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 300,
              duration: MOTION_TIMING.screen.max / 1000, /* §1.2 오버레이 최대 300ms */
            }}
            onAnimationComplete={(def) => {
              if (def === 'animate' && onEntered) onEntered();
            }}
            className="fixed bottom-0 left-0 right-0 bg-[var(--toss-bg)] z-[61]"
            style={{
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              maxHeight: '80vh',
              height,
              paddingBottom: 'env(safe-area-inset-bottom, 16px)',
            }}
            role="dialog"
            aria-modal="true"
            aria-label={title || '바텀시트'}
            tabIndex={0}
          >
            {/* Handle — TDS drag indicator */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-9 h-1 rounded-full bg-toss-grey-300" />
            </div>

            {/* Header */}
            {title && (
              <div className="flex items-center justify-between" style={{ paddingLeft: 24, paddingRight: 16, paddingTop: 8, paddingBottom: 8 }}>
                <h3 className="text-toss-grey-900" style={{ fontSize: 'var(--typo-sub9-size)', fontWeight: 700, lineHeight: 'var(--typo-sub9-lh)' }}>{title}</h3>
                <button
                  onClick={onClose}
                  className="flex items-center justify-center"
                  style={{ width: 44, height: 44 }}
                  aria-label="닫기"
                >
                  <X size={20} className="text-toss-grey-500" aria-hidden="true" />
                </button>
              </div>
            )}

            {/* Content — TDS: 24px inner padding */}
            {/* §2.4C 스크롤 콘텐츠 상단 페이드 (더 있음 인지) */}
            <div className="relative">
              {showTopFade && (
                <div
                  className="absolute top-0 left-0 right-0 z-10 pointer-events-none"
                  style={{ height: 20, background: 'linear-gradient(to bottom, var(--toss-bg), transparent)' }}
                  aria-hidden="true"
                />
              )}
              <div
                ref={contentRef}
                className="overflow-y-auto"
                style={{ paddingLeft: 24, paddingRight: 24, maxHeight: footer ? 'calc(80vh - 140px)' : 'calc(80vh - 80px)' }}
              >
                {children}
              </div>
              {/* §2.4C 스크롤 콘텐츠 하단 페이드 */}
              {showBottomFade && (
                <div
                  className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none"
                  style={{ height: 20, background: 'linear-gradient(to top, var(--toss-bg), transparent)' }}
                  aria-hidden="true"
                />
              )}
            </div>

            {/* Optional footer with buttons */}
            {footer && (
              <div style={{ padding: '12px 24px 8px 24px' }}>
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}