# TDS 컴포넌트 실무 노트 4(Mobile) — ProgressBar·Stepper·ListFooter·ProgressStepper·GridList


## 0. 범위와 중복 처리 원칙
- 이 페이지는 Mobile(WebView) 실무에서 자주 쓰는 컴포넌트 중, 아래 주제들을 “수치/기본값/허용값/Props/예시/체크리스트”로 정리합니다.
    - ProgressBar
    - Stepper
    - ListFooter
    - ProgressStepper
    - GridList

        ---

## 1. ProgressBar (TDS Mobile)
공식 문서: https://tossmini-docs.toss.im/tds-mobile/components/progress-bar/

### 1.1 언제 쓰는가 (실무 기준)
- 데이터 로딩, 업로드/다운로드, 단계형 작업 등 진행률(%)을 직관적으로 보여줘야 할 때 사용합니다.
- 텍스트만으로 진행 상태를 설명하면 불안감을 주는 흐름에서, ProgressBar로 “남은 정도”를 고정해줍니다.

### 1.2 progress (필수)
- progress: number (0.0 ~ 1.0)
    - 예: 0.5는 50% 진행

### 1.3 size (허용값 + 기본값)
- size: "light" | "normal" | "bold"
- 기본값: 'normal'

### 1.4 color (기본값)
- color: string
- 기본값: colors.blue400
- CSS 색상 값을 받을 수 있으나, 실무에서는 토큰(colors/adaptive 계열)을 우선합니다.

### 1.5 animate (애니메이션)
- animate: boolean
- 기본값: false
- true면 progress 변경 시 부드러운 애니메이션 적용

### 1.6 Props (ProgressBarProps)
- progress (필수): number (0.0 ~ 1.0)
- size: 'normal'(기본) | 'light' | 'bold'
- color: string (기본값 colors.blue400)
- animate: boolean (기본값 false)
- className: string

### 1.7 실무 예시

```javascript
<ProgressBar progress={0.5} size="normal" />

<ProgressBar progress={0.7} size="light" />
<ProgressBar progress={0.7} size="bold" />

<ProgressBar progress={0.7} color={colors.green400} />

function Animated() {
	const [progress, setProgress] = React.useState(0);
	return (
		<div style= display: 'flex', flexDirection: 'column', gap: 40 >
			<ProgressBar progress={progress} size="bold" animate />
			<Button onClick={() => setProgress(progress === 0 ? 1 : 0)}>
				{progress === 0 ? '애니메이션 시작' : '애니메이션 리셋'}
			</Button>
		</div>
	);
}
```

### 1.8 실무 체크리스트
[ ] progress 값은 0~1 범위로 clamp(보정)해서 넘긴다.
[ ] 크기(size)는 한 화면에서 혼용하지 말고 맥락별로 규칙을 정한다.
[ ] 색상 변경은 의미(성공/위험/브랜드) 기준으로만 하고 임의 하드코딩은 피한다.
[ ] 진행률이 자주 갱신되는 화면이면 animate=true 사용 시 과도하게 느려 보이지 않는지 확인한다.

---

## 2. Stepper (TDS Mobile)
공식 문서: https://tossmini-docs.toss.im/tds-mobile/components/stepper/

### 2.1 언제 쓰는가 (실무 기준)
- “해야 할 단계가 여러 개”이고, 각 단계가 제목/설명을 갖거나, 우측에 액션(화살표/버튼)이 필요한 흐름에서 사용합니다.
- 예: 본인인증 절차, 신청 단계 안내, 온보딩 단계 목록

### 2.2 기본 구성(문서 구조)
- 컨테이너: Stepper
- 행(row): StepperRow
    - left: 단계 표시(숫자 아이콘/에셋 등)
    - center: 텍스트(제목/설명)
    - right: 액션(화살표/버튼 등)

