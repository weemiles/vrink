# TDS 심화 학습 — 오버레이·토스트·에셋·스켈레톤·TableRow (원문 구조 기반)


## 0. 이 문서의 범위
- 이 문서는 기존의 TDS 헌법 — Toss 모바일 앱 디자인 실무 가이드라인 (2026): 레이아웃·타이포·컬러·컴포넌트·접근성에 추가로 붙이기엔 너무 길어지는 “심화 학습” 내용을 별도 페이지로 분리해 기록한 것입니다.
- 소스는 Toss Design System(TDS) 공식 문서/아티클을 기준으로 하며, 아래 항목을 "요약 없이" 가능한 한 원문 구조대로 적습니다.
    - 오버레이(Modal/Dialog/BottomSheet) + 관련 Hook API
    - Toast (React Native)
    - Asset (Mobile + React Native)
    - Skeleton (로딩)
    - TableRow (정보 2열 레이아웃)

---

## 1. 오버레이 시스템 (TDS Mobile)

### 1.1 Modal
공식 문서: Modal — Toss Design System | Mobile
- Modal은 중요한 내용 표시 또는 즉각 상호작용이 필요할 때 사용하며, 화면 위에 떠서 사용자의 집중을 유도합니다.
- 사용자는 제공되는 정보를 확인하거나 필요한 동작을 완료해야만 기존 화면으로 돌아갈 수 있습니다.

#### 1) 구성 요소 (하위 컴포넌트)
- Modal은 Modal.Overlay + Modal.Content로 구성됩니다.
- 콘텐츠는 Modal.Content 안에 들어갑니다.
- Modal.Overlay는 배경(오버레이)이며, 사용자가 콘텐츠에 집중하도록 돕습니다.

#### 2) 동작과 이벤트(실무 적용 포인트)
- 기본 예시 기준으로:
    - 버튼 클릭 → open=true로 변경 → 모달 열림
    - 확인 버튼 클릭 또는 오버레이 클릭 → open=false로 변경 → 모달 닫힘
- onExited: 모달이 완전히 닫히고 애니메이션이 완료된 후 호출됩니다.
    - 리소스 해제, 후속 작업, 입력 초기화 같은 “닫힘 이후” 처리에 적합합니다.
- Modal.Overlay onClick: 오버레이 클릭 시 특별 동작을 실행할 수 있습니다.
    - 예: 저장하지 않고 나갈지 확인, 결제 진행 중 실수로 닫는 것 방지(추가 확인), 닫힐 때 입력 내용 초기화 등.

#### 3) 접근성 (기본 지원)
- aria-hidden
    - Modal 외부(배경) 콘텐츠가 스크린 리더에서 숨겨집니다.
    - Modal이 열린 동안 배경 콘텐츠는 스크린 리더가 읽지 않습니다.
- tabIndex={0}
    - Modal 내부로 키보드 포커스가 이동합니다.
    - Modal이 열리면 자동으로 포커스를 받을 수 있습니다.
- role="button" (Overlay)
    - 오버레이가 클릭 가능한 요소임을 알려줍니다.
    - 스크린 리더 사용자가 오버레이 클릭으로 Modal을 닫을 수 있음을 인지할 수 있습니다.

#### 4) 인터페이스 (Props) — 값/기본값까지 그대로

#### ModalProps
- open: true | false (필수)
    - true면 열림, false면 닫힘
- onOpenChange: (open: boolean) => void
    - 열림/닫힘 상태가 변경될 때 호출
- onExited: () => void
    - 닫힘 + 애니메이션 완료 후 호출
- portalContainer: HTMLElement
    - 기본값: document.body
    - Modal이 렌더링될 DOM 요소

#### ModalOverlayProps
- onClick: () => void
    - 오버레이 클릭 시 호출

#### 5) 실무에서 바로 쓰는 "표준 구현" (상태 제어)

```javascript
function Basic() {
	const [open, setOpen] = React.useState(false);

	return (
		<>
			<Button onClick={() => setOpen(true)}>모달 열기</Button>
			<Modal open={open} onOpenChange={setOpen}>
				<Modal.Overlay />
				<Modal.Content>
					{/* 내용 */}
				</Modal.Content>
			</Modal>
		</>
	);
}
```

