import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { NavigationBar } from '../components/NavigationBar';

/**
 * TermsPage — 서비스 이용약관 전문
 * TDS 8pt grid, 24px padding
 */

interface TermsSection {
  title: string;
  content: string;
}

const TERMS_SECTIONS: TermsSection[] = [
  {
    title: '제1조 (목적)',
    content:
      '이 약관은 keppin(이하 "서비스")을 제공하는 운영자(이하 "회사")와 서비스를 이용하는 회원(이하 "회원") 간의 권리·의무 및 기타 필요한 사항을 규정함을 목적으로 합니다.',
  },
  {
    title: '제2조 (정의)',
    content:
      '① "서비스"란 회사가 제공하는 인맥 관리 및 관계 기록 관련 제반 서비스를 의미합니다.\n② "회원"이란 서비스에 가입하여 이 약관에 따라 서비스를 이용하는 자를 말합니다.\n③ "개인정보"란 생존하는 개인에 관한 정보로서, 해당 정보에 의해 특정 개인을 알아볼 수 있는 정보를 말합니다.\n④ "콘텐츠"란 회원이 서비스에 입력·등록한 연락처, 메모, 일정 등 모든 데이터를 의미합니다.',
  },
  {
    title: '제3조 (약관의 효력 및 변경)',
    content:
      '① 이 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이 발생합니다.\n② 회사는 관련 법령을 위배하지 않는 범위에서 이 약관을 개정할 수 있으며, 개정 시 적용일자 및 개정 사유를 명시하여 최소 7일 전에 공지합니다.\n③ 회원이 변경된 약관에 동의하지 않는 경우, 서비스 이용을 중단하고 탈퇴할 수 있습니다.',
  },
  {
    title: '제4조 (서비스 이용 계약의 성립)',
    content:
      '① 이용 계약은 회원이 되고자 하는 자가 약관에 동의한 후 회원가입 신청을 하고, 회사가 이를 승낙함으로써 체결됩니다.\n② 회사는 다음 각 호의 사유가 있는 경우 가입을 거부할 수 있습니다.\n  1. 타인의 정보를 도용한 경우\n  2. 허위 정보를 기재하거나 필수 사항을 미기재한 경우\n  3. 기타 서비스 운영에 지장을 초래할 우려가 있는 경우',
  },
  {
    title: '제5조 (회원의 의무)',
    content:
      '① 회원은 서비스 이용 시 관계 법령, 이 약관 및 서비스 이용 안내를 준수하여야 합니다.\n② 회원은 다음 각 호의 행위를 해서는 안 됩니다.\n  1. 타인의 개인정보를 무단으로 수집·이용하는 행위\n  2. 서비스를 이용하여 제3자의 권리를 침해하는 행위\n  3. 서비스의 정상적인 운영을 방해하는 행위\n  4. 기타 불법적이거나 부당한 행위\n③ 회원은 자신의 계정 정보(이메일, 비밀번호)를 안전하게 관리할 책임이 있습니다.',
  },
  {
    title: '제6조 (서비스의 제공 및 변경)',
    content:
      '① 회사는 다음과 같은 서비스를 제공합니다.\n  1. 연락처 관리 및 인맥 기록 서비스\n  2. 생일·기념일 알림 서비스\n  3. 연락 리마인더 서비스\n  4. 기타 회사가 정하는 서비스\n② 회사는 서비스의 내용을 변경할 수 있으며, 이 경우 변경 사항을 사전에 공지합니다.',
  },
  {
    title: '제7조 (서비스의 중단)',
    content:
      '① 회사는 천재지변, 시스템 점검, 통신 장애 등 부득이한 사유가 발생한 경우 서비스의 전부 또는 일부를 일시적으로 중단할 수 있습니다.\n② 서비스 중단의 경우, 회사는 가능한 한 사전에 공지합니다.\n③ 회사는 무료로 제공되는 서비스의 이용과 관련하여 회원에게 발생한 손해에 대해 책임을 지지 않습니다.',
  },
  {
    title: '제8조 (회원 탈퇴 및 자격 상실)',
    content:
      '① 회원은 언제든지 서비스 내 설정을 통해 탈퇴를 요청할 수 있으며, 회사는 즉시 탈퇴 처리합니다.\n② 탈퇴 시 회원이 등록한 모든 데이터는 관련 법령에서 정한 보관 의무가 없는 한 즉시 삭제됩니다.\n③ 회사는 회원이 본 약관을 위반한 경우 경고, 일시 정지, 영구 이용 정지 등의 조치를 취할 수 있습니다.',
  },
  {
    title: '제9조 (저작권 및 지적재산권)',
    content:
      '① 서비스에 포함된 디자인, 로고, 소프트웨어 등에 대한 저작권 및 지적재산권은 회사에 귀속됩니다.\n② 회원이 서비스에 등록한 콘텐츠의 저작권은 해당 회원에게 귀속됩니다.\n③ 회사는 서비스 운영 목적 외에 회원의 콘텐츠를 이용하지 않습니다.',
  },
  {
    title: '제10조 (면책 조항)',
    content:
      '① 회사는 천재지변, 전쟁, 기간통신사업자의 서비스 중지 등 불가항력으로 인해 서비스를 제공할 수 없는 경우에는 책임이 면제됩니다.\n② 회사는 회원의 귀책 사유로 인한 서비스 이용 장애에 대해 책임을 지지 않습니다.\n③ 회사는 회원이 서비스를 통해 기대하는 수익을 얻지 못하거나, 서비스 이용으로 발생하는 손해에 대해 책임을 지지 않습니다.',
  },
  {
    title: '제11조 (분쟁 해결)',
    content:
      '① 회사와 회원 사이에 발생한 분쟁에 대해서는 대한민국 법률을 적용합니다.\n② 서비스 이용과 관련하여 분쟁이 발생한 경우, 회사의 본사 소재지를 관할하는 법원을 전속 관할 법원으로 합니다.',
  },
  {
    title: '부칙',
    content:
      '① 이 약관은 2026년 2월 19일부터 시행합니다.\n② 이 약관에 명시되지 않은 사항은 관계 법령 및 상관례에 따릅니다.',
  },
];

