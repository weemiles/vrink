# Vercel Deploy (MVP)

## 1) 프로젝트 연결
1. Vercel에서 `New Project` 선택
2. `vrink-react` 리포지토리/디렉터리 연결
3. Framework Preset: `Next.js` 확인

## 2) 환경 변수 설정
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `LEAD_RATE_LIMIT_WINDOW_MS` (optional)
- `LEAD_RATE_LIMIT_MAX` (optional)

## 3) 배포 확인
- `Production Deployment` 완료 후 URL 접속
- 확인 포인트
  - 섹션 렌더링
  - 문의 폼 제출 성공/실패 메시지
  - Supabase `lead_inquiries` 데이터 저장

## 4) 운영 기본안 (Step 3-A)
- 문의 내역은 Supabase Dashboard `Table Editor > lead_inquiries`에서 확인
