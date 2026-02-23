import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { NavigationBar } from '../components/NavigationBar';
import { useLanguage } from '../components/useLanguage';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const FAQ_DATA_KO: FAQItem[] = [
  {
    category: '일반',
    question: 'keppin은 어떤 앱인가요?',
    answer: 'keppin은 소중한 인연들과의 관계를 관리하고 유지할 수 있도록 도와주는 인연 관리 앱이에요. 생일 알림, 연락 주기 관리, 메모 기능 등으로 중요한 관계를 놓치지 않게 해줘요.',
  },
  {
    category: '일반',
    question: '무료로 사용할 수 있나요?',
    answer: 'keppin의 기본 기능은 모두 무료로 사용할 수 있어요. 연락처 등록, 생일 알림, 연락 공백 확인 등 핵심 기능을 무료로 이용하실 수 있습니다.',
  },
  {
    category: '계정',
    question: '회원가입은 어떻게 하나요?',
    answer: '카카오톡, 네이버, 구글 소셜 로그인으로 간편하게 가입하거나, 이메일로 직접 회원가입할 수 있어요. 앱 첫 화면에서 원하는 방법을 선택해주세요.',
  },
  {
    category: '계정',
    question: '비밀번호를 잊어버렸어요.',
    answer: '로그인 화면에서 "비밀번호를 잊으셨나요?"를 탭하면 이메일로 비밀번호 재설정 링크를 받을 수 있어요. 소셜 로그인을 사용하시면 비밀번호 없이 로그인할 수 있어요.',
  },
  {
    category: '계정',
    question: '회원 탈퇴하면 데이터가 어떻게 되나요?',
    answer: '회원 탈퇴 시 모든 인연 데이터가 영구적으로 삭제돼요. 탈퇴 후에는 복구가 불가능하니 신중하게 결정해주세요.',
  },
  {
    category: '인연 관리',
    question: '연락처를 어떻게 추가하나요?',
    answer: '홈 화면의 "새 인연 추가하기" 버튼 또는 인연 목록 화면의 + 버튼을 탭하면 새 연락처를 등록할 수 있어요. 이름, 관계, 친함 정도는 필수 입력 사항이에요.',
  },
  {
    category: '인연 관리',
    question: '마지막 연락일은 어떻게 수정하나요?',
    answer: '인연 상세 페이지에서 "마지막 연락" 영역을 탭하면 캘린더 팝업이 나타나요. 날짜를 선택하면 연락 공백이 자동으로 재계산돼요. 수정 페이지에서도 변경할 수 있어요.',
  },
  {
    category: '인연 관리',
    question: '생일을 모를 때는 어떻게 하나요?',
    answer: '연락처 추가 또는 수정 화면에서 "나이 · 생일" 영역의 "모름" 체크박스를 선택면 생일을 모르는 상태로 저장할 수 있어요.',
  },
  {
    category: '인연 관리',
    question: '친함 정도는 어떤 기준으로 설정하나요?',
    answer: '친함 정도는 "매우 친함", "친함", "보통", "가끔", "거의 모름" 5단계로 나뉘어요. 자신이 느끼는 친밀감을 기준으로 자유롭게 설정해주세요. 가족 관계는 자동으로 "가족"으로 설정돼요.',
  },
  {
    category: '알림',
    question: '생일 알림은 언제 오나요?',
    answer: '설정에서 지정한 시간에 맞춰 생일 당일과 D-7일에 알림을 보내드려요. 푸시 알림이 켜져 있어야 받을 수 있어요.',
  },
  {
    category: '알림',
    question: '연락 리마인더 주기를 변경할 수 있나요?',
    answer: '설정 > 리마인더 주기에서 7일, 14일, 30일 중 원하는 주기를 선택할 수 있어요. 설정한 기간 동안 연락하지 않은 인연에 대해 알림을 보내드려요.',
  },
  {
    category: '데이터',
    question: '데이터는 안전하게 보관되나요?',
    answer: '현재 keppin의 데이터는 기기 내부(localStorage)에 저장돼요. 앱을 삭제하거나 브라우저 데이터를 지우면 데이터가 사라질 수 있으니 주의해주세요. 향후 클라우드 동기화 기능을 제공할 예정이에요.',
  },
  {
    category: '데이터',
    question: '다른 기기에서도 사용할 수 있나요?',
    answer: '현재는 기기별로 데이터가 저장돼요. 추후 Supabase 기반 클라우드 동기화 기능이 추가되면 여러 기기에서 동일한 데이터에 접근할 수 있게 될 거예요.',
  },
];

