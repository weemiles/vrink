import { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, Eye, Database, Trash2, Download } from 'lucide-react';
import { NavigationBar } from '../components/NavigationBar';
import { Switch } from '../components/Switch';
import { useToast } from '../components/useToast';
import { useLanguage } from '../components/useLanguage';

interface PrivacySection {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export function PrivacyPage() {
  const toast = useToast();
  const { lang } = useLanguage();
  const isKo = lang === 'ko';

  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [crashReportEnabled, setCrashReportEnabled] = useState(true);

  const sections: PrivacySection[] = isKo ? [
    {
      icon: <Lock size={20} className="text-toss-blue" />,
      title: '데이터 암호화',
      description: '모든 개인정보는 기기 내에 안전하게 저장돼요. 네트워크 전송 시 TLS 암호화가 적용돼요.',
    },
    {
      icon: <Eye size={20} className="text-toss-blue" />,
      title: '접근 권한',
      description: 'keppin은 연락처 접근 권한만 요청해요. 카메라, 위치 등 불필요한 권한은 요청하지 않아요.',
    },
    {
      icon: <Database size={20} className="text-toss-blue" />,
      title: '데이터 저장',
      description: '인연 데이터는 기기의 localStorage에 저장돼요. 서버에 데이터를 업로드하지 않으며, 모든 데이터는 사용자의 기기에서만 관리돼요.',
    },
    {
      icon: <Shield size={20} className="text-toss-blue" />,
      title: '제3자 제공',
      description: '사용자의 개인정보는 어떠한 제3자에게도 제공하지 않아요. 마케팅 목적의 데이터 활용도 하지 않습니다.',
    },
  ] : [
    {
      icon: <Lock size={20} className="text-toss-blue" />,
      title: 'Data Encryption',
      description: 'All personal data is securely stored on your device. TLS encryption is applied during network transmission.',
    },
    {
      icon: <Eye size={20} className="text-toss-blue" />,
      title: 'Permissions',
      description: 'keppin only requests contact access permission. No unnecessary permissions like camera or location are requested.',
    },
    {
      icon: <Database size={20} className="text-toss-blue" />,
      title: 'Data Storage',
      description: 'Contact data is stored in your device\'s localStorage. No data is uploaded to servers — everything is managed locally.',
    },
    {
      icon: <Shield size={20} className="text-toss-blue" />,
      title: 'Third-Party Sharing',
      description: 'Your personal information is never shared with any third parties. Data is not used for marketing purposes.',
    },
  ];