#### 6) 실무 규칙(체크리스트 형태)
[ ] open을 단일 source of truth로 관리한다.
[ ] 닫힘 이후 정리 작업은 onExited에서 처리한다.
[ ] 오버레이 클릭의 의미(즉시 닫기 vs 추가 확인)를 명확히 결정하고 Modal.Overlay onClick으로 구현한다.
[ ] 스크린리더 배경 차단(aria-hidden)과 포커스 이동(tabIndex)이 의도대로 동작하는지 확인한다.
> 위 내용은 공식 문서의 구성/예시/Props/접근성 섹션을 기준으로 “실무 적용 가능한 형태”로 재구성했습니다.

---

### 1.2 Dialog (이해하기)
공식 문서: Dialog 이해하기 — Toss Design System | Mobile
- Dialog는 사용자에게 중요한 정보를 전달하거나 선택을 요구할 때 사용하는 모달 인터페이스입니다.
- 사용 맥락:
    - 작업 완료 알림
    - 상태 변경 알림
    - 사용자의 확인이 필요한 중요한 액션 수행 전

#### 1) AlertDialog vs ConfirmDialog (버튼 개수/용도 기준으로 구분)

#### 2) Dialog의 구성 요소 (컴포넌트 이름까지)
1. 제목(Title)
    - 주요 메시지
    - AlertDialog.Title 또는 ConfirmDialog.Title
1. 설명(Description)
    - 부가 설명이 필요할 때 사용
    - AlertDialog.Description 또는 ConfirmDialog.Description
    - 선택적으로 사용 가능
1. 버튼
    - AlertDialog: 단일 확인 버튼 AlertDialog.AlertButton
    - ConfirmDialog: 취소/확인 버튼 ConfirmDialog.CancelButton, ConfirmDialog.ConfirmButton

#### 3) 실무 규칙(선택 기준)
[ ] “사용자 선택”이 필요한가?
    - 아니오 → AlertDialog
    - 예 → ConfirmDialog
[ ] Description이 없어도 메시지가 충분히 명확한가?
    - 예 → Title만 사용
    - 아니오 → Description을 추가
> 이 섹션은 Dialog 이해하기 문서의 정의/표/구성 요소를 그대로 실무 기준으로 펼친 것입니다.

---

### 1.3 useDialog (OverlayExtension)
공식 문서: useDialog — Toss Design System | Mobile
- useDialog는 Alert/Confirm 다이얼로그를 “코드로 호출해서 띄우는” 유틸리티 훅입니다.

#### 1) 메서드
- openAlert(options)
    - 기본 Alert 다이얼로그 표시
- openConfirm(options)
    - Confirm 다이얼로그 표시(사용자 결정 필요)
- openAsyncConfirm(options)
    - Confirm 다이얼로그 + 비동기 작업
    - 버튼 클릭 시 로딩 상태 표시
    - onConfirmClick, onCancelClick에 비동기 함수를 전달하면 작업 완료까지 로딩 상태가 자동 처리

#### 2) 사용 예시(문서 예제 패턴을 그대로 실무형으로)

#### (1) Alert

```javascript
const { openAlert } = useDialog();

openAlert({
	title: '알려드릴게요',
	description: '작업이 완료됐어요.',
	alertButton: '확인하기',
});
```

#### (2) Confirm

```javascript
const { openConfirm } = useDialog();

openConfirm({
	title: '삭제할까요?',
	description: '이 작업은 되돌릴 수 없어요.',
	confirmButton: '삭제하기',
	cancelButton: '취소',
});
```

#### (3) Async Confirm

```javascript
const { openAsyncConfirm } = useDialog();

openAsyncConfirm({
	title: '상담을 종료할까요?',
	description: '상담을 종료하면 대화를 이어갈 수 없어요.',
	confirmButton: '종료하기',
	cancelButton: '취소',
	onConfirmClick: async () => {
		await new Promise(res => setTimeout(res, 2000));
	},
});
```

#### 3) 인터페이스(Options) — 기본값/타입까지

#### AlertOptions
- title (필수): React.ReactNode
- description: React.ReactNode
- alertButton: ReactElement | string
    - 기본값: '확인'
