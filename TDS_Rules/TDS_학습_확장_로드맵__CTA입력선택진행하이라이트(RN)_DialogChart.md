# TDS 학습 확장 로드맵 — CTA·입력·선택·진행·하이라이트·(RN) Dialog/Chart


> 🧹 요약 내용 수정 없이, 현재 페이지의 텍스트를 원문 그대로 유지하면서 읽기 좋게 서식만 정리했습니다.

## 7. 추가 학습 확장 (2/2) — CTA, 입력, 선택, 진행, 하이라이트, (RN) Dialog/Chart
아래 섹션들은 Toss 모바일 앱 디자인 실무 가이드라인 (2026 최신판) 및 이 페이지의 기존 섹션(Modal/Toast/Asset/Skeleton/TableRow) 외에 추가로 학습 가능한 TDS 공식 문서를 기반으로 “수치/기본값/허용값/Props/예시/체크리스트” 형태로 바로 적용 가능하게 정리합니다.

---

## 7.1 BottomCTA / FixedBottomCTA (TDS Mobile)

### 7.1.1 BottomCTA 이해하기
공식 문서: BottomCTA 이해하기 — Toss Design System | Mobile
- BottomCTA는 페이지 하단에 고정되는 호출 버튼(Call-to-Action)입니다.
- 긴 스크롤/키보드 입력 중에도 접근성을 높이기 위해 하단에 고정되는 패턴입니다.

#### FixedBottomCTA vs BottomCTA
- 차이점은 “버튼 고정 여부”입니다.
- FixedBottomCTA는 BottomCTA의 fixed prop을 true로 기본 설정한 래핑 컴포넌트입니다.
    - 즉, 항상 화면 하단에 고정됩니다.
추상 정의(문서 그대로):

```javascript
export const FixedBottomCTA = (props: Omit<ComponentProps<typeof BottomCTA>, 'fixed'>) => {
	return <BottomCTA fixed={true} {...props} />;
};
```
추가 규칙(문서):
- FixedBottomCTA는 기본적으로 CTA가 1개인 BottomCTA.Single입니다.
- CTA가 2개인 Double을 쓰려면 FixedBottomCTA.Double을 사용합니다.

#### Single vs Double
- Single: 버튼 1개. children으로 버튼에 렌더링될 요소를 결정
- Double: 버튼 2개. leftButton, rightButton으로 각 버튼 요소를 결정

---

### 7.1.2 FixedBottomCTA
공식 문서: FixedBottomCTA — Toss Design System | Mobile
- 화면 하단에 고정된 CTA 버튼 표현.

#### Double 예시

```javascript
<FixedBottomCTA.Double
	leftButton={
		<CTAButton color="dark" variant="weak">
			취소
		</CTAButton>
	}
	rightButton={<CTAButton>확인</CTAButton>}
/>
```

#### hideOnScroll (스크롤 애니메이션)
- hideOnScroll을 추가하면:
    - 아래로 스크롤 → 버튼 숨김
    - 위로 스크롤 → 버튼 다시 나타남
예시:

```javascript
<FixedBottomCTA.Double
	hideOnScroll
	leftButton={
		<CTAButton color="dark" variant="weak">
			취소
		</CTAButton>
	}
	rightButton={<CTAButton>확인</CTAButton>}
/>
```

---

### 7.1.3 BottomCTA.Single
공식 문서: BottomCTA.Single — Toss Design System | Mobile
- 버튼 1개 렌더링.

#### 1) background(배경 제거)
- 기본적으로 배경색이 있음.
- 배경 제거: background="none"

#### 2) Safe Area 패딩
- hasSafeAreaPadding을 true로 설정하면 하단 Safe Area만큼 paddingBottom이 추가됩니다.
- Safe Area는 웹뷰 user-agent로 전달되어 --toss-safe-area-bottom 변수로 사용됩니다.
문서의 계산식:

```css
--bottom-cta-padding-bottom: max(var(--toss-safe-area-bottom, 0px), env(safe-area-inset-bottom), 20px);
```

