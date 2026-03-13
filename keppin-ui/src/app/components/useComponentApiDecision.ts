/**
 * TDS 컴포넌트 API 결정 트리 — 아티클 1: 디자인 시스템 다시 생각해보기 (2026-01-08)
 *
 * ═══ §1.3~1.5 Flat vs Compound API 선택 규칙 ═══
 *
 * 1) 상위 구조 (§3.2 가이드 규칙 B: 큰 구조→상세)
 * ────────────────────────────────────────────────
 * Flat API:
 *   - 내부 구조를 숨기고, 변형을 props로 제공
 *   - 사용이 간단, 러닝커브 낮음
 *   - 위험: 예상치 못한 요구 시 props 폭발
 *   - 적합: 구조가 거의 고정, 단순·고빈도 케이스
 *
 * Compound API:
 *   - 하위 컴포넌트를 제공, 제품팀이 조립
 *   - 예측 못한 레이아웃도 조합으로 해결
 *   - 단점: verbose, 올바른 조합 학습 필요
 *   - 적합: 복잡·변형 잦은 케이스
 *
 * 2) 구성 요소: 결정 트리 (§1.5)
 * ────────────────────────────────────────────────
 *   Q1: "이 컴포넌트는 구조가 거의 고정인가?"
 *     → 예: Flat 우선
 *     → 아니오: Q2로
 *
 *   Q2: "예외/커스텀 요구가 자주 발생하는가?"
 *     → 예: Compound 제공
 *     → 아니오: Flat으로 시작, 우회(fork/detach) 발생 시 Compound 추가
 *
 * 3) 하이브리드 제공 (§1.4)
 * ────────────────────────────────────────────────
 *   - 외부 API: Flat + Compound 2벌 제공 가능
 *   - 내부 구현: 반드시 하나의 primitive 레이어로 통합 (유지보수 부담↓)
 *
 * 4) 우회 신호 대응 (§1.1)
 * ────────────────────────────────────────────────
 *   - detach/fork가 보이면 "나쁜 사용"이 아니라 "미충족 수요"
 *   - 통제 강화 대신 → "무엇이 부족한가"를 기록하고 API를 확장
 *
 * ═══ 접근성 (§3.2D 하단 고정) ═══
 *   - Flat/Compound 어느 쪽이든 접근성은 컴포넌트 내부에서 보장
 *   - aria-label, role, 포커스 관리는 primitive 레이어에서 통합 처리
 *   - 큰 텍스트/VoiceOver는 컴포넌트 책임 (화면이 아님)
 */

/* ─── API 스타일 타입 (런타임 사용 가능) ─── */

export type ComponentApiStyle = 'flat' | 'compound' | 'hybrid';

export interface ComponentApiMeta {
  /** 컴포넌트 이름 */
  name: string;
  /** 현재 제공하는 API 스타일 */
  apiStyle: ComponentApiStyle;
  /** 구조 고정 여부 (Q1) */
  isStructureFixed: boolean;
  /** 예외/커스텀 요구 빈번 여부 (Q2) */
  hasFrequentCustomRequests: boolean;
  /** 우회(detach/fork) 발생 기록 */
  bypassSignals?: string[];
}

/**
 * §1.5 결정 트리 — 컴포넌트 API 스타일 추천
 *
 * @param isStructureFixed - Q1: 구조가 거의 고정인가?
 * @param hasFrequentCustomRequests - Q2: 예외/커스텀 요구 빈번?
 * @param hasBypassSignals - 우회(fork/detach) 발생 이력 있음?
 * @returns 추천 API 스타일
 */
export function decideComponentApiStyle(
  isStructureFixed: boolean,
  hasFrequentCustomRequests: boolean,
  hasBypassSignals: boolean = false,
): ComponentApiStyle {
  // 우회 이력이 있으면 → Compound 추가(하이브리드) 검토
  if (hasBypassSignals) return 'hybrid';

  // Q1: 구조 고정 → Flat
  if (isStructureFixed) return 'flat';

  // Q2: 예외 빈번 → Compound
  if (hasFrequentCustomRequests) return 'compound';

  // 그 외: Flat 시작 (나중에 필요하면 Compound 추가)
  return 'flat';
}

/**
 * keepin 컴포넌트별 API 메타 — 현재 코드베이스 현황
 *
 * §3.2C worst case: 모든 컴포넌트를 한눈에 파악할 수 있도록 전체 목록 제공
 */
export const KEEPIN_COMPONENT_API_MAP: ComponentApiMeta[] = [
  // ── 아토믹 (§3.2E: 예측 가능 구조만) ──
  { name: 'TossButton',       apiStyle: 'flat',     isStructureFixed: true,  hasFrequentCustomRequests: false },
  { name: 'IconButton',       apiStyle: 'flat',     isStructureFixed: true,  hasFrequentCustomRequests: false },
  { name: 'TextButton',       apiStyle: 'flat',     isStructureFixed: true,  hasFrequentCustomRequests: false },
  { name: 'Switch',           apiStyle: 'flat',     isStructureFixed: true,  hasFrequentCustomRequests: false },
  { name: 'Slider',           apiStyle: 'flat',     isStructureFixed: true,  hasFrequentCustomRequests: false },
  { name: 'ProgressBar',      apiStyle: 'flat',     isStructureFixed: true,  hasFrequentCustomRequests: false },
  { name: 'TextField',        apiStyle: 'flat',     isStructureFixed: true,  hasFrequentCustomRequests: false },
  { name: 'Skeleton',         apiStyle: 'flat',     isStructureFixed: true,  hasFrequentCustomRequests: false },
  { name: 'SearchField',      apiStyle: 'flat',     isStructureFixed: true,  hasFrequentCustomRequests: false },
  { name: 'SegmentedControl', apiStyle: 'flat',     isStructureFixed: true,  hasFrequentCustomRequests: false },
  { name: 'ContactAvatar',    apiStyle: 'flat',     isStructureFixed: true,  hasFrequentCustomRequests: false },

  // ── 조합형 (§3.2E: 공통 체크리스트) ──
  { name: 'Toast',            apiStyle: 'flat',     isStructureFixed: true,  hasFrequentCustomRequests: false },
  { name: 'FixedBottomCTA',   apiStyle: 'flat',     isStructureFixed: true,  hasFrequentCustomRequests: false },
  { name: 'ListFooter',       apiStyle: 'flat',     isStructureFixed: true,  hasFrequentCustomRequests: false },
  { name: 'TableRow',         apiStyle: 'flat',     isStructureFixed: false, hasFrequentCustomRequests: false },
  { name: 'NavigationBar',    apiStyle: 'flat',     isStructureFixed: true,  hasFrequentCustomRequests: false },
  { name: 'EmptyState',       apiStyle: 'flat',     isStructureFixed: true,  hasFrequentCustomRequests: false },
  { name: 'Menu',             apiStyle: 'flat',     isStructureFixed: true,  hasFrequentCustomRequests: false },

  // ── 오버레이 (§3.2E: position 항목 추가) ──
  { name: 'Popup',            apiStyle: 'flat',     isStructureFixed: true,  hasFrequentCustomRequests: false },
  { name: 'BottomSheet',      apiStyle: 'hybrid',   isStructureFixed: false, hasFrequentCustomRequests: true,
    bypassSignals: ['children 슬롯으로 다양한 내부 구조 조립 필요'] },
  { name: 'Result',           apiStyle: 'hybrid',   isStructureFixed: false, hasFrequentCustomRequests: false,
    bypassSignals: ['Result.Button compound 패턴 이미 제공'] },
];