- closeOnDimmerClick: boolean
    - 기본값: false
    - false면 배경 클릭으로 닫힘 방지
- onEntered: () => void
- onExited: () => void

#### ConfirmOptions
- title (필수): React.ReactNode
- description: React.ReactNode
- closeOnDimmerClick: boolean
    - 기본값: false
- confirmButton: ReactElement | string
    - 기본값: '확인'
- cancelButton: ReactElement | string
    - 기본값: '취소'
- onEntered: () => void
- onExited: () => void

#### AsyncConfirmOptions
- title (필수): React.ReactNode
- description: React.ReactNode
- closeOnDimmerClick: boolean
    - 기본값: false
- confirmButton: ReactElement | string
    - 기본값: '확인'
- onConfirmClick: () => Promise<void>
- confirmButtonLoadingPropName: string
    - 기본값: 'loading'
- cancelButton: ReactElement | string
    - 기본값: '취소'
- onCancelClick: () => Promise<void>
- cancelButtonLoadingPropName: string
    - 기본값: 'loading'
- onEntered: () => void
- onExited: () => void

#### 4) 실무 규칙(체크리스트)
[ ] 다이얼로그는 “상태 기반 컴포넌트 렌더링”이 아니라, useDialog 호출로 일관되게 연다.
[ ] 배경 클릭으로 닫히면 안 되는 케이스는 closeOnDimmerClick: false를 명시한다.
[ ] 서버 요청/결제/삭제처럼 비동기 처리라면 openAsyncConfirm을 우선 사용한다.
[ ] 버튼 로딩 prop 명이 다른 디자인 시스템 버튼을 쓰는 경우, *LoadingPropName으로 맞춘다.
> 위 내용은 useDialog 문서의 사용 예시와 Options 테이블을 그대로 옮겨 실무 적용형으로 정리했습니다.

---

### 1.4 useBottomSheet (OverlayExtension)
공식 문서: useBottomSheet — Toss Design System | Mobile
- useBottomSheet는 바텀시트를 일관되게 열고/닫기 위한 유틸리티 훅입니다.
- “반복적인 코드를 줄이고, 바텀시트를 일관되게 구현”하는 목적을 명시합니다.

#### 1) 메서드
- open(options)
    - 기본 바텀시트
- close()
    - 바텀시트 닫기
- openOneButtonSheet(options)
    - 단일 버튼 바텀시트
- openTwoButtonSheet(options)
    - 이중 버튼 바텀시트
- openAsyncTwoButtonSheet(options)
    - 이중 버튼 + 비동기 작업
    - 버튼 클릭 시 로딩 표시, 작업이 끝날 때까지 바텀시트를 유지

#### 2) 사용 예시(문서 예제를 실무형으로)

#### (1) 기본

```javascript
const { open, close } = useBottomSheet();

open({
	header: '기본 바텀시트예요',
	children: <Text style= margin: '0 24px 24px 24px' >컨텐츠만 있는 기본적인 바텀시트예요.</Text>,
	onClose: () => close(),
});
```

#### (2) 단일 버튼

```javascript
const { openOneButtonSheet } = useBottomSheet();

openOneButtonSheet({
	header: '단일 버튼 바텀시트예요',
	children: <Text style= margin: '0 24px' >하나의 버튼이 있는 바텀시트예요.</Text>,
	button: '확인',
});
```

#### (3) 이중 버튼

```javascript
const { openTwoButtonSheet } = useBottomSheet();

await openTwoButtonSheet({
	header: '이중 버튼 바텀시트예요',
	children: <Text style= margin: '0 24px' >두 개의 버튼이 있는 바텀시트예요.</Text>,
	leftButton: '취소',
	rightButton: '확인',
});
```

#### (4) 비동기 이중 버튼

```javascript
const { openAsyncTwoButtonSheet } = useBottomSheet();

openAsyncTwoButtonSheet({
	header: '결제를 취소할까요?',
	children: <Text style= margin: '0 24px' >결제를 취소하면 되돌릴 수 없어요.</Text>,
	leftButton: '취소',
	rightButton: '확인',
	onRightButtonClick: async () => {
		await new Promise(res => setTimeout(res, 1000));
	},
});
```

#### 3) 인터페이스(Options) — 기본값/타입까지

