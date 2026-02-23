export type Relationship = '가족' | '군대' | '직장 동료' | '친구' | '학교';
export type Closeness = '가족' | '매우 친함' | '친함' | '보통' | '가끔' | '거의 모름';
export type FamilyStatus = '미혼' | '기혼·자녀 없음' | '기혼·자녀 있음' | '기타/모름';

export interface Contact {
  id: string;
  name: string;
  relationship: Relationship;
  age: number;
  birthday: string; // YYYY-MM-DD
  birthdayDday: number; // days until next birthday
  birthdayUnknown: boolean;
  lastContact: string; // YYYY-MM-DD
  contactGap: number; // days since last contact
  birthdayGiftDone: boolean;
  familyStatus: FamilyStatus;
  closeness: Closeness;
  memo: string;
  phone?: string;
  avatarColor: string;
  isFavorite?: boolean;
  groupIds?: string[];
  tags?: string[]; // tag IDs
}

const AVATAR_COLORS = [
  '#2D2D2D', '#525252', '#737373', '#8A8A8A', '#A3A3A3',
  '#3D3D3D', '#5C5C5C', '#666666', '#999999', '#B0B0B0',
];

function getDday(birthday: string): number {
  const today = new Date();
  const bday = new Date(birthday);
  const thisYear = today.getFullYear();
  let nextBirthday = new Date(thisYear, bday.getMonth(), bday.getDate());
  if (nextBirthday < today) {
    nextBirthday = new Date(thisYear + 1, bday.getMonth(), bday.getDate());
  }
  const diff = nextBirthday.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getContactGap(lastContact: string): number {
  const today = new Date();
  const last = new Date(lastContact);
  const diff = today.getTime() - last.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getAge(birthday: string): number {
  const today = new Date();
  const bday = new Date(birthday);
  return today.getFullYear() - bday.getFullYear() + 1;
}

export const contacts: Contact[] = [
  {
    id: '1', name: '엄마', relationship: '가족', birthday: '1967-05-12',
    lastContact: '2026-02-17', birthdayGiftDone: false, familyStatus: '기혼·자녀 있음',
    closeness: '가족', memo: '매주 전화하기', phone: '010-1234-5678',
    avatarColor: AVATAR_COLORS[0],
  },
  {
    id: '2', name: '아빠', relationship: '가족', birthday: '1965-09-03',
    lastContact: '2026-02-15', birthdayGiftDone: false, familyStatus: '기혼·자녀 있음',
    closeness: '가족', memo: '건강 챙기기', phone: '010-1234-5679',
    avatarColor: AVATAR_COLORS[1],
  },
  {
    id: '3', name: '동생', relationship: '가족', birthday: '1999-11-22',
    lastContact: '2026-02-16', birthdayGiftDone: false, familyStatus: '미혼',
    closeness: '가족', memo: '', phone: '010-9876-5432',
    avatarColor: AVATAR_COLORS[2],
  },
  {
    id: '4', name: '할머니', relationship: '가족', birthday: '1942-03-15',
    lastContact: '2026-02-10', birthdayGiftDone: false, familyStatus: '기혼·자녀 있음',
    closeness: '가족', memo: '안부 전화 자주 드리기', phone: '010-1111-2222',
    avatarColor: AVATAR_COLORS[3],
  },
  {
    id: '5', name: '매부', relationship: '가족', birthday: '1990-07-08',
    lastContact: '2026-02-01', birthdayGiftDone: false, familyStatus: '기혼·자녀 있음',
    closeness: '가족', memo: '', phone: '010-3333-4444',
    avatarColor: AVATAR_COLORS[4],
  },
  {
    id: '6', name: '김태영', relationship: '친구', birthday: '1997-04-20',
    lastContact: '2026-02-12', birthdayGiftDone: false, familyStatus: '미혼',
    closeness: '매우 친함', memo: '같이 운동하는 친구', phone: '010-5555-6666',
    avatarColor: AVATAR_COLORS[5],
  },
  {
    id: '7', name: '박민기', relationship: '친구', birthday: '1996-08-14',
    lastContact: '2026-02-13', birthdayGiftDone: false, familyStatus: '미혼',
    closeness: '매우 친함', memo: '고등학교 동창', phone: '010-7777-8888',
    avatarColor: AVATAR_COLORS[6],
  },
  {
    id: '8', name: '김응국', relationship: '군대', birthday: '1997-01-30',
    lastContact: '2026-01-20', birthdayGiftDone: true, familyStatus: '미혼',
    closeness: '친함', memo: '같은 소대', phone: '010-9999-0000',
    avatarColor: AVATAR_COLORS[7],
  },
  {
    id: '9', name: '윤재현', relationship: '군대', birthday: '1996-06-25',
    lastContact: '2026-01-05', birthdayGiftDone: false, familyStatus: '미혼',
    closeness: '친함', memo: '선임', phone: '010-1212-3434',
    avatarColor: AVATAR_COLORS[8],
  },
  {
    id: '10', name: '이용규', relationship: '직장 동료', birthday: '1993-12-01',
    lastContact: '2026-02-14', birthdayGiftDone: false, familyStatus: '기혼·자녀 없음',
    closeness: '친함', memo: '디자인팀 팀장', phone: '010-5656-7878',
    avatarColor: AVATAR_COLORS[9],
  },
  {
    id: '11', name: '조민수', relationship: '학교', birthday: '1997-03-18',
    lastContact: '2026-02-05', birthdayGiftDone: false, familyStatus: '미혼',
    closeness: '보통', memo: '대학 동기',
    avatarColor: AVATAR_COLORS[0],
  },
  {
    id: '12', name: '전해림', relationship: '학교', birthday: '1998-09-10',
    lastContact: '2025-12-25', birthdayGiftDone: false, familyStatus: '미혼',
    closeness: '보통', memo: '과 선배',
    avatarColor: AVATAR_COLORS[1],
  },
  {
    id: '13', name: '정호준', relationship: '친구', birthday: '1997-02-28',
    lastContact: '2026-02-10', birthdayGiftDone: true, familyStatus: '미혼',
    closeness: '매우 친함', memo: '절친', phone: '010-4545-6767',
    avatarColor: AVATAR_COLORS[2],
  },
  {
    id: '14', name: '권기환', relationship: '직장 동료', birthday: '1994-11-05',
    lastContact: '2026-02-17', birthdayGiftDone: false, familyStatus: '기혼·자녀 있음',
    closeness: '친함', memo: '개발팀',
    avatarColor: AVATAR_COLORS[3],
  },
  {
    id: '15', name: '이진술', relationship: '친구', birthday: '1997-07-15',
    lastContact: '2026-01-30', birthdayGiftDone: false, familyStatus: '미혼',
    closeness: '친함', memo: '동네 친구',
    avatarColor: AVATAR_COLORS[4],
  },
  {
    id: '16', name: '최은성', relationship: '학교', birthday: '1997-05-22',
    lastContact: '2026-01-15', birthdayGiftDone: false, familyStatus: '미혼',
    closeness: '보통', memo: '동아리 후배',
    avatarColor: AVATAR_COLORS[5],
  },
  {
    id: '17', name: '심준용', relationship: '군대', birthday: '1996-10-08',
    lastContact: '2025-11-20', birthdayGiftDone: false, familyStatus: '미혼',
    closeness: '가끔', memo: '같은 중대',
    avatarColor: AVATAR_COLORS[6],
  },
  {
    id: '18', name: '전수희', relationship: '직장 동료', birthday: '1995-04-02',
    lastContact: '2026-02-18', birthdayGiftDone: false, familyStatus: '미혼',
    closeness: '친함', memo: '기획팀', phone: '010-8989-0101',
    avatarColor: AVATAR_COLORS[7],
  },
  {
    id: '19', name: '강호건', relationship: '친구', birthday: '1997-08-30',
    lastContact: '2026-02-01', birthdayGiftDone: false, familyStatus: '미혼',
    closeness: '보통', memo: '',
    avatarColor: AVATAR_COLORS[8],
  },
  {
    id: '20', name: '조성연', relationship: '학교', birthday: '1996-12-19',
    lastContact: '2025-12-01', birthdayGiftDone: false, familyStatus: '기혼·자녀 없음',
    closeness: '가끔', memo: '대학 선배',
    avatarColor: AVATAR_COLORS[9],
  },
  {
    id: '21', name: '윤준서', relationship: '친구', birthday: '1998-01-14',
    lastContact: '2026-02-08', birthdayGiftDone: false, familyStatus: '미혼',
    closeness: '친함', memo: '게임 친구',
    avatarColor: AVATAR_COLORS[0],
  },
  {
    id: '22', name: '나경욱', relationship: '직장 동료', birthday: '1992-06-30',
    lastContact: '2026-02-13', birthdayGiftDone: false, familyStatus: '기혼·자녀 있음',
    closeness: '보통', memo: '마케팅팀',
    avatarColor: AVATAR_COLORS[1],
  },
  {
    id: '23', name: '권민종', relationship: '군대', birthday: '1997-03-05',
    lastContact: '2025-10-15', birthdayGiftDone: false, familyStatus: '미혼',
    closeness: '거의 모름', memo: '',
    avatarColor: AVATAR_COLORS[2],
  },
  {
    id: '24', name: '백영웅', relationship: '학교', birthday: '1997-09-18',
    lastContact: '2026-01-28', birthdayGiftDone: false, familyStatus: '미혼',
    closeness: '보통', memo: '과 동기',
    avatarColor: AVATAR_COLORS[3],
  },
  {
    id: '25', name: '송하원', relationship: '친구', birthday: '1998-02-25',
    lastContact: '2026-02-15', birthdayGiftDone: true, familyStatus: '미혼',
    closeness: '매우 친함', memo: '여행 메이트', phone: '010-2323-4545',
    avatarColor: AVATAR_COLORS[4],
  },
].map(c => ({
  ...c,
  age: getAge(c.birthday),
  birthdayDday: getDday(c.birthday),
  contactGap: getContactGap(c.lastContact),
  birthdayUnknown: false,
}));

export function getContactById(id: string): Contact | undefined {
  return contacts.find(c => c.id === id);
}

export function getContactsByRelationship(rel: Relationship): Contact[] {
  return contacts.filter(c => c.relationship === rel);
}

export function getUpcomingBirthdays(days: number = 30): Contact[] {
  return contacts.filter(c => c.birthdayDday <= days && c.birthdayDday >= 0)
    .sort((a, b) => a.birthdayDday - b.birthdayDday);
}

export function getContactsNeedingAttention(days: number = 30): Contact[] {
  return contacts.filter(c => c.contactGap >= days)
    .sort((a, b) => b.contactGap - a.contactGap);
}

export const RELATIONSHIP_COLORS: Record<Relationship, string> = {
  '가족': '#616161',
  '군대': '#616161',
  '직장 동료': '#616161',
  '친구': '#616161',
  '학교': '#616161',
};

export const CLOSENESS_ORDER: Closeness[] = ['가족', '매우 친함', '친함', '보통', '가끔', '거의 모름'];