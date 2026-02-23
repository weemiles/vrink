import { useState, useRef, useCallback, type InputHTMLAttributes } from 'react';
import { Search, X } from 'lucide-react';

/**
 * TDS SearchField — 실무 확장 노트 2
 *
 * §1.4 검색 입력 규칙:
 *   - debounce 250ms (외부에서 useDebounce 적용)
 *   - 최소 2글자 이상부터 검색 결과 노출
 *   - 검색어 최대 50자
 *   - clear 버튼: 값이 있을 때만 노출
 *
 * §1 TDS Touch Target: 최소 44×44px
 */

interface SearchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  onSubmit?: (value: string) => void;
  size?: 'small' | 'medium' | 'large';
  variant?: 'filled' | 'outlined';
}

const SIZES = {
  small: { height: 36, fontSize: 13, iconSize: 16, padding: '0 10px' },
  medium: { height: 44, fontSize: 15, iconSize: 18, padding: '0 12px' },
  large: { height: 52, fontSize: 16, iconSize: 20, padding: '0 14px' },
} as const;

export function SearchField({
  value,
  onChange,
  onClear,
  onSubmit,
  size = 'medium',
  variant = 'filled',
  placeholder = '검색',
  ...rest
}: SearchFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const s = SIZES[size];

  const handleClear = useCallback(() => {
    onChange('');
    onClear?.();
    inputRef.current?.focus();
  }, [onChange, onClear]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSubmit) {
      onSubmit(value);
    }
  }, [onSubmit, value]);

  const bgClass = variant === 'filled'
    ? 'bg-toss-grey-100'
    : `bg-transparent border ${isFocused ? 'border-toss-blue' : 'border-toss-grey-200'}`;

  return (
    <div
      role="search"
      className={`flex items-center rounded-xl transition-all ${bgClass}`}
      style={{ height: s.height }}
    >
      <Search
        size={s.iconSize}
        className="text-toss-grey-400 ml-3 shrink-0"
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        type="search"
        className="flex-1 bg-transparent px-3 outline-none text-toss-grey-900 placeholder-toss-grey-400"
        style={{ fontSize: s.fontSize }}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
        maxLength={50}
        autoComplete="off"
        {...rest}
      />
      {value.length > 0 && (
        <button
          onClick={handleClear}
          className="flex items-center justify-center shrink-0 mr-1"
          style={{ width: 32, height: 32, minWidth: 32 }}
          aria-label="검색어 지우기"
          type="button"
        >
          <div className="flex items-center justify-center bg-toss-grey-300 rounded-full" style={{ width: 18, height: 18 }}>
            <X size={12} className="text-white" strokeWidth={3} />
          </div>
        </button>
      )}
    </div>
  );
}