#### BottomSheetOptions (open)
- children (필수): React.ReactNode
- header: React.ReactNode
- closeOnDimmerClick: boolean
    - 기본값: true
- onEntered: () => void
- onExited: () => void
- UNSAFE_disableFocusLock: boolean
    - 바텀시트 외부로 키보드 포커스가 나갈 수 있게 하고, 스크린리더가 외부 콘텐츠를 읽을 수 있게 함
    - 접근성 제한 가능성이 있어 “불가피한 경우에만” 사용 권고
- UNSAFE_ignoreDimmerClick: boolean
    - dimmer 클릭해도 onClose가 호출되지 않게 함
    - 문서 주의: dimmer 클릭 시 사용자의 액션을 취소하고 닫히는 것이 권장되는 동작
- UNSAFE_ignoreBackEvent: boolean
    - 뒤로가기 이벤트로 닫히지 않게 함
    - 문서 주의: 뒤로가기 시 취소 액션으로 닫히는 것이 권장되는 동작
    - 추후 deprecated 가능, 기술적으로 어려운 상황에서만 사용 권고

#### OneButtonOptions (openOneButtonSheet)
- children (필수): React.ReactNode
- header: React.ReactNode
- closeOnDimmerClick: boolean (기본값 true)
- onEntered: () => void
- onExited: () => void
- topAccessory: React.ReactNode
- bottomAccessory: React.ReactNode
- button: string | ReactElement
    - 기본값: '확인'
- closeOnButtonClick: boolean
    - 기본값: true
- UNSAFE_* 옵션: 위와 동일

#### AsyncOneButtonOptions
- OneButtonOptions +
- onClick: () => Promise<void>
- loadingPropName: string (기본값 'loading')
- UNSAFE_* 옵션: 위와 동일

#### TwoButtonOptions (openTwoButtonSheet)
- children (필수): React.ReactNode
- header: React.ReactNode
- closeOnDimmerClick: boolean (기본값 true)
- onEntered: () => void
- onExited: () => void
- topAccessory: React.ReactNode
- bottomAccessory: React.ReactNode
- leftButton: string | ReactElement (기본값 '취소')
- closeOnLeftButtonClick: boolean (기본값 true)
- rightButton: string | ReactElement (기본값 '확인')
- closeOnRightButtonClick: boolean (기본값 true)
- UNSAFE_* 옵션: 위와 동일

#### AsyncTwoButtonOptions (openAsyncTwoButtonSheet)
- TwoButtonOptions +
- onLeftButtonClick: () => Promise<void>
- leftButtonLoadingPropName: string (기본값 'loading')
- onRightButtonClick: () => Promise<void>
- rightButtonLoadingPropName: string (기본값 'loading')
- UNSAFE_* 옵션: 위와 동일

#### 4) 실무 규칙(체크리스트)
[ ] 기본값이 closeOnDimmerClick: true이므로, “닫히면 안 되는” 흐름은 명시적으로 false로 잠근다.
[ ] 비동기 작업이 포함되면 openAsyncTwoButtonSheet를 사용해 버튼 로딩/대기 상태를 표준화한다.
[ ] UNSAFE_*는 UX/접근성 합의 없이는 사용하지 않는다(문서가 경고).
> 위 내용은 useBottomSheet 문서의 사용 예시와 Options 테이블(기본값 포함)을 그대로 옮겨 실무 적용형으로 정리했습니다.

---

## 2. 로딩/스켈레톤 (TDS Mobile)

### 2.1 Skeleton
공식 문서: Skeleton — Toss Design System | Mobile
- Skeleton은 데이터 로딩 동안 콘텐츠의 기본 레이아웃을 임시로 보여주는 컴포넌트입니다.
- 빈 화면 대신 구조를 보여주어 “로딩 중”이라는 인식을 주고, 느린 로딩에서도 UX를 높이는 목적을 갖습니다.

#### 1) 패턴(pattern) — 프리셋 목록(실무에서 바로 선택)
- topList (기본값)
    - 제목이 상단에 있는 리스트
- topListWithIcon
    - 제목이 상단에 있고 아이콘 포함
- amountTopList
    - 제목 + 부제목이 상단
