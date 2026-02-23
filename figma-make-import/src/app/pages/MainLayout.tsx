import { Outlet } from 'react-router';
import { BottomTabBar } from '../components/BottomTabBar';

export function MainLayout() {
  return (
    <div className="min-h-dvh bg-[var(--toss-bg)] relative">
      {/* Main content area — bottom padding accounts for Tab Bar 49px */}
      <Outlet />
      <BottomTabBar />
    </div>
  );
}