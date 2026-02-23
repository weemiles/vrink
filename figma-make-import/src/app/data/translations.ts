/**
 * translations.ts
 * ─────────────────────────────────────────
 * keppin i18n 번역 사전
 * 지원 언어: ko (한국어), en (English)
 */

export type Lang = 'ko' | 'en';

export const LANG_LABELS: Record<Lang, string> = {
  ko: '한국어',
  en: 'English',
};

const translations: Record<Lang, Record<string, string>> = {
  /* ═══════════════════════════════════════
     한국어 (기본)
     ═══════════════════════════════════════ */
  ko: {
    /* ── 공통 / 네비게이션 ── */
    'common.home': '홈',
    'common.contacts': '인연',
    'common.calendar': '캘린더',
    'common.mypage': '마이',
    'common.settings': '설정',
    'common.back': '뒤로',
    'common.cancel': '취소',
    'common.confirm': '확인',
    'common.save': '저장',
    'common.delete': '삭제',
    'common.edit': '수정',
    'common.done': '완료',
    'common.change': '변경',
    'common.restore': '복원',
    'common.close': '닫기',
    'common.next': '다음',
    'common.search': '검색',
    'common.retry': '재시도',
    'common.withdraw': '탈퇴',

    /* ── 설정 페이지 ── */
    'settings.title': '설정',

    /* 그룹 제목 */
    'settings.group.notification': '알림',
    'settings.group.security': '보안',
    'settings.group.account': '계정',
    'settings.group.general': '기타',

    /* 알림 그룹 */
    'settings.push': '푸시 알림',
    'settings.push.desc': '마케팅 주 {weeklyMax}회, {startHour}시~{endHour}시',
    'settings.birthday_alert': '생일 알림',
    'settings.reminder': '리마인더 주기',
    'settings.reminder.7': '7일',
    'settings.reminder.14': '14일',
    'settings.reminder.30': '30일',
    'settings.reminder.changed': '리마인더 주기를 {days}일로 변경했어요',
    'settings.dnd': '방해금지 시간',
    'settings.dnd.desc': '설정한 시간에는 알림을 보내지 않아요',

    /* 보안 그룹 */
    'settings.biometric': '생체 인증 잠금',
    'settings.biometric.desc': '앱을 열 때 생체 인증으로 잠금해요',
    'settings.auto_lock': '자동 잠금',
    'settings.auto_lock.min': '1분',
    'settings.auto_lock.mid': '15분',
    'settings.auto_lock.max': '30분',
    'settings.password_change': '비밀번호 변경',
    'settings.password_change.desc': '변경 시 다른 기기에서 자동 로그아웃돼요',
    'settings.support_code': '지원 코드',
    'settings.support_code.desc': '이 코드를 고객센터에 전달해주세요',
    'settings.contact_support': '문의하기',
    'settings.support_submitted': '문의 접수가 완료됐어요',

    /* 계정 그룹 */
    'settings.data_retention': '데이터 보관',
    'settings.data_retention.desc': '기간 만료 시 영구 삭제돼요',
    'settings.delete_account': '회원 탈퇴',
    'settings.delete_account.title': '정말 탈퇴할까요?',
    'settings.delete_account.desc': '탈퇴하면 모든 인연 데이터가 영구 삭제돼요. 이 작업은 되돌릴 수 없어요.',
    'settings.delete_account.confirm': '탈퇴하기',
    'settings.delete_account.done': '회원 탈퇴가 완료됐어요',

    /* 기타 그룹 */
    'settings.theme': '화면 테마',
    'settings.theme.light': '라이트',
    'settings.theme.dark': '다크',
    'settings.theme.system': '시스템',
    'settings.theme.changed': '{label} 모드로 변경했어요',
    'settings.language': '언어',
    'settings.language.changed': '언어를 {label}(으)로 변경했어요',
    'settings.hidden_tags': '숨긴 관계 태그',
    'settings.hidden_tags.empty': '숨긴 관계 태그가 없어요',
    'settings.hidden_tags.count': '{items} ({count}개 숨김)',
    'settings.hidden_tags.restored': '기본 관계를 복원했어요',
    'settings.app_version': '앱 버전',

    /* 토글 토스트 */
    'settings.toggle.on': '{label}을 활성화했어요',
    'settings.toggle.off': '{label}을 비활성화했어요',

    /* 비밀번호 변경 결과 */
    'settings.password.success': '비밀번호를 변경했어요',
    'settings.password.failed': '비밀번호 변경에 실패했어요',

    /* ── 홈 페이지 ── */
    'home.title': '홈',
    'home.my_contacts': '나의 인연',
    'home.count_unit': '명',
    'home.upcoming_birthday': '다가오는 생일',
    'home.view_all': '전체보기',
    'home.needs_attention': '연락이 뜸한 사람',
    'home.add_contact': '새 인연 추가하기',
    'home.search': '인연 검색',
    'home.search_placeholder': '이름 또는 메모로 검색',
    'home.no_results': '검색 결과가 없어요',
    'home.tip.title': '인연 관리 팁',
    'home.tip.desc': '정기적으로 연락하면 관계가 더 가까워져요. 2주에 한 번 안부를 전해보세요.',
    'home.last_contact': '마지막 연락 {gap}',

    /* ── 인연 목록 ── */
    'contacts.title': '인연',
    'contacts.sort.birthday': '생일순',
    'contacts.sort.name': '이름순',
    'contacts.sort.recent': '최근 연락순',
    'contacts.empty': '등록된 인연이 없어요',

    /* ── 폼 공통 ── */
    'form.last_contact_label': '마지막 연락일',
    'form.last_contact_help': '입력하면 연락 공백이 자동으로 계산돼요',
    'form.last_contact_future': '미래 날짜예요',
    'form.last_contact_today': '오늘 연락함',
    'form.no_contact_days': '연락 안 한지 {days}일',
    'form.no_contact_weeks': '연락 안 한지 {weeks}주',
    'form.no_contact_months': '연락 안 한지 {months}개월',
    'form.no_contact_years': '연락 안 한지 {years}년 이상',
    'form.birthday_label': '나이 · 생일',
    'form.birthday_unknown': '모름',
    'form.birthday_help': '생년월일을 입력하면 나이가 자동으로 계산돼요',
    'form.birthday_unknown_msg': '생일을 모르는 상태로 저장돼요',
    'form.basic_info': '기본 정보',
    'form.relationship_settings': '관계 설정',
    'form.memo': '메모',
    'form.edit_title': '연락처 수정',
    'form.add_title': '연락처 추가',
    'form.save': '저장',
    'form.edit_done': '수정 완료',
    'form.contact_saved': '연락처를 저장했어요',
    'form.contact_edited': '연락처를 수정했어요',
    'form.undo': '되돌리기',
    'form.undo_done': '수정을 되돌렸어요',
    'form.dirty_title': '수정을 그만할까요?',
    'form.dirty_desc': '변경한 내용이 저장되지 않아요.',
    'form.dirty_leave': '나가기',
    'form.dirty_continue': '계속 수정',

    /* ── 캘린더 ── */
    'calendar.title': '캘린더',
    'calendar.birthday': '생일',
    'calendar.holiday': '공휴일',

    /* ── 마이페이지 ── */
    'mypage.title': '마이',
    'mypage.total': '전체 인연',
    'mypage.close': '가까운 사람',
    'mypage.gift_done': '선물 완료',
    'mypage.closeness_dist': '친밀도 분포',
    'mypage.manage': '관리',
    'mypage.my_stats': '내 인연 통계',
    'mypage.birthday_cal': '생일 캘린더',
    'mypage.favorites': '즐겨찾기',
    'mypage.settings_group': '설정',
    'mypage.app_settings': '앱 설정',
    'mypage.darkmode': '다크모드',
    'mypage.darkmode.on': '켜짐',
    'mypage.darkmode.off': '꺼짐',
    'mypage.privacy': '개인정보 보호',
    'mypage.help': '도움말',
    'mypage.faq': '자주 묻는 질문',
    'mypage.inquiry': '문의하기',
    'mypage.logout': '로그아웃',
    'mypage.logout.title': '로그아웃할까요?',
    'mypage.logout.desc': '다시 로그인하면 데이터를 복원할 수 있어요.',
    'mypage.preparing': '{feature} 기능은 준비 중이에요',

    /* ── 하단 탭바 ── */
    'tab.home': '홈',
    'tab.contacts': '인연',
    'tab.calendar': '캘린더',
    'tab.mypage': '마이',
  },

  /* ═══════════════════════════════════════
     English
     ═══════════════════════════════════════ */
  en: {
    /* ── Common / Navigation ── */
    'common.home': 'Home',
    'common.contacts': 'Contacts',
    'common.calendar': 'Calendar',
    'common.mypage': 'My',
    'common.settings': 'Settings',
    'common.back': 'Back',
    'common.cancel': 'Cancel',
    'common.confirm': 'OK',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.done': 'Done',
    'common.change': 'Change',
    'common.restore': 'Restore',
    'common.close': 'Close',
    'common.next': 'Next',
    'common.search': 'Search',
    'common.retry': 'Retry',
    'common.withdraw': 'Withdraw',

    /* ── Settings ── */
    'settings.title': 'Settings',

    /* Group headings */
    'settings.group.notification': 'Notifications',
    'settings.group.security': 'Security',
    'settings.group.account': 'Account',
    'settings.group.general': 'General',

    /* Notifications */
    'settings.push': 'Push Notifications',
    'settings.push.desc': 'Marketing max {weeklyMax}/week, {startHour}:00–{endHour}:00',
    'settings.birthday_alert': 'Birthday Alerts',
    'settings.reminder': 'Reminder Interval',
    'settings.reminder.7': '7 days',
    'settings.reminder.14': '14 days',
    'settings.reminder.30': '30 days',
    'settings.reminder.changed': 'Reminder interval changed to {days} days',
    'settings.dnd': 'Do Not Disturb',
    'settings.dnd.desc': 'Mute notifications during set hours',

    /* Security */
    'settings.biometric': 'Biometric Lock',
    'settings.biometric.desc': 'Require biometrics to open the app',
    'settings.auto_lock': 'Auto Lock',
    'settings.auto_lock.min': '1 min',
    'settings.auto_lock.mid': '15 min',
    'settings.auto_lock.max': '30 min',
    'settings.password_change': 'Change Password',
    'settings.password_change.desc': 'Other devices will be signed out',
    'settings.support_code': 'Support Code',
    'settings.support_code.desc': 'Share this code with customer support',
    'settings.contact_support': 'Contact Support',
    'settings.support_submitted': 'Support request submitted',

    /* Account */
    'settings.data_retention': 'Data Retention',
    'settings.data_retention.desc': 'Data is permanently deleted after expiry',
    'settings.delete_account': 'Delete Account',
    'settings.delete_account.title': 'Delete your account?',
    'settings.delete_account.desc': 'All your contact data will be permanently deleted. This cannot be undone.',
    'settings.delete_account.confirm': 'Delete',
    'settings.delete_account.done': 'Account has been deleted',

    /* General */
    'settings.theme': 'Theme',
    'settings.theme.light': 'Light',
    'settings.theme.dark': 'Dark',
    'settings.theme.system': 'System',
    'settings.theme.changed': 'Changed to {label} mode',
    'settings.language': 'Language',
    'settings.language.changed': 'Language changed to {label}',
    'settings.hidden_tags': 'Hidden Tags',
    'settings.hidden_tags.empty': 'No hidden relationship tags',
    'settings.hidden_tags.count': '{items} ({count} hidden)',
    'settings.hidden_tags.restored': 'Default relationships restored',
    'settings.app_version': 'App Version',

    /* Toggle toasts */
    'settings.toggle.on': '{label} enabled',
    'settings.toggle.off': '{label} disabled',

    /* Password change results */
    'settings.password.success': 'Password changed successfully',
    'settings.password.failed': 'Failed to change password',

    /* ── Home ── */
    'home.title': 'Home',
    'home.my_contacts': 'My Contacts',
    'home.count_unit': '',
    'home.upcoming_birthday': 'Upcoming Birthdays',
    'home.view_all': 'View All',
    'home.needs_attention': 'Needs Attention',
    'home.add_contact': 'Add New Contact',
    'home.search': 'Search Connections',
    'home.search_placeholder': 'Search by name or memo',
    'home.no_results': 'No results found',
    'home.tip.title': 'Connection Tip',
    'home.tip.desc': 'Regular check-ins strengthen relationships. Try reaching out every 2 weeks.',
    'home.last_contact': 'Last contact {gap}',

    /* ── Contacts ── */
    'contacts.title': 'Contacts',
    'contacts.sort.birthday': 'Birthday',
    'contacts.sort.name': 'Name',
    'contacts.sort.recent': 'Recent',
    'contacts.empty': 'No contacts yet',

    /* ── 폼 공통 ── */
    'form.last_contact_label': 'Last Contact Date',
    'form.last_contact_help': 'Enter to automatically calculate the contact gap',
    'form.last_contact_future': 'Future date',
    'form.last_contact_today': 'Contacted today',
    'form.no_contact_days': 'No contact for {days} days',
    'form.no_contact_weeks': 'No contact for {weeks} weeks',
    'form.no_contact_months': 'No contact for {months} months',
    'form.no_contact_years': 'No contact for {years} years or more',
    'form.birthday_label': 'Age · Birthday',
    'form.birthday_unknown': 'Unknown',
    'form.birthday_help': 'Enter date of birth to automatically calculate age',
    'form.birthday_unknown_msg': 'Saved with unknown birthday',
    'form.basic_info': 'Basic Info',
    'form.relationship_settings': 'Relationship Settings',
    'form.memo': 'Memo',
    'form.edit_title': 'Edit Contact',
    'form.add_title': 'Add Contact',
    'form.save': 'Save',
    'form.edit_done': 'Edit Complete',
    'form.contact_saved': 'Contact saved',
    'form.contact_edited': 'Contact edited',
    'form.undo': 'Undo',
    'form.undo_done': 'Edit undone',
    'form.dirty_title': 'Stop editing?',
    'form.dirty_desc': 'Changes have not been saved.',
    'form.dirty_leave': 'Leave',
    'form.dirty_continue': 'Continue editing',

    /* ── Calendar ── */
    'calendar.title': 'Calendar',
    'calendar.birthday': 'Birthday',
    'calendar.holiday': 'Holiday',

    /* ── My Page ── */
    'mypage.title': 'My',
    'mypage.total': 'Total',
    'mypage.close': 'Close Friends',
    'mypage.gift_done': 'Gifted',
    'mypage.closeness_dist': 'Closeness',
    'mypage.manage': 'Manage',
    'mypage.my_stats': 'Contact Stats',
    'mypage.birthday_cal': 'Birthday Calendar',
    'mypage.favorites': 'Favorites',
    'mypage.settings_group': 'Settings',
    'mypage.app_settings': 'App Settings',
    'mypage.darkmode': 'Dark Mode',
    'mypage.darkmode.on': 'On',
    'mypage.darkmode.off': 'Off',
    'mypage.privacy': 'Privacy',
    'mypage.help': 'Help',
    'mypage.faq': 'FAQ',
    'mypage.inquiry': 'Contact Us',
    'mypage.logout': 'Log Out',
    'mypage.logout.title': 'Log out?',
    'mypage.logout.desc': 'You can restore your data by logging in again.',
    'mypage.preparing': '{feature} is coming soon',

    /* ── Tab bar ── */
    'tab.home': 'Home',
    'tab.contacts': 'Connections',
    'tab.calendar': 'Calendar',
    'tab.mypage': 'My',
  },
};

export default translations;