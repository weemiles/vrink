import { useState, useRef, useCallback, useEffect } from 'react';

/* TDS Slider (Mobile) — 심화 실무 노트 3, 섹션 4
 * - 연속 값 입력 (가격 범위, 강도, 볼륨, 만족도, 퍼센트)
 * - color: string (기본 blue400)
 * - label: { min: string; max: string; mid?: string; }
 * - tooltip: React.ReactElement (Slider.Tooltip)
 *
 * TDS 컴포넌트 시스템화 보강판 §1 Tooltip 운영 규칙:
 * - 정밀 조절 입력(가격, 퍼센트, 강도)은 Tooltip 기본 켜기 (showTooltip=true)
 * - Tooltip 메시지는 현재값 1개만 표시. 범위 설명은 label로 분리
 * - 값 업데이트는 onValueChange와 동일 프레임에서 반영
 * - Tooltip이 손가락을 가리면 상단 여백 추가 (paddingTop: 55px)
 *
 * Props:
 * - value: number
 * - defaultValue: number
 * - onValueChange: (value: number) => void
 * - minValue: number (기본 0)
 * - maxValue: number (기본 100)
 * - color: string
 * - label: { min: string; max: string; mid?: string; }
 * - tooltip: React.ReactElement
 * - showTooltip: boolean (기본 false — 정밀 조절 시 true 권장)
 * - tooltipFormatter: (value: number) => string
 */

interface SliderLabelConfig {
  min: string;
  max: string;
  mid?: string;
}

interface SliderTooltipProps {
  message: string;
  offset?: number;
}

interface SliderProps {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  minValue?: number;
  maxValue?: number;
  color?: string;
  label?: SliderLabelConfig;
  tooltip?: React.ReactElement;
  /** §1 Tooltip 운영 규칙: 정밀 조절 입력은 true로 설정 */
  showTooltip?: boolean;
  /** showTooltip 사용 시 Tooltip 메시지 포매터 (기본: 현재값 그대로) */
  tooltipFormatter?: (value: number) => string;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  'aria-label'?: string;
}

function SliderTooltip({ message, offset = 0 }: SliderTooltipProps) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        bottom: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        marginBottom: 8 + offset,
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--toss-slider-tooltip-bg)',
          color: 'var(--toss-slider-tooltip-color)',
          fontSize: 13,
          fontWeight: 600,
          padding: '4px 10px',
          borderRadius: 8,
          whiteSpace: 'nowrap',
          lineHeight: 1.4,
        }}
      >
        {message}
      </div>
      {/* Tooltip arrow */}
      <div
        className="mx-auto"
        style={{
          width: 0,
          height: 0,
          borderLeft: '5px solid transparent',
          borderRight: '5px solid transparent',
          borderTop: '5px solid var(--toss-slider-tooltip-bg)',
        }}
      />
    </div>
  );
}

