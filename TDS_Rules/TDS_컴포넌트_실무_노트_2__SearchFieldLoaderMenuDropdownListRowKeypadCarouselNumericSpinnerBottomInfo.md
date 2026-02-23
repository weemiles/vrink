# TDS 컴포넌트 실무 노트 2 — SearchField·Loader·Menu/Dropdown·ListRow·Keypad·Carousel·NumericSpinner·BottomInfo


## 0. 목적
- 이 문서는 기존에 정리된 TDS 실무 노트(TDS 헌법 — Toss 모바일 앱 디자인 실무 가이드라인 (2026): 레이아웃·타이포·컬러·컴포넌트·접근성, https://www.notion.so/e0d80d589c024de686a9fc2c2f5679a5)에 이어, 실무에서 바로 자주 쓰는 컴포넌트들을 “수치/기본값/허용값/Props/예시/체크리스트”로 정리합니다.
- 출처는 모두 Toss Design System 공식 문서입니다.

---

## 1. SearchField

### 1.1 SearchField (TDS Mobile)
공식 문서: https://tossmini-docs.toss.im/tds-mobile/components/search-field/

#### 핵심 기능
- 검색 입력창 + 상단 고정 + 검색어 삭제(클리어) 기능을 포함합니다.

#### Props (SearchFieldProps)
- fixed: boolean (기본값 false)
    - true면 검색창을 화면 상단에 고정합니다.
    - CSS의 position: fixed와 동일한 의미로 설명됩니다.
- takeSpace: boolean (기본값 true)
    - fixed=true일 때, 기존 검색창 높이만큼 레이아웃 공간을 유지할지 결정합니다.
    - true면 아래 콘텐츠가 튀지 않도록 “자리”를 유지합니다.
- onDeleteClick: () => void
    - 삭제 아이콘 클릭 시 호출됩니다.

#### 실무 예시

```javascript
<SearchField placeholder="검색어를 입력하세요" fixed takeSpace />

<SearchField
	placeholder="검색어를 입력하고 오른쪽 버튼을 클릭해보세요."
	onDeleteClick={() => alert('delete')}
/>
```

#### 실무 체크리스트
[ ] “스크롤 중에도 검색창이 보여야 하는” 화면이면 fixed=true를 기본 검토한다.
[ ] 고정 시 레이아웃 점프를 막아야 하면 takeSpace=true 유지.
[ ] 검색어 삭제 시 로그/상태 초기화가 필요하면 onDeleteClick으로 표준화.

---

### 1.2 SearchField (TDS React Native)
공식 문서: https://tossmini-docs.toss.im/tds-react-native/components/search-field/

#### Props (SearchFieldProps)
- hasClearButton: boolean (기본값 false)
- autoFocus: boolean
- maxLength: number
- editable: boolean
- keyboardType: "default" | "numeric" | "email-address" | "phone-pad"
- onChange: (event: { nativeEvent: { text: string } }) => void

#### 실무 예시

```javascript
<SearchField
	placeholder="검색어를 입력하세요"
	value={searchText}
	onChange={e => setSearchText(e.nativeEvent.text)}
	hasClearButton
	autoFocus
	maxLength={50}
/>

<SearchField
	placeholder="검색어를 입력하세요"
	editable={false}
	value={searchText}
/>
```

#### 실무 체크리스트
[ ] “검색 결과가 즉시 반응”하는 화면이면 value를 controlled로 두고 onChange에서 필터링한다.
[ ] 지우기 UX가 필요하면 hasClearButton=true.
[ ] 입력 타입이 숫자/이메일/전화면 keyboardType을 명시한다.

---

## 2. Loader (TDS Mobile)
공식 문서: https://tossmini-docs.toss.im/tds-mobile/components/loader/

#### 목적
- 작업 진행 중임을 사용자에게 시각적으로 알립니다.

#### Props (LoaderProps)
- size: "small" | "medium" | "large" (기본값 'medium')
- type: "primary" | "dark" | "light" (기본값 'primary')
    - light는 어두운 배경에서 사용하기 적합하다고 명시됩니다.
- label: string (여러 줄 지원)
- style: React.CSSProperties
- className: string
- id: string

#### 실무 예시

```javascript
<Loader size="small" />
<Loader size="medium" />
<Loader size="large" />

<Loader type="light" style= background: adaptive.grey600  />

<Loader label={'카드를\n불러오고있어요.'} />
```

#### 실무 체크리스트
[ ] 레이아웃을 유지하며 로딩을 표현해야 하면 Skeleton을 우선.
[ ] “처리 중/대기 중” 피드백이 목적이면 Loader를 사용.
[ ] 어두운 배경이면 type='light' 우선 검토.

---

## 3. Menu (TDS Mobile)
공식 문서: https://tossmini-docs.toss.im/tds-mobile/components/menu/

#### 구성 요소
- Menu.Dropdown: 컨테이너, header로 상단 제목 추가
- Menu.Header: 헤더 텍스트
- Menu.DropdownItem: 일반 메뉴 항목
- Menu.DropdownIcon: 아이콘
- Menu.DropdownCheckItem: 체크박스 포함 메뉴
- Menu.Trigger: 트리거 기반으로 열고 닫는 컨트롤

#### placement (Menu.Trigger)
- 기본값: 'bottom-start'
- 허용값(문서):
    - top, top-start, top-end
    - bottom, bottom-start, bottom-end
    - left, left-start, left-end
    - right, right-start, right-end

#### Props 요약
- MenuDropdownProps
    - header: React.ReactNode
- MenuDropdownItemProps
    - left, right, children: React.ReactNode
- MenuDropdownCheckedItemProps
    - checked: boolean
    - onCheckedChange: (checked: boolean) => void
- MenuTriggerProps
    - open: boolean
    - defaultOpen: boolean
    - children: React.ReactNode
    - dropdown: React.ReactNode
    - placement: 위 placement 값들 (기본값 'bottom-start')
    - onOpen: () => void
    - onClose: () => void

#### 실무 예시

```javascript
<Menu.Dropdown header={<Menu.Header>편집</Menu.Header>}>
	<Menu.DropdownItem>첫 번째 메뉴</Menu.DropdownItem>
	<Menu.DropdownItem right={<Menu.DropdownIcon name="icon-setting-mono" />}>
		설정
	</Menu.DropdownItem>
	<Menu.DropdownCheckItem checked={true}>선택됨</Menu.DropdownCheckItem>
</Menu.Dropdown>
```
Trigger 예시(문서 패턴):

```javascript
function Trigger() {
	const [open, setOpen] = React.useState(false);
	return (
		<Menu.Trigger
			open={open}
			onOpen={() => setOpen(true)}
			onClose={() => setOpen(false)}
			placement="bottom"
			dropdown={
				<Menu.Dropdown header={<Menu.Header>항목을 선택하세요</Menu.Header>}>
					<Menu.DropdownItem>옵션 1</Menu.DropdownItem>
				</Menu.Dropdown>
			}
		>
			<Button>클릭해보세요</Button>
		</Menu.Trigger>
	);
}
```

#### 실무 체크리스트
[ ] “옵션 선택”이 화면 흐름을 바꾸지 않으면 Menu/Dropdown으로 처리.
[ ] 상태가 있는 옵션은 DropdownCheckItem + checked/onCheckedChange로 표준화.
[ ] placement는 기본 bottom-start를 쓰고, 컴포넌트 주변 여백/잘림이 있을 때만 변경.

---

## 4. Dropdown (TDS React Native)
공식 문서: https://tossmini-docs.toss.im/tds-react-native/components/dropdown/

#### Props
- DropdownProps
    - children (필수): React.ReactNode (Dropdown.Item들)
- DropdownItemProps
    - children (필수): React.ReactNode
    - onPress: () => void
    - disabled: boolean (기본값 false)

#### 실무 예시

```javascript
<Dropdown>
	<Dropdown.Item onPress={() => console.log('수정')}>수정하기</Dropdown.Item>
	<Dropdown.Item onPress={() => console.log('공유')}>공유하기</Dropdown.Item>
	<Dropdown.Item disabled>비활성화된 옵션</Dropdown.Item>
</Dropdown>
```

#### 실무 체크리스트
[ ] destructive 액션(삭제 등)은 disabled/구분/확인 다이얼로그와 함께 사용.
[ ] 선택 불가 상태는 disabled=true로만 처리하고 임의 스타일링으로 숨기지 않기.

---

## 5. ListRow (TDS React Native)
공식 문서: https://tossmini-docs.toss.im/tds-react-native/components/list-row/

#### 개요
- 리스트의 한 행을 표준화.
- left / contents / right 영역.

#### 숫자/기본값 (ListRowProps)
- withArrow: boolean (기본값 false)
- leftAlignment: "top" | "center" (기본값 'center')
- rightAlignment: "top" | "center" (기본값 'center')
- verticalPadding:
    - 허용값: "extraSmall"(8) | "small"(16) | "medium"(24) | "large"(32)
    - 기본값: 24
- horizontalPadding: 0 지정 시 좌우 패딩 제거
- preferReducedMotion: boolean (기본값 false)
- disabled: boolean (기본값 false)
- disabledStyle: "type1" | "type2" (기본값 'type1')

#### ref 애니메이션(ListRowRef)
- blink(duration?: number)
- shine(playCount?: number)

#### 실무 예시

```javascript
<ListRow
	left={<ListRow.Icon name="icon-notification" />}
	contents={<ListRow.Texts texts={[{ text: '알림' }]} />}
	withArrow
	onPress={() => navigation.navigate('Settings')}
/>

<ListRow
	contents={<ListRow.Texts texts={[{ text: '잔액' }]} />}
	right={<ListRow.RightTexts texts={[{ text: '1,000,000원', fontWeight: 'semiBold' }]} />}
/>

<ListRow verticalPadding="small" contents={<ListRow.Texts texts={[{ text: '작은 패딩' }]} />} />
<ListRow verticalPadding="large" contents={<ListRow.Texts texts={[{ text: '큰 패딩' }]} />} />
<ListRow horizontalPadding={0} contents={<ListRow.Texts texts={[{ text: '패딩 없음' }]} />} />
```

#### 실무 체크리스트
[ ] 설정 화면/목록 화면은 ListRow로 통일해서 패딩/정렬/화살표 규칙을 고정한다.
[ ] 접근성/모션 감소 대응이 필요하면 preferReducedMotion을 고려한다.
[ ] 비활성 상태는 disabled + disabledStyle로 일관되게 표현한다.

---

## 6. ListRowLegacy (TDS Mobile, v3 제거 예정)
공식 문서: https://tossmini-docs.toss.im/tds-mobile/components/ListRow/ListRowLegacy/list-row-legacy/
- 문서에 “⚠️ v3에서 제거되는 API”로 명시되어 있습니다.
- 기존 프로젝트 유지보수/레거시 화면 대응 시 참고용.
(핵심 포인트만)
- 아이콘 shape 옵션이 매우 많고, 일부는 size: medium|large 선택 가능.
- ListRow.IconButton은 variant: fill|clear|border, iconSize 기본값 24 등 “수치”가 포함됩니다.

---

## 7. Keypad

### 7.1 NumberKeypad (TDS Mobile)
공식 문서: https://tossmini-docs.toss.im/tds-mobile/components/Keypad/number-keypad/

#### Props (NumberKeypadProps)
- numbers: (0..9)[] (기본값 [1,2,3,4,5,6,7,8,9,0])
- secure: boolean (기본값 false)
    - true면 클릭한 숫자와 함께 상하좌우를 제외한 무작위 2개 숫자도 눌린 것처럼 처리.
- onKeyClick(value: string) (필수)
- onBackspaceClick() (필수)

#### 실무 예시

```javascript
<NumberKeypad
	numbers={[1, 3, 5, 7, 9, 2, 4, 6, 8, 0]}
	onKeyClick={() => {}}
	onBackspaceClick={() => {}}
/>

<NumberKeypad secure onKeyClick={() => {}} onBackspaceClick={() => {}} />
```

#### 실무 규칙(문서의 강한 권고)
- 주민등록번호 뒷자리를 입력받을 때는 secure=true를 반드시 설정.

---

### 7.2 FullSecureKeypad (TDS Mobile)
공식 문서: https://tossmini-docs.toss.im/tds-mobile/components/Keypad/full-secure-keypad/

#### Props (FullSecureKeypadProps)
- onKeyClick(value: string) (필수)
- onBackspaceClick() (필수)
- onSpaceClick() (필수)
- onSubmit() (필수)
- submitDisabled: boolean (기본값 false)
- submitButtonText: string (기본값 '입력 완료')

#### Ref (FullSecureKeypadRef)
- reorderEmptyCells(): void
    - 공백 위치를 무작위로 재배치
- element: HTMLDivElement

#### 실무 예시

```javascript
const ref = React.useRef({ reorderEmptyCells: () => {}, element: null });

<FullSecureKeypad
	ref={ref}
	onKeyClick={() => {}}
	onBackspaceClick={() => {}}
	onSpaceClick={() => {}}
	onSubmit={() => {
		ref.current?.reorderEmptyCells();
	}}
	submitButtonText="공백 옮기기"
/>
```

---

### 7.3 NumberKeypad (TDS React Native)
공식 문서: https://tossmini-docs.toss.im/tds-react-native/components/keypad/

#### Props (NumberKeypadProps)
- onKeyPress(value: number) (필수)
- onBackspacePress() (필수)
- numbers: NumberKey[]
    - 문서: 기본값 [1,2,3,4,5,6,7,8,9,0]
- style: StyleProp<ViewStyle>

#### 실무 예시(문서 패턴)
- 금액 입력: 최대 금액 제한 로직 + toLocaleString() 포맷
- PIN 입력: PIN_LENGTH=6 같은 고정 길이
- 전화번호 입력: 3-4-4 포맷

---

## 8. Carousel (TDS React Native)
공식 문서: https://tossmini-docs.toss.im/tds-react-native/components/carousel/

#### 중요 사항
- Android에서 정상 동작하려면 앱 최상위에 GestureHandlerRootView가 필요.

#### Props (CarouselProps) — 수치/기본값
- itemWidth: number (px, 기본값 280)
- itemGap: number (px, 기본값 12)
- padding: number (px, 기본값 24)
- renderIndicators: ({ activeIndex, itemsCount }) => ReactNode

#### 실무 예시

```javascript
<Carousel itemWidth={320} itemGap={20} padding={16}>
	<Carousel.Item>{/* 카드 */}</Carousel.Item>
	<Carousel.Item>{/* 카드 */}</Carousel.Item>
</Carousel>
```

---

## 9. NumericSpinner (TDS React Native)
공식 문서: https://tossmini-docs.toss.im/tds-react-native/components/numeric-spinner/

#### 목적
- 키보드 없이 정수 증감 입력.

#### Props (NumericSpinnerProps)
- size: tiny | small | medium | large
- number: number (기본값 0)
- defaultNumber: number
- minNumber: number (기본값 0)
- maxNumber: number (기본값 999)
- disable: boolean (기본값 false)
- onNumberChange(number: number)

#### 실무 예시

```javascript
const [value, setValue] = useState(0);

<NumericSpinner size="large" number={value} onNumberChange={setValue} />
<NumericSpinner size="large" disable />
```

---

## 10. BottomInfo (TDS React Native)
공식 문서: https://tossmini-docs.toss.im/tds-react-native/components/bottom-info/

#### 목적
- 화면 하단에 법적 고지/주의사항(디스클레이머)을 명확히 표시.
- 문서에서는 리스트 표현을 위해 Post 컴포넌트와 함께 쓰는 패턴을 제시.

#### 실무 예시(문서)

```javascript
<BottomInfo>
	<Post.Ul paddingBottom={24} typography="t7">
		<Post.Li>고지 1</Post.Li>
		<Post.Li>고지 2</Post.Li>
	</Post.Ul>
</BottomInfo>
```

#### Props (BottomInfoProps)
- children: React.ReactNode
- style: StyleProp<ViewStyle>

---

## 11. 실무 적용 빠른 선택 가이드
- 검색 화면: SearchField + (결과 리스트) ListRow
- 설정 화면: ListRow + Switch + Menu/Dropdown
- 결제/보안 입력: (Mobile) NumberKeypad secure / FullSecureKeypad, (RN) NumberKeypad
- 배너/프로모션: Carousel (itemWidth, itemGap, padding부터 결정)
- 수량/기간: NumericSpinner (min/max 포함)
- 법적 고지: BottomInfo + Post.Ul(t7) + paddingBottom=24
