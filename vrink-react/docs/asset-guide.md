# VRINK Asset Guide

## 목적
- 사용자 제공 이미지 에셋을 일관된 경로와 네이밍으로 관리합니다.
- 에셋이 없을 때도 레이아웃이 깨지지 않도록 fallback UI를 유지합니다.

## 저장 위치
- `public/images/vrink/`

## 파일 규칙
- 권장 포맷: `webp` 또는 `jpg`
- 권장 네이밍: `section-purpose-v1.webp`
- 예시:
  - `hero-product-v1.webp`
  - `feature-customization-v1.webp`
  - `proof-hardware-v1.webp`
  - `proof-operations-v1.webp`

## 적용 방법
1. 에셋 파일을 `public/images/vrink/`에 저장
2. `src/content/assets.ts`의 `src` 값을 파일 경로로 업데이트
   - 예: `src: "/images/vrink/hero-product-v1.webp"`
3. 페이지에서 `AssetFrame`이 자동으로 실이미지 렌더링

## 참고
- 현재 기본값은 모두 `src: null`로 되어 있어 "이미지 에셋 준비중" fallback이 표시됩니다.
