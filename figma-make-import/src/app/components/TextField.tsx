import { forwardRef, useState, useCallback, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { Eye, EyeOff, X, ChevronDown } from 'lucide-react';

/* TDS TextField (7.2)
 * - variant: 'box' | 'line' | 'big' | 'hero' (required)
 * - label: string
 * - labelOption: 'appear' | 'sustain' (default 'appear')
 * - help: ReactNode (helper/error text)
 * - hasError: boolean (default false)
 * - prefix/suffix: string
 * - right: ReactNode (right action)
 * - disabled: boolean (default false)
 * - format: { transform, reset }
 * - paddingTop/paddingBottom: string | number
 *
 * Sub-components:
 * - TextField.Clearable: with onClear
 * - TextField.Password: with visibility toggle
 * - TextField.Button: click-only field (like a select trigger)
 *
 * + 제품 운영 확장 4-12, §1 — Input 실무 운영 규칙:
 * §1.2 검증 타이밍: onChange=포맷만(에러 금지), onBlur=형식+에러, submit=서버+첫에러포커스
 * §1.3 에러: 필드당 1문장, 30자, 우선순위 필수>형식>범위
 * §1.4 자동 포맷: format.transform은 onChange에서만 실행 (에러 노출 없이)
 * §1.6 삭제: Clear 버튼(필드 내부), TextField.Clearable
 */
type TextFieldVariant = 'box' | 'line' | 'big' | 'hero';
type LabelOption = 'appear' | 'sustain';

interface TextFieldPublicProps {
  disabled?: boolean;
  prefix?: string;
  suffix?: string;
  right?: React.ReactNode;
  placeholder?: string;
  format?: { transform: (value: string) => string; reset?: (formattedValue: string) => string };
}

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'>, TextFieldPublicProps {
  variant: TextFieldVariant;
  label?: string;
  labelOption?: LabelOption;
  help?: React.ReactNode;
  hasError?: boolean;
  paddingTop?: string | number;
  paddingBottom?: string | number;
}

const VARIANT_STYLES: Record<TextFieldVariant, {
  height: number;
  fontSize: number;
  fontWeight: number;
  borderRadius: number;
  bg: boolean; // has background
  borderBottom: boolean;
}> = {
  box: { height: 52, fontSize: 16, fontWeight: 400, borderRadius: 12, bg: true, borderBottom: false },
  line: { height: 48, fontSize: 16, fontWeight: 400, borderRadius: 0, bg: false, borderBottom: true },
  big: { height: 56, fontSize: 22, fontWeight: 700, borderRadius: 12, bg: true, borderBottom: false },
  hero: { height: 64, fontSize: 28, fontWeight: 700, borderRadius: 12, bg: true, borderBottom: false },
};

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({
    variant,
    label,
    labelOption = 'appear',
    help,
    hasError = false,
    disabled = false,
    prefix,
    suffix,
    right,
    placeholder,
    format,
    paddingTop,
    paddingBottom,
    className = '',
    value,
    onChange,
    onFocus,
    onBlur,
    ...props
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = value !== undefined && value !== '';
    const showLabel = label && (labelOption === 'sustain' || (labelOption === 'appear' && hasValue));

    const vs = VARIANT_STYLES[variant];
    const inputId = props.id || (label ? `tf-${label.replace(/\s+/g, '-')}` : undefined);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      if (format) {
        const transformed = format.transform(e.target.value);
        e.target.value = transformed;
      }
      onChange?.(e);
    }, [format, onChange]);

    return (
      <div style={{ paddingTop, paddingBottom }} className="w-full">
        {/* Sustain label (always visible) */}
        {label && labelOption === 'sustain' && (
          <label
            htmlFor={inputId}
            className="block mb-1.5"
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: hasError ? 'var(--toss-textfield-error-color)' : 'var(--toss-textfield-label-color)',
            }}
          >
            {label}
          </label>
        )}

        <div
          className={`relative flex items-center transition-all ${className}`}
          style={{
            height: vs.height,
            borderRadius: vs.borderRadius,
            backgroundColor: vs.bg
              ? hasError
                ? 'var(--toss-textfield-bg-error)'
                : 'var(--toss-textfield-bg)'
              : 'transparent',
            borderBottom: vs.borderBottom
              ? `2px solid ${hasError ? 'var(--toss-textfield-border-error)' : isFocused ? 'var(--toss-textfield-border-focus)' : 'var(--toss-grey-200)'}`
              : undefined,
            boxShadow: vs.bg && isFocused && !hasError
              ? '0 0 0 2px var(--toss-textfield-border-focus)'
              : vs.bg && hasError
              ? '0 0 0 2px var(--toss-textfield-border-error)'
              : undefined,
            opacity: disabled ? 0.4 : 1,
          }}
        >
          {/* Appear label (floats above when has value) */}
          {label && labelOption === 'appear' && showLabel && (
            <span
              className="absolute left-4 transition-all pointer-events-none"
              style={{
                top: 6,
                fontSize: 11,
                fontWeight: 500,
                color: hasError ? 'var(--toss-textfield-error-color)' : 'var(--toss-textfield-label-color)',
              }}
            >
              {label}
            </span>
          )}

          {prefix && (
            <span className="shrink-0 pl-4 text-toss-grey-500" style={{ fontSize: vs.fontSize }}>
              {prefix}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            value={value}
            onChange={handleChange}
            onFocus={(e) => { setIsFocused(true); onFocus?.(e); }}
            onBlur={(e) => { setIsFocused(false); onBlur?.(e); }}
            disabled={disabled}
            placeholder={placeholder}
            className="w-full h-full bg-transparent outline-none text-toss-grey-900 placeholder-toss-grey-400"
            style={{
              fontSize: vs.fontSize,
              fontWeight: vs.fontWeight,
              paddingLeft: prefix ? 4 : 16,
              paddingRight: suffix || right ? 4 : 16,
              paddingTop: label && labelOption === 'appear' && showLabel ? 10 : 0,
            }}
            aria-invalid={hasError || undefined}
            aria-describedby={help ? `${inputId}-help` : undefined}
            {...props}
          />

          {suffix && (
            <span className="shrink-0 pr-4 text-toss-grey-500" style={{ fontSize: vs.fontSize }}>
              {suffix}
            </span>
          )}

          {right && (
            <div className="shrink-0 pr-3 flex items-center">{right}</div>
          )}
        </div>

        {help && (
          <p
            id={`${inputId}-help`}
            className="mt-1.5"
            style={{
              fontSize: 12,
              color: hasError ? 'var(--toss-textfield-error-color)' : 'var(--toss-textfield-help-color)',
            }}
            role={hasError ? 'alert' : undefined}
          >
            {help}
          </p>
        )}
      </div>
    );
  }
);

TextField.displayName = 'TextField';

/* TextField.Clearable */
interface ClearableProps extends Omit<TextFieldProps, 'right'> {
  onClear?: () => void;
}

const TextFieldClearable = forwardRef<HTMLInputElement, ClearableProps>(
  ({ onClear, value, ...props }, ref) => {
    const hasValue = value !== undefined && value !== '';

    return (
      <TextField
        ref={ref}
        value={value}
        right={
          hasValue ? (
            <button
              type="button"
              onClick={onClear}
              className="flex items-center justify-center"
              style={{ width: 28, height: 28 }}
              aria-label="입력 내용 지우기"
            >
              <X size={16} className="text-toss-grey-400" />
            </button>
          ) : undefined
        }
        {...props}
      />
    );
  }
);

TextFieldClearable.displayName = 'TextField.Clearable';

/* TextField.Password */
interface PasswordProps extends Omit<TextFieldProps, 'right' | 'type'> {
  onVisibilityChange?: (visible: boolean) => void;
}

const TextFieldPassword = forwardRef<HTMLInputElement, PasswordProps>(
  ({ onVisibilityChange, ...props }, ref) => {
    const [visible, setVisible] = useState(false);

    const toggle = () => {
      const next = !visible;
      setVisible(next);
      onVisibilityChange?.(next);
    };

    return (
      <TextField
        ref={ref}
        type={visible ? 'text' : 'password'}
        right={
          <button
            type="button"
            onClick={toggle}
            className="flex items-center justify-center"
            style={{ width: 28, height: 28 }}
            aria-label={visible ? '비밀번호 숨기기' : '비밀번호 보기'}
          >
            {visible
              ? <EyeOff size={18} className="text-toss-grey-400" />
              : <Eye size={18} className="text-toss-grey-400" />}
          </button>
        }
        {...props}
      />
    );
  }
);

TextFieldPassword.displayName = 'TextField.Password';

/* TextField.Button — click-only, looks like a field */
interface ButtonFieldProps extends Omit<TextFieldProps, 'onChange' | 'value' | 'right'> {
  onClick?: () => void;
  displayValue?: string;
}

const TextFieldButton = forwardRef<HTMLInputElement, ButtonFieldProps>(
  ({ onClick, displayValue, placeholder, ...props }, ref) => {
    return (
      <TextField
        ref={ref}
        value={displayValue || ''}
        readOnly
        onClick={onClick}
        placeholder={placeholder}
        right={
          <ChevronDown size={24} className="text-toss-grey-400" />
        }
        style={{ cursor: 'pointer' }}
        {...props}
      />
    );
  }
);

TextFieldButton.displayName = 'TextField.Button';

/* TextArea (7.2.2) */
interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'prefix'> {
  variant: TextFieldVariant;
  label?: string;
  labelOption?: LabelOption;
  help?: React.ReactNode;
  hasError?: boolean;
  height?: string | number;
  minHeight?: string | number;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({
    variant,
    label,
    labelOption = 'appear',
    help,
    hasError = false,
    disabled = false,
    placeholder,
    height,
    minHeight,
    className = '',
    value,
    onChange,
    onFocus,
    onBlur,
    ...props
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const vs = VARIANT_STYLES[variant];
    const inputId = props.id || (label ? `ta-${label.replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block mb-1.5"
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: hasError ? 'var(--toss-textfield-error-color)' : 'var(--toss-textfield-label-color)',
            }}
          >
            {label}
          </label>
        )}

        <div
          className={`relative transition-all ${className}`}
          style={{
            borderRadius: vs.borderRadius,
            backgroundColor: vs.bg
              ? hasError ? 'var(--toss-textfield-bg-error)' : 'var(--toss-textfield-bg)'
              : 'transparent',
            boxShadow: isFocused && !hasError
              ? '0 0 0 2px var(--toss-textfield-border-focus)'
              : hasError
              ? '0 0 0 2px var(--toss-textfield-border-error)'
              : undefined,
            opacity: disabled ? 0.4 : 1,
          }}
        >
          <textarea
            ref={ref}
            id={inputId}
            value={value}
            onChange={onChange}
            onFocus={(e) => { setIsFocused(true); onFocus?.(e); }}
            onBlur={(e) => { setIsFocused(false); onBlur?.(e); }}
            disabled={disabled}
            placeholder={placeholder}
            className="w-full bg-transparent outline-none text-toss-grey-900 placeholder-toss-grey-400 resize-none"
            style={{
              fontSize: vs.fontSize,
              fontWeight: vs.fontWeight,
              padding: 16,
              height: height || undefined,
              minHeight: minHeight || 100,
              borderRadius: vs.borderRadius,
            }}
            aria-invalid={hasError || undefined}
            aria-describedby={help ? `${inputId}-help` : undefined}
            {...props}
          />
        </div>

        {help && (
          <p
            id={`${inputId}-help`}
            className="mt-1.5"
            style={{
              fontSize: 12,
              color: hasError ? 'var(--toss-textfield-error-color)' : 'var(--toss-textfield-help-color)',
            }}
            role={hasError ? 'alert' : undefined}
          >
            {help}
          </p>
        )}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';

// Attach sub-components
(TextField as any).Clearable = TextFieldClearable;
(TextField as any).Password = TextFieldPassword;
(TextField as any).Button = TextFieldButton;

export type { TextFieldProps, TextFieldVariant, LabelOption };