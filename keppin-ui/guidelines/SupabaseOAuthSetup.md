# Supabase OAuth Setup (Google/Kakao)

## 1) Supabase Auth Provider 화면에서 입력

### Google
- `Client ID` / `Client Secret`:
  - Google Cloud Console > APIs & Services > Credentials > OAuth 2.0 Client IDs에서 발급
- `Callback URL (for OAuth)`:
  - 읽기 전용 값이며 복사해서 Google Cloud의 Authorized redirect URI에 등록
- 필수 스코프:
  - 기본 프로필/이메일 스코프(`openid`, `email`, `profile`) 사용

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

## 2-1) Google Cloud에 등록할 값

- Authorized redirect URI:
  - `https://odjnidzoerrygtaivuru.supabase.co/auth/v1/callback`
- Authorized JavaScript origin:
  - `http://localhost:4173`
  - (배포 시) `https://<운영도메인>`
- OAuth consent screen:
  - `Publishing status`가 `Testing`이면 테스트 사용자 이메일을 등록해야 로그인 가능

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
  - Kakao: enabled
  - Naver: unsupported (현재 Supabase Auth provider 미지원)

## 6) KOE004 (앱 관리자 설정 오류) 빠른 점검

`KOE004`는 보통 "카카오 앱 설정 불일치" 문제입니다. 아래 4가지를 같은 앱 기준으로 맞춰야 해결됩니다.

1. 카카오 로그인 활성화
- Kakao Developers > 제품 설정 > 카카오 로그인 > 활성화 ON

2. Supabase Callback URL 등록
- Supabase Provider 화면의 `Callback URL (for OAuth)` 값을 복사
- Kakao Developers > 앱 > 플랫폼 키 > Redirect URI에 동일하게 등록

3. REST API Key / Client Secret 일치
- Supabase `REST API Key`는 카카오 `REST API 키`와 동일해야 함
- 카카오 Client Secret을 활성화했다면 Supabase `Client Secret Code`도 동일값 입력

4. URL Configuration 정합성
- Supabase Auth > URL Configuration의 Site URL/Additional Redirect URLs에
  실제 테스트 URL(로컬, 프리뷰, 운영)을 모두 등록
