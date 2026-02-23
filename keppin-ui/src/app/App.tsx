import { Capacitor } from '@capacitor/core';
import { DevicePreviewShell, EmbeddedRouterApp } from './components/DevicePreviewShell';

/**
 * App entry point — keppin
 *
 * createBrowserRouter + RouterProvider (Data Router) 패턴을 사용합니다.
 * Figma Make에서 페이지 목록을 올바르게 감지하려면 이 패턴이 필요합니다.
 *
 * React 인스턴스 중복 문제는 vite.config.ts의
 * resolve.dedupe + optimizeDeps.include 설정으로 해결합니다.
 */
export default function App() {
  const isIframe = typeof window !== 'undefined' && window.self !== window.top;
  const query = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const isEmbedQuery = query?.get('embed') === '1';
  const forcePreviewShell = query?.get('preview') === '1';
  const forceAppOnly = query?.get('app') === '1';
  const isEmbedded = isIframe || isEmbedQuery;
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isPrivate172 = /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname);
  const isLocalHost =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname.startsWith('10.') ||
    hostname.startsWith('192.168.') ||
    isPrivate172;
  const isNative = Capacitor.isNativePlatform();
  const shouldUsePreviewShell =
    !isNative && !isEmbedded && !forceAppOnly && (import.meta.env.DEV || forcePreviewShell || isLocalHost);

  if (shouldUsePreviewShell) {
    return <DevicePreviewShell />;
  }

  return <EmbeddedRouterApp />;
}
