import { useState, useCallback, useMemo, createContext, useContext } from 'react';

/**
 * TDS 제품 운영 확장 5-13, §6 — Server-driven UI / Feature Flag 운영 규칙
 *
 * §6.1 플래그 우선순위
 *   - Default → Experiment → Kill switch (최우선)
 *
 * §6.2 롤아웃 단계
 *   - 0.5% (내부) → 5% → 25% → 50% → 100%
 *   - 각 단계: 최소 24시간 관찰 후 다음 단계
 *
 * §6.3 롤백 기준 (가드레일)
 *   - crash-free users -0.2%p → 롤백
 *   - 핵심 전환 -1%p → 롤백
 *   - CS/리뷰 키워드 하루 10건+ → 롤백
 *
 * §6.4 설정 기반 UI 일관성
 *   - 같은 상태에서 플래그 따라 버튼 위치/명칭 변경 금지
 *   - 변경 필요 시 실험군/대조군 동일 이벤트 스키마 사용
 */

/* ─── §6.1 우선순위 ─── */

export type FlagSource = 'default' | 'experiment' | 'killswitch';

const FLAG_PRIORITY: Record<FlagSource, number> = {
  default: 0,
  experiment: 1,
  killswitch: 2, // 최우선
};

/* ─── §6.2 롤아웃 단계 ─── */

export const ROLLOUT_STAGES = [0.5, 5, 25, 50, 100] as const;
export const ROLLOUT_OBSERVE_MIN_MS = 86400000; // 24시간

/* ─── §6.3 롤백 기준 ─── */

export const ROLLBACK_THRESHOLDS = {
  crashFreeDelta: 0.2,      // crash-free -0.2%p
  conversionDelta: 1.0,     // 핵심 전환 -1%p
  csDailyMax: 10,            // CS 키워드 10건/일
} as const;

/* ─── Flag 정의 ─── */

export interface FlagDefinition<T = boolean> {
  key: string;
  defaultValue: T;
  source: FlagSource;
  /** 롤아웃 비율 (0~100) */
  rolloutPercentage: number;
  /** Kill switch 활성 시 이 값으로 강제 (기본: defaultValue) */
  killswitchValue?: T;
  /** 현재 사용자가 실험군에 포함되는지 */
  isInExperiment?: boolean;
  experimentValue?: T;
}

export interface FlagResolution<T = boolean> {
  value: T;
  source: FlagSource;
  isEnabled: boolean;
}

/** §6.1 플래그 해석: 우선순위 규칙 적용 */
export function resolveFlag<T>(flag: FlagDefinition<T>): FlagResolution<T> {
  // Kill switch 최우선
  if (flag.source === 'killswitch' && flag.killswitchValue !== undefined) {
    return {
      value: flag.killswitchValue,
      source: 'killswitch',
      isEnabled: !!flag.killswitchValue,
    };
  }

  // Experiment
  if (
    flag.source === 'experiment' &&
    flag.isInExperiment &&
    flag.experimentValue !== undefined
  ) {
    return {
      value: flag.experimentValue,
      source: 'experiment',
      isEnabled: !!flag.experimentValue,
    };
  }

  // Default
  return {
    value: flag.defaultValue,
    source: 'default',
    isEnabled: !!flag.defaultValue,
  };
}

/* ─── §6.3 롤백 판단 ─── */

export interface HealthMetrics {
  crashFreeUsersDelta: number;  // -값이면 악화
  conversionDelta: number;      // -값이면 악화
  csDailyCount: number;
}

export interface RollbackDecision {
  shouldRollback: boolean;
  reasons: string[];
}

