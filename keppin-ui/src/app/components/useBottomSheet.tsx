import { useState, useCallback, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TossButton } from './TossButton';

/* TDS useBottomSheet Hook
 * - open(options): basic bottom sheet
 * - close(): close bottom sheet
 * - openOneButtonSheet(options): single button
 * - openTwoButtonSheet(options): two buttons
 * - openAsyncTwoButtonSheet(options): two buttons with async loading
 *
 * Based on TDS OverlayExtension pattern:
 * - closeOnDimmerClick: default true (unlike Dialog which is false)
 * - onExited / onEntered lifecycle callbacks
 * - Accessibility: aria-modal, role="dialog", tabIndex, focus lock
 */

interface BaseSheetOptions {
  children: React.ReactNode;
  header?: React.ReactNode;
  closeOnDimmerClick?: boolean;
  onEntered?: () => void;
  onExited?: () => void;
}

interface OneButtonOptions extends BaseSheetOptions {
  button?: string | React.ReactElement;
  closeOnButtonClick?: boolean;
}

interface TwoButtonOptions extends BaseSheetOptions {
  leftButton?: string | React.ReactElement;
  rightButton?: string | React.ReactElement;
  closeOnLeftButtonClick?: boolean;
  closeOnRightButtonClick?: boolean;
}

interface AsyncTwoButtonOptions extends TwoButtonOptions {
  onLeftButtonClick?: () => Promise<void>;
  onRightButtonClick?: () => Promise<void>;
}

type SheetType = 'basic' | 'oneButton' | 'twoButton' | 'asyncTwoButton';

interface SheetState {
  type: SheetType;
  open: boolean;
  options: BaseSheetOptions | OneButtonOptions | TwoButtonOptions | AsyncTwoButtonOptions;
  resolve?: (value: boolean) => void;
  onClose?: () => void;
}

interface BottomSheetContextType {
  open: (options: BaseSheetOptions & { onClose?: () => void }) => void;
  close: () => void;
  openOneButtonSheet: (options: OneButtonOptions) => Promise<void>;
  openTwoButtonSheet: (options: TwoButtonOptions) => Promise<boolean>;
  openAsyncTwoButtonSheet: (options: AsyncTwoButtonOptions) => Promise<boolean>;
}

const BottomSheetContext = createContext<BottomSheetContextType | null>(null);

export function useBottomSheetHook(): BottomSheetContextType {
  const ctx = useContext(BottomSheetContext);
  if (!ctx) {
    throw new Error('useBottomSheetHook must be used within a BottomSheetProvider');
  }
  return ctx;
}