- amountTopListWithIcon
    - 제목 + 부제목이 상단 + 아이콘 포함
- subtitleList
    - 부제목 포함 리스트
- subtitleListWithIcon
    - 부제목 + 아이콘 포함 리스트
- listOnly
    - 리스트 형태만
- listWithIconOnly
    - 아이콘 포함 리스트
- cardOnly
    - 카드 형태만
사용 예:

```javascript
<Skeleton pattern="topListWithIcon" style= width: '100%'  />
```

#### 2) 커스텀(custom) — 타입 조합으로 레이아웃을 직접 정의
- custom에 배열로 정의하며, 타입은 다음과 같습니다.
    - title
        - 굵고 큰 제목 바(일반적으로 상단)
    - subtitle
        - 얇은 부제목 바(제목 아래)
    - list
        - 여러 줄 가로형 bar로 구성된 리스트
    - listWithIcon
        - 아이콘 + 리스트
    - card
        - 직사각형 블록 카드
    - spacer(${number})
        - 픽셀 단위 빈 공간
        - 예: spacer(20)
사용 예:

```javascript
<Skeleton
	custom={['title', 'subtitle', 'spacer(20)', 'card']}
	repeatLastItemCount={1}
	style= width: '100%' 
/>
```

#### 3) 반복(repeatLastItemCount) — “리스트 길이”를 빠르게 맞추는 수치
- 마지막 요소를 반복 렌더링합니다.
- 값:
    - number
    - 'infinite'
- 기본값: 3
- 'infinite' 설정 시 실제로는 마지막 요소가 최대 30번 반복됩니다.
사용 예:

```javascript
<Skeleton pattern="listOnly" repeatLastItemCount={5} style= width: '100%'  />
```

#### 4) 배경(background) — 허용 값이 고정됨
- background로 배경을 설정할 수 있고, 가능한 값은 다음 3개입니다.
    - white
    - grey (기본값)
    - greyOpacity100
사용 예:

```javascript
<Skeleton pattern="amountTopListWithIcon" background="white" style= width: '100%'  />
```

#### 5) 인터페이스(SkeletonProps) — 기본값/타입
- height: string | number
    - 기본값: auto
- pattern: 위 패턴 문자열
    - 기본값: topList
- custom: ("list" | "title" | "subtitle" | "card" | "listWithIcon" | spacer(${number}))[]
- repeatLastItemCount: number | "infinite"
    - 기본값: 3
- play: "show" | "hide"
    - 기본값: show
- background: "white" | "grey" | "greyOpacity100"
    - 기본값: grey

#### 6) 실무 규칙(체크리스트)
[ ] 로딩 화면을 “디자인”하지 말고, 먼저 pattern 프리셋으로 커버 가능한지 확인한다.
[ ] 리스트 길이는 repeatLastItemCount로 맞춘다.
[ ] 무한 반복이 필요하면 'infinite'를 쓰되, 실제 최대 반복이 30임을 인지하고 화면을 검증한다.
[ ] 배경은 white/grey/greyOpacity100 중에서만 선택하고, 임의 색을 만들지 않는다.
> 위 내용은 Skeleton 문서의 패턴 목록, 커스텀 타입, 반복/배경, Props 테이블을 그대로 옮겨 실무 적용형으로 정리했습니다.

---

## 3. 정보 2열 레이아웃 (TDS Mobile)

### 3.1 TableRow
공식 문서: TableRow — Toss Design System | Mobile
- TableRow는 데이터를 좌우로 간결하게 배치하는 컴포넌트입니다.
- 정보 제목과 내용을 나란히 배치할 때 유용하며, 텍스트 비율/정렬을 유연하게 조정할 수 있습니다.

#### 1) 필수 속성(실무에서 무조건 들어감)
- left (필수)
    - 왼쪽 요소
    - 문자열/숫자/React 컴포넌트 가능
- right (필수)
    - 오른쪽 요소
    - 문자열/숫자/React 컴포넌트 가능
- align (필수)
    - 정렬 방향

#### 2) align 옵션(2개로 고정)
- align="space-between"
    - left와 right를 양쪽 끝으로 배치
    - 정보의 제목과 내용이 “명확히 분리”되어야 할 때 적합
예시:

