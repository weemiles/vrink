import { useRef, useCallback } from 'react';
import { sanitizeEventPayload } from './useThreatModel';
import { shouldSampleEvent, classifyEventCriticality } from './useComplianceOps';

/**
 * TDS 제품 운영 심화 8, §5 — Analytics / 실험(A|B) 이벤트 설계
 *
 * 기본 이벤트 5종:
 *   1) screen_view
 *   2) click
 *   3) submit
 *   4) success
 *   5) fail
 *
 * 공통 파라미터: screen_name, component_name, action, result
 *
 * §5.2 중복 로깅 방지:
 *   - 같은 버튼 연속 클릭: 0.5초 내 동일 click 이벤트 드롭 (디바운스)
 *   - 스크롤 기반 노출: 동일 아이템 세션당 1회
 */

const CLICK_DEBOUNCE_MS = 500; // §5.2

type EventType = 'screen_view' | 'click' | 'submit' | 'success' | 'fail';

interface EventParams {
  screen_name: string;
  component_name: string;
  action: string;
  result?: string;
  [key: string]: string | number | boolean | undefined;
}

interface UseAnalyticsReturn {
  /** 이벤트 전송 (click은 0.5s 디바운스) */
  trackEvent: (type: EventType, params: EventParams) => void;
  /** 화면 진입 이벤트 */
  trackScreenView: (screenName: string) => void;
  /** 노출 이벤트 (동일 아이템 세션당 1회) */
  trackImpression: (itemId: string, params: Omit<EventParams, 'action'>) => void;
}

// 세션 레벨 싱글톤 — 노출 이벤트 중복 방지
const impressionSet = new Set<string>();

// 마지막 click 이벤트 타임스탬프 추적
const lastClickMap = new Map<string, number>();

/** 실제 이벤트 전송 (현재는 console.debug, 추후 실제 SDK로 교체) */
function sendEvent(type: EventType, params: EventParams) {
  // §2.4 (제품 운영 확장 3-11) PII 혼입 방지 — 이벤트 payload 살균
  const sanitized = sanitizeEventPayload(params as Record<string, unknown>) as EventParams;

  // §2.4 이벤트 샘플링 — 크리티컬 이벤트는 100%, 일반은 10%
  const criticality = classifyEventCriticality(type);
  if (!shouldSampleEvent(criticality)) {
    return; // 샘플링에서 제외
  }

  if (process.env.NODE_ENV === 'development') {
    console.debug(`[Analytics] ${type}`, sanitized);
  }
  // TODO: 실제 Analytics SDK 연동
  // analytics.track(type, sanitized);
}

export function useAnalytics(): UseAnalyticsReturn {
  const screenViewedRef = useRef(new Set<string>());

  const trackEvent = useCallback((type: EventType, params: EventParams) => {
    // §5.2 click 디바운스
    if (type === 'click') {
      const key = `${params.screen_name}__${params.component_name}__${params.action}`;
      const now = Date.now();
      const lastTime = lastClickMap.get(key) || 0;
      if (now - lastTime < CLICK_DEBOUNCE_MS) {
        return; // 0.5초 내 중복 클릭 드롭
      }
      lastClickMap.set(key, now);
    }

    sendEvent(type, params);
  }, []);

  const trackScreenView = useCallback((screenName: string) => {
    // 동일 세션 내 같은 화면 중복 허용 (뒤로가기 후 다시 진입 가능)
    sendEvent('screen_view', {
      screen_name: screenName,
      component_name: 'screen',
      action: 'view',
    });
  }, []);

  const trackImpression = useCallback(
    (itemId: string, params: Omit<EventParams, 'action'>) => {
      // §5.2 동일 아이템 노출 세션당 1회
      if (impressionSet.has(itemId)) return;
      impressionSet.add(itemId);

      sendEvent('click', {
        ...params,
        action: 'impression',
      } as EventParams);
    },
    [],
  );

  return { trackEvent, trackScreenView, trackImpression };
}

/** 세션 초기화 (로그아웃 등) */
export function resetAnalyticsSession() {
  impressionSet.clear();
  lastClickMap.clear();
}

/**
 * TDS 제품 운영 확장 2-10, §4 — 실험/측정 심화
 *
 * §4.1 실험 이벤트는 최소 3종 메트릭 필수: Primary, Guardrail, Diagnostic
 * §4.4 결과 분해 시 최소 3세그먼트: 신규/기존, iOS/Android, 저속/정상
 * §4.5 실험 기간 중 UI 변경 → 무효 마킹
 */
export type ExperimentEventType = 'experiment_start' | 'experiment_end' | 'experiment_metric';

export interface ExperimentEvent {
  experimentId: string;
  variant: string;
  metricRole: 'primary' | 'guardrail' | 'diagnostic';
  metricName: string;
  value: number;
  segment?: {
    userType?: 'new' | 'existing';
    platform?: 'ios' | 'android' | 'web';
    network?: 'normal' | 'slow';
  };
}

/** §4.1 실험 메트릭 이벤트 전송 */
export function trackExperimentMetric(event: ExperimentEvent) {
  if (process.env.NODE_ENV === 'development') {
    console.debug('[Analytics:Experiment]', event);
  }
  // TODO: 실제 실험 플랫폼 SDK 연동
}