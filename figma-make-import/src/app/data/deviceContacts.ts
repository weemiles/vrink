/**
 * Mock 디바이스 연락처 데이터
 * 실제 앱에서는 네이티브 Contacts API로 가져옴
 * 온보딩 시 사용자가 선택적으로 앱에 연동할 수 있는 연락처 목록
 */

export interface DeviceContact {
  id: string;
  name: string;
  phone: string;
  /** 초성 그룹핑용 */
  initial: string;
  /** 프로필 색상 */
  avatarColor: string;
}

const AVATAR_COLORS = [
  '#3182f6', '#f04452', '#30b06e', '#f59e0b', '#9b59b6',
  '#e67e22', '#1abc9c', '#e74c3c', '#3498db', '#2ecc71',
];

function getKoreanInitial(name: string): string {
  const code = name.charCodeAt(0);
  // 한글 범위: 0xAC00 ~ 0xD7A3
  if (code >= 0xAC00 && code <= 0xD7A3) {
    const initials = [
      'ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ',
      'ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ',
    ];
    const index = Math.floor((code - 0xAC00) / 588);
    return initials[index] || '#';
  }
  // 영문 대문자
  const ch = name.charAt(0).toUpperCase();
  if (/[A-Z]/.test(ch)) return ch;
  return '#';
}

/** 디바이스에 저장된 연락처 (Mock) */
export const deviceContacts: DeviceContact[] = [
  { id: 'd1', name: '강서윤', phone: '010-2345-6789' },
  { id: 'd2', name: '강호건', phone: '010-8765-4321' },
  { id: 'd3', name: '고영민', phone: '010-1111-2345' },
  { id: 'd4', name: '권기환', phone: '010-3456-7890' },
  { id: 'd5', name: '권민종', phone: '010-4567-8901' },
  { id: 'd6', name: '김민지', phone: '010-5678-9012' },
  { id: 'd7', name: '김수연', phone: '010-6789-0123' },
  { id: 'd8', name: '김응국', phone: '010-9999-0000' },
  { id: 'd9', name: '김태영', phone: '010-5555-6666' },
  { id: 'd10', name: '김하늘', phone: '010-7890-1234' },
  { id: 'd11', name: '나경욱', phone: '010-8901-2345' },
  { id: 'd12', name: '동생', phone: '010-9876-5432' },
  { id: 'd13', name: '멈마', phone: '010-1234-5678' },
  { id: 'd14', name: '박민기', phone: '010-7777-8888' },
  { id: 'd15', name: '박서현', phone: '010-9012-3456' },
  { id: 'd16', name: '박유진', phone: '010-0123-4567' },
  { id: 'd17', name: '백영웅', phone: '010-1234-9876' },
  { id: 'd18', name: '서지원', phone: '010-2345-0987' },
  { id: 'd19', name: '송하원', phone: '010-2323-4545' },
  { id: 'd20', name: '심준용', phone: '010-3456-1098' },
  { id: 'd21', name: '아빠', phone: '010-1234-5679' },
  { id: 'd22', name: '엄마', phone: '010-1234-5678' },
  { id: 'd23', name: '윤재현', phone: '010-1212-3434' },
  { id: 'd24', name: '윤준서', phone: '010-4567-2109' },
  { id: 'd25', name: '이용규', phone: '010-5656-7878' },
  { id: 'd26', name: '이진술', phone: '010-5678-3210' },
  { id: 'd27', name: '이채원', phone: '010-6789-4321' },
  { id: 'd28', name: '장현우', phone: '010-7890-5432' },
  { id: 'd29', name: '전수희', phone: '010-8989-0101' },
  { id: 'd30', name: '전해림', phone: '010-8901-6543' },
  { id: 'd31', name: '정호준', phone: '010-4545-6767' },
  { id: 'd32', name: '조민수', phone: '010-9012-7654' },
  { id: 'd33', name: '조성연', phone: '010-0123-8765' },
  { id: 'd34', name: '최은성', phone: '010-1234-0987' },
  { id: 'd35', name: '한소희', phone: '010-2345-1098' },
  { id: 'd36', name: '할머니', phone: '010-1111-2222' },
  { id: 'd37', name: '홍지수', phone: '010-3456-2109' },
  { id: 'd38', name: '황도윤', phone: '010-4567-3210' },
].map((c, i) => ({
  ...c,
  initial: getKoreanInitial(c.name),
  avatarColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
}));

/** 초성별 그룹핑 */
export function groupByInitial(
  contacts: DeviceContact[],
): Array<{ initial: string; contacts: DeviceContact[] }> {
  const map = new Map<string, DeviceContact[]>();
  for (const c of contacts) {
    const group = map.get(c.initial) ?? [];
    group.push(c);
    map.set(c.initial, group);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b, 'ko'))
    .map(([initial, contacts]) => ({ initial, contacts }));
}

/** 검색 필터 (이름 또는 전화번호) */
export function filterDeviceContacts(
  contacts: DeviceContact[],
  query: string,
): DeviceContact[] {
  if (!query || query.length < 1) return contacts;
  const lower = query.toLowerCase();
  return contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(lower) ||
      c.phone.replace(/-/g, '').includes(lower.replace(/-/g, '')),
  );
}
