# Step 3 운영 기본안 (A)

## 문의 데이터 확인 방법
1. Supabase Dashboard 접속
2. 프로젝트 선택
3. `Table Editor` > `lead_inquiries` 테이블 이동
4. `created_at` 기준 최신순 확인

## 최소 운영 규칙
- 고객 문의 식별 키: `id`
- 연락 우선 필드: `company`, `name`, `phone`, `email`
- 문의 내용 필드: `message`
- 유입 확인 필드: `source`, `created_at`

## 보안/권한
- 웹 클라이언트에서 직접 DB 접근 없음
- `SUPABASE_SERVICE_ROLE_KEY`는 서버(API route)에서만 사용
- 문의 조회는 Dashboard 권한 사용자만 수행