export function TermsPage() {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const toggleSection = (idx: number) => {
    setExpandedIdx((prev) => (prev === idx ? null : idx));
  };

  return (
    <div className="min-h-dvh bg-[var(--toss-bg)] pb-12">
      <NavigationBar title="서비스 이용약관" showBack />

      {/* 헤더 */}
      <div style={{ padding: '16px 24px 20px' }}>
        <h2 className="text-toss-grey-900" style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
          서비스 이용약관
        </h2>
        <p className="text-toss-grey-500" style={{ fontSize: 13, lineHeight: 1.6 }}>
          시행일: 2026년 2월 19일
        </p>
      </div>

      {/* 아코디언 섹션 */}
      <div style={{ padding: '0 16px' }}>
        {TERMS_SECTIONS.map((section, idx) => (
          <div key={idx} className="border-b border-toss-grey-100 last:border-b-0">
            <button
              onClick={() => toggleSection(idx)}
              className="w-full flex items-center justify-between text-left active:bg-toss-grey-50 transition-colors rounded-xl"
              style={{ padding: '16px 8px', minHeight: 48 }}
              aria-expanded={expandedIdx === idx}
              aria-controls={`terms-section-${idx}`}
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
                  id={`terms-section-${idx}`}
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
        <p className="text-toss-grey-400 text-center" style={{ fontSize: 11, lineHeight: 1.6 }}>
          본 약관에 대해 궁금한 점이 있으시면{'\n'}
          앱 내 문의하기를 통해 연락해주세요.
        </p>
      </div>
    </div>
  );
}