const FAQ_DATA_EN: FAQItem[] = [
  {
    category: 'General',
    question: 'What is keppin?',
    answer: 'keppin is a relationship management app that helps you maintain and nurture your personal connections. With features like birthday reminders, contact frequency tracking, and notes, you\'ll never lose touch with the people who matter.',
  },
  {
    category: 'General',
    question: 'Is it free to use?',
    answer: 'All core features of keppin are free to use, including contact registration, birthday alerts, and contact gap tracking.',
  },
  {
    category: 'Account',
    question: 'How do I sign up?',
    answer: 'You can sign up quickly using Kakao, Naver, or Google social login, or register directly with your email address.',
  },
  {
    category: 'Account',
    question: 'I forgot my password.',
    answer: 'Tap "Forgot password?" on the login screen to receive a password reset link via email. If you use social login, you don\'t need a password.',
  },
  {
    category: 'Contacts',
    question: 'How do I add a contact?',
    answer: 'Tap the "Add New Contact" button on the home screen or the + button on the contacts list. Name, relationship, and closeness are required fields.',
  },
  {
    category: 'Contacts',
    question: 'How do I edit the last contact date?',
    answer: 'Tap the "Last Contact" area on the contact detail page to open a calendar popup. Select a date and the contact gap will be automatically recalculated.',
  },
  {
    category: 'Notifications',
    question: 'When do birthday alerts come?',
    answer: 'Birthday notifications are sent on the birthday and 7 days before, at the time you set in Settings. Push notifications must be enabled.',
  },
  {
    category: 'Data',
    question: 'Is my data safe?',
    answer: 'Currently, data is stored locally on your device (localStorage). Cloud sync via Supabase is planned for future releases.',
  },
];

const CATEGORIES_KO = ['전체', '일반', '계정', '인연 관리', '알림', '데이터'];
const CATEGORIES_EN = ['All', 'General', 'Account', 'Contacts', 'Notifications', 'Data'];

export function FAQPage() {
  const { lang } = useLanguage();
  const [activeCategory, setActiveCategory] = useState(lang === 'en' ? 'All' : '전체');
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const faqData = lang === 'en' ? FAQ_DATA_EN : FAQ_DATA_KO;
  const categories = lang === 'en' ? CATEGORIES_EN : CATEGORIES_KO;
  const allLabel = lang === 'en' ? 'All' : '전체';

  const filteredFAQ = activeCategory === allLabel
    ? faqData
    : faqData.filter((item) => item.category === activeCategory);

  return (
    <div className="min-h-dvh bg-[var(--toss-bg)]">
      <NavigationBar title={lang === 'en' ? 'FAQ' : '자주 묻는 질문'} showBack />

      {/* Category filter */}
      <div className="overflow-x-auto" style={{ padding: '8px 24px 16px' }}>
        <div className="flex gap-2">
          {categories.map((cat) => {
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); setExpandedIdx(null); }}
                className={`shrink-0 px-4 py-2 rounded-full transition-colors ${
                  active
                    ? 'bg-toss-blue text-[var(--primary-foreground)]'
                    : 'bg-toss-grey-100 text-toss-grey-600 active:bg-toss-grey-200'
                }`}
                style={{ fontSize: 13, fontWeight: active ? 600 : 400, minHeight: 36 }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* FAQ list */}
      <div style={{ padding: '0 24px 32px' }}>
        {filteredFAQ.map((item, idx) => {
          const isOpen = expandedIdx === idx;
          return (
            <div key={idx} className="border-b border-toss-grey-100 last:border-b-0">
              <button
                onClick={() => setExpandedIdx(isOpen ? null : idx)}
                className="w-full flex items-start justify-between py-4 text-left active:bg-toss-grey-50 transition-colors -mx-2 px-2 rounded-lg"
                style={{ minHeight: 52 }}
                aria-expanded={isOpen}
              >
                <div className="flex-1 min-w-0" style={{ paddingRight: 12 }}>
                  <span className="text-toss-grey-400" style={{ fontSize: 11, fontWeight: 500 }}>
                    {item.category}
                  </span>
                  <p className="text-toss-grey-900 mt-0.5" style={{ fontSize: 15, fontWeight: 500 }}>
                    {item.question}
                  </p>
                </div>
                <motion.span
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-toss-grey-400 shrink-0 mt-1"
                >
                  <ChevronDown size={18} />
                </motion.span>
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <p
                      className="text-toss-grey-600 pb-4 px-2"
                      style={{ fontSize: 14, lineHeight: 1.7 }}
                    >
                      {item.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {filteredFAQ.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-toss-grey-400" style={{ fontSize: 14 }}>
              {lang === 'en' ? 'No FAQs in this category' : '해당 카테고리에 질문이 없어요'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}