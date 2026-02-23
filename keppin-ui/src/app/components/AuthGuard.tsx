/**
 * AuthGuard — 인증 라우트 가드
 * 미인증 사용자가 /app/* 경로에 접근하면 /login으로 리다이렉트.
 * auth 초기화 중에는 로딩 상태를 표시.
 * 인증 완료 후 useAppBootstrap으로 서버 데이터 하이드레이션 + 토큰 갱신.
 */
import { Navigate, Outlet } from 'react-router';
import { isDemoAuthBypassEnabled, useAuth } from '../data/authStore';
import { KeppinAppIcon } from './KeppinLogo';
import { useAppBootstrap } from './useAppBootstrap';
import { useScrollRestoration } from './useScrollRestoration';

export function AuthGuard() {
  const auth = useAuth();
  const demoBypass = isDemoAuthBypassEnabled();

  // 서버 데이터 하이드레이션 + 선제적 토큰 갱신
  useAppBootstrap();

  // 탭 전환 시 스크롤 위치 보존 + 비탭 페이지 스크롤 리셋
  useScrollRestoration();

  // 아직 인증 상태 확인 중 → 로딩 스피너
  if (!auth.initialized || auth.loading) {
    return (
      <div className="h-dvh flex flex-col items-center justify-center bg-[var(--toss-bg)]" role="status" aria-label="인증 확인 중">
        <KeppinAppIcon size={48} variant="blue" borderRadius={16} />
        <p className="text-toss-grey-400 mt-4" style={{ fontSize: 14 }}>
          로딩 중...
        </p>
      </div>
    );
  }

  // 미인증 → 로그인 페이지로 리다이렉트
  if (!auth.user && !demoBypass) {
    return <Navigate to="/login" replace />;
  }

  // 인증 완료 → 자식 라우트 렌더링
  return <Outlet />;
}
