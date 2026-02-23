# TDS Mobile 추가 학습/적용 규칙 (중복 없는 보강판)


> ✅ 이 페이지는 기존 TDS Mobile 정리 페이지들과 겹치지 않게,
    지금까지 대화에서 언급했던 “추가로 파면 좋은 축”을 실무에 바로 적용 가능한 규칙/수치 단위의 의사결정 기준으로만 정리합니다.
    - 이미 상세 Props/기본값이 정리된 컴포넌트는 여기서 재작성하지 않습니다.
    - 필요 시 원본 정리 페이지로 링크만 둡니다.

### 1) Tooltip (컴포넌트 스펙을 파기 전, 먼저 고정할 운영 규칙)
> Slider에서 Slider.Tooltip을 쓰는 맥락은 이미 정리되어 있으니, 여기서는 “Tooltip을 언제/어떻게 켤지”를 규칙으로 고정합니다.[1]
[ ] 정밀 조절이 필요한 입력(가격, 퍼센트, 강도)에서는 Tooltip을 기본으로 켠다.[1]
[ ] Tooltip 메시지는 현재값 1개만 보여준다. 범위 설명은 label(min/max/mid)로 분리한다.[1]
[ ] Tooltip이 뜨는 순간 사용자가 “지금 값이 바뀌고 있다”는 확신을 얻어야 하므로,
    - 값 업데이트는 onValueChange와 동일 프레임에서 반영되게 설계한다.[1]
[ ] Tooltip이 필요한데 손가락이 값을 가리면,
    - Slider 주변에 상단 여백을 추가한다. (예시로 55px paddingTop을 둔 패턴이 이미 존재)[1]

### 2) Empty / Error / Retry (Result와 겹치지 않는 ‘부분 영역’ 규칙)
> Result는 페이지 레벨 결과 화면을 위한 컴포넌트이고,[1] 리스트/카드/섹션 단위의 Empty·Error는 별도 규칙이 필요합니다.

#### 2.1 Empty(데이터 없음) 규칙
[ ] Empty는 “아무것도 없음”이 아니라 다음 행동을 제시해야 한다.
    - 예: 검색 결과 없음이면 ‘필터 초기화’ 또는 ‘추천 키워드’ 같은 다음 액션.
[ ] Empty에서 CTA를 제공해야 하면,
    - 페이지 하단 고정이 필요: BottomCTA/FixedBottomCTA로 올린다.[2]
    - 섹션 내부의 약한 액션이면: TextButton으로 둔다.[1]

#### 2.2 Error(불러오기 실패) 규칙
[ ] “결정이 필요한 오류”(삭제, 종료, 결제 등)는 Toast로 처리하지 말고 Dialog/BottomSheet로 올린다.[3]
[ ] “재시도 가능한 네트워크 오류”는
    - 1차: 섹션/리스트 단위 재시도 버튼 제공
    - 2차: 페이지 단위로 격상 시 Result + Result.Button을 사용한다.[1]

#### 2.3 Retry(재시도) UX 수치 규칙
[ ] 재시도 버튼은 연속 탭 방지가 기본이다.
    - 최소 규칙: 요청 중에는 disabled 처리하거나, 같은 요청을 중복 발사하지 않는다.
    - (수치가 필요하면 팀 규칙으로 ‘디바운스 시간(ms)’을 정해두고 전 화면에 동일 적용)

### 3) Overlay 선택 규칙 (Modal vs Dialog vs BottomSheet) — “기준만”
> 각 컴포넌트의 Props/기본값은 심화 페이지에 이미 정리되어 있으니,[3] 여기서는 선택 기준만 고정합니다.
- Dialog(Alert/Confirm)
    [ ] 사용자가 확인/선택을 해야만 다음으로 진행되는 흐름
    [ ] ‘닫으면 안 되는’ 성격이면 closeOnDimmerClick 정책을 명확히 고정한다.[2]
- BottomSheet
    [ ] 여러 옵션 탐색, 보조 정보, 추가 설정 같은 “아래에서 올라오는 작업 공간”
    [ ] 기본값이 closeOnDimmerClick: true인 패턴이 많아서, 닫히면 안 되는 플로우는 반드시 잠근다.[3]
- Modal
    [ ] ‘지금 화면 위에’ 떠야 하는 집중 콘텐츠(설명/작업 완료)이며,
    [ ] 닫힘 후 정리 작업은 onExited에서만 처리한다.[3]

### 4) Toast 사용 경계 (Mobile hook) — 규칙만
> useToast는 동작/기본 duration이 이미 정리되어 있으니,[2] “어디까지 쓰는가” 기준만 추가합니다.
[ ] Toast는 상태 알림에만 쓴다. 선택/확인은 Dialog/BottomSheet로 올린다.[2]
[ ] 버튼이 달린 Toast는 기본 지속 시간이 달라질 수 있으므로(기본 5초), 중요한 메시지는 Dialog로 격상한다.[2]

### 5) 스크롤/키보드가 있는 화면에서의 고정 요소 충돌 규칙
> BottomCTA / TextField / Toast가 동시에 등장하면 충돌이 잦아, ‘충돌 방지’ 규칙을 페이지 단위로 고정하는 게 효과적입니다.[2]
[ ] 입력 화면에서 CTA가 핵심이면 fixedAboveKeyboard를 고려하되, Double에서는 불가를 먼저 체크한다.[2]
[ ] containerStyle로 키보드 중 opacity나 bottom을 바꾸는 건 지양한다.[2]
[ ] 스크롤이 길면 hideOnScroll을 기본 검토한다.[2]

### 6) ‘표준 컴포넌트로 통일’ 우선순위(겹치지 않는 선택 기준)
[ ] 설정/목록 화면은 ListRow로 통일해서 패딩/정렬 규칙을 화면마다 새로 결정하지 않는다.[4]
[ ] 리스트 확장(더 보기/더 불러오기)은 ListFooter로 통일하고, aria-label은 ‘무엇의 더보기인지’까지 포함한다.[5]
[ ] 아이콘만 있는 액션은 IconButton을 쓰고 aria-label은 필수로 박는다.[1]

---

### 참고(중복 방지용 링크)
- CTA/입력/선택/Dialog/Toast 등 확장 로드맵: TDS 학습 확장 로드맵 — CTA·입력·선택·진행·하이라이트·(RN) Dialog/Chart
- 오버레이/토스트/에셋/스켈레톤/TableRow 심화: TDS 심화 학습 — 오버레이·토스트·에셋·스켈레톤·TableRow (원문 구조 기반)
- 실무 노트 2: TDS 컴포넌트 실무 노트 2 — SearchField·Loader·Menu/Dropdown·ListRow·Keypad·Carousel·NumericSpinner·BottomInfo
- 실무 노트 3: TDS 컴포넌트 실무 노트 3(Mobile) — TextButton·IconButton·Result·Slider
- 실무 노트 4: TDS 컴포넌트 실무 노트 4(Mobile) — ProgressBar·Stepper·ListFooter·ProgressStepper·GridList
