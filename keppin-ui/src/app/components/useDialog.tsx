import { useState, useCallback, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TossButton } from './TossButton';

/* TDS useDialog Hook
 * - openAlert(options): single-button alert (TDS AlertDialog pattern)
 * - openConfirm(options): two-button confirm (TDS ConfirmDialog pattern)
 * - openAsyncConfirm(options): confirm with async loading
 *
 * Based on TDS 7.4 AlertDialog/ConfirmDialog specs:
 * - AlertDialog Title: as='h3', color=grey800, typography=t4 (20px), fontWeight=bold
 * - AlertDialog Description: as='h3', color=grey600, typography=t6 (15px), fontWeight=medium
 * - AlertButton: size='medium', color=blue500, fontWeight=bold, variant=clear
 * - ConfirmDialog CancelButton: type='dark', style='weak', size='large'
 * - ConfirmDialog ConfirmButton: size='large'
 * - closeOnDimmerClick: default true (false => Wiggle animation)
 * - closeOnBackEvent: default true
 * - onClose required (if missing, won't close)
 * - Accessibility: role="alertdialog", aria-modal, aria-hidden background
 * - onExited / onEntered lifecycle callbacks
 * - portalContainer: default document.body
 *
 * ═══ TDS 컴포넌트 시스템화 보강판 §3 Overlay 선택 규칙 + §4 Toast 사용 경계 ═══
 * - "결정이 필요한 오류"(삭제, 종료, 결제)는 Toast 대신 openConfirm을 사용한다.
 * - "사용자 확인/선택 필수" 흐름에서만 Dialog를 사용한다.
 * - "여러 옵션 탐색"이면 useBottomSheet를 사용한다.
 * - 재시도 가능한 오류: 1차 인라인 → 2차 openAlert로 격상
 */

interface AlertOptions {
  title: React.ReactNode;
  description?: React.ReactNode;
  alertButton?: string;
  closeOnDimmerClick?: boolean;
  onExited?: () => void;
  onEntered?: () => void;
}

interface ConfirmOptions {
  title: React.ReactNode;
  description?: React.ReactNode;
  confirmButton?: string;
  cancelButton?: string;
  closeOnDimmerClick?: boolean;
  onExited?: () => void;
  onEntered?: () => void;
  destructive?: boolean;
}

interface AsyncConfirmOptions extends ConfirmOptions {
  onConfirmClick?: () => Promise<void>;
  onCancelClick?: () => Promise<void>;
}

interface DialogState {
  type: 'alert' | 'confirm' | 'asyncConfirm';
  open: boolean;
  options: AlertOptions | ConfirmOptions | AsyncConfirmOptions;
  resolve?: (value: boolean) => void;
}

interface DialogContextType {
  openAlert: (options: AlertOptions) => Promise<void>;
  openConfirm: (options: ConfirmOptions) => Promise<boolean>;
  openAsyncConfirm: (options: AsyncConfirmOptions) => Promise<boolean>;
}

const DialogContext = createContext<DialogContextType | null>(null);

export function useDialog(): DialogContextType {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return ctx;
}

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DialogState | null>(null);
  const [loading, setLoading] = useState<'confirm' | 'cancel' | null>(null);

  const close = useCallback((result: boolean = false) => {
    if (state?.resolve) state.resolve(result);
    setState((prev) => prev ? { ...prev, open: false } : null);
  }, [state]);

  const openAlert = useCallback((options: AlertOptions): Promise<void> => {
    return new Promise((resolve) => {
      setState({
        type: 'alert',
        open: true,
        options,
        resolve: () => resolve(),
      });
    });
  }, []);

  const openConfirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        type: 'confirm',
        open: true,
        options,
        resolve,
      });
    });
  }, []);

  const openAsyncConfirm = useCallback((options: AsyncConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        type: 'asyncConfirm',
        open: true,
        options,
        resolve,
      });
    });
  }, []);

  const handleConfirm = async () => {
    if (state?.type === 'asyncConfirm') {
      const opts = state.options as AsyncConfirmOptions;
      if (opts.onConfirmClick) {
        setLoading('confirm');
        try {
          await opts.onConfirmClick();
        } finally {
          setLoading(null);
        }
      }
    }
    close(true);
  };

  const handleCancel = async () => {
    if (state?.type === 'asyncConfirm') {
      const opts = state.options as AsyncConfirmOptions;
      if (opts.onCancelClick) {
        setLoading('cancel');
        try {
          await opts.onCancelClick();
        } finally {
          setLoading(null);
        }
      }
    }
    close(false);
  };

  const handleDimmerClick = () => {
    const closeOnDimmer = state?.options?.closeOnDimmerClick ?? true;
    if (closeOnDimmer) {
      close(false);
    }
  };

  const handleExitComplete = () => {
    if (state?.options?.onExited) state.options.onExited();
    setState(null);
    setLoading(null);
  };

  const opts = state?.options;
  const isConfirm = state?.type === 'confirm' || state?.type === 'asyncConfirm';
  const confirmOpts = opts as ConfirmOptions | undefined;

  return (
    <DialogContext.Provider value={{ openAlert, openConfirm, openAsyncConfirm }}>
      {children}
      <AnimatePresence onExitComplete={handleExitComplete}>
        {state?.open && opts && (
          <>
            {/* Overlay — TDS: role="button" for screen reader */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[80]"
              style={{ backgroundColor: 'var(--toss-overlay-dim)' }}
              onClick={handleDimmerClick}
              role="button"
              tabIndex={-1}
              aria-label="배경 클릭하여 닫기"
            />
            {/* Content — TDS Modal: borderRadius 16, padding 24 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onAnimationComplete={(def) => {
                if (def === 'animate' && opts.onEntered) opts.onEntered();
              }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[81] w-[calc(100%-48px)] max-w-[340px] bg-[var(--toss-bg)]"
              style={{ borderRadius: 16, padding: 24 }}
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="dialog-title"
              aria-describedby={opts.description ? 'dialog-desc' : undefined}
              tabIndex={0}
            >
              <h3
                id="dialog-title"
                className="text-[var(--toss-grey-800)] text-center"
                style={{ fontSize: 'var(--typo-4-size)', fontWeight: 700, lineHeight: 'var(--typo-4-lh)' }}
              >
                {opts.title}
              </h3>
              {opts.description && (
                <p
                  id="dialog-desc"
                  className="mt-2 text-[var(--toss-grey-600)] text-center"
                  style={{ fontSize: 'var(--typo-6-size)', fontWeight: 500, lineHeight: 'var(--typo-6-lh)' }}
                >
                  {opts.description}
                </p>
              )}
              {/* TDS: button gap 8px, button height 48px */}
              <div className="flex gap-2 mt-6">
                {isConfirm && (
                  <TossButton
                    variant="weak"
                    color="light"
                    size="large"
                    display="full"
                    loading={loading === 'cancel'}
                    disabled={loading === 'confirm'}
                    onClick={handleCancel}
                  >
                    {confirmOpts?.cancelButton || '취소'}
                  </TossButton>
                )}
                <TossButton
                  variant="fill"
                  color={confirmOpts?.destructive ? 'danger' : 'primary'}
                  size="large"
                  display="full"
                  loading={loading === 'confirm'}
                  disabled={loading === 'cancel'}
                  onClick={state.type === 'alert' ? () => close(true) : handleConfirm}
                >
                  {isConfirm
                    ? (confirmOpts?.confirmButton || '확인')
                    : ((opts as AlertOptions).alertButton || '확인')
                  }
                </TossButton>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </DialogContext.Provider>
  );
}