#### 3) containerStyle 주의
- containerStyle로 최상단 요소 스타일 변경 가능.
- 모바일 키패드 사용 시 opacity 또는 bottom 변경은 지양.

#### 4) topAccessory / bottomAccessory

```javascript
<BottomCTA.Single
	topAccessory={<div>topAccessory</div>}
	bottomAccessory={<div>bottomAccessory</div>}
>
	여기는 설명이 들어갑니다
</BottomCTA.Single>
```

#### 5) fixedAboveKeyboard
- fixedAboveKeyboard={true}면 키보드 활성화 중에도 CTA가 키보드 위에 고정.
- 주의: Double에서는 사용 불가

#### 6) showAfterDelay (지연 + 애니메이션)
- showAfterDelay= animation, delay
- animation: 'fade' | 'scale' | 'slide'
- delay: number (단위: 초)

#### 7) hideOnScrollDistanceThreshold (단위: px)
- hideOnScroll={true}일 때
- hideOnScrollDistanceThreshold 기본값: 1

#### 8) 인터페이스(TypeAProps)
- children (필수): React.ReactNode
- showAfterDelay: { animation: "slide" | "fade" | "scale"; delay: number; }
- show: boolean (기본값 false)
- hideOnScroll: boolean (기본값 false)
- hideOnScrollDistanceThreshold: number (기본값 1, 단위 px)
- hasSafeAreaPadding: boolean (기본값 true)
    - hasPaddingBottom=false면 무조건 paddingBottom=0px
    - hasPaddingBottom=true이고 hasSafeAreaPadding=false면 paddingBottom=20px
- hasPaddingBottom: boolean (기본값 true)
- takeSpace: boolean
    - 고정 상태에서 레이아웃 공간 차지 여부
    - fixed=true일 때 기본값은 true
- fixed: boolean
- containerStyle: React.CSSProperties (키보드 중 opacity/bottom 피하기)
- containerRef: React.Ref<HTMLDivElement>
- background: "default" | "none" (기본값 'default')
- topAccessory: React.ReactNode
- bottomAccessory: React.ReactNode
- fixedAboveKeyboard: boolean

#### 9) 실무 규칙(체크리스트)
[ ] 스크롤 길이가 긴 화면이면 hideOnScroll을 기본 검토한다.
[ ] 하단 고정 CTA가 UX 핵심이면 FixedBottomCTA로 고정한다.
[ ] 입력 화면에서 키보드가 올라오면 fixedAboveKeyboard를 고려하되, Double에서 불가한 점을 먼저 체크한다.

---

## 7.2 입력 (TextField / TextArea / SplitTextField) (TDS Mobile)

### 7.2.1 TextField
공식 문서: TextField — Toss Design System | Mobile

#### 1) variant (허용값 4개)
- box | line | big | hero
    - box: 기본 사각형
    - line: 하단 라인만
    - big: 큰 글씨 강조
    - hero: 대형 스타일

#### 2) hasError
- hasError=true면 에러 상태
- help와 같이 써서 에러 메시지 제공

#### 3) disabled
- disabled=true면 비활성화

#### 4) labelOption
- appear | sustain
    - sustain: 항상 라벨 표시
    - appear: 값이 있을 때만 라벨 표시
- 기본값: appear

#### 5) prefix/suffix (string)
- 금액/단위 입력에 사용

#### 6) right (ReactNode)
- 오른쪽 액션 버튼/아이콘/상태 표시

#### 7) 파생 컴포넌트
- TextField.Clearable
    - onClear: () => void
- TextField.Password
    - onVisibilityChange: (visible: boolean) => void
- TextField.Button
    - 클릭 가능한 버튼 형태(placeholder가 버튼 라벨처럼)
    - onClick 사용
    - right 기본값:
        <Icon name="icon-arrow-down-mono" color={adaptive.grey400} size={24} />

#### 8) TextFieldPublicProps(공통)
- disabled: 기본값 false
- prefix: string
- suffix: string
- right: React.ReactNode
- placeholder: string
- format: { transform: (value: string) => string; reset?: (formattedValue: string) => string; }

