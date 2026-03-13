# 허들리 디자인 시스템 문서

## 목적
- 허들리 레퍼런스 랜딩 페이지를 일관된 토큰 기반으로 유지하기 위한 기준 문서
- 구현 위치: `src/app/page.tsx`, `src/app/page.module.css`
- 에셋 위치: `public/images/vrink/reference/`

## 디자인 시스템 구조
- 토큰: `src/app/page.module.css`의 `.page` 블록에 `--huddly-*` 변수로 선언
- 컴포넌트 패턴: `dot-link`, `section-title`, `badge`, 카드 레이아웃, floating chat
- 레이아웃 패턴: Hero / Split Hero / Feature Grid / Story Grid / Product Grid / CTA / Footer

## 핵심 토큰

### Color
- `--huddly-color-bg`: `#ffffff`
- `--huddly-color-text`: `#101010`
- `--huddly-color-surface-01`: `#f5f5f5`
- `--huddly-color-surface-02`: `#eeeeee`
- `--huddly-color-olive`: `#b6b77e`
- `--huddly-color-chat-border`: `#3f3f3f`
- `--huddly-color-border-soft`: `rgba(0, 0, 0, 0.12)`

### Typography
- `--huddly-font-size-display`: `clamp(42px, 4vw, 66px)`
- `--huddly-font-size-title`: `28px`
- `--huddly-font-size-body`: `15px`
- `--huddly-font-size-body-sm`: `14px`
- `--huddly-font-size-caption`: `12px`
- `--huddly-font-size-badge`: `10px`

### Layout/Spacing
- `--huddly-page-max`: `1920px`
- `--huddly-side-padding`: `40px`
- `--huddly-side-padding-mobile`: `24px`
- 카드/그리드 기본 간격: `20px`

### Shadow
- `--huddly-shadow-float`: `0 4px 6px rgba(0, 0, 0, 0.1)`

## 컴포넌트 규칙
- `.dotLink` + `.dot`
  - 모든 CTA/텍스트 링크는 점(10x10) + 볼드 텍스트 조합 사용
- `.sectionTitle`
  - 대형 섹션 헤딩은 display 토큰을 공통 사용
- `.badge`
  - 제품 태그는 검정 배경 + 흰 텍스트 + 10px 타입 사용
- `.chatPreview`, `.chatBubble`
  - 데스크톱 우하단 고정, 모바일(`<=1100px`)에서는 숨김

## 반응형 기준
- 브레이크포인트: `@media (max-width: 1100px)`
- 규칙:
  - 메인 네비게이션 숨김
  - 공통 좌우 여백 `24px`
  - Challenge/Story/Product grid를 1열 전환
  - CTA를 2열 -> 1열 전환
  - floating chat UI 숨김

## 에셋 규칙
- 모든 이미지/아이콘은 `public/images/vrink/reference/` 하위 파일만 사용
- 외부 CDN/새 아이콘 패키지 추가 금지
- 파일명은 Figma 원본 export 파일명을 유지
