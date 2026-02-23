import { Shield, Settings } from 'lucide-react';
import { TossButton } from './TossButton';
import { Popup } from './Popup';
import { type PrePromptMessage, type AlternativePath, type PermissionState } from './usePermissionRequest';

/**
 * TDS 제품 운영 확장 5-13, §4 — 권한 프리-프롬프트 / 거절 대응 컴포넌트
 *
 * §4.1 프리-프롬프트: 3문장 이내
 *   1) 무엇을 위해
 *   2) 어떤 데이터가
 *   3) 언제 사용되는지
 *
 * §4.2 거절 대응
 *   - 1회 거절: 대체 경로 제시
 *   - 영구 거절: 설정 이동 CTA (세션당 1회)
 *
 * §4.3 대체 경로
 *   - 위치 → 수동 입력 / 카메라 → 갤러리
 */

/* ─── §4.1 프리-프롬프트 ─── */

interface PermissionPrePromptProps {
  isOpen: boolean;
  message: PrePromptMessage;
  onAllow: () => void;
  onDeny: () => void;
}

export function PermissionPrePrompt({
  isOpen,
  message,
  onAllow,
  onDeny,
}: PermissionPrePromptProps) {
  return (
    <Popup
      isOpen={isOpen}
      onClose={onDeny}
      title="권한이 필요해요"
      description={`${message.purpose}\n${message.dataType}\n${message.timing}`}
      confirmText="허용하기"
      cancelText="다음에"
      onConfirm={onAllow}
      closeOnDimmerClick={false}
    />
  );
}

/* ─── §4.2 거절 상태 안내 ─── */

interface PermissionDeniedBannerProps {
  state: PermissionState;
  alternative: AlternativePath;
  canShowSettingsCTA: boolean;
  onOpenSettings: () => void;
  onUseAlternative: () => void;
}

export function PermissionDeniedBanner({
  state,
  alternative,
  canShowSettingsCTA,
  onOpenSettings,
  onUseAlternative,
}: PermissionDeniedBannerProps) {
  if (state !== 'denied' && state !== 'permanentDenied') return null;

  return (
    <div
      className="bg-toss-orange-50 border border-toss-orange-100"
      style={{ borderRadius: 14, padding: '14px 16px', margin: '0 24px' }}
      role="alert"
      aria-label="권한 필요"
    >
      <div className="flex items-start gap-3">
        <Shield
          size={18}
          className="text-toss-orange-500 shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          <p className="text-toss-grey-800" style={{ fontSize: 13, fontWeight: 600 }}>
            {state === 'permanentDenied'
              ? '설정에서 권한을 허용해주세요'
              : '권한이 필요해요'}
          </p>
          <p className="text-toss-grey-500 mt-0.5" style={{ fontSize: 12 }}>
            {alternative.description}
          </p>

          <div className="flex gap-2 mt-3">
            {/* §4.3 대체 경로 */}
            {alternative.available && (
              <TossButton
                variant="fill"
                color="primary"
                size="small"
                onClick={onUseAlternative}
              >
                {alternative.actionLabel}
              </TossButton>
            )}

            {/* §4.2 설정 이동 (영구거절 + 세션 1회) */}
            {state === 'permanentDenied' && canShowSettingsCTA && (
              <TossButton
                variant="weak"
                color="light"
                size="small"
                onClick={onOpenSettings}
              >
                <Settings size={14} className="mr-1" aria-hidden="true" />
                설정으로 이동
              </TossButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