  return (
    <div className="min-h-dvh bg-[var(--toss-bg)] pb-8">
      <NavigationBar title={isKo ? '개인정보 보호' : 'Privacy'} showBack />

      {/* 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ padding: '16px 24px 24px' }}
      >
        <div
          className="flex items-center justify-center bg-toss-blue-50 rounded-2xl"
          style={{ width: 56, height: 56, marginBottom: 16 }}
        >
          <Shield size={28} className="text-toss-blue" />
        </div>
        <h2 className="text-toss-grey-900" style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
          {isKo ? '개인정보를 안전하게\n보호하고 있어요' : 'Your privacy is\nsafely protected'}
        </h2>
        <p className="text-toss-grey-500" style={{ fontSize: 14, lineHeight: 1.6 }}>
          {isKo
            ? 'keppin은 최소한의 정보만 수집하며,\n사용자의 데이터를 소중하게 다루고 있어요.'
            : 'keppin collects minimal information\nand handles your data with care.'}
        </p>
      </motion.div>

      {/* 보호 정책 섹션 */}
      <div style={{ padding: '0 24px', marginBottom: 24 }}>
        <div className="space-y-3">
          {sections.map((section, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * idx }}
              className="bg-toss-grey-50 rounded-2xl"
              style={{ padding: '20px' }}
            >
              <div className="flex items-center gap-3" style={{ marginBottom: 8 }}>
                <div className="flex items-center justify-center bg-[var(--toss-bg)] rounded-xl" style={{ width: 40, height: 40 }}>
                  {section.icon}
                </div>
                <h3 className="text-toss-grey-900" style={{ fontSize: 15, fontWeight: 700 }}>
                  {section.title}
                </h3>
              </div>
              <p className="text-toss-grey-600" style={{ fontSize: 13, lineHeight: 1.6, paddingLeft: 52 }}>
                {section.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 데이터 수집 설정 */}
      <div className="bg-[var(--toss-bg)]" style={{ marginBottom: 8 }}>
        <div style={{ padding: '16px 24px 8px' }}>
          <h3 className="text-toss-grey-900" style={{ fontSize: 15, fontWeight: 700 }}>
            {isKo ? '데이터 수집 설정' : 'Data Collection Settings'}
          </h3>
        </div>

        <div className="flex items-center justify-between" style={{ padding: '12px 24px', minHeight: 52 }}>
          <div className="flex-1 min-w-0" style={{ paddingRight: 12 }}>
            <p className="text-toss-grey-800" style={{ fontSize: 15 }}>
              {isKo ? '사용 통계 수집' : 'Usage Analytics'}
            </p>
            <p className="text-toss-grey-500 mt-0.5" style={{ fontSize: 12 }}>
              {isKo ? '앱 개선을 위한 익명 사용 데이터' : 'Anonymous usage data for app improvement'}
            </p>
          </div>
          <Switch
            checked={analyticsEnabled}
            onChange={(_, checked) => {
              setAnalyticsEnabled(checked);
              toast.openToast(isKo
                ? (checked ? '사용 통계 수집을 활성화했어요' : '사용 통계 수집을 비활성화했어요')
                : (checked ? 'Usage analytics enabled' : 'Usage analytics disabled'));
            }}
          />
        </div>

        <div className="flex items-center justify-between" style={{ padding: '12px 24px 16px', minHeight: 52 }}>
          <div className="flex-1 min-w-0" style={{ paddingRight: 12 }}>
            <p className="text-toss-grey-800" style={{ fontSize: 15 }}>
              {isKo ? '오류 보고' : 'Crash Reports'}
            </p>
            <p className="text-toss-grey-500 mt-0.5" style={{ fontSize: 12 }}>
              {isKo ? '앱 안정성 향상을 위한 오류 로그' : 'Error logs for stability improvement'}
            </p>
          </div>
          <Switch
            checked={crashReportEnabled}
            onChange={(_, checked) => {
              setCrashReportEnabled(checked);
              toast.openToast(isKo
                ? (checked ? '오류 보고를 활성화했어요' : '오류 보고를 비활성화했어요')
                : (checked ? 'Crash reports enabled' : 'Crash reports disabled'));
            }}
          />
        </div>
      </div>

      {/* 데이터 관리 */}
      <div className="bg-[var(--toss-bg)]">
        <div style={{ padding: '16px 24px 8px' }}>
          <h3 className="text-toss-grey-900" style={{ fontSize: 15, fontWeight: 700 }}>
            {isKo ? '내 데이터 관리' : 'My Data'}
          </h3>
        </div>

        <button
          onClick={() => toast.openToast(isKo ? '데이터 내보내기 기능은 준비 중이에요' : 'Data export is coming soon')}
          className="w-full flex items-center gap-3 active:bg-toss-grey-50 transition-colors"
          style={{ padding: '12px 24px', minHeight: 52 }}
        >
          <Download size={20} className="text-toss-grey-500" />
          <div className="flex-1 text-left">
            <p className="text-toss-grey-800" style={{ fontSize: 15 }}>
              {isKo ? '내 데이터 내보내기' : 'Export My Data'}
            </p>
            <p className="text-toss-grey-500 mt-0.5" style={{ fontSize: 12 }}>
              {isKo ? 'JSON 형식으로 다운로드' : 'Download as JSON format'}
            </p>
          </div>
        </button>

        <button
          onClick={() => toast.openToast(isKo ? '전체 데이터 삭제 기능은 준비 중이에요' : 'Full data deletion is coming soon')}
          className="w-full flex items-center gap-3 active:bg-toss-grey-50 transition-colors"
          style={{ padding: '12px 24px 16px', minHeight: 52 }}
        >
          <Trash2 size={20} className="text-toss-red" />
          <div className="flex-1 text-left">
            <p className="text-toss-red" style={{ fontSize: 15 }}>
              {isKo ? '전체 데이터 삭제' : 'Delete All Data'}
            </p>
            <p className="text-toss-grey-500 mt-0.5" style={{ fontSize: 12 }}>
              {isKo ? '모든 인연 데이터를 영구 삭제해요' : 'Permanently delete all contact data'}
            </p>
          </div>
        </button>
      </div>

      {/* 개인정보 처리방침 */}
      <div style={{ padding: '24px' }}>
        <p className="text-toss-grey-400 text-center" style={{ fontSize: 11, lineHeight: 1.6 }}>
          {isKo
            ? '개인정보 처리방침 최종 업데이트: 2026.02.18\nkeppin v1.0.0'
            : 'Privacy Policy last updated: 2026.02.18\nkeppin v1.0.0'}
        </p>
      </div>
    </div>
  );
}