export function shouldRollback(metrics: HealthMetrics): RollbackDecision {
  const reasons: string[] = [];

  if (metrics.crashFreeUsersDelta <= -ROLLBACK_THRESHOLDS.crashFreeDelta) {
    reasons.push(
      `crash-free ${metrics.crashFreeUsersDelta.toFixed(1)}%p (기준: -${ROLLBACK_THRESHOLDS.crashFreeDelta}%p)`,
    );
  }

  if (metrics.conversionDelta <= -ROLLBACK_THRESHOLDS.conversionDelta) {
    reasons.push(
      `전환율 ${metrics.conversionDelta.toFixed(1)}%p (기준: -${ROLLBACK_THRESHOLDS.conversionDelta}%p)`,
    );
  }

  if (metrics.csDailyCount >= ROLLBACK_THRESHOLDS.csDailyMax) {
    reasons.push(
      `CS 키워드 ${metrics.csDailyCount}건/일 (기준: ${ROLLBACK_THRESHOLDS.csDailyMax}건)`,
    );
  }

  return {
    shouldRollback: reasons.length > 0,
    reasons,
  };
}

/* ─── Feature Flag Store (Context) ─── */

type FlagStore = Record<string, FlagDefinition>;

interface FeatureFlagContextValue {
  flags: FlagStore;
  isEnabled: (key: string) => boolean;
  getValue: <T = boolean>(key: string) => T | undefined;
  getResolution: (key: string) => FlagResolution | null;
}

const FeatureFlagContext = createContext<FeatureFlagContextValue>({
  flags: {},
  isEnabled: () => false,
  getValue: () => undefined,
  getResolution: () => null,
});

export { FeatureFlagContext };

/* ─── 메인 훅 ─── */

/**
 * TDS Feature Flag 훅
 *
 * - 앱에서 플래그 정의를 제공하고 해석합니다.
 * - 프론트엔드 구현이므로 모의(mock) 플래그 스토어를 사용합니다.
 * - 실제 서버 연동 시 초기 데이터를 flags 파라미터로 전달합니다.
 */
export function useFeatureFlag(initialFlags: FlagDefinition[] = []) {
  const [flags, setFlags] = useState<FlagStore>(() => {
    const store: FlagStore = {};
    for (const flag of initialFlags) {
      store[flag.key] = flag;
    }
    return store;
  });

  const isEnabled = useCallback(
    (key: string): boolean => {
      const flag = flags[key];
      if (!flag) return false;
      return resolveFlag(flag).isEnabled;
    },
    [flags],
  );

  const getValue = useCallback(
    <T = boolean>(key: string): T | undefined => {
      const flag = flags[key];
      if (!flag) return undefined;
      return resolveFlag(flag).value as T;
    },
    [flags],
  );

  const getResolution = useCallback(
    (key: string): FlagResolution | null => {
      const flag = flags[key];
      if (!flag) return null;
      return resolveFlag(flag);
    },
    [flags],
  );

  /** 플래그 업데이트 (서버 응답 반영) */
  const updateFlag = useCallback((flag: FlagDefinition) => {
    setFlags((prev) => ({ ...prev, [flag.key]: flag }));
  }, []);

  /** Kill switch 활성화 */
  const activateKillSwitch = useCallback(
    (key: string) => {
      setFlags((prev) => {
        const existing = prev[key];
        if (!existing) return prev;
        return {
          ...prev,
          [key]: {
            ...existing,
            source: 'killswitch' as FlagSource,
            killswitchValue: existing.defaultValue,
          },
        };
      });
    },
    [],
  );

  const contextValue = useMemo(
    (): FeatureFlagContextValue => ({
      flags,
      isEnabled,
      getValue,
      getResolution,
    }),
    [flags, isEnabled, getValue, getResolution],
  );

  return {
    flags,
    isEnabled,
    getValue,
    getResolution,
    updateFlag,
    activateKillSwitch,
    contextValue,
    Provider: FeatureFlagContext.Provider,
  };
}

/** Feature flag 소비 훅 */
export function useFlag(key: string) {
  const ctx = useContext(FeatureFlagContext);
  return {
    isEnabled: ctx.isEnabled(key),
    resolution: ctx.getResolution(key),
  };
}
