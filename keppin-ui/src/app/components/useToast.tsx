import { useState, useCallback, createContext, useContext, useRef } from 'react';
import { Toast } from './Toast';

/* TDS useToast Hook (7.5) + 실무 운영 규칙 7, §3.2
 * - openToast(text, options?): show toast
 * - duration: ms (default 3000 no button, 5000 with button)
 * - type: 'top' | 'bottom' (default 'bottom')
 * - gap: number (top/bottom distance, highest priority)
 * - icon: string (lottie와 동시 불가)
 * - iconType: 'circle' | 'square'
 * - button: { text, onClick }
 * - higherThanCTA: boolean (default false)
 * §3.2 bottomOffset 규칙:
 *   - 기본: 20px
 *   - 하단 CTA 있을 때: 90px
 *   - 홈 인디케이터 보정: +34px
 *   - 버튼 있는 토스트: 정말 필요한 경우에만 사용
 *
 * ═══ TDS 컴포넌트 시스템화 보강판 §4 Toast 사용 경계 ═══
 * - Toast는 **상태 알림**에만 사용한다. (예: "저장 완료", "복사됨", "토글 변경됨")
 * - 사용자 **선택/확인**이 필요한 메시지는 Dialog/BottomSheet로 올린다.
 * - 버튼이 달린 Toast는 기본 5초로 짧으므로, 중요 메시지는 Dialog로 격상한다.
 * - "결정이 필요한 오류"(삭제, 종료, 결제)는 Toast 금지 → Dialog/BottomSheet 사용.
 * - "재시도 가능한 네트워크 오류"는 1차 섹션 재시도 → 2차 Result.Button → Toast는 보조 알림만.
 */

interface OpenToastOptions {
  type?: 'top' | 'bottom';
  gap?: number;
  icon?: React.ReactNode;
  iconType?: 'circle' | 'square';
  button?: { text: string; onClick: () => void };
  higherThanCTA?: boolean;
  duration?: number;
}

interface ToastContextType {
  openToast: (text: string, options?: OpenToastOptions) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}

interface ToastState {
  open: boolean;
  text: string;
  options: OpenToastOptions;
  id: number;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const idRef = useRef(0);

  const openToast = useCallback((text: string, options: OpenToastOptions = {}) => {
    idRef.current += 1;
    setToast({
      open: true,
      text,
      options,
      id: idRef.current,
    });
  }, []);

  const handleClose = useCallback(() => {
    setToast((prev) => prev ? { ...prev, open: false } : null);
  }, []);

  const handleExited = useCallback(() => {
    setToast(null);
  }, []);

  const position = toast?.options.type || 'bottom';
  const hasButton = !!toast?.options.button;
  const defaultDuration = hasButton ? 5 : 3;
  const duration = toast?.options.duration
    ? toast.options.duration / 1000
    : defaultDuration;
  const bottomOffset = toast?.options.gap ?? (toast?.options.higherThanCTA ? 90 + 34 : 20 + 34);

  return (
    <ToastContext.Provider value={{ openToast }}>
      {children}
      <Toast
        key={toast?.id}
        open={toast?.open ?? false}
        text={toast?.text ?? ''}
        onClose={handleClose}
        onExited={handleExited}
        position={position}
        duration={duration}
        bottomOffset={position === 'bottom' ? bottomOffset : undefined}
        icon={toast?.options.icon}
        button={
          toast?.options.button ? (
            <Toast.Button
              text={toast.options.button.text}
              onPress={() => {
                toast.options.button?.onClick();
                handleClose();
              }}
            />
          ) : undefined
        }
      />
    </ToastContext.Provider>
  );
}