import { createBrowserRouter, Navigate } from 'react-router';

/* ─── 즉시 로드 (항상 필요한 레이아웃/가드) ─── */
import { RootLayout } from './pages/RootLayout';
import { MainLayout } from './pages/MainLayout';
import { AuthGuard } from './components/AuthGuard';

/**
 * App Router — createBrowserRouter (Data Router) 패턴
 *
 * Figma Make에서 페이지 목록을 올바르게 감지하려면
 * createBrowserRouter + RouterProvider 패턴이 필요합니다.
 *
 * 모든 페이지 컴포넌트는 route-level lazy loading을 사용합니다.
 * (React.lazy + Suspense 대신 route.lazy 사용 — Data Router 네이티브 코드 스플리팅)
 */
export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    HydrateFallback: () => null,
    children: [
      /* ═══════ 비인증 영역 ═══════ */
      {
        index: true,
        lazy: async () => {
          const { SplashPage } = await import('./pages/SplashPage');
          return { Component: SplashPage };
        },
      },
      {
        path: 'onboarding',
        lazy: async () => {
          const { OnboardingPage } = await import('./pages/OnboardingPage');
          return { Component: OnboardingPage };
        },
      },
      {
        path: 'login',
        lazy: async () => {
          const { LoginPage } = await import('./pages/LoginPage');
          return { Component: LoginPage };
        },
      },
      {
        path: 'signup',
        lazy: async () => {
          const { SignUpPage } = await import('./pages/SignUpPage');
          return { Component: SignUpPage };
        },
      },
      {
        path: 'forgot-password',
        lazy: async () => {
          const { ForgotPasswordPage } = await import('./pages/ForgotPasswordPage');
          return { Component: ForgotPasswordPage };
        },
      },
      {
        path: 'phone-verify',
        lazy: async () => {
          const { PhoneVerificationPage } = await import('./pages/PhoneVerificationPage');
          return { Component: PhoneVerificationPage };
        },
      },
      /* 비인증 영역에서도 접근 가능한 약관/정책 페이지 */
      {
        path: 'terms',
        lazy: async () => {
          const { TermsPage } = await import('./pages/TermsPage');
          return { Component: TermsPage };
        },
      },
      {
        path: 'privacy-policy',
        lazy: async () => {
          const { PrivacyPolicyPage } = await import('./pages/PrivacyPolicyPage');
          return { Component: PrivacyPolicyPage };
        },
      },

      /* ═══════ 인증 필요 영역 (/app/*) — AuthGuard ═══════ */
      {
        path: 'app',
        Component: AuthGuard,
        children: [
          {
            path: 'onboarding/sync',
            lazy: async () => {
              const { ContactSyncPage } = await import('./pages/ContactSyncPage');
              return { Component: ContactSyncPage };
            },
          },
          {
            path: 'contacts/add',
            lazy: async () => {
              const { AddContactPage } = await import('./pages/AddContactPage');
              return { Component: AddContactPage };
            },
          },
          {
            path: 'contact/:id/edit',
            lazy: async () => {
              const { EditContactPage } = await import('./pages/EditContactPage');
              return { Component: EditContactPage };
            },
          },
          {
            path: 'profile/edit',
            lazy: async () => {
              const { ProfileEditPage } = await import('./pages/ProfileEditPage');
              return { Component: ProfileEditPage };
            },
          },
          {
            path: 'home-variations',
            lazy: async () => {
              const { HomeVariations } = await import('./pages/HomeVariations');
              return { Component: HomeVariations };
            },
          },
          {
            path: 'insights',
            lazy: async () => {
              const { InsightsPage } = await import('./pages/InsightsPage');
              return { Component: InsightsPage };
            },
          },
          {
            path: 'tags',
            lazy: async () => {
              const { TagManagementPage } = await import('./pages/TagManagementPage');
              return { Component: TagManagementPage };
            },
          },
          {
            path: 'duplicates',
            lazy: async () => {
              const { DuplicateDetectionPage } = await import('./pages/DuplicateDetectionPage');
              return { Component: DuplicateDetectionPage };
            },
          },
          {
            path: 'import',
            lazy: async () => {
              const { ContactImportPage } = await import('./pages/ContactImportPage');
              return { Component: ContactImportPage };
            },
          },
          {
            path: 'faq',
            lazy: async () => {
              const { FAQPage } = await import('./pages/FAQPage');
              return { Component: FAQPage };
            },
          },
          {
            path: 'inquiry',
            lazy: async () => {
              const { InquiryPage } = await import('./pages/InquiryPage');
              return { Component: InquiryPage };
            },
          },
          {
            path: 'privacy',
            lazy: async () => {
              const { PrivacyPage } = await import('./pages/PrivacyPage');
              return { Component: PrivacyPage };
            },
          },
          {
            path: 'terms',
            lazy: async () => {
              const { TermsPage } = await import('./pages/TermsPage');
              return { Component: TermsPage };
            },
          },
          {
            path: 'privacy-policy',
            lazy: async () => {
              const { PrivacyPolicyPage } = await import('./pages/PrivacyPolicyPage');
              return { Component: PrivacyPolicyPage };
            },
          },
          {
            path: 'messages',
            lazy: async () => {
              const { ScheduledMessagesPage } = await import('./pages/ScheduledMessagesPage');
              return { Component: ScheduledMessagesPage };
            },
          },
          {
            path: 'messages/group',
            lazy: async () => {
              const { GroupMessagePage } = await import('./pages/GroupMessagePage');
              return { Component: GroupMessagePage };
            },
          },
          /* ContactDetailPage — 하단 네비게이션 바 없이 표시 */
          {
            path: 'contact/:id',
            lazy: async () => {
              const { ContactDetailPage } = await import('./pages/ContactDetailPage');
              return { Component: ContactDetailPage };
            },
          },
          /* MainLayout — 하단 탭 바 포함 */
          {
            Component: MainLayout,
            children: [
              {
                index: true,
                lazy: async () => {
                  const { HomePage } = await import('./pages/HomePage');
                  return { Component: HomePage };
                },
              },
              {
                path: 'contacts',
                lazy: async () => {
                  const { ContactListPage } = await import('./pages/ContactListPage');
                  return { Component: ContactListPage };
                },
              },
              {
                path: 'calendar',
                lazy: async () => {
                  const { CalendarPage } = await import('./pages/CalendarPage');
                  return { Component: CalendarPage };
                },
              },
              {
                path: 'mypage',
                lazy: async () => {
                  const { MyPage } = await import('./pages/MyPage');
                  return { Component: MyPage };
                },
              },
              {
                path: 'settings',
                lazy: async () => {
                  const { SettingsPage } = await import('./pages/SettingsPage');
                  return { Component: SettingsPage };
                },
              },
            ],
          },
          /* 잘못된 /app/* 경로 → 홈으로 리다이렉트 */
          {
            path: '*',
            element: <Navigate to="/app" replace />,
          },
        ],
      },

      /* 잘못된 최상위 경로 → 홈으로 리다이렉트 */
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
