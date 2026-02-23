import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X } from 'lucide-react';

/* TDS Toast — §3.2 가이드 작성 규칙 적용 (조합형)
 *
 * ═══ 1) 상위 타입 (§3.2B: 큰 구조) ═══
 * - 용도: 상태 알림 전용 (선택/확인은 Dialog/BottomSheet)
 * - API 스타일: Flat (§1.4 — 구조 고정)
 * - position: top | bottom (기본 bottom)
 *
 * ═══ 2) Worst case (§3.2C: 모든 옵션 사용) ═══
 * <Toast open text="완료" position="bottom" duration={5}
 *   icon={<ToastIcon type="complete"/>}
 *   button={<ToastButton text="실행취소" onPress={fn}/>}
 *   bottomOffset={80} onClose={fn} onExited={fn} onEntered={fn} />
 *
 * ═══ 3) 구성 요소 ═══
 * - text: 필수 메시지 텍스트
 * - icon: 좌측 아이콘 (complete/error/info)
 * - button: 우측 액션 버튼 (bottom 전용, 최대 5초)
 * - duration: 기본 3초, 버튼 포함 시 최대 5초 (--tds-toast-max-duration)
 * - bottomOffset: 하단 여백 (BottomTabBar 높이 반영용)
 *
 * ═══ 4) 상태 변화 디테일 ═══
 * - duration 초 후 자동 닫힘
 * - 버튼 포함 Toast 최대 5초 (§Toast 경계 규칙)
 * - 중요 메시지(결정 필요)는 Toast가 아닌 Dialog 격상
 *
 * ═══ 5) 접근성 — §3.2D 하단 고정 ═══
 * - role="status", aria-live="polite"
 * - 큰 텍스트: 텍스트 영역 flex-wrap 허용
 * - VoiceOver: text 자동 읽기 (aria-live)
 */

interface ToastButtonProps {
  text: string;
  onPress?: () => void;
}

function ToastButton({ text, onPress }: ToastButtonProps) {
  return (
    <button
      onClick={onPress}
      className="shrink-0 text-white/90 active:text-white/60 transition-colors"
      style={{ fontSize: 14, fontWeight: 600, minWidth: 44, minHeight: 36 }}
    >
      {text}
    </button>
  );
}

interface ToastIconProps {
  type?: 'complete' | 'error' | 'info';
}

function ToastIcon({ type = 'complete' }: ToastIconProps) {
  const icons = {
    complete: <Check size={16} className="text-white" strokeWidth={3} />,
    error: <X size={16} className="text-white" strokeWidth={3} />,
    info: (
      <div className="rounded-full bg-white/20 flex items-center justify-center" style={{ width: 18, height: 18 }}>
        <span className="text-white" style={{ fontSize: 12, fontWeight: 700 }}>i</span>
      </div>
    ),
  };
  return (
    <div className="shrink-0 flex items-center justify-center" style={{ width: 20, height: 20 }}>
      {icons[type]}
    </div>
  );
}

interface ToastProps {
  open: boolean;
  text: string;
  onClose: () => void;
  icon?: React.ReactNode;
  position?: 'top' | 'bottom';
  duration?: number;
  onExited?: () => void;
  onEntered?: () => void;
  button?: React.ReactNode;
  bottomOffset?: number;
}

export function Toast({
  open,
  text,
  onClose,
  icon,
  position = 'bottom',
  duration,
  onExited,
  onEntered,
  button,
  bottomOffset = 20,
}: ToastProps) {
  const effectiveDuration = duration ?? (button ? 5 : 3);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(handleClose, effectiveDuration * 1000);
    return () => clearTimeout(timer);
  }, [open, effectiveDuration, handleClose]);

  const positionStyles: React.CSSProperties = position === 'top'
    ? { top: 'env(safe-area-inset-top, 12px)', left: 16, right: 16 }
    : { bottom: bottomOffset, left: 16, right: 16 };

  return (
    <AnimatePresence
      onExitComplete={onExited}
    >
      {open && (
        <motion.div
          initial={{ opacity: 0, y: position === 'top' ? -20 : 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: position === 'top' ? -20 : 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onAnimationComplete={(def) => {
            if (def === 'animate' && onEntered) onEntered();
          }}
          className="fixed z-[100]"
          style={positionStyles}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <div
            className="flex items-center gap-2.5 w-full shadow-lg"
            style={{
              backgroundColor: 'var(--toss-grey-800)',
              borderRadius: 12,
              padding: '12px 16px',
              minHeight: 48,
            }}
          >
            {icon && <div className="shrink-0">{icon}</div>}
            <span className="flex-1 text-white" style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.4 }}>
              {text}
            </span>
            {position === 'bottom' && button && (
              <div className="shrink-0 ml-1">{button}</div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

Toast.Button = ToastButton;
Toast.Icon = ToastIcon;