#### 9) TextFieldProps
- variant (필수): box | line | big | hero
- label: string
- labelOption: appear | sustain (기본값 appear)
- help: React.ReactNode
- hasError: boolean (기본값 false)
- paddingTop: string | number
- paddingBottom: string | number
- value: string | number
- defaultValue: string
- onFocus: focus handler
- onBlur: blur handler
- onChange: change handler

#### 10) 실무 규칙(체크리스트)
[ ] 입력 검증 에러는 hasError + help를 같이 써서 텍스트로 명확히 보여준다.
[ ] 오른쪽 버튼이 필요하면 right에 Button/Icon을 넣고, 단순 초기화는 Clearable을 우선 사용한다.
[ ] 비밀번호는 Password 컴포넌트로 통일하고, visible 변경 이벤트를 로깅/분석하려면 onVisibilityChange를 사용한다.

---

### 7.2.2 TextArea
공식 문서: TextArea — Toss Design System | Mobile
- TextField를 확장한 멀티라인 입력.

#### Props
- height: string | number
    - 고정 높이
- minHeight: string | number
    - 자동 높이 증가 시 최소 높이
예시:

```javascript
<TextArea variant="box" height="200px" placeholder="텍스트를 입력해보세요." help="높이가 고정된 텍스트 필드" />
<TextArea variant="box" minHeight={100} placeholder="길게 입력하거나 엔터" help="높이가 자동" />
```

---

### 7.2.3 SplitTextField
공식 문서: SplitTextField — Toss Design System | Mobile
- 입력을 여러 필드로 나눠 받는 컴포넌트.
- 제공 타입:
    - SplitTextField.RRN13 (주민번호 13자리)
    - SplitTextField.RRNFirst7 (앞 7자리)

#### 핵심 동작
- RRN13: 앞 6자리 입력 완료 시 자동으로 뒷자리 필드로 포커스 이동

#### mask 기본값
- RRN13의 mask 기본값: true (뒷자리 마스킹)
- RRNFirst7의 mask 기본값: false (성별코드 마스킹 기본 꺼짐)

#### first/second 커스터마이즈
- first, second로 각 필드에 TextFieldPublicProps(placeholder/disabled 등) 적용

#### 인터페이스
- SplitTextFieldProps
    - variant (필수): box | line | big | hero
    - label (필수, 기본값 '주민등록번호')
    - labelOption (필수)
        - variant='box'일 때 기본 sustain
        - 그 외 기본 appear
    - help: React.ReactNode
    - paddingTop, paddingBottom: string | number
    - hasError: boolean (기본값 false)
    - first: TextFieldPublicProps
    - second: TextFieldPublicProps
    - focused: boolean
- RRN13TextFieldProps.mask: boolean (기본값 true)
- RRNFirst7TextFieldProps.mask: boolean (기본값 false)

---

## 7.3 토글/선택 (Switch / SegmentedControl / (RN) Radio / Checkbox)

### 7.3.1 Switch (TDS Mobile)
공식 문서: Switch — Toss Design System | Mobile

#### 상태
- checked로 on/off 표현
- 상태 변경은 onChange와 함께

#### 기본값
- disabled: 기본값 false
- hasTouchEffect: 기본값 true

#### 터치 애니메이션 끄기
- hasTouchEffect={false}

#### 접근성(기본 제공)
- role="switch"
- aria-checked
- aria-disabled
추가 접근성
- 외부 라벨이거나 아이콘만 있으면 aria-label을 반드시 추가
    - 레이블에는 “스위치/켜짐/꺼짐” 같은 상태 단어는 포함하지 않음

#### 인터페이스(SwitchProps)
- checked: boolean
- disabled: boolean (기본값 false)
- name: string
- hasTouchEffect: boolean (기본값 true)
- onChange: (event, checked: boolean) => void
- onClick: mouse click handler

---

### 7.3.2 Switch (TDS React Native)
공식 문서: Switch — Toss Design System | React Native
- 상태 변경 콜백이 onCheckedChange(value: boolean)로 정의됨.

