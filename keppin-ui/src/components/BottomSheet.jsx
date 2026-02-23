import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  footer,
  closeOnDimmerClick = true,
}) {
  const onDimClick = () => {
    if (closeOnDimmerClick) onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onDimClick}
            aria-hidden="true"
          />
          <motion.aside
            className="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            role="dialog"
            aria-modal="true"
          >
            <div className="sheet-handle-wrap">
              <div className="sheet-handle" />
            </div>
            <header className="sheet-header">
              <h2>{title || '바텀시트'}</h2>
              <button type="button" className="sheet-close" onClick={onClose} aria-label="닫기">
                <X size={20} />
              </button>
            </header>
            <div className="sheet-body">{children}</div>
            {footer ? <footer className="sheet-footer">{footer}</footer> : null}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
