import { Outlet } from 'react-router';
import { BottomTabBar } from '../components/BottomTabBar';

export function MainLayout() {
  const capacitor = (globalThis as { Capacitor?: { getPlatform?: () => string } }).Capacitor;
  const isNativeIOS = capacitor?.getPlatform?.() === 'ios';
  const safeAreaTop = isNativeIOS
    ? 'max(env(safe-area-inset-top, 0px), 44px)'
    : 'env(safe-area-inset-top, 0px)';

  return (
    <div
      className="min-h-dvh bg-[var(--toss-bg)] relative"
      style={{
        paddingTop: safeAreaTop,
      }}
    >
      {/* Main content area — pages have their own pb-20 to clear Tab Bar */}
      <Outlet />
      <BottomTabBar />
    </div>
  );
}