#### 인터페이스(SwitchProps)
- checked: boolean
- onCheckedChange: (value: boolean) => void
- defaultChecked: boolean (기본값 false)
- disabled: boolean (기본값 false)
- onPress: (event: GestureResponderEvent) => void
- style: StyleProp<ViewStyle>

---

### 7.3.3 SegmentedControl (TDS Mobile)
공식 문서: Segmented Control — Toss Design System | Mobile

#### 상태 관리
- 외부 관리: value + onChange(v: string)
- 내부 관리: defaultValue

#### size
- small | large
- 기본값: 'small'

#### alignment
- fixed | fluid
- 기본값: 'fixed'
- fluid이면 아이템 너비가 글자 수에 맞춰지고, 넘치면 가로 스크롤

#### 접근성(기본 지원)
- role="radiogroup"
- 각 항목 role="radio" + tabindex="0"
- aria-checked 자동 관리
- aria-labelledby로 레이블 연결

#### 인터페이스
- SegmentedControlProps
    - children (필수)
    - size: small | large (기본값 'small')
    - alignment: fixed | fluid (기본값 'fixed')
    - value: string
    - defaultValue: string
    - onChange: (v: string) => void
- SegmentedControlItemProps
    - children (필수)
    - value (필수)
    - size: small | large

---

### 7.3.4 SegmentedControl (TDS React Native)
공식 문서: SegmentedControl — Toss Design System | React Native
- value + onValueChange(value: string) 패턴.

#### 인터페이스
- SegmentedControlProps
    - children (필수)
    - value: string
    - onValueChange: (value: string) => void
- SegmentedControlItemProps
    - value (필수)
    - children (필수)

---

### 7.3.5 Radio (TDS React Native)
공식 문서: Radio — Toss Design System | React Native

#### 핵심
- Radio + Radio.Option children
- 필수: value, onChange, children

#### 수치
- horizontalMargin: 기본값 0 (px)

#### 비활성화
- 전체 disabled=true
- 또는 특정 옵션만 Radio.Option disabled=true

#### react-hook-form 통합
- RadioInput을 제공
    - control, name으로 연결
    - 추가 onChange 핸들러도 가능

#### 인터페이스
- RadioProps
    - value (필수): Value
    - onChange (필수): (value: Value) => void
    - children (필수): Radio.Option(들)
    - disabled: boolean (기본값 false)
    - horizontalMargin: number (기본값 0)
- RadioOptionProps
    - value (필수)
    - children (필수)
    - checked: boolean (기본값 false)
    - disabled: boolean (기본값 false)
    - onPress: (value: Value) => void

---

### 7.3.6 Checkbox (TDS React Native)
공식 문서: Checkbox — Toss Design System | React Native

#### 형태
- <Checkbox.Circle />
- <Checkbox.Line />

#### 상태 관리
- 외부: checked + onCheckedChange
- 내부: defaultChecked

#### 수치
- size: 기본값 24

#### disabled 동작
- disabled=true면 클릭 시 상태가 바뀌지 않고, 좌우로 흔들리는 애니메이션이 나타남

#### 인터페이스(CheckboxProps)
- checked: boolean
- disabled: boolean
- defaultChecked: boolean
- onCheckedChange: (checked: boolean) => void
- size: number (기본값 24)
- style: StyleProp<ViewStyle>

---

## 7.4 Dialog (상세) — Mobile(AlertDialog/ConfirmDialog) + RN(Dialog)

### 7.4.1 AlertDialog (TDS Mobile)
공식 문서: AlertDialog — Toss Design System | Mobile

#### 기본 구성
- title (AlertDialog.Title)
- description (AlertDialog.Description, 선택)
- alertButton (AlertDialog.AlertButton)

#### closeOnDimmerClick
- 기본값: true
- false면 외부 클릭으로 닫히지 않고 Wiggle 애니메이션

#### portalContainer
- 기본값: document.body