```javascript
<TableRow align="space-between" left="김토스" right="받는 분" />
```
- align="left"
    - left와 right를 모두 왼쪽으로 가까이 배치
    - 공간이 제한되거나, 같은 영역에 밀집되어 보여야 할 때 유용
예시:

```javascript
<TableRow align="left" left="김토스" right="받는 분" />
```

#### 3) leftRatio (수치 기반 레이아웃 제어)
- leftRatio={number}
    - 왼쪽 영역이 전체 너비에서 차지하는 비율(%)을 고정
    - 예: leftRatio={30} → 왼쪽 영역이 전체 너비의 30%
예시:

```javascript
<TableRow align="left" left="강토스" right="받는 분 통장표시" leftRatio={30} />
```

#### 4) 인터페이스(TableRowProps)
- left (필수): React.ReactNode
- right (필수): React.ReactNode
- align (필수): "left" | "space-between"
- leftRatio: number

#### 5) 실무 규칙(체크리스트)
[ ] 값이 명확히 구분되어야 하면 space-between을 기본으로 고려한다.
[ ] 좁은 영역/밀집 정보는 left + leftRatio를 조합해 좌측 라벨 폭을 먼저 고정한다.
[ ] left/right는 string으로 제한하지 말고, 필요하면 ReactNode(예: Badge, Link, 강조 텍스트)로 확장한다.
> 위 내용은 TableRow 문서의 “필수 속성/align/leftRatio/Props 테이블”을 그대로 실무 적용형으로 정리했습니다.

---

## 4. Toast (TDS React Native)

### 4.1 Toast
공식 문서: Toast — Toss Design System | React Native
- Toast는 짧은 메시지를 일시적으로 표시합니다.
- 액션 결과/상태 변화를 알리는 데 유용하며, 화면 상단 또는 하단에 나타났다가 자동으로 사라집니다.

#### 1) 기본 사용(필수 props 3개)
- open
- text
- onClose
예시:

```javascript
<Toast open={isOpen} text="저장되었어요" onClose={() => setIsOpen(false)} />
```

#### 2) 위치(position)
- position: "top" | "bottom"
- 기본값: 'bottom'
예시:

```javascript
<Toast open={isOpen} text="상단 Toast" position="top" onClose={() => setIsOpen(false)} />
<Toast open={isOpen} text="하단 Toast" position="bottom" onClose={() => setIsOpen(false)} />
```

#### 3) 아이콘(icon)
- icon: React.ReactNode
- 사용할 수 있는 아이콘 구성 예:
    - <Toast.Icon ... />
    - <Toast.LottieIcon preset type="complete" />
예시:

```javascript
<Toast
	open={isOpen}
	text="완료되었어요"
	icon={<Toast.LottieIcon preset type="complete" />}
	onClose={() => setIsOpen(false)}
/>
```

#### 4) 버튼(button) — 하단 Toast에서만 가능 + 디테일
- button: React.ReactNode
- 조건: position === 'bottom'일 때만 사용 가능
예시:

```javascript
<Toast
	open={isOpen}
	text="작업이 완료되었어요"
	position="bottom"
	button={<Toast.Button text="확인" onPress={() => setIsOpen(false)} />}
	onClose={() => setIsOpen(false)}
/>
```

#### 5) 지속 시간(duration) — 단위가 “초”
- duration: number (초)
- 기본값: 3
- 단, button이 있으면 기본값이 5초, 없으면 3초
예시:

```javascript
<Toast open={isOpen} text="5초 동안 표시" duration={5} onClose={() => setIsOpen(false)} />
```

#### 6) 하단 여백(bottomOffset) — 단위가 “픽셀”
- bottomOffset: number (px)
- 기본값: 20
- 조건: position === 'bottom'일 때만 사용 가능
예시:

```javascript
<Toast
	open={isOpen}
	text="하단 여백 40px"
	position="bottom"
	bottomOffset={40}
	onClose={() => setIsOpen(false)}
/>
```

#### 7) 인터페이스(ToastProps)
- open (필수): boolean
- text (필수): string
- onClose (필수): () => void
- icon: React.ReactNode
- position: "top" | "bottom" (기본값 'bottom')
- duration: number (기본값 3, button 있으면 기본 5)
- onExited: () => void
- onEntered: () => void
- button: React.ReactNode (position='bottom'에서만)
- bottomOffset: number (기본값 20, position='bottom'에서만)

