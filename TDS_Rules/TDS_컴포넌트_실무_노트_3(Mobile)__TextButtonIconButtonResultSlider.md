# TDS 컴포넌트 실무 노트 3(Mobile) — TextButton·IconButton·Result·Slider


## 0. 범위와 중복 처리 원칙
- 이 페이지는 Mobile(WebView) 실무에서 바로 쓰는 컴포넌트 중, 기존 문서들과 겹치지 않는 내용만 “수치/기본값/허용값/Props/예시/체크리스트” 형태로 정리합니다.
- 이미 아래 페이지에 상세 스펙이 있는 주제는 여기서 재작성하지 않고 링크만 둡니다.
    - Button 상세 스펙: Untitled (섹션 L.1 Button)
    - 오버레이/토스트/CTA/입력/선택 등: Untitled
    - SearchField/Loader/Menu 등 실무 확장 2: Untitled

---

## 1. TextButton (TDS Mobile)
공식 문서: https://tossmini-docs.toss.im/tds-mobile/components/text-button/

### 1.1 언제 쓰는가 (실무 기준)
- 텍스트가 곧 액션인 UI에서 사용합니다.
    - 예: “자세히 보기”, “약관 보기”, “다시 시도”, “인증번호 재전송”
- 버튼을 강하게 보이게 하면 안 되는 맥락에서 Button(채움)보다 TextButton을 우선합니다.

### 1.2 size (허용값)
- xsmall | small | medium | large | xlarge | xxlarge

### 1.3 variant (허용값 + 기본값)
- variant: arrow | underline | clear
- 기본값: 'clear'
    - arrow: 오른쪽에 화살표 추가
    - underline: 밑줄 표시
    - clear: 기본 텍스트 버튼

### 1.4 disabled
- disabled: boolean

### 1.5 Props (TextButtonProps)
- size (필수): 위 size 값
- variant: 'clear' (기본) | 'arrow' | 'underline'
- disabled: boolean

### 1.6 실무 예시

```javascript
<TextButton size="xsmall">텍스트 버튼</TextButton>
<TextButton size="medium" variant="arrow">자세히</TextButton>
<TextButton size="medium" variant="underline">약관 보기</TextButton>
<TextButton size="medium" disabled>비활성</TextButton>
```

### 1.7 실무 체크리스트
[ ] 리스트의 서브 액션은 TextButton variant='arrow'로 표준화한다.
[ ] 약관/링크성 액션은 underline으로 “텍스트 링크” 느낌을 명확히 준다.
[ ] disabled 상태가 필요하면 스타일로 숨기지 말고 disabled를 사용한다.

---

## 2. IconButton (TDS Mobile)
공식 문서: https://tossmini-docs.toss.im/tds-mobile/components/icon-button/

### 2.1 핵심 규칙 (문서)
- aria-label은 필수입니다.
    - 아이콘만으로는 역할을 알 수 없기 때문.

### 2.2 variant (허용값 + 기본값)
- variant: 'clear' | 'fill' | 'border'
- 기본값: 'clear'
문서 정의 요약:
- clear: 배경 없이 아이콘만. 눌렸을 때 배경색이 보임.
- fill: 배경이 채워진 스타일. 눌렸을 때 배경색이 사라짐.
- border: 테두리. 눌렸을 때 배경색이 보임.

### 2.3 iconSize (수치 + 기본값)
- iconSize: number (기본값 24)
    - 예시: 24, 20, 16

### 2.4 bgColor (기본값)
- bgColor: string (기본값 adaptive.greyOpacity100)
- 적용 규칙:
    - variant='fill': 지정한 색이 평상시 배경
    - variant='clear' | 'border': 지정한 색이 pressed 배경

### 2.5 color
- color: string
- 아이콘 이름이 -mono로 끝나는 모노 타입 아이콘만 색상 변경 가능.

### 2.6 src vs name
- src: URL 문자열
- name: 아이콘 이름
- src와 name은 동시에 사용 불가

### 2.7 Props (IconButtonProps)
- 'aria-label' (필수): string
- variant: 'clear'(기본) | 'fill' | 'border'
- src: string
- name: string
- color: string
- bgColor: string (기본값 adaptive.greyOpacity100)
- iconSize: number (기본값 24)

### 2.8 실무 예시

```javascript
<IconButton
	src="https://static.toss.im/icons/svg/icon-search-bold-mono.svg"
	variant="clear"
	aria-label="검색하기"
/>

<IconButton
	name="icon-setting-mono"
	variant="border"
	bgColor={adaptive.greyOpacity100}
	iconSize={20}
	aria-label="설정 열기"
/>
```

### 2.9 실무 체크리스트
[ ] 아이콘 버튼은 무조건 aria-label을 쓴다.
[ ] 기본은 variant='clear'로 시작하고, “강조가 필요”할 때만 fill/border로 올린다.
[ ] bgColor는 디자인 토큰(adaptive.*)로만 관리한다.

---