#### 인터페이스(AlertDialogProps)
- open: boolean
- title: React.ReactNode
- description: React.ReactNode
- alertButton: React.ReactNode
- closeOnDimmerClick: boolean (기본값 true)
- closeOnBackEvent: boolean (기본값 true)
- onClose: () => void
    - 문서: closeOnDimmerClick=true여도 onClose가 없으면 닫히지 않음
- onEntered: () => void
- onExited: () => void
- portalContainer: HTMLElement (기본값 document.body)
Title/Description/Button 기본값(문서)
- Title
    - as='h3'
    - color=adaptive.grey800
    - typography='t4'
    - fontWeight='bold'
- Description
    - as='h3'
    - color=adaptive.grey600
    - typography='t6'
    - fontWeight='medium'
- AlertButton
    - size='medium'
    - color=colors.blue500
    - fontWeight='bold'
    - variant: arrow | underline | clear

---

### 7.4.2 ConfirmDialog (TDS Mobile)
공식 문서: ConfirmDialog — Toss Design System | Mobile

#### 기본 구성
- title (ConfirmDialog.Title)
- description (ConfirmDialog.Description, 선택)
- cancelButton (ConfirmDialog.CancelButton)
- confirmButton (ConfirmDialog.ConfirmButton)

#### closeOnDimmerClick / closeOnBackEvent
- 기본값: 둘 다 true
- false면 외부 클릭으로 닫히지 않고 Wiggle 애니메이션

#### 인터페이스(ConfirmDialogProps)
- open: boolean
- title: React.ReactNode
- description: React.ReactNode
- cancelButton: React.ReactNode
- confirmButton: React.ReactNode
- closeOnDimmerClick: boolean (기본값 true)
- closeOnBackEvent: boolean (기본값 true)
- onClose: () => void (없으면 닫히지 않음)
- onEntered: () => void
- onExited: () => void
- portalContainer: HTMLElement (기본값 document.body)
CancelButton 기본값(문서)
- type='dark' (primary/danger/light/dark)
- style='weak' (fill/weak)
- size='large' (medium/big/large/tiny)
ConfirmButton
- Button 확장
- size='large' (medium/big/large/tiny)

---

### 7.4.3 Dialog (TDS React Native)
공식 문서: Dialog — Toss Design System | React Native
- RN은 useOverlay()를 사용해 Dialog를 “Promise 기반”으로 열어 결과를 받는 패턴이 예시로 제시됩니다.

#### AlertDialogProps
- open (필수): boolean
- title (필수): React.ReactNode
- onClose (필수): () => void
- description: React.ReactNode
- content: React.ReactNode
- buttonText: string (기본값 '확인')
- onButtonPress: () => void
- closeOnDimmerClick: boolean (기본값 false)
- onExited: () => void
- onEntered: () => void

#### ConfirmDialogProps
- open (필수): boolean
- title (필수): React.ReactNode
- leftButton (필수): React.ReactNode
- rightButton (필수): React.ReactNode
- onClose (필수): () => void
- description: React.ReactNode
- content: React.ReactNode
- closeOnDimmerClick: boolean (기본값 false)
- onExited: () => void
- onEntered: () => void

---

## 7.5 useToast (TDS Mobile, OverlayExtension)
공식 문서: useToast — Toss Design System | Mobile

### 동작 방식

#### 웹 환경
- 자동 사라짐
    - 버튼 없음: 3000ms
    - 버튼 있음: 5000ms
- duration(ms)로 조절 가능
- closeToast로 수동 닫기 가능

#### 앱 환경
- OS별 기본 위치(상단 기준)
    - Android: 26px
    - iOS: 46px
- SafeArea + BottomCTA 높이를 자동 고려
- 수동 닫기 메서드 없음

### 기본 사용

```javascript
const toast = useToast();
toast.openToast('메시지를 전송했어요');
```

### 옵션(OpenToastOptions)
- type: 'top' | 'bottom' (기본값 'bottom')
- gap: number (상/하단 거리, 최우선 적용)
- icon: string (lottie와 동시 사용 불가)
- iconType: 'circle' | 'square' (기본값 undefined)
- lottie: string (icon과 동시 사용 불가)
- button: { text: string; onClick: () => void }
- higherThanCTA: boolean (기본값 false)
- duration: number (ms)
    - 버튼 있으면 기본 5000ms, 없으면 기본 3000ms