#### 8) 실무 규칙(체크리스트)
[ ] 화면 아래 고정 CTA/탭바가 있으면 bottomOffset을 명시적으로 올려 겹침을 방지한다.
[ ] action(확인 버튼)을 넣는 순간 기본 duration이 5초로 바뀌는 것을 감안해 UX를 검증한다.
[ ] 토스트는 “상태 알림”에만 사용하고, 결정이 필요한 흐름은 Dialog/BottomSheet로 올린다.
> 위 내용은 Toast 문서의 사용 예제/Props 테이블(기본값 포함)을 그대로 실무 적용형으로 정리했습니다.

---

## 5. Asset / 미디어 프레임 규격화

### 5.1 Asset (TDS Mobile) — 래핑한 컴포넌트 활용
공식 문서: 래핑한 컴포넌트 활용하기 — Toss Design System | Mobile
- TDS Mobile에서는 많이 사용되는 Frame + 각 Content 컴포넌트 조합을 미리 래핑한 Asset 컴포넌트들을 제공합니다.

#### 1) 래핑된 컴포넌트 목록(= 실무에서 바로 쓸 API)
- Asset.Icon = Frame + ContentIcon
- Asset.Image = Frame + ContentImage
- Asset.Lottie = Frame + ContentLottie
- Asset.Text = Frame + ContentText
- Asset.Video = Frame + ContentVideo

#### 2) frameShape 네이밍 규칙(중요)
- 원래 Frame의 shape prop을, 래핑 컴포넌트에서는 frameShape로 이름을 변경해 제공합니다.
예시(문서 예제 그대로):

```javascript
// Frame을 직접 사용할 때
<Frame shape={...restProps} />

// 래핑된 컴포넌트를 사용할 때
<Asset.Image frameShape={...restProps} />
```

#### 3) frameShape 프리셋 제공
- 자주 쓰는 frameShape는 Asset.frameShape.* 프리셋으로 제공됩니다.
예시:

```javascript
<Asset.Image frameShape={Asset.frameShape.SquareMedium} {...restProps} />
```

#### 4) 기능별 상세 사용 예 + 수치/기본값

#### (1) Icon
- Asset.Icon은 프레임 안에 아이콘을 “일관된 크기/스타일”로 표현하기 위한 컴포넌트
- color로 색상 변경 가능
    - CSS 색상값 지원
    - TDS 색상 시스템의 adaptive 값도 사용 가능
예시:

```javascript
<Asset.Icon color="green" name="heart-line" />
```
IconProps
- name (필수): string
- color: string

#### (2) Image
- frameShape로 크기/모양 지정
- scaleType로 맞춤 방식 제어
    - 기본값: 'fit'
    - 값: fit | crop
예시:

```javascript
<Asset.Image
	frameShape= height: 100, width: 100 
	scaleType="crop"
	src="https://static.toss.im/2d-emojis/svg/u1F600.svg"
/>
```
ImageProps
- src (필수): string
- scaleType: "fit" | "crop" (기본값 'fit')
- alt: string

#### (3) Lottie
- src (필수)
- scaleType: fit | crop (기본값 'fit')
예시:

```javascript
<Asset.Lottie frameShape= height: 300, width: 300  scaleType="crop" src="https://static.toss.im/lotties/activation/1won_new/1won.json" />
```
LottieProps
- src (필수): string
- scaleType: "fit" | "crop" (기본값 'fit')

#### (4) Text
TextProps
- children: React.ReactNode
예시:

```javascript
<Asset.Text frameShape= height: 100, width: 100 >Text</Asset.Text>
```

#### (5) Video
- 재생 제어 속성(기본값 포함)
    - autoPlay: 기본값 true
    - loop: 기본값 true
    - muted: 기본값 true
    - controls: 기본값 false
    - playsInline: 기본값 true
예시:

```javascript
<Asset.Video
	frameShape= height: 200, width: 200 
	as="video"
	src="https://www.notion.so/0e1d29c627fb4a58bbe6b58c88a5c08b"
/>
```
VideoProps
- src (필수): string
- autoPlay: boolean (기본값 true)
- loop: boolean (기본값 true)
- muted: boolean (기본값 true)
- controls: boolean (기본값 false)
- playsInline: boolean (기본값 true)