export function BottomSheetProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SheetState | null>(null);
  const [loading, setLoading] = useState<'left' | 'right' | null>(null);

  const closeSheet = useCallback((result: boolean = false) => {
    if (state?.resolve) state.resolve(result);
    if (state?.onClose) state.onClose();
    setState((prev) => prev ? { ...prev, open: false } : null);
  }, [state]);

  const openBasic = useCallback((options: BaseSheetOptions & { onClose?: () => void }) => {
    setState({
      type: 'basic',
      open: true,
      options,
      onClose: options.onClose,
    });
  }, []);

  const openOneButtonSheet = useCallback((options: OneButtonOptions): Promise<void> => {
    return new Promise((resolve) => {
      setState({
        type: 'oneButton',
        open: true,
        options,
        resolve: () => resolve(),
      });
    });
  }, []);

  const openTwoButtonSheet = useCallback((options: TwoButtonOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        type: 'twoButton',
        open: true,
        options,
        resolve,
      });
    });
  }, []);

  const openAsyncTwoButtonSheet = useCallback((options: AsyncTwoButtonOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        type: 'asyncTwoButton',
        open: true,
        options,
        resolve,
      });
    });
  }, []);

  const handleDimmerClick = () => {
    const closeOnDimmer = state?.options?.closeOnDimmerClick ?? true;
    if (closeOnDimmer) closeSheet(false);
  };

  const handleLeftClick = async () => {
    if (state?.type === 'asyncTwoButton') {
      const opts = state.options as AsyncTwoButtonOptions;
      if (opts.onLeftButtonClick) {
        setLoading('left');
        try {
          await opts.onLeftButtonClick();
        } finally {
          setLoading(null);
        }
      }
    }
    const opts = state?.options as TwoButtonOptions;
    if (opts?.closeOnLeftButtonClick !== false) {
      closeSheet(false);
    }
  };

  const handleRightClick = async () => {
    if (state?.type === 'asyncTwoButton') {
      const opts = state.options as AsyncTwoButtonOptions;
      if (opts.onRightButtonClick) {
        setLoading('right');
        try {
          await opts.onRightButtonClick();
        } finally {
          setLoading(null);
        }
      }
    }
    const opts = state?.options as TwoButtonOptions;
    if (opts?.closeOnRightButtonClick !== false) {
      closeSheet(true);
    }
  };

  const handleOneButtonClick = () => {
    const opts = state?.options as OneButtonOptions;
    if (opts?.closeOnButtonClick !== false) {
      closeSheet(true);
    }
  };

  const handleExitComplete = () => {
    if (state?.options?.onExited) state.options.onExited();
    setState(null);
    setLoading(null);
  };

  const opts = state?.options;
  const oneOpts = opts as OneButtonOptions;
  const twoOpts = opts as TwoButtonOptions;
  const hasButtons = state?.type === 'oneButton' || state?.type === 'twoButton' || state?.type === 'asyncTwoButton';

  return (
    <BottomSheetContext.Provider value={{
      open: openBasic,
      close: () => closeSheet(false),
      openOneButtonSheet,
      openTwoButtonSheet,
      openAsyncTwoButtonSheet,
    }}>
      {children}
      <AnimatePresence onExitComplete={handleExitComplete}>
        {state?.open && opts && (
          <>
            {/* Overlay — TDS: greyOpacity500 = rgba(0,27,55,0.46) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[60]"
              style={{ backgroundColor: 'var(--toss-overlay-dim)' }}
              onClick={handleDimmerClick}
              aria-hidden="true"
            />
            {/* Sheet — TDS: top radius 16px, padding 24px, safe area bottom */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              onAnimationComplete={(def) => {
                if (def === 'animate' && opts.onEntered) opts.onEntered();
              }}
              className="fixed bottom-0 left-0 right-0 bg-[var(--toss-bg)] z-[61]"
              style={{
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                maxHeight: '80vh',
                paddingBottom: 'env(safe-area-inset-bottom, 16px)',
              }}
              role="dialog"
              aria-modal="true"
              aria-label={typeof opts.header === 'string' ? opts.header : '바텀시트'}
              tabIndex={0}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-9 h-1 rounded-full" style={{ backgroundColor: 'var(--toss-grey-300)' }} />
              </div>

              {/* Header */}
              {opts.header && (
                <div style={{ paddingLeft: 24, paddingRight: 24, paddingTop: 8, paddingBottom: 8 }}>
                  {typeof opts.header === 'string' ? (
                    <h3 className="text-[var(--toss-grey-900)]" style={{ fontSize: 18, fontWeight: 700 }}>
                      {opts.header}
                    </h3>
                  ) : (
                    opts.header
                  )}
                </div>
              )}

              {/* Content */}
              <div className="overflow-y-auto" style={{ maxHeight: 'calc(80vh - 120px)' }}>
                {opts.children}
              </div>

              {/* Buttons area */}
              {hasButtons && (
                <div className="flex gap-2" style={{ padding: '12px 24px 8px 24px' }}>
                  {(state.type === 'twoButton' || state.type === 'asyncTwoButton') && (
                    <TossButton
                      variant="weak"
                      color="light"
                      size="large"
                      display="full"
                      loading={loading === 'left'}
                      disabled={loading === 'right'}
                      onClick={handleLeftClick}
                    >
                      {typeof twoOpts.leftButton === 'string' ? twoOpts.leftButton : (twoOpts.leftButton || '취소')}
                    </TossButton>
                  )}
                  {state.type === 'oneButton' ? (
                    <TossButton
                      variant="fill"
                      color="primary"
                      size="large"
                      display="full"
                      onClick={handleOneButtonClick}
                    >
                      {typeof oneOpts.button === 'string' ? oneOpts.button : (oneOpts.button || '확인')}
                    </TossButton>
                  ) : (state.type === 'twoButton' || state.type === 'asyncTwoButton') ? (
                    <TossButton
                      variant="fill"
                      color="primary"
                      size="large"
                      display="full"
                      loading={loading === 'right'}
                      disabled={loading === 'left'}
                      onClick={handleRightClick}
                    >
                      {typeof twoOpts.rightButton === 'string' ? twoOpts.rightButton : (twoOpts.rightButton || '확인')}
                    </TossButton>
                  ) : null}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </BottomSheetContext.Provider>
  );
}