---

## 7.6 ProgressStepper (TDS Mobile)
공식 문서: ProgressStepper — Toss Design System | Mobile

#### variant
- compact | icon

#### paddingTop (수치 포함)
- wide: 24px
- default: 16px
- 기본값: 'default'

#### activeStepIndex
- 기본값: 0

#### checkForFinish
- 기본값: false
- variant='icon'일 때만 사용 가능

#### 인터페이스
- ProgressStepperProps
    - variant (필수): compact | icon
    - paddingTop: default | wide (기본값 'default')
    - activeStepIndex: number (기본값 0)
    - checkForFinish: boolean (기본값 false)
- ProgressStepProps
    - title: string
    - icon: React.ReactNode (variant='icon'일 때만)

---

## 7.7 Highlight (TDS Mobile)
공식 문서: Highlight — Toss Design System | Mobile
- 특정 영역을 강조하고, 나머지 화면을 어둡게 처리하는 컴포넌트.

#### 사용 패턴
- 강조 영역을 children으로 감쌈
- open=true일 때 활성

#### 수치/단위
- padding: 기본값 0 (px)
- delay: 기본값 0 (초)

#### message 관련
- message: string 또는 (props) => ReactElement
- messageColor: 기본값 colors.white
- messageXAlignment: left | center | right (기본값 자동)
- messageYAlignment: top | bottom (기본값 자동)

#### 이벤트
- onClick: 강조 영역 외부 클릭 시
- onExited: 강조 애니메이션 종료 시

#### 인터페이스(HighlightProps)
- open (필수): boolean
- padding: number (기본값 0, px)
- delay: number (기본값 0, 초)
- highlighterClassname: string
- message: string | (props) => ReactElement
- messageColor: string (기본값 colors.white)
- messageXAlignment: left | center | right
- messageYAlignment: top | bottom
- onClick: () => void
- onExited: () => void

---

## 7.8 BarChart (TDS React Native)
공식 문서: BarChart — Toss Design System | React Native
- 이번 배치의 view 결과가 요약 수준으로만 노출되어, 세부 Props/옵션/기본값을 완전히 옮기기엔 정보가 부족합니다.
- 다음 단계에서는 BarChart 페이지 본문을 추가로 상세 추출한 뒤:
    - 데이터 구조
    - theme 옵션
    - 색상/막대 스타일
    - 축/라벨
    - 인터랙션(탭)
    - 인터페이스 테이블
- 를 그대로 이 섹션에 추가합니다.

---

## 8. 다음 작업(이 페이지에서 이어서 할 일)
[ ] BarChart 문서 본문을 더 상세로 추출해 Props/기본값/예시를 완성한다.
[ ] BottomCTA.Double 문서까지 함께 읽어서(현재 Single만 상세) left/right 버튼 props, 간격, fixedAboveKeyboard 지원 여부 등을 동일 포맷으로 채운다.
[ ] TextField 문서 내 “v3에서 제거되는 API” 경고가 보이므로(문서 하단), 실제 마이그레이션 가이드가 있다면 링크를 찾아 함께 기록한다.
[ ] Highlight는 앱브릿지(showHighlight)가 언급되므로, 앱브릿지 문서가 workspace 범위에서 필요하면 별도 섹션으로 분리한다.

---

## 9. (구) 다음 작업(이 페이지에서 이어서 할 일)
- 이 페이지는 “딥 확장 후보”를 먼저 분리해 두는 것이 목적이라, 아직 일부 섹션은 ‘정의 + 확장 체크리스트’만 존재합니다.
- 다음 단계에서는 각 공식 문서의 본문을 더 열람해:
    - props/interface table
    - default value
    - 상태(state)별 변화
    - 접근성 섹션
    - 코드 예시
- 를 그대로 추가하는 방식으로 계속 확장합니다.