### 2.3 StepperRow.Texts type (허용값)
- type: "A" | "B" | "C" (필수)
- 문서 정의(타이포 조합)
    - A: 타이틀 t5, 설명 t6
    - B: 타이틀 t4, 설명 t6
    - C: 타이틀 t5, 설명 t7

### 2.4 연결선 숨기기
- StepperRow.hideLine: boolean (기본값 false)
- 마지막 단계에서 true로 두어 연결선을 제거

### 2.5 등장 모션(컨테이너 Stepper)
- play: boolean (기본값 true)
    - false면 애니메이션 없이 렌더
- delay: number (기본값 0, 단위 초)
- staggerDelay: number (기본값 0.1, 단위 초)
    - row가 순차 등장할 때 간격

### 2.6 Props 요약

#### StepperProps
- play: boolean (기본값 true)
- delay: number (기본값 0)
- staggerDelay: number (기본값 0.1)

#### StepperRowProps
- left (필수): React.ReactNode
- center (필수): React.ReactNode
- right: React.ReactNode
- hideLine: boolean (기본값 false)

#### StepperRowTextsProps
- type (필수): 'A' | 'B' | 'C'
- title (필수): React.ReactNode
- description: React.ReactNode
- titleProps: ParagraphTextProps
- descriptionProps: ParagraphTextProps

### 2.7 실무 예시

#### (1) 숫자 + 텍스트

```javascript
<>
	<StepperRow
		left={<StepperRow.NumberIcon number={1} />}
		center={<StepperRow.Texts type="A" title="타이틀" description="설명" />}
	/>
	<StepperRow
		left={<StepperRow.NumberIcon number={2} />}
		center={<StepperRow.Texts type="A" title="타이틀" description="설명" />}
	/>
	<StepperRow
		left={<StepperRow.NumberIcon number={3} />}
		center={<StepperRow.Texts type="A" title="타이틀" description="설명" />}
		hideLine
	/>
</>
```

#### (2) 오른쪽 화살표

```javascript
<Stepper>
	<StepperRow
		left={<StepperRow.NumberIcon number={1} />}
		center={<StepperRow.Texts type="A" title="타이틀" description="설명" />}
		right={<StepperRow.RightArrow />}
	/>
	...
</Stepper>
```

#### (3) 순차 등장(stagger)

```javascript
<Stepper staggerDelay={0.5}>
	<StepperRow left={<StepperRow.NumberIcon number={1} />} center={<StepperRow.Texts type="A" title="1" description="..." />} />
	<StepperRow left={<StepperRow.NumberIcon number={2} />} center={<StepperRow.Texts type="A" title="2" description="..." />} />
	<StepperRow left={<StepperRow.NumberIcon number={3} />} center={<StepperRow.Texts type="A" title="3" description="..." />} hideLine />
</Stepper>
```

### 2.8 실무 체크리스트
[ ] 마지막 row는 hideLine=true로 연결선을 정리한다.
[ ] 텍스트 스타일(type A/B/C)는 화면 내에서 혼용하지 말고 규칙을 정한다.
[ ] 오른쪽 요소(right)는 “항상 눌리는지” 여부를 명확히 하고, 눌리는 row라면 터치 영역(최소 44px)을 보장한다.
[ ] 모션이 과한 흐름(리스트 스크롤)에서는 play=false도 검토한다.

---

## 3. ListFooter (TDS Mobile)
공식 문서: https://tossmini-docs.toss.im/tds-mobile/components/list-footer/

### 3.1 언제 쓰는가 (실무 기준)
- 리스트의 끝에서 더 보기 / 더 불러오기 / 목록 확장 같은 액션을 제공할 때 사용합니다.
- “리스트가 여기서 끝이 아니라 이어질 수 있다”는 힌트를 텍스트/아이콘으로 줍니다.

### 3.2 children (텍스트 vs 컴포넌트)
- children에 문자열을 주면 ListFooter.Text로 렌더
- children에 ReactElement를 주면 그대로 렌더

