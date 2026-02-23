import { useState, useRef, useId } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TossButton } from './TossButton';
import { useFocusTrap } from './useFocusTrap';

/* TDS Popup / Dialog — §3.2 가이드 작성 규칙 적용
 *
 * ═══ 1) 상위 타입 (§3.2B: 큰 구조) ═══
 * - AlertDialog: 버튼 1개 (확인만) — 사용자 인지만 필요할 때
 * - ConfirmDialog: 버튼 2개 (취소+확인) — 사용자 결정이 필요할 때
 * - API 스타일: Flat (§1.4 — 구조 고정, 고빈도)
 *
 * ═══ 2) Worst case (§3.2C: 모든 옵션 사용) ═══
 * <Popup isOpen title="제목" description="설명"
 *   confirmText="확인" cancelText="취소" destructive
 *   onConfirm={async()=>{}} onClose={fn} closeOnDimmerClick={false}
 *   onExited={fn} onEntered={fn}>
 *   {children}
 * </Popup>
 *
 * ═══ 3) 구성 요소 (§3.2B: 상세) ═══
 * - Border radius: 16px
 * - Inner padding: 24px
 * - Button height: 48px (large), gap: 8px
 * - closeOnDimmerClick: 기본 false (TDS — 확인/선택 필수 흐름)
 * - loading: async confirm 시 로딩 상태 자동 처리
 * - onExited: 닫힘 + 애니메이션 완료 후 호출
 *
 * ═══ 4) 상태 변화 디테일 ═══
 * - destructive=true: 확인 버튼이 danger 색상
 * - loading 중: 버튼 disabled + 스피너
 * - cancelText 미지정: AlertDialog (1버튼), 지정: ConfirmDialog (2버튼)
 *
 * ═══ 5) Overlay 선택 기준 (§3.2E 오버레이: position 추가) ═══
 * - Dialog → "확인/선택 필수" 흐름 전용
 * - closeOnDimmerClick 기본 false (닫으면 안 되는 성격)
 * - "결정 필요 오류"(삭제, 종료, 결제)는 Toast 대신 Dialog
 * - 여러 옵션 탐색이면 → BottomSheet
 * - position: 화면 중앙 고정 (fixed center)
 *
 * ═══ 6) 접근성 — §3.2D 하단 고정 ═══
 * - role="alertdialog", aria-modal, aria-hidden 배경
 * - §1.3 포커스 트랩: 열릴 때 제목 포커스, 외부 탈출 0회, 닫힐 때 트리거 복귀
 * - ESC 키 닫기
 * - 큰 텍스트: 제목/설명이 길어져도 스크롤 가능
 * - VoiceOver: title이 aria-labelledby로 연결
 */
interface PopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  destructive?: boolean;
  children?: React.ReactNode;
  closeOnDimmerClick?: boolean;
  onExited?: () => void;
  onEntered?: () => void;
}

export function Popup({
  isOpen,
  onClose,
  title,
  description,
  confirmText = '확인',
  cancelText,
  onConfirm,
  destructive = false,
  children,
  closeOnDimmerClick = false,
  onExited,
  onEntered,
}: PopupProps) {
  const [loading, setLoading] = useState(false);
  const isConfirmDialog = !!cancelText;
  const popupRef = useRef<HTMLDivElement>(null);
  const uniqueId = useId();
  const titleId = `popup-title-${uniqueId}`;
  const descId = `popup-desc-${uniqueId}`;

  // §1.3 포커스 트랩 — 열릴 때 제목으로 포커스, 닫힐 때 트리거 복귀
  const { triggerRef } = useFocusTrap({
    isActive: isOpen,
    containerRef: popupRef,
    initialFocus: 'title',
  });

  const handleDimmerClick = () => {
    if (closeOnDimmerClick) {
      onClose();
    }
  };

  const handleConfirm = async () => {
    if (onConfirm) {
      const result = onConfirm();
      if (result instanceof Promise) {
        setLoading(true);
        try {
          await result;
        } finally {
          setLoading(false);
        }
      }
    }
    onClose();
  };

  return (
    <AnimatePresence onExitComplete={() => {
      setLoading(false);
      onExited?.();
    }}>
      {isOpen && (
        <>
          {/* Overlay — TDS: role="presentation" for screen reader (not interactive) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70]"
            style={{ backgroundColor: 'var(--toss-overlay-dim)' }}
            onClick={handleDimmerClick}
            aria-hidden="true"
          />
          {/* Content — TDS: borderRadius 16, padding 24 */}
          <motion.div
            ref={popupRef}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onAnimationComplete={(def) => {
              if (def === 'animate' && onEntered) onEntered();
            }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[71] w-[calc(100%-48px)] max-w-[340px] bg-[var(--toss-bg)]"
            style={{ borderRadius: 16, padding: 24 }}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descId : undefined}
            tabIndex={0}
          >
            <h3
              id={titleId}
              className="text-[var(--toss-grey-800)] text-center"
              style={{ fontSize: 'var(--typo-4-size)', fontWeight: 700, lineHeight: 'var(--typo-4-lh)' }}
            >
              {title}
            </h3>
            {description && (
              <p
                id={descId}
                className="mt-2 text-[var(--toss-grey-600)] text-center"
                style={{ fontSize: 'var(--typo-6-size)', fontWeight: 500, lineHeight: 'var(--typo-6-lh)' }}
              >
                {description}
              </p>
            )}
            {children && <div className="mt-4">{children}</div>}
            {/* TDS: button gap 8px, button height 48px */}
            <div className="flex gap-2 mt-6">
              {isConfirmDialog && (
                <TossButton
                  variant="weak"
                  color="light"
                  size="large"
                  display="full"
                  disabled={loading}
                  onClick={onClose}
                >
                  {cancelText}
                </TossButton>
              )}
              <TossButton
                variant="fill"
                color={destructive ? 'danger' : 'primary'}
                size="large"
                display="full"
                loading={loading}
                onClick={handleConfirm}
                aria-label={loading ? '처리 중' : undefined}
              >
                {confirmText}
              </TossButton>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}