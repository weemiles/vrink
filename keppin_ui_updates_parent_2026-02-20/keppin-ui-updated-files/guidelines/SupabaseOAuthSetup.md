# Supabase OAuth Setup (Google/Kakao)

## 1) Supabase Auth Provider 화면에서 입력

### Kakao
- `REST API Key`:
  - Kakao Developers > 내 애플리케이션 > 앱 키 > `REST API 키` 값을 입력
- `Client Secret Code`:
  - Kakao Developers > 보안 > `Client Secret 활성화` 후 발급된 Secret 입력
- `Allow users without an email`:
  - 기본은 `OFF` 권장
  - Kakao 계정 이메일 미제공 사용자까지 허용할 때만 `ON`
- `Callback URL (for OAuth)`:
  - 읽기 전용 값이며 복사해서 Kakao Developers 쪽 Redirect URI에 등록

## 2) Kakao Developers 쪽에 등록할 값

- Redirect URI:
  - `https://odjnidzoerrygtaivuru.supabase.co/auth/v1/callback`
- 플랫폼 > Web 사이트 도메인:
  - `http://localhost:4173`
  - (배포 시) 실제 서비스 도메인 추가
- 카카오 로그인 활성화
- 동의항목에서 이메일(필요 시) 설정

## 3) Supabase URL Configuration

- Supabase Dashboard > Auth > URL Configuration
- `Site URL`:
  - 개발: `http://localhost:4173`
- `Additional Redirect URLs`:
  - `http://localhost:4173/app`
  - 배포 도메인 경로 추가

## 4) 프로젝트 점검 명령

```bash
npm run supabase:check
npm run supabase:check:routes
npm run supabase:check:oauth
npm run supabase:check:all
```

## 5) 현재 프로젝트 상태(자동 점검 기준)

- Edge Function 연결: 정상
- API 라우트 접근/인증 가드: 정상
- OAuth:
  - Google: disabled
  - Kakao: disabled
  - Naver: unsupported (현재 Supabase Auth provider 미지원)
