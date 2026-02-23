import { useEffect, useMemo, useRef, useState } from 'react';
import { RouterProvider } from 'react-router';
import { router } from '../routes';
import { ErrorBoundary } from './ErrorBoundary';
import { setDemoAuthBypassEnabled } from '../data/authStore';

type DevicePreset = {
  id: string;
  label: string;
  width: number;
  height: number;
  group: 'android' | 'custom' | 'ios';
};

type ScreenPreset = {
  id: string;
  label: string;
  path: string;
  group: 'public' | 'app';
};

const DEVICE_PRESETS: DevicePreset[] = [
  { id: 'android-compact', label: 'Android Compact', width: 412, height: 917, group: 'android' },
  { id: 'android-medium', label: 'Android Medium', width: 700, height: 840, group: 'android' },
  { id: 'custom', label: 'Custom', width: 393, height: 852, group: 'custom' },
  { id: 'iphone-16', label: 'iPhone 16', width: 393, height: 852, group: 'ios' },
  { id: 'iphone-16-pro', label: 'iPhone 16 Pro', width: 402, height: 874, group: 'ios' },
  { id: 'iphone-16-pro-max', label: 'iPhone 16 Pro Max', width: 440, height: 956, group: 'ios' },
  { id: 'iphone-16-plus', label: 'iPhone 16 Plus', width: 430, height: 932, group: 'ios' },
  { id: 'iphone-se', label: 'iPhone SE', width: 320, height: 568, group: 'ios' },
];

const SCREEN_PRESETS: ScreenPreset[] = [
  { id: 'splash', label: '스플래시', path: '/', group: 'public' },
  { id: 'onboarding', label: '온보딩', path: '/onboarding', group: 'public' },
  { id: 'login', label: '로그인', path: '/login', group: 'public' },
  { id: 'signup', label: '회원가입', path: '/signup', group: 'public' },
  { id: 'forgot-password', label: '비밀번호 재설정', path: '/forgot-password', group: 'public' },
  { id: 'phone-verify', label: '전화번호 인증', path: '/phone-verify', group: 'public' },
  { id: 'terms-public', label: '이용약관', path: '/terms', group: 'public' },
  { id: 'privacy-policy-public', label: '개인정보처리방침', path: '/privacy-policy', group: 'public' },
  { id: 'home', label: '홈', path: '/app', group: 'app' },
  { id: 'contact-sync', label: '연락처 동기화', path: '/app/onboarding/sync', group: 'app' },
  { id: 'contacts', label: '연락처 목록', path: '/app/contacts', group: 'app' },
  { id: 'contact-add', label: '연락처 추가', path: '/app/contacts/add', group: 'app' },
  { id: 'calendar', label: '캘린더', path: '/app/calendar', group: 'app' },
  { id: 'mypage', label: '마이페이지', path: '/app/mypage', group: 'app' },
  { id: 'settings', label: '설정', path: '/app/settings', group: 'app' },
  { id: 'insights', label: '인사이트', path: '/app/insights', group: 'app' },
  { id: 'messages', label: '자동메시지', path: '/app/messages', group: 'app' },
  { id: 'messages-group', label: '관계그룹 메시지', path: '/app/messages/group', group: 'app' },
  { id: 'import', label: '연락처 가져오기', path: '/app/import', group: 'app' },
  { id: 'tags', label: '태그 관리', path: '/app/tags', group: 'app' },
  { id: 'duplicates', label: '중복 정리', path: '/app/duplicates', group: 'app' },
  { id: 'faq', label: 'FAQ', path: '/app/faq', group: 'app' },
  { id: 'inquiry', label: '문의하기', path: '/app/inquiry', group: 'app' },
  { id: 'privacy-app', label: '개인정보 보호', path: '/app/privacy', group: 'app' },
  { id: 'terms-app', label: '이용약관(앱)', path: '/app/terms', group: 'app' },
  { id: 'privacy-policy-app', label: '개인정보처리방침(앱)', path: '/app/privacy-policy', group: 'app' },
  { id: 'profile-edit', label: '프로필 편집', path: '/app/profile/edit', group: 'app' },
  { id: 'home-variations', label: '홈 Variations', path: '/app/home-variations', group: 'app' },
];

const MIN_CUSTOM_SIZE = 280;
const MAX_CUSTOM_SIZE = 1400;
const FRAME_BEZEL = 10;
const ZOOM_MIN = 50;
const ZOOM_MAX = 200;
const ZOOM_STEP = 10;
const ZOOM_PRESETS = Array.from(
  { length: (ZOOM_MAX - ZOOM_MIN) / ZOOM_STEP + 1 },
  (_, index) => ZOOM_MIN + index * ZOOM_STEP,
);

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function clampZoom(value: number) {
  const rounded = Math.round(value / ZOOM_STEP) * ZOOM_STEP;
  return clamp(rounded, ZOOM_MIN, ZOOM_MAX);
}

function normalizePath(path: string) {
  if (!path) return '/';
  return path.startsWith('/') ? path : `/${path}`;
}