#### 5) 공통 속성(AssetCommonType)
- frameShape: FrameShapeType
- backgroundColor: string
- id: string
- className: string
- style: React.CSSProperties
- acc: React.ReactNode (액세서리 요소)
- accPosition: FrameAccPositionType (기본값 'bottom-right')
- overlap: { color: string; } (여러 항목이 합쳐졌음을 표현)

---

### 5.2 Asset (TDS React Native)
공식 문서: Asset — Toss Design System | React Native
- RN Asset은 이미지/아이콘/Lottie 등을 일정한 프레임 안에 표시하기 위한 컴포넌트입니다.

#### 1) 바로 쓰는 사용 예 + “수치”가 들어가는 부분

#### (1) Image Asset (frameShape + background + scale + acc + overlap)
- 예제에서 확인되는 실무형 파라미터:
    - frameShape: Asset.frameShape.SquareLarge 같은 프리셋 사용
    - backgroundColor: adaptive.grey100 같은 토큰
    - scale: 예제에서는 0.55
    - acc: 우하단에 체크 아이콘 같은 accessory 콘텐츠
    - accPosition: 'bottom-right'
    - overlap: { x, y, blur } 구조를 가진 객체로 예시됨

#### (2) Icon Asset
- 기본 형태: name만으로 호출
예시:

```javascript
<Asset.Icon name="heart-line" />
```

#### (3) Icon 색상
- 예제에서 color: green | red | blue 문자열로 변경

#### (4) Lottie Asset
- frameShape: 예제에서는 Asset.frameShape.CleanW60
- src: lottie json url
- loop 사용

#### (5) 다양한 프레임 크기(프리셋)
- 60px 프레임: Asset.frameShape.CleanW60
- 48px 프레임: Asset.frameShape.CleanW48
- 36px 프레임: Asset.frameShape.CleanW36

#### 2) 인터페이스(Props) — 수치/구조가 핵심

#### LegacyFrameShape
- width (필수): number (px)
- height (필수): number (px)
- radius (필수): number (px)
- color (필수): string (배경색)
- overlap: { x: number; y: number; blur: number; }

#### AssetProps
- resource (필수): ReactElement
- frame (필수): LegacyFrameShape
- union: { type: "overlap"; color: string; }
- style: StyleProp<ViewStyle>

#### 3) 실무 규칙(체크리스트)
[ ] 프레임 크기/라운드/배경을 임의로 만들기 전에 Asset.frameShape.* 프리셋이 있는지 먼저 확인한다.
[ ] 프레임을 커스텀해야 하면 LegacyFrameShape(width/height/radius/color)를 먼저 정의하고, 나머지는 옵션으로 붙인다.
[ ] overlay/acc 같은 부가 정보는 acc, accPosition, union/overlap 구조를 사용해 표준화한다.
> 위 내용은 Mobile Asset(래핑 규칙 + props 기본값)과 RN Asset(프레임 수치 구조 + 인터페이스)을 문서 기반으로 실무 적용형으로 펼친 것입니다.

---

## 6. (메타) 문서를 더 깊게 확장하는 방법: llms-full 인덱스
공식 파일: tds-react-native/llms-full.txt
- 이 파일은 TDS React Native 문서의 인덱스/본문을 한 번에 훑을 수 있게 만든 텍스트입니다.
- 목적: “다음에 어떤 컴포넌트/파운데이션이 남아있는지”를 빠르게 스캔하고, 이 문서에 확장할 토픽을 누락 없이 뽑아내기 위함.

### 6.1 다음 확장 후보를 뽑는 체크리스트(이 페이지의 운영 규칙)
- Overlay/Toast/Asset/Skeleton/TableRow를 정리한 후,
    - SegmentedControl 같은 선택 컨트롤
    - Chart(BarChart 등)처럼 도메인 UI
    - Form/Input 계열
    - Accessibility(VoiceOver, Reduce Motion)
    - Dark mode, Theming
    등을 llms-full에서 “섹션 단위로” 발견되는 순서대로 추가 확장합니다.

---
