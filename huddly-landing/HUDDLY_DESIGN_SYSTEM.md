# Huddly 랜딩 디자인 시스템

## 구조
- `styles/tokens.css`: 색상, 타이포, 간격, 반경, 그림자 토큰 정의
- `styles/components.css`: 재사용 컴포넌트 스타일(`dot-link`, `badge`, floating chat 등)
- `styles/layout.css`: 섹션 레이아웃, 그리드, 반응형 규칙

## 핵심 토큰

### 컬러
- `--color-bg`: `#ffffff`
- `--color-text`: `#101010`
- `--color-text-muted`: `#555555`
- `--color-surface-01`: `#f5f5f5`
- `--color-surface-02`: `#eeeeee`
- `--color-olive`: `#b6b77e`
- `--color-border-soft`: `rgba(0,0,0,0.12)`
- `--color-chat-bg`: `#101010`
- `--color-chat-border`: `#3f3f3f`

### 타이포그래피
- `--font-family-base`: Inter + system fallback
- `--font-size-display`: `clamp(42px, 4vw, 66px)`
- `--font-size-title`: `28px`
- `--font-size-body`: `15px`
- `--font-size-body-sm`: `14px`
- `--font-size-caption`: `12px`
- `--font-size-badge`: `10px`

### 간격/레이아웃
- 기본 좌우 여백: `--layout-side-padding: 40px`
- 모바일 좌우 여백: `--layout-side-padding-mobile: 24px`
- 기본 그리드 간격: `20px`
- 히어로 좌우 여백: `80px`

### 형태/그림자
- 필 형태 반경: `--radius-pill: 999px`
- 플로팅 그림자: `--shadow-floating: 0 4px 6px rgba(0,0,0,0.1)`

## 재사용 컴포넌트
- `.dot-link` + `.dot`: CTA 및 내비게이션 텍스트 링크 패턴
- `.section-title`: 대형 섹션 헤딩 스타일
- `.badge`: 제품 태그(`New`, `Multi-camera enabled`) 스타일
- `.chat-preview`, `.chat-bubble`: 우하단 플로팅 채팅 모듈

## 반응형 규칙
- 브레이크포인트: `@media (max-width: 1100px)`
- 동작:
  - 상단 메인 내비게이션 숨김
  - 페이지 좌우 여백 24px로 축소
  - Challenge/Stories/Products 그리드를 1열로 전환
  - CTA를 2열에서 1열로 전환

## 에셋 규칙
- Figma MCP에서 내려온 에셋을 `../output/assets/*` 경로로 직접 재사용
- 아이콘 패키지 추가 없이 SVG/이미지를 원본 자산 기준으로 사용