### 3.3 icon
- icon에 문자열을 주면 ListFooter.Icon으로 렌더
- icon에 ReactElement를 주면 그대로 렌더

### 3.4 border (허용값 + 기본값)
- border: "full" | "indented" | "none"
- 기본값: full
    - full: 전체 너비 구분선
    - indented: 좌측 여백을 둔 구분선
    - none: 구분선 없음

### 3.5 hairline (구분선 커스텀)
- hairline: React.ReactElement
- ListFooter.Hairline indent={number(px)}로 좌측 여백 지정 가능

### 3.6 shadow (클릭 시 그림자)
- onClick이 있을 때 기본적으로 클릭 그림자 효과가 나타남
- shadow로 ListFooter.Shadow를 전달해 커스텀 가능

### 3.7 접근성(중요)
- aria-label은 필수로 제공해야 합니다.
    - 화면 맥락 없이 버튼만 읽는 스크린리더 사용자를 위해 목적을 구체적으로 설명

### 3.8 Props (ListFooterProps)
- border: 'full'(기본) | 'indented' | 'none'
- icon: string | ReactElement
- hairline: React.ReactElement
- shadow: React.ReactElement
- textColor: string (기본값 adaptive.blue500)
- iconColor: string (기본값 adaptive.blue500)
- children: string | ReactElement

### 3.9 실무 예시

```javascript
<ListFooter aria-label="다음 항목 더 불러오기" onClick={loadMore}>
	더 보기
</ListFooter>

<ListFooter
	aria-label="다음 항목 더 불러오기"
	icon="icon-plus-small-mono"
	border="indented"
	onClick={loadMore}
>
	더 보기
</ListFooter>

<ListFooter
	aria-label="더 보기"
	hairline={<ListFooter.Hairline indent={50} style= background: adaptive.blue100  />}
	onClick={loadMore}
>
	더 보기
</ListFooter>
```

### 3.10 실무 체크리스트
[ ] aria-label을 “무엇에 대한 더보기인지”까지 포함해 작성한다.
[ ] 리스트 스타일에 맞춰 border를 통일한다(섹션 리스트는 indented가 자연스러운 경우가 많음).
[ ] 더 불러오기 로딩이 있다면 클릭 후 중복 클릭 방지(디바운스/disabled 처리)를 함께 설계한다.

---

## 4. ProgressStepper (TDS Mobile)
공식 문서: https://tossmini-docs.toss.im/tds-mobile/components/progress-stepper/

### 4.1 언제 쓰는가 (실무 기준)
- 단계형 흐름에서, 현재 단계와 남은 단계를 한 줄(또는 컴팩트)로 요약해 보여주고 싶을 때 사용합니다.
- ProgressBar + Stepper의 결합 형태로, “진행률”과 “단계”를 동시에 전달합니다.

### 4.2 variant (필수)
- variant: "compact" | "icon"
    - compact: 간결한 단계 표시
    - icon: 각 단계에 아이콘이 포함되는 형태

### 4.3 paddingTop (기본값)
- paddingTop: "default" | "wide"
- 기본값: 'default'
    - default: 16px
    - wide: 24px

### 4.4 activeStepIndex (현재 단계)
- activeStepIndex: number
- 기본값: 0

### 4.5 checkForFinish (완료 단계 체크 표시)
- checkForFinish: boolean (기본값 false)
- 조건: variant === 'icon'일 때만 사용
- activeStepIndex보다 낮은 단계들을 check icon으로 렌더

### 4.6 ProgressStep (자식)
- ProgressStep.title?: string (생략 가능)
    - title을 생략하면 “단순한 형태(진행 상태만)”로 사용 가능
- ProgressStep.icon?: React.ReactNode (variant='icon'일 때 사용)

### 4.7 Props 요약

#### ProgressStepperProps
- variant (필수): 'compact' | 'icon'
- paddingTop: 'default'(기본) | 'wide'
- activeStepIndex: number (기본값 0)
- checkForFinish: boolean (기본값 false, variant='icon'에서만)

