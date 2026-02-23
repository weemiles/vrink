import { motion } from 'motion/react';

const SIZES = {
  small: { height: 32, fontSize: 13, padding: '0 12px', borderRadius: 8 },
  medium: { height: 40, fontSize: 14, padding: '0 16px', borderRadius: 10 },
  large: { height: 48, fontSize: 15, padding: '0 16px', borderRadius: 12 },
  xlarge: { height: 56, fontSize: 16, padding: '0 20px', borderRadius: 14 },
};

const COLOR_STYLES = {
  primary: {
    fill: 'btn-base btn-fill-primary',
    weak: 'btn-base btn-weak-primary',
  },
  danger: {
    fill: 'btn-base btn-fill-danger',
    weak: 'btn-base btn-weak-danger',
  },
  light: {
    fill: 'btn-base btn-fill-light',
    weak: 'btn-base btn-weak-light',
  },
  dark: {
    fill: 'btn-base btn-fill-dark',
    weak: 'btn-base btn-weak-dark',
  },
};

function ButtonLoader() {
  return (
    <div className="btn-loader" role="status" aria-label="로딩 중">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ opacity: [0.35, 1, 0.35] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: 'linear' }}
        />
      ))}
    </div>
  );
}

export function TossButton({
  children,
  variant = 'fill',
  color = 'primary',
  size = 'xlarge',
  display = 'full',
  fullWidth = false,
  loading = false,
  disabled = false,
  className = '',
  ...rest
}) {
  const sizeStyle = SIZES[size] || SIZES.xlarge;
  const styleClass = (COLOR_STYLES[color] || COLOR_STYLES.primary)[variant] || COLOR_STYLES.primary.fill;
  const isDisabled = disabled || loading;

  return (
    <button
      type="button"
      disabled={isDisabled}
      className={[
        styleClass,
        display === 'full' || fullWidth ? 'btn-full' : '',
        className,
      ].join(' ').trim()}
      style={{
        height: sizeStyle.height,
        fontSize: sizeStyle.fontSize,
        padding: sizeStyle.padding,
        borderRadius: sizeStyle.borderRadius,
        minWidth: 44,
        minHeight: 44,
      }}
      aria-busy={loading || undefined}
      aria-disabled={isDisabled || undefined}
      {...rest}
    >
      {loading ? <ButtonLoader /> : children}
    </button>
  );
}