## 3. Result (TDS Mobile)
공식 문서: https://tossmini-docs.toss.im/tds-mobile/components/result/

### 3.1 언제 쓰는가 (실무 기준)
- 특정 작업의 성공/실패/대기 결과를 “페이지 레벨”로 안내할 때 사용합니다.
- 텍스트, 버튼, 이미지(figure)를 빠르게 배치하는 목적.

### 3.2 figure (상단 시각 요소)
- figure: React.ReactNode
- 문서에서는 Asset.Image 또는 Asset.Icon 활용을 예시로 듭니다.
    - 예: Asset.frameShape.CleanH60, Asset.frameShape.CleanH24

### 3.3 button (하단 액션)
- button: React.ReactNode
- Result.Button을 사용해 재시도/홈 이동 같은 액션을 제공합니다.

### 3.4 접근성 (문서)
- title은 <h5> 헤딩 태그로 변환
- Result.Button은 <button> 태그로 변환
- figure의 이미지는 장식용 처리로 alt="" 자동 적용

### 3.5 Props (ResultProps)
- figure: React.ReactNode
- title: React.ReactNode
- description: React.ReactNode
- button: React.ReactNode

### 3.6 실무 예시

```javascript
<Result
	figure={
		<Asset.Image
			src="https://static.toss.im/2d-emojis/png/4x/u1F4FA.png"
			frameShape={Asset.frameShape.CleanH60}
		/>
	}
	title="라이브 쇼핑 준비 중"
	description="요금이 나오면 알림을 보내드릴게요."
/>

<Result
	figure={<Asset.Icon name="icn-info-line" frameShape={Asset.frameShape.CleanH24} />}
	title="다시 접속해주세요"
	description={'페이지를 불러올 수 없습니다\n다시 시도해주세요'}
	button={<Result.Button>재시도</Result.Button>}
/>
```

### 3.7 실무 체크리스트
[ ] “되돌아갈 길”이 필요하면 button을 반드시 제공한다.
[ ] figure는 메시지 톤(성공/경고/정보)에 맞는 아이콘/이미지를 사용한다.
[ ] title은 짧게, description에서 원인/다음 행동을 설명한다.

---

## 4. Slider (TDS Mobile)
공식 문서: https://tossmini-docs.toss.im/tds-mobile/components/slider/

### 4.1 언제 쓰는가 (실무 기준)
- 범위를 직관적으로 조절해야 하는 연속 값 입력에 사용합니다.
    - 예: 가격 범위, 강도, 볼륨, 만족도, 퍼센트

### 4.2 color (기본값 + 토큰 사용)
- color: string
- 문서: 기본값은 blue400
- 예시 토큰: adaptive.blue500 | adaptive.green500 | adaptive.red500

### 4.3 label (범위 라벨)
- label: { min: string; max: string; mid?: string; }
- mid는 선택값.
문서 예시 수치:
- MIN=100, MID=150, MAX=200 (만원)

### 4.4 tooltip (현재값 표시)
- tooltip: React.ReactElement
- Slider.Tooltip을 사용해 현재값 표시
- Slider.Tooltip은 Tooltip의 props를 그대로 사용
    - 예: offset으로 위치 조절
- message (필수): string

### 4.5 Props (SliderProps)
- value: number
- defaultValue: number
- onValueChange: (value: number) => void
- minValue: number
- maxValue: number
- color: string
- label: { min: string; max: string; mid?: string; }
- tooltip: React.ReactElement

### 4.6 실무 예시

#### (1) 색상만 변경

```javascript
const [value, setValue] = React.useState(50);

<Slider
	color={adaptive.blue500}
	value={value}
	onValueChange={setValue}
/>
```

#### (2) 라벨(최소/중간/최대)

```javascript
const [value, setValue] = React.useState(150);
const MIN = 100;
const MID = 150;
const MAX = 200;

<Slider
	value={value}
	minValue={MIN}
	maxValue={MAX}
	label={{ min: `${MIN} 만원`, mid: `${MID} 만원`, max: `${MAX} 만원` }}
	onValueChange={setValue}
/>
```

#### (3) 툴팁

```javascript
const [value, setValue] = React.useState(50);

<div style= paddingTop: '55px' >
	<Slider
		value={value}
		tooltip={<Slider.Tooltip message={String(value)} />}
		onValueChange={setValue}
	/>
</div>
```

### 4.7 실무 체크리스트
[ ] 정밀 조절이 필요하면 tooltip을 기본으로 켠다.
[ ] 범위를 명확히 해야 하면 label(min/max)은 필수.
[ ] 색상은 의미(긍정/주의/위험)로만 바꾸고, 임의 CSS 색상 하드코딩은 지양한다.

---

## 5. 다음으로 더 확장할 후보 (Mobile)
- (추가 탐색 필요) Tooltip 컴포넌트 자체의 props/기본값
- Result와 함께 쓰기 좋은 “빈 상태/에러/재시도” 관련 컴포넌트들