function buildEmbedSrc(path: string) {
  const url = new URL(window.location.href);
  url.pathname = normalizePath(path);
  url.searchParams.set('embed', '1');
  return `${url.pathname}${url.search}${url.hash}`;
}

export function DevicePreviewShell() {
  const initialScreen = useMemo(() => {
    const query = new URLSearchParams(window.location.search);
    const requestedScreenId = query.get('screen');
    if (requestedScreenId) {
      const byId = SCREEN_PRESETS.find((item) => item.id === requestedScreenId);
      if (byId) return byId;
    }
    const currentPath = normalizePath(window.location.pathname);
    return SCREEN_PRESETS.find((item) => item.path === currentPath) ?? SCREEN_PRESETS[0];
  }, []);
  const [selectedDeviceId, setSelectedDeviceId] = useState('iphone-16');
  const [selectedScreenId, setSelectedScreenId] = useState(initialScreen.id);
  const [menuOpen, setMenuOpen] = useState(false);
  const [customWidth, setCustomWidth] = useState(393);
  const [customHeight, setCustomHeight] = useState(852);
  const [zoomPercent, setZoomPercent] = useState(100);
  const [previewPath, setPreviewPath] = useState(initialScreen.path);
  const [iframeSrc, setIframeSrc] = useState('');
  const [stageSize, setStageSize] = useState({ width: 1200, height: 800 });

  const menuRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIframeSrc(buildEmbedSrc(previewPath));
    setDemoAuthBypassEnabled(previewPath.startsWith('/app'));
  }, [previewPath]);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('preview', '1');
    url.searchParams.set('screen', selectedScreenId);
    url.searchParams.delete('app');
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  }, [selectedScreenId]);

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (menuRef.current.contains(event.target as Node)) return;
      setMenuOpen(false);
    };
    window.addEventListener('mousedown', onMouseDown);
    return () => window.removeEventListener('mousedown', onMouseDown);
  }, []);

  useEffect(() => {
    if (!stageRef.current) return;
    const update = () => {
      if (!stageRef.current) return;
      const rect = stageRef.current.getBoundingClientRect();
      setStageSize({ width: rect.width, height: rect.height });
    };
    update();

    const observer = new ResizeObserver(update);
    observer.observe(stageRef.current);
    window.addEventListener('resize', update);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return;
      const target = event.target as HTMLElement | null;
      const isEditable =
        !!target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);
      if (isEditable) return;

      if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        setZoomPercent((prev) => Math.min(ZOOM_MAX, prev + ZOOM_STEP));
      } else if (event.key === '-') {
        event.preventDefault();
        setZoomPercent((prev) => Math.max(ZOOM_MIN, prev - ZOOM_STEP));
      } else if (event.key === '0') {
        event.preventDefault();
        setZoomPercent(100);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const selectedPreset = useMemo(
    () => DEVICE_PRESETS.find((item) => item.id === selectedDeviceId) ?? DEVICE_PRESETS[3],
    [selectedDeviceId],
  );
  const groupedScreens = useMemo(() => {
    const publicScreens = SCREEN_PRESETS.filter((item) => item.group === 'public');
    const appScreens = SCREEN_PRESETS.filter((item) => item.group === 'app');
    return { publicScreens, appScreens };
  }, []);

  const viewport = useMemo(() => {
    if (selectedPreset.id === 'custom') {
      return {
        width: clamp(customWidth, MIN_CUSTOM_SIZE, MAX_CUSTOM_SIZE),
        height: clamp(customHeight, MIN_CUSTOM_SIZE, MAX_CUSTOM_SIZE),
      };
    }
    return { width: selectedPreset.width, height: selectedPreset.height };
  }, [selectedPreset, customWidth, customHeight]);

  const fitScale = useMemo(() => {
    const availableWidth = Math.max(stageSize.width - 40 - FRAME_BEZEL * 2, 1);
    const availableHeight = Math.max(stageSize.height - 40 - FRAME_BEZEL * 2, 1);
    return Math.min(1, availableWidth / viewport.width, availableHeight / viewport.height);
  }, [stageSize, viewport.width, viewport.height]);

  const effectiveScale = useMemo(() => fitScale * (zoomPercent / 100), [fitScale, zoomPercent]);
  const frameWidth = Math.round(viewport.width * effectiveScale);
  const frameHeight = Math.round(viewport.height * effectiveScale);

  const changeZoom = (next: number) => {
    setZoomPercent(clampZoom(next));
  };

  return (
    <div className="device-preview-root">
      <header className="device-preview-toolbar">
        <div className="device-toolbar-left">
          <div className="device-field">
            <span className="device-field-label">디바이스</span>
            <div className="device-select-wrap" ref={menuRef}>
              <button
                type="button"
                className="device-select-trigger"
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-haspopup="listbox"
                aria-expanded={menuOpen}
              >
                <span>{selectedPreset.label}</span>
                <span className="device-caret">▾</span>
              </button>

              {menuOpen && (
                <div className="device-select-menu" role="listbox" aria-label="Device preset">
                  {DEVICE_PRESETS.map((preset, index) => {
                    const isSelected = preset.id === selectedPreset.id;
                    const prevPreset = index > 0 ? DEVICE_PRESETS[index - 1] : null;
                    const hasGroupGap = Boolean(prevPreset && prevPreset.group !== preset.group);
                    const dims =
                      preset.id === 'custom'
                        ? `${clamp(customWidth, MIN_CUSTOM_SIZE, MAX_CUSTOM_SIZE)}x${clamp(customHeight, MIN_CUSTOM_SIZE, MAX_CUSTOM_SIZE)}`
                        : `${preset.width}x${preset.height}`;

                    return (
                      <button
                        key={preset.id}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        className={`device-option ${isSelected ? 'is-selected' : ''} ${hasGroupGap ? 'has-group-gap' : ''}`}
                        onClick={() => {
                          setSelectedDeviceId(preset.id);
                          setMenuOpen(false);
                        }}
                      >
                        <span className="device-option-left">
                          <span className="device-check">{isSelected ? '✓' : ''}</span>
                          <span>{preset.label}</span>
                        </span>
                        <span className="device-option-size">{dims}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="device-field">
            <span className="device-field-label">화면</span>
            <div className="screen-select-wrap">
              <select
                className="screen-select-trigger"
                aria-label="화면 이동"
                value={selectedScreenId}
                onChange={(event) => {
                  const nextId = event.target.value;
                  const nextScreen = SCREEN_PRESETS.find((item) => item.id === nextId);
                  if (!nextScreen) return;
                  setSelectedScreenId(nextId);
                  setPreviewPath(nextScreen.path);
                }}
              >
                <optgroup label="공개 화면">
                  {groupedScreens.publicScreens.map((screen) => (
                    <option key={screen.id} value={screen.id}>
                      {screen.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="앱 내부 화면">
                  {groupedScreens.appScreens.map((screen) => (
                    <option key={screen.id} value={screen.id}>
                      {screen.label}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>
        </div>

        <div className="device-toolbar-right">
          <div className="device-zoom-controls" role="group" aria-label="Preview zoom">
            <button
              type="button"
              className="device-zoom-btn"
              onClick={() => changeZoom(zoomPercent - ZOOM_STEP)}
              aria-label="축소"
              disabled={zoomPercent <= ZOOM_MIN}
            >
              −
            </button>
            <span className="device-zoom-value">{zoomPercent}%</span>
            <button
              type="button"
              className="device-zoom-btn"
              onClick={() => changeZoom(zoomPercent + ZOOM_STEP)}
              aria-label="확대"
              disabled={zoomPercent >= ZOOM_MAX}
            >
              +
            </button>
            <select
              className="device-zoom-select"
              aria-label="확대 비율 선택"
              value={zoomPercent}
              onChange={(event) => changeZoom(Number(event.target.value))}
            >
              {ZOOM_PRESETS.map((percent) => (
                <option key={percent} value={percent}>
                  {percent}%
                </option>
              ))}
            </select>
            <input
              className="device-zoom-slider"
              type="range"
              min={ZOOM_MIN}
              max={ZOOM_MAX}
              step={ZOOM_STEP}
              value={zoomPercent}
              onChange={(event) => changeZoom(Number(event.target.value))}
              aria-label="확대 슬라이더"
            />
            <button
              type="button"
              className="device-zoom-reset"
              onClick={() => changeZoom(100)}
              aria-label="줌 초기화"
            >
              맞춤
            </button>
          </div>

          <div className="device-size-badges" aria-live="polite">
            <span className="device-size-pill">W {viewport.width}</span>
            <span className="device-size-pill">H {viewport.height}</span>
          </div>
        </div>
      </header>

      {selectedPreset.id === 'custom' && (
        <div className="device-custom-row">
          <label className="device-custom-label">
            Width
            <input
              type="number"
              min={MIN_CUSTOM_SIZE}
              max={MAX_CUSTOM_SIZE}
              value={customWidth}
              onChange={(event) => setCustomWidth(Number(event.target.value) || MIN_CUSTOM_SIZE)}
              className="device-custom-input"
            />
          </label>
          <label className="device-custom-label">
            Height
            <input
              type="number"
              min={MIN_CUSTOM_SIZE}
              max={MAX_CUSTOM_SIZE}
              value={customHeight}
              onChange={(event) => setCustomHeight(Number(event.target.value) || MIN_CUSTOM_SIZE)}
              className="device-custom-input"
            />
          </label>
        </div>
      )}

      <main className="device-preview-stage" ref={stageRef}>
        <div
          className="device-frame-shell"
          style={{ width: frameWidth + FRAME_BEZEL * 2, height: frameHeight + FRAME_BEZEL * 2 }}
        >
          <div
            className="device-frame-inner"
            style={{
              width: frameWidth,
              height: frameHeight,
            }}
          >
            {iframeSrc ? (
              <iframe
                title="Keppin Device Preview"
                src={iframeSrc}
                width={viewport.width}
                height={viewport.height}
                className="device-frame-iframe"
                style={{
                  transform: `scale(${effectiveScale})`,
                  transformOrigin: 'top left',
                }}
              />
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}

export function EmbeddedRouterApp() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}