#### ProgressStepProps
- title: string
- icon: React.ReactNode (variant='icon'에서만)

### 4.8 실무 예시

```javascript
<ProgressStepper variant="compact" activeStepIndex={1}>
	<ProgressStep title="유심 신청" />
	<ProgressStep title="배송 완료" />
	<ProgressStep title="개통 완료" />
</ProgressStepper>

<ProgressStepper variant="icon" activeStepIndex={2} checkForFinish>
	<ProgressStep title="첫 번째" />
	<ProgressStep title="두 번째" />
	<ProgressStep title="세 번째" />
	<ProgressStep title="마지막" />
</ProgressStepper>

<ProgressStepper variant="compact" activeStepIndex={1}>
	<ProgressStep />
	<ProgressStep />
	<ProgressStep />
	<ProgressStep />
</ProgressStepper>
```

### 4.9 실무 체크리스트
[ ] 단계 수가 많아져도 라벨이 과밀하지 않은지(줄바꿈/잘림) 확인한다.
[ ] title을 생략하는 “단순형”은 사용자가 맥락을 이미 알고 있을 때만 쓴다.
[ ] 완료 단계 표시가 유의미하면 variant='icon' + checkForFinish=true를 기본 검토한다.

---

## 5. GridList (TDS Mobile)
공식 문서: https://tossmini-docs.toss.im/tds-mobile/components/grid-list/

### 5.1 언제 쓰는가 (실무 기준)
- 메뉴/카테고리/빠른 진입 등, 여러 옵션을 그리드로 압축해 한 화면에 효율적으로 보여줄 때 사용합니다.
- GridList.Item 터치 시 확대 효과로 피드백 제공(모바일 상호작용 강화).

### 5.2 column (허용값 + 기본값)
- column: 1 | 2 | 3
- 기본값: 3
    - 1열: 내용이 길거나 중요도가 높은 메뉴 강조
    - 2열: 아이템을 더 크게 보여주고 가독성 강화
    - 3열: 가장 일반적, 많은 옵션을 한눈에

### 5.3 GridList.Item
- image (필수): React.ReactNode
    - img 태그 또는 기타 ReactNode
- children: React.ReactNode
    - 하단 텍스트이며 Paragraph로 렌더

### 5.4 Props 요약

#### GridListProps
- column: 1 | 2 | 3 (기본값 3)
- children: React.ReactNode

#### GridListItemProps
- image (필수): React.ReactNode
- children: React.ReactNode

### 5.5 실무 예시

```javascript
<GridList column={3}>
	<GridList.Item
		image={<img src="https://static.toss.im/icons/png/4x/icn-bank-toss.png" style= width: '24px', height: '24px'  />}
	>
		아이템 1
	</GridList.Item>
	<GridList.Item
		image={<img src="https://static.toss.im/icons/png/4x/icn-bank-toss.png" style= width: '24px', height: '24px'  />}
	>
		아이템 2
	</GridList.Item>
</GridList>
```

### 5.6 실무 체크리스트
[ ] 화면 목적(탐색 vs 실행) 기준으로 1/2/3열을 고정하고, 임의로 자주 바꾸지 않는다.
[ ] 아이콘/이미지의 시각 크기를 통일한다(예: 24px 기준).
[ ] 아이템 텍스트가 길어질 수 있으면 1열 우선 검토(줄바꿈/가독성).

---

## 6. 다음 확장 후보 (Mobile)
- ProgressStepper를 실제 플로우(주문/배송/개통/심사)에 적용했을 때, “상태별 문구 규칙” (예: 완료/진행/대기)
- ListFooter와 결합되는 로딩 패턴(더보기 클릭 → Loader/Skeleton) 표준화
- StepperRow 전체 row 클릭 패턴 vs right 버튼 클릭 패턴 (터치 영역/우선순위 합의)