export function Slider({
  value: controlledValue,
  defaultValue = 50,
  onValueChange,
  minValue = 0,
  maxValue = 100,
  color,
  label,
  tooltip,
  showTooltip = false,
  tooltipFormatter,
  disabled = false,
  className = '',
  style,
  'aria-label': ariaLabel = '슬라이더',
}: SliderProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const effectiveColor = color || 'var(--toss-slider-fill-color)';

  const percent = Math.max(0, Math.min(100, ((value - minValue) / (maxValue - minValue)) * 100));

  const updateValue = useCallback(
    (clientX: number) => {
      if (disabled || !trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const pct = x / rect.width;
      const raw = minValue + pct * (maxValue - minValue);
      const rounded = Math.round(raw);
      const clamped = Math.max(minValue, Math.min(maxValue, rounded));

      if (controlledValue === undefined) {
        setInternalValue(clamped);
      }
      onValueChange?.(clamped);
    },
    [disabled, minValue, maxValue, controlledValue, onValueChange]
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    isDragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updateValue(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    updateValue(e.clientX);
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  // Keyboard support
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    const step = (maxValue - minValue) / 100;
    let newVal = value;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        newVal = Math.min(maxValue, value + step);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        newVal = Math.max(minValue, value - step);
        break;
      case 'Home':
        newVal = minValue;
        break;
      case 'End':
        newVal = maxValue;
        break;
      default:
        return;
    }

    e.preventDefault();
    const rounded = Math.round(newVal);
    if (controlledValue === undefined) {
      setInternalValue(rounded);
    }
    onValueChange?.(rounded);
  };

  // Clone tooltip with current value position info
  const renderTooltip = () => {
    // §1 명시적 tooltip prop이 있으면 우선 사용
    if (tooltip) return tooltip;
    // §1 showTooltip=true 이면 자동 Tooltip 생성 (현재값 1개만)
    if (showTooltip) {
      const message = tooltipFormatter ? tooltipFormatter(value) : String(value);
      return <SliderTooltip message={message} />;
    }
    return null;
  };

  /* §1 Tooltip 활성 시 상단 여백 추가 (55px) — 손가락이 값을 가리지 않도록 */
  const hasActiveTooltip = !!tooltip || showTooltip;

  return (
    <div
      className={`w-full ${className}`}
      style={{
        ...style,
        ...(hasActiveTooltip ? { paddingTop: 55 } : {}),
      }}
    >
      {/* Track area */}
      <div
        ref={trackRef}
        className={`relative w-full select-none ${disabled ? 'opacity-40' : 'cursor-pointer'}`}
        style={{ height: 44, display: 'flex', alignItems: 'center' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        role="slider"
        aria-label={ariaLabel}
        aria-valuenow={value}
        aria-valuemin={minValue}
        aria-valuemax={maxValue}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={handleKeyDown}
      >
        {/* Track background */}
        <div
          className="w-full rounded-full"
          style={{
            height: 4,
            backgroundColor: 'var(--toss-slider-track-bg)',
          }}
        >
          {/* Fill */}
          <div
            className="h-full rounded-full transition-[width] duration-75"
            style={{
              width: `${percent}%`,
              backgroundColor: effectiveColor,
            }}
          />
        </div>

        {/* Thumb */}
        <div
          className="absolute"
          style={{
            left: `${percent}%`,
            transform: 'translateX(-50%)',
          }}
        >
          {/* Tooltip */}
          {renderTooltip() && (
            <div className="relative">
              {renderTooltip()}
            </div>
          )}
          {/* Thumb circle */}
          <div
            style={{
              width: 'var(--toss-slider-thumb-size)',
              height: 'var(--toss-slider-thumb-size)',
              borderRadius: '50%',
              backgroundColor: 'var(--toss-slider-thumb-bg)',
              boxShadow: 'var(--toss-slider-thumb-shadow)',
              border: `2px solid ${effectiveColor}`,
              transition: 'transform 0.1s',
              transform: isDragging.current ? 'scale(1.1)' : 'scale(1)',
            }}
          />
        </div>
      </div>

      {/* Labels */}
      {label && (
        <div
          className="flex items-center justify-between mt-1"
          style={{ padding: '0 2px' }}
          aria-hidden="true"
        >
          <span
            style={{
              fontSize: 12,
              color: 'var(--toss-slider-label-color)',
              fontWeight: 400,
            }}
          >
            {label.min}
          </span>
          {label.mid && (
            <span
              style={{
                fontSize: 12,
                color: 'var(--toss-slider-label-color)',
                fontWeight: 400,
              }}
            >
              {label.mid}
            </span>
          )}
          <span
            style={{
              fontSize: 12,
              color: 'var(--toss-slider-label-color)',
              fontWeight: 400,
            }}
          >
            {label.max}
          </span>
        </div>
      )}
    </div>
  );
}

Slider.Tooltip = SliderTooltip;