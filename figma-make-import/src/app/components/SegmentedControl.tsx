import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';

/* TDS SegmentedControl (7.3.3)
 * - value + onChange: controlled
 * - defaultValue: uncontrolled
 * - size: 'small' | 'large' (default 'small')
 * - alignment: 'fixed' | 'fluid' (default 'fixed')
 * - Accessibility: role="radiogroup", items role="radio", aria-checked, tabIndex
 *   + 화살표 키 탐색 (WAI-ARIA Radio Group Pattern)
 *
 * + 제품 운영 확장 4-12, §3 — 선택/토글 운영 규칙:
 * §3.1 기본 원칙: SegmentedControl/Radio는 default 선택 1개를 반드시 지정
 * §3.2 옵션 개수: 2~5개 권장, 6개 이상이면 dropdown/필터 화면으로 전환
 * §3.3 라벨 규칙: "켜짐/꺼짐" 같은 상태 단어 금지, 대상만 말하기
 * §3.4 파괴적 선택: ConfirmDialog 또는 2단계 확인으로 올리기
 */

/** §3.2 옵션 개수 범위 */
const SEGMENT_OPTIONS_MIN = 2;
const SEGMENT_OPTIONS_MAX = 5;

interface SegmentedControlProps {
  children: React.ReactNode;
  size?: 'small' | 'large';
  alignment?: 'fixed' | 'fluid';
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  'aria-labelledby'?: string;
  className?: string;
}

interface SegmentedControlItemProps {
  children: React.ReactNode;
  value: string;
  size?: 'small' | 'large';
  // internal props
  _isActive?: boolean;
  _onClick?: (value: string) => void;
  _alignment?: 'fixed' | 'fluid';
  _index?: number;
  _onKeyNav?: (index: number, direction: 'prev' | 'next' | 'first' | 'last') => void;
  _ref?: (el: HTMLButtonElement | null) => void;
}

function SegmentedControlItem({
  children,
  value,
  size = 'small',
  _isActive = false,
  _onClick,
  _alignment = 'fixed',
  _index = 0,
  _onKeyNav,
  _ref,
}: SegmentedControlItemProps) {
  const heights = { small: 32, large: 40 };
  const fontSizes = { small: 13, large: 15 };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!_onKeyNav) return;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        _onKeyNav(_index, 'next');
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        _onKeyNav(_index, 'prev');
        break;
      case 'Home':
        e.preventDefault();
        _onKeyNav(_index, 'first');
        break;
      case 'End':
        e.preventDefault();
        _onKeyNav(_index, 'last');
        break;
    }
  };

  return (
    <button
      ref={_ref}
      role="radio"
      aria-checked={_isActive}
      tabIndex={_isActive ? 0 : -1}
      onClick={() => _onClick?.(value)}
      onKeyDown={handleKeyDown}
      className={`relative z-10 transition-colors duration-200 ${_alignment === 'fixed' ? 'flex-1' : 'shrink-0'}`}
      style={{
        height: heights[size],
        fontSize: fontSizes[size],
        fontWeight: _isActive ? 600 : 400,
        color: _isActive ? 'var(--toss-segment-active-text)' : 'var(--toss-segment-text)',
        padding: _alignment === 'fluid' ? '0 16px' : '0 8px',
        minWidth: 44,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
}

export function SegmentedControl({
  children,
  size = 'small',
  alignment = 'fixed',
  value: controlledValue,
  defaultValue,
  onChange,
  'aria-labelledby': ariaLabelledBy,
  className = '',
}: SegmentedControlProps) {
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  const activeValue = isControlled ? controlledValue : internalValue;

  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  const handleChange = useCallback(
    (val: string) => {
      if (!isControlled) setInternalValue(val);
      onChange?.(val);
    },
    [isControlled, onChange]
  );

  const items = Array.isArray(children) ? children : [children];
  const activeIndex = items.findIndex(
    (child: any) => child?.props?.value === activeValue
  );

  /** A11y: 화살표 키 탐색 — radiogroup 패턴 */
  const handleKeyNav = useCallback(
    (currentIndex: number, direction: 'prev' | 'next' | 'first' | 'last') => {
      let newIndex: number;
      switch (direction) {
        case 'next':
          newIndex = (currentIndex + 1) % items.length;
          break;
        case 'prev':
          newIndex = (currentIndex - 1 + items.length) % items.length;
          break;
        case 'first':
          newIndex = 0;
          break;
        case 'last':
          newIndex = items.length - 1;
          break;
      }
      const childValue = (items[newIndex] as any)?.props?.value;
      if (childValue) {
        handleChange(childValue);
        itemRefs.current[newIndex]?.focus();
      }
    },
    [items, handleChange]
  );

  useEffect(() => {
    if (!containerRef.current || activeIndex < 0) return;
    const buttons = containerRef.current.querySelectorAll('[role="radio"]');
    const activeBtn = buttons[activeIndex] as HTMLElement;
    if (activeBtn) {
      setIndicatorStyle({
        left: activeBtn.offsetLeft,
        width: activeBtn.offsetWidth,
      });
    }
  }, [activeIndex, activeValue, size, alignment]);

  const heights = { small: 36, large: 44 };

  return (
    <div
      ref={containerRef}
      role="radiogroup"
      aria-labelledby={ariaLabelledBy}
      className={`relative flex items-center rounded-xl ${alignment === 'fluid' ? 'overflow-x-auto no-scrollbar' : ''} ${className}`}
      style={{
        height: heights[size],
        backgroundColor: 'var(--toss-segment-bg)',
        padding: 2,
      }}
    >
      {/* Active indicator */}
      {activeIndex >= 0 && (
        <motion.div
          className="absolute rounded-[10px] shadow-sm"
          animate={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          style={{
            height: heights[size] - 4,
            backgroundColor: 'var(--toss-segment-active-bg)',
            top: 2,
          }}
        />
      )}

      {items.map((child: any, index: number) => {
        if (!child?.props) return null;
        return (
          <SegmentedControlItem
            key={child.props.value}
            value={child.props.value}
            size={child.props.size || size}
            _isActive={child.props.value === activeValue}
            _onClick={handleChange}
            _alignment={alignment}
            _index={index}
            _onKeyNav={handleKeyNav}
            _ref={(el) => { itemRefs.current[index] = el; }}
          >
            {child.props.children}
          </SegmentedControlItem>
        );
      })}
    </div>
  );
}

SegmentedControl.Item = SegmentedControlItem;