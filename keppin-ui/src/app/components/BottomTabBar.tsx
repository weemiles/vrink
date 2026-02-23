import { useNavigate, useLocation } from 'react-router';
import { useCallback, useRef } from 'react';
import { Home, Users, Calendar, User } from 'lucide-react';
import { useLanguage } from './useLanguage';

const tabs = [
  { path: '/app', icon: Home, labelKey: 'tab.home' },
  { path: '/app/contacts', icon: Users, labelKey: 'tab.contacts' },
  { path: '/app/calendar', icon: Calendar, labelKey: 'tab.calendar' },
  { path: '/app/mypage', icon: User, labelKey: 'tab.mypage' },
];

export function BottomTabBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const capacitor = (globalThis as { Capacitor?: { getPlatform?: () => string } }).Capacitor;
  const isNativeIOS = capacitor?.getPlatform?.() === 'ios';
  const safeAreaBottom = isNativeIOS
    ? 'max(env(safe-area-inset-bottom, 0px), 20px)'
    : 'env(safe-area-inset-bottom, 0px)';

  const isActive = (path: string) => {
    if (path === '/app') return location.pathname === '/app';
    return location.pathname.startsWith(path);
  };

  /**
   * A11y: tablist 패턴 — 좌/우 화살표로 탭 이동, Home/End로 처음/끝 이동
   * WAI-ARIA Tabs Pattern 준수
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    let newIndex = index;

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        newIndex = (index + 1) % tabs.length;
        break;
      case 'ArrowLeft':
        e.preventDefault();
        newIndex = (index - 1 + tabs.length) % tabs.length;
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = tabs.length - 1;
        break;
      default:
        return;
    }

    tabRefs.current[newIndex]?.focus();
    navigate(tabs[newIndex].path);
  }, [navigate]);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-[var(--toss-bg)]/95 backdrop-blur-lg z-50"
      style={{
        paddingBottom: safeAreaBottom,
        borderTop: '1px solid var(--toss-border-default)',
      }}
      aria-label="메인 탭 내비게이션"
    >
      <div
        className="flex items-center justify-around"
        role="tablist"
        aria-label="메인 탭"
        style={{ height: 52, paddingLeft: 8, paddingRight: 8 }}
      >
        {tabs.map((tab, index) => {
          const active = isActive(tab.path);
          const Icon = tab.icon;
          const label = t(tab.labelKey);
          return (
            <button
              key={tab.path}
              ref={(el) => { tabRefs.current[index] = el; }}
              onClick={() => navigate(tab.path)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              role="tab"
              aria-selected={active}
              aria-current={active ? 'page' : undefined}
              tabIndex={active ? 0 : -1}
              aria-label={label}
              className="relative flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors"
              style={{ minWidth: 44, minHeight: 44 }}
            >
              <Icon
                size={22}
                strokeWidth={active ? 2.4 : 1.6}
                className={`transition-colors ${active ? 'text-toss-blue' : 'text-toss-grey-400'}`}
                aria-hidden="true"
              />
              <span
                className={`transition-colors ${active ? 'text-toss-blue' : 'text-toss-grey-400'}`}
                style={{ fontSize: 10, fontWeight: active ? 600 : 400, lineHeight: 1 }}
                aria-hidden="true"
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
