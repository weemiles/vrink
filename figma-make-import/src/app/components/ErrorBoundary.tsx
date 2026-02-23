import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * 글로벌 에러 바운더리 — 런타임 에러 시 white-screen 방지
 * 에러 발생 시 사용자 친화적 복구 화면을 표시합니다.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          className="flex flex-col items-center justify-center min-h-screen bg-toss-bg px-8"
          role="alert"
        >
          <div
            className="flex items-center justify-center rounded-full bg-toss-grey-100 mb-6"
            style={{ width: 72, height: 72 }}
          >
            <AlertTriangle size={32} className="text-toss-grey-500" />
          </div>

          <h1
            className="text-toss-grey-900 text-center mb-2"
            style={{ fontSize: 20, fontWeight: 700 }}
          >
            문제가 발생했어요
          </h1>

          <p
            className="text-toss-grey-500 text-center mb-8"
            style={{ fontSize: 14, lineHeight: '22px', maxWidth: 280 }}
          >
            일시적인 오류가 발생했습니다.
            <br />
            다시 시도하거나, 문제가 계속되면 앱을 새로고침해 주세요.
          </p>

          {/* Error detail (dev only) */}
          {import.meta.env.DEV && this.state.error && (
            <pre
              className="text-toss-grey-400 mb-6 w-full overflow-auto text-left bg-toss-grey-100 rounded-xl p-4"
              style={{ fontSize: 11, maxHeight: 120, lineHeight: '16px' }}
            >
              {this.state.error.message}
            </pre>
          )}

          <div className="flex items-center gap-3 w-full" style={{ maxWidth: 280 }}>
            <button
              onClick={this.handleRetry}
              className="flex-1 flex items-center justify-center gap-2 bg-toss-grey-900 text-[var(--toss-bg)] active:opacity-80 transition-opacity"
              style={{ height: 48, borderRadius: 12, fontSize: 15, fontWeight: 600 }}
            >
              <RefreshCw size={16} />
              다시 시도
            </button>
            <button
              onClick={this.handleGoHome}
              className="flex-1 flex items-center justify-center bg-toss-grey-100 text-toss-grey-700 active:bg-toss-grey-200 transition-colors"
              style={{ height: 48, borderRadius: 12, fontSize: 15, fontWeight: 600 }}
            >
              홈으로
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
