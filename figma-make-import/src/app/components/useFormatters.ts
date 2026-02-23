/**
 * TDS 제품 운영 심화 8, §3 — 데이터 표기(Formatting System)
 * + 제품 운영 확장 (수치 중심) 6, §1.4 — 숫자/금액 표기 규칙
 *
 * - formatCurrency: 금액 표기 (KRW, 천단위 콤마, 만/억 축약)
 * - formatPercent: 퍼센트 표기 (일반 0, 정밀 1, <1% → 1 자리)
 * - formatDate: YYYY.MM.DD
 * - formatDateTime: YYYY.MM.DD HH:mm
 * - formatRelativeTime: 방금 / N분 전 / N시간 전 → 24h 이후 절대 날짜
 * - maskPhone: 010-****-1234
 * - maskAccount: ****-****-1234
 * - formatContactGap: 연락 공백 일수 → "N일 전" 또는 상대시간
 * - abbreviateNumber: 10,000+ → 만 단위, 1억+ → 억 단위 (§1.4)
 */

/** §3.1 금액(KRW) 표기 — 확장6 §1.4 축약 규칙 반영 */
export function formatCurrency(amount: number, compress: boolean = false): string {
  if (compress) {
    // §1.4 큰 수 축약: 억 → 만 → 기본
    if (Math.abs(amount) >= 100_000_000) {
      const eok = amount / 100_000_000;
      const rounded = Math.round(eok * 10) / 10;
      const str = rounded % 1 === 0 ? `${rounded}` : rounded.toFixed(1);
      return `${str}억원`;
    }
    if (Math.abs(amount) >= 10_000) {
      const man = amount / 10_000;
      const rounded = Math.round(man * 10) / 10;
      const str = rounded % 1 === 0 ? `${rounded}` : rounded.toFixed(1);
      return `${str}만원`;
    }
  }
  // §1.4 금액: 소수점 표시하지 않음
  return `${Math.round(amount).toLocaleString('ko-KR')}원`;
}

/**
 * §1.4 큰 수 축약 유틸리티
 * - 10,000 이상: 만 단위 (예: 12.3만)
 * - 100,000,000 이상: 억 단위 (예: 1.2억)
 * - 축약 시 소수점 최대 1자리
 */
export function abbreviateNumber(value: number, unit?: string): string {
  const suffix = unit || '';
  if (Math.abs(value) >= 100_000_000) {
    const eok = value / 100_000_000;
    const rounded = Math.round(eok * 10) / 10;
    const str = rounded % 1 === 0 ? `${rounded}` : rounded.toFixed(1);
    return `${str}억${suffix}`;
  }
  if (Math.abs(value) >= 10_000) {
    const man = value / 10_000;
    const rounded = Math.round(man * 10) / 10;
    const str = rounded % 1 === 0 ? `${rounded}` : rounded.toFixed(1);
    return `${str}만${suffix}`;
  }
  return `${value.toLocaleString('ko-KR')}${suffix}`;
}

/** §3.2 퍼센트 표기 — 확장6 §1.4/§4.3 보완: 0~1% 소수점 1자리, 그 외 정수 우선 */
export function formatPercent(
  value: number,
  precision: 'general' | 'precise' | 'auto' = 'auto',
): string {
  if (precision === 'auto') {
    if (value < 1 && value > 0) return `${value.toFixed(1)}%`;
    if (value === Math.round(value)) return `${Math.round(value)}%`;
    return `${value.toFixed(1)}%`;
  }
  if (precision === 'precise') return `${value.toFixed(1)}%`;
  return `${Math.round(value)}%`;
}

/** §3.3 날짜 포맷: YYYY.MM.DD */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

/** §3.3 날짜+시간 포맷: YYYY.MM.DD HH:mm */
export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}.${m}.${day} ${h}:${min}`;
}

/** §3.3 상대시간 — 1분 미만: 방금, 1~59분: N분 전, 1~23시간: N시간 전, 24h+: 절대 날짜 */
export function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return '';
  const now = new Date();
  const target = new Date(dateStr);
  const diffMs = now.getTime() - target.getTime();

  // 미래 시점이면 절대 날짜
  if (diffMs < 0) return formatDate(dateStr);

  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);

  if (diffMin < 1) return '방금';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  return formatDate(dateStr);
}

/**
 * 연락 공백 일수를 상대시간 스타일로 표시
 * §3.3 기반이지만 일(day) 단위용 커스텀
 */
export function formatContactGap(days: number): string {
  if (days === 0) return '오늘';
  if (days === 1) return '어제';
  if (days < 7) return `${days}일 전`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `${weeks}주 전`;
  }
  if (days < 365) {
    const months = Math.floor(days / 30);
    return `${months}개월 전`;
  }
  const years = Math.floor(days / 365);
  return `${years}년 전`;
}

/** §3.4 전화번호 마스킹: 010-1234-5678 → 010-****-5678 */
export function maskPhone(phone: string): string {
  if (!phone) return '';
  // 정규식: 앞 3자리, 가운데 4자리 마스킹, 뒤 4자리
  const cleaned = phone.replace(/[^0-9-]/g, '');
  const match = cleaned.match(/^(\d{2,3})-?(\d{3,4})-?(\d{4})$/);
  if (match) {
    return `${match[1]}-****-${match[3]}`;
  }
  // fallback: 변환 못 하면 그대로
  return phone;
}

/** §3.4 계좌번호 마스킹: 뒤 4자리만 노출 */
export function maskAccount(account: string): string {
  if (!account) return '';
  const cleaned = account.replace(/[^0-9]/g, '');
  if (cleaned.length < 4) return account;
  const last4 = cleaned.slice(-4);
  const masked = cleaned.slice(0, -4).replace(/./g, '*');
  // 4자리 단위 그룹핑
  return `${masked}-${last4}`.replace(/(\*{4})(?=\*)/g, '$1-');
}

/** §3.3 생일 날짜를 한국식으로 포맷 (MM월 DD일) */
export function formatBirthday(birthday: string): string {
  if (!birthday) return '';
  const month = parseInt(birthday.slice(5, 7));
  const day = parseInt(birthday.slice(8, 10));
  return `${month}월 ${day}일`;
}

/** §3.3 마지막 연락 날짜를 적절한 형태로 포맷 */
export function formatLastContact(lastContact: string): string {
  if (!lastContact) return '';
  const now = new Date();
  const target = new Date(lastContact);
  const diffMs = now.getTime() - target.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // 7일 이내면 상대시간
  if (diffDays === 0) return '오늘';
  if (diffDays === 1) return '어제';
  if (diffDays < 7) return `${diffDays}일 전`;
  // 7일 이후면 절대 날짜
  return formatDate(lastContact);
}