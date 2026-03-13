import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Shield } from 'lucide-react';
import { NavigationBar } from '../components/NavigationBar';

/**
 * PrivacyPolicyPage — 개인정보처리방침 전문
 * TDS 8pt grid, 24px padding
 *
 * 기존 PrivacyPage.tsx는 "개인정보 보호 설정" 대시보드로 유지하고,
 * 이 페이지는 법적 고지 전문용입니다.
 */

interface PolicySection {
  title: string;
  content: string;
}

const POLICY_SECTIONS: PolicySection[] = [
  {
    title: '제1조 (개인정보의 수집 항목 및 수집 방법)',
    content:
      '① 회사는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다.\n\n[필수 수집 항목]\n• 회원가입 시: 이메일 주소, 비밀번호, 이름(닉네임)\n• 서비스 이용 시: 연락처 데이터(이름, 전화번호, 생년월일, 관계, 메모 등 사용자가 직접 입력한 정보)\n\n[선택 수집 항목]\n• 프로필 이미지, 상태 메시지\n• 마케팅 수신 동의 여부\n\n[자동 수집 항목]\n• 서비스 이용 기록, 접속 로그, 기기 정보(OS 버전, 브라우저 정보)\n\n② 개인정보는 회원가입, 서비스 이용 과정에서 사용자가 직접 입력하는 방법으로 수집합니다.',
  },
  {
    title: '제2조 (개인정보의 수집 및 이용 목적)',
    content:
      '회사는 수집한 개인정보를 다음 목적으로 이용합니다.\n\n• 회원 관리: 회원 식별, 본인 확인, 서비스 이용 계약 관리, 부정 이용 방지\n• 서비스 제공: 연락처 관리, 생일 알림, 연락 리마인더 등 핵심 서비스 제공\n• 서비스 개선: 서비스 이용 통계 분석, 오류 탐지 및 개선 (사용자 동의 시)\n• 안내 및 공지: 서비스 변경·중단 안내, 약관 변경 고지\n• 마케팅: 신규 기능 안내, 이벤트 정보 제공 (사용자 동의 시)',
  },
  {
    title: '제3조 (개인정보의 보유 및 이용 기간)',
    content:
      '① 회원의 개인정보는 서비스 이용 계약 기간 동안 보유하며, 탈퇴 시 지체 없이 파기합니다.\n\n② 다만, 관련 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.\n• 전자상거래 등에서의 소비자 보호에 관한 법률\n  - 계약 또는 청약 철회에 관한 기록: 5년\n  - 소비자 불만 또는 분쟁 처리에 관한 기록: 3년\n• 통신비밀보호법\n  - 서비스 이용 관련 로그 기록: 3개월\n\n③ 회원 탈퇴 후에는 관계 법령에 따른 보관 의무가 없는 한 모든 데이터를 즉시 파기합니다.',
  },
  {
    title: '제4조 (개인정보의 제3자 제공)',
    content:
      '① 회사는 원칙적으로 회원의 개인정보를 제3자에게 제공하지 않습니다.\n\n② 다만, 다음 각 호의 경우에는 예외로 합니다.\n  1. 회원이 사전에 동의한 경우\n  2. 법령의 규정에 의하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우\n\n③ 회사는 광고 또는 마케팅 목적으로 회원의 개인정보를 제3자에게 제공하지 않습니다.',
  },
  {
    title: '제5조 (개인정보의 처리 위탁)',
    content:
      '① 회사는 서비스 향상을 위해 다음과 같이 개인정보 처리를 위탁하고 있습니다.\n\n• 위탁 업체: Supabase Inc.\n• 위탁 업무: 클라우드 인프라 제공 및 데이터 저장\n• 보유 및 이용 기간: 회원 탈퇴 또는 위탁 계약 종료 시까지\n\n② 회사는 위탁 업체가 개인정보를 안전하게 처리하도록 필요한 사항을 규정하고 관리·감독합니다.',
  },
  {
    title: '제6조 (개인정보의 파기 절차 및 방법)',
    content:
      '① 회사는 개인정보의 보유 기간이 경과하거나 처리 목적이 달성된 경우, 지체 없이 해당 개인정보를 파기합니다.\n\n② 파기 방법은 다음과 같습니다.\n• 전자적 파일 형태의 정보: 기록을 재생할 수 없는 기술적 방법으로 삭제\n• 종이에 출력된 개인정보: 분쇄기로 분쇄하거나 소각\n\n③ 회원이 직접 등록한 연락처 데이터는 회원 탈퇴 시 서버에서 즉시 삭제되며, 복구할 수 없습니다.',
  },
  {
    title: '제7조 (회원의 권리와 행사 방법)',
    content:
      '① 회원은 언제든지 자신의 개인정보를 조회하거나 수정할 수 있습니다.\n\n② 회원은 언제든지 개인정보의 수집·이용·제공에 대한 동의를 철회할 수 있습니다.\n\n③ 회원은 다음과 같은 권리를 행사할 수 있습니다.\n• 개인정보 열람 요구\n• 개인정보 정정·삭제 요구\n• 개인정보 처리 정지 요구\n• 데이터 이동 요구 (내보내기)\n\n④ 위 권리 행사는 서비스 내 설정 또는 고객센터를 통해 가능합니다.',
  },
  {
    title: '제8조 (개인정보의 안전성 확보 조치)',
    content:
      '회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.\n\n• 관리적 조치: 개인정보 보호 내부 관리 계획 수립·시행\n• 기술적 조치: 데이터 암호화(TLS/AES-256), 접근 통제 시스템 적용, 보안 프로그램 설치·운영\n• 물리적 조치: 클라우드 인프라를 통한 물리적 접근 제한',
  },
  {
    title: '제9조 (쿠키의 운영 및 거부)',
    content:
      '① 회사는 서비스 이용 편의를 위해 쿠키(Cookie)를 사용할 수 있습니다.\n\n② 쿠키는 웹사이트 이용 시 자동으로 생성·저장되며, 사용자는 브라우저 설정을 통해 쿠키를 거부할 수 있습니다.\n\n③ 쿠키를 거부할 경우 일부 서비스 이용이 제한될 수 있습니다.',
  },
  {
    title: '제10조 (개인정보 보호 책임자)',
    content:
      '회사는 개인정보 처리에 관한 업무를 총괄하고 회원의 불만 처리 및 피해 구제를 위하여 아래와 같이 개인정보 보호 책임자를 지정하고 있습니다.\n\n• 개인정보 보호 책임자\n  - 직책: 대표\n  - 연락처: 앱 내 문의하기 기능을 이용해주세요\n\n• 개인정보 침해 신고·상담\n  - 개인정보침해신고센터 (privacy.kisa.or.kr / 국번없이 118)\n  - 대검찰청 사이버수사과 (spo.go.kr / 국번없이 1301)\n  - 경찰청 사이버안전국 (cyberbureau.police.go.kr / 국번없이 182)',
  },
  {
    title: '제11조 (고지의 의무)',
    content:
      '이 개인정보처리방침은 2026년 2월 19일부터 적용되며, 법령·정책 또는 보안 기술의 변경에 따라 내용의 추가·삭제 및 수정이 있을 경우에는 변경 사항의 시행 7일 전부터 서비스 내 공지사항을 통하여 고지합니다.',
  },
];

export function PrivacyPolicyPage() {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const toggleSection = (idx: number) => {
    setExpandedIdx((prev) => (prev === idx ? null : idx));
  };

  return (
    <div className="min-h-dvh bg-[var(--toss-bg)] pb-12">
      <NavigationBar title="개인정보처리방침" showBack />

      {/* 헤더 */}
      <div style={{ padding: '16px 24px 20px' }}>
        <div
          className="flex items-center justify-center bg-toss-blue-50 rounded-2xl"
          style={{ width: 48, height: 48, marginBottom: 14 }}
        >
          <Shield size={22} className="text-toss-blue" />
        </div>
        <h2 className="text-toss-grey-900" style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
          개인정보처리방침
        </h2>
        <p className="text-toss-grey-500" style={{ fontSize: 13, lineHeight: 1.6 }}>
          시행일: 2026년 2월 19일
          {'\n'}keepin은 회원의 개인정보를 소중하게 다루고 있습니다.
        </p>
      </div>

      {/* 아코디언 섹션 */}
      <div style={{ padding: '0 16px' }}>
        {POLICY_SECTIONS.map((section, idx) => (
          <div key={idx} className="border-b border-toss-grey-100 last:border-b-0">
            <button
              onClick={() => toggleSection(idx)}
              className="w-full flex items-center justify-between text-left active:bg-toss-grey-50 transition-colors rounded-xl"
              style={{ padding: '16px 8px', minHeight: 48 }}
              aria-expanded={expandedIdx === idx}
              aria-controls={`policy-section-${idx}`}
            >
              <span
                className="text-toss-grey-900 flex-1"
                style={{ fontSize: 15, fontWeight: expandedIdx === idx ? 700 : 500 }}
              >
                {section.title}
              </span>
              <motion.span
                animate={{ rotate: expandedIdx === idx ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="shrink-0 ml-2"
              >
                <ChevronDown size={18} className="text-toss-grey-400" />
              </motion.span>
            </button>

            <AnimatePresence initial={false}>
              {expandedIdx === idx && (
                <motion.div
                  id={`policy-section-${idx}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="overflow-hidden"
                >
                  <p
                    className="text-toss-grey-600"
                    style={{
                      fontSize: 13,
                      lineHeight: 1.8,
                      padding: '0 8px 16px',
                      whiteSpace: 'pre-line',
                    }}
                  >
                    {section.content}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* 하단 안내 */}
      <div style={{ padding: '24px' }}>
        <div className="bg-toss-grey-50 rounded-2xl" style={{ padding: '16px 20px' }}>
          <p className="text-toss-grey-600" style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
            개인정보 관련 문의
          </p>
          <p className="text-toss-grey-500" style={{ fontSize: 12, lineHeight: 1.6 }}>
            개인정보 처리에 관한 불만이나 피해 구제가 필요한 경우,
            앱 내 문의하기 기능을 이용해주세요.
          </p>
        </div>
        <p className="text-toss-grey-400 text-center mt-4" style={{ fontSize: 11 }}>
          keepin v1.0.0
        </p>
      </div>
    </div>
  );
}
