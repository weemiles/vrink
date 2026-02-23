import { forwardRef, InputHTMLAttributes, useState, useCallback, useRef, useEffect } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';

/* TDS 실무 운영 규칙 7, §1 — Form Input
 * + 제품 운영 확장 4-12, §1 — Input 실무 운영 규칙
 *
 * §1.1 입력 길이: name 30, address 200, search 50, pin 6
 * §1.2 검증 타이밍:
 *   - onChange: 형식 보정(formatting)만, 에러 노출 금지
 *   - onBlur: 형식 검증 + 에러 노출 (1개만)
 *   - submit: 서버 검증 + 첫 에러 필드 스크롤/포커스
 * §1.3 에러 메시지: 필드당 최대 1문장, 30자 권장
 *   - 우선순위: (1) 필수 → (2) 형식 → (3) 범위/정책
 * §1.4 자동 포맷: 숫자→콤마, 전화→3-4-4, 민감번호→마스킹
 * §1.5 키보드/포커스: Next→다음 필드, 7개+→그룹분리
 * §1.6 삭제/초기화: Clear 버튼, 3개+→'전체 지우기' CTA
 */

/** §1.3 에러 메시지 최대 문자수 */
const ERROR_MAX_CHARS = 30;

interface TossInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showClear?: boolean;
  onClear?: () => void;
  /** §1.2 onBlur 검증 콜백 — 기본 검증 타이밍 */
  onValidate?: (value: string) => string | undefined;
  /** §1.4 onChange 포맷 변환 (숫자/전화/카드 등) — 에러 노출 금지 */
  formatOnChange?: (value: string) => string;
  /** §1.5 Enter/Next 키 시 포커스 이동할 다음 필드 ID */
  nextFieldId?: string;
  /** §1.1 입력 용도별 최대 길이 (기본: maxLength prop 사용) */
  inputPurpose?: 'name' | 'address' | 'search' | 'pin' | 'email' | 'password' | 'memo' | 'general';
}

/** §1.1 용도별 기본 maxLength */
const PURPOSE_MAX_LENGTH: Record<string, number> = {
  name: 30,
  address: 200,
  search: 50,
  pin: 6,
  email: 100,
  password: 64,
  memo: 500,
  general: 200,
};

export const TossInput = forwardRef<HTMLInputElement, TossInputProps>(
  ({
    label,
    error,
    helperText,
    showClear,
    onClear,
    onValidate,
    formatOnChange,
    nextFieldId,
    inputPurpose,
    type,
    className = '',
    maxLength: maxLengthProp,
    ...props
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [blurError, setBlurError] = useState<string | undefined>();
    const internalRef = useRef<HTMLInputElement>(null);
    const inputRef = (ref as React.RefObject<HTMLInputElement>) || internalRef;

    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;
    const inputId = props.id || (label ? `input-${label.replace(/\s+/g, '-')}` : undefined);

    // §1.1 용도별 maxLength 결정 (props maxLength > 용도별 기본값)
    const effectiveMaxLength = maxLengthProp
      || (inputPurpose ? PURPOSE_MAX_LENGTH[inputPurpose] : undefined);

    // §1.3 에러 우선순위: 외부 error prop > onBlur 검증 결과
    const rawError = error || blurError;
    // §1.3 에러 30자 제한
    const displayError = rawError && rawError.length > ERROR_MAX_CHARS
      ? rawError.slice(0, ERROR_MAX_CHARS)
      : rawError;

    // §1.2 onChange: 포맷만, 에러 노출 금지
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      // §1.4 onChange 포맷 변환 (에러 노출 없이 formatting만)
      if (formatOnChange) {
        const formatted = formatOnChange(e.target.value);
        e.target.value = formatted;
      }
      // §1.2 입력 중 에러 초기화 (사용자 스트레스 방지)
      if (blurError) setBlurError(undefined);
      props.onChange?.(e);
    }, [formatOnChange, blurError, props.onChange]);

    // §1.5 Enter/Next → 다음 필드 포커스
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && nextFieldId) {
        e.preventDefault();
        const nextEl = document.getElementById(nextFieldId);
        nextEl?.focus();
      }
      props.onKeyDown?.(e);
    }, [nextFieldId, props.onKeyDown]);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-toss-grey-700"
            style={{ fontSize: 'var(--typo-7-size)', fontWeight: 500, marginBottom: 'var(--toss-form-label-gap)' }}
          >
            {label}
          </label>
        )}
        <div
          className={`relative flex items-center rounded-xl transition-all ${
            displayError
              ? 'ring-2 ring-toss-red bg-toss-red-light'
              : isFocused
              ? 'ring-2 ring-toss-blue bg-[var(--toss-bg)]'
              : 'bg-toss-grey-100'
          }`}
          style={{ height: 52 }}
        >
          <input
            ref={inputRef}
            id={inputId}
            type={inputType}
            className={`w-full h-full bg-transparent px-4 text-toss-grey-900 placeholder-toss-grey-400 outline-none rounded-xl ${className}`}
            style={{ fontSize: 'var(--typo-sub10-size)' }}
            maxLength={effectiveMaxLength}
            onFocus={(e) => {
              setIsFocused(true);
              // §1.2 포커스 시 이전 블러 에러 초기화
              if (blurError) setBlurError(undefined);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              // §1.2 onBlur 검증 — 형식 검증 + 에러 1개만 노출
              if (onValidate) {
                const result = onValidate(e.target.value);
                setBlurError(result);
              }
              props.onBlur?.(e);
            }}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            aria-invalid={!!displayError || undefined}
            aria-describedby={displayError ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            {...props}
          />
          <div className="flex items-center gap-1 pr-3">
            {showClear && props.value && (
              <button
                type="button"
                onClick={onClear}
                className="flex items-center justify-center"
                style={{ width: 28, height: 28 }}
                aria-label="입력 내용 지우기"
              >
                <X size={16} className="text-toss-grey-400" />
              </button>
            )}
            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="flex items-center justify-center"
                style={{ width: 28, height: 28 }}
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                {showPassword
                  ? <EyeOff size={18} className="text-toss-grey-400" />
                  : <Eye size={18} className="text-toss-grey-400" />
                }
              </button>
            )}
          </div>
        </div>
        {/* §1.3 에러: 최대 1개, 30자 이내 */}
        {displayError && (
          <p
            id={`${inputId}-error`}
            className="text-toss-red"
            style={{ fontSize: 'var(--typo-sub12-size)', marginTop: 'var(--toss-form-helper-gap)' }}
            role="alert"
          >
            {displayError}
          </p>
        )}
        {helperText && !displayError && (
          <p
            id={`${inputId}-helper`}
            className="text-toss-grey-500"
            style={{ fontSize: 'var(--typo-sub12-size)', marginTop: 'var(--toss-form-helper-gap)' }}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

TossInput.displayName = 'TossInput';