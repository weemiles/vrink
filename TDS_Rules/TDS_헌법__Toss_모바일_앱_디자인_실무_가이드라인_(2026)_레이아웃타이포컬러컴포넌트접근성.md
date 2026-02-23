# TDS 헌법 — Toss 모바일 앱 디자인 실무 가이드라인 (2026): 레이아웃·타이포·컬러·컴포넌트·접근성

이 문서는 Toss Design System(TDS) 공식 문서, 토스 브랜드 리소스, 실제 컴포넌트 문서, 그리고 실무 적용 사례를 기반으로 Toss 모바일 앱의 모든 디자인 실무 규칙, 수치, 컴포넌트 기준을 한눈에 파악할 수 있도록 정리한 헌법입니다. iOS/Android 공통 실무 기준, 토스만의 디자인 언어, 접근성, 컬러 시스템, 타이포그래피, 레이아웃 그리드, 컴포넌트 스펙까지 하나도 빠짐없이 조사하였습니다.

---

## A. 레이아웃 & 그리드 시스템

### 1. 그리드 시스템 및 열 구성
토스 모바일 앱은 GridList 컴포넌트를 통해 1, 2, 3열 그리드 레이아웃을 제공합니다.
- 기본값은 3열이며, column 속성으로 1, 2, 3 중 선택 가능
- 각 아이템은 이미지(24x24px)와 텍스트로 구성
- 중요도가 높거나 내용이 긴 경우 1열, 일반적인 메뉴/카테고리에는 3열이 가장 많이 사용됨
- 그리드 내 아이템 간 기본 간격(gap)은 8px~16px 수준으로, 일관된 spacing을 유지합니다[1].

### 2. 마진, 패딩, Spacing 규칙
- 기본 좌우 마진: 16px (Safe Area 기준, 화면 가장자리와의 최소 여백)
- 컴포넌트 간 기본 간격: 8px, 12px, 16px (8의 배수 단위가 실무 표준)
- 카드/리스트/섹션 등 컨테이너 내부 패딩: 16px~24px
- 그리드 gutter(열 사이 간격): 8px~16px
- Safe Area는 iOS/Android 모두 필수 고려 사항이며, 모든 UI 요소는 Safe Area 내에 배치해야 함[2][1].

### 3. Safe Area & 네비게이션 바
- Safe Area 마진: 16px 이상(좌우), 상단/하단은 디바이스별로 다름
- 네비게이션 바 높이: 44px
- 탭바(하단): 49px(일반), 83px(홈 인디케이터 포함 시)
- 홈 인디케이터: 34px
- 리스트 셀 높이: 56px(가장 많이 사용), 최소 44px[3].

---

## B. 타이포그래피 시스템

### 1. 폰트 패밀리 및 브랜드 폰트
- Toss Product Sans: 토스 전용 브랜드 폰트로, 라틴/숫자 가독성에 특화[4].
- 한글 및 다국어 지원도 보장함.

### 2. 텍스트 스타일, 폰트 사이즈, 라인하이트
토스 디자인 시스템은 계층화된 토큰 기반 타이포그래피를 사용하며, 아래는 대표 스타일입니다[5].
- 폰트 weight: Light, Regular, Medium, Semibold, Bold 계층 제공
- Line Height: Font Size의 약 130~140% 권장
- 접근성: iOS/Android 시스템의 "더 큰 텍스트" 모드 지원(비율로 자동 대응)
- 실무 적용: 버튼 텍스트는 보통 Typography 5(Bold, 17~19px), 본문은 Typography 5~6(17~15px, 24~21px) 사용[5].

---

## C. 컬러 시스템 & 브랜드 컬러

### 1. Toss 공식 브랜드 컬러
- Toss Blue:
    - HEX: #0064FF
    - RGB: 0, 100, 255
    - PANTONE: 2175 C
- Toss Gray:
    - HEX: #202632
    - RGB: 32, 38, 50
    - PANTONE: 433 C
- 브랜드 컬러는 변형 금지, 흰/검은 배경 모두에서 명확한 시각적 인지 보장[6].

### 2. 색상 시스템(Design Tokens)
토스는 색상 계층을 50~900 단위로 나누어 사용합니다.
- Blue:
    - blue50: #e8f3ff
    - blue100: #c9e2ff
    - blue200: #90c2ff
    - blue500: #3182f6 (실제 버튼/강조에 많이 사용)
- Grey:
    - grey50: #f9fafb
    - grey100: #f2f4f6
    - grey900: #191f28
- Red, Green, Orange, Yellow, Teal, Purple 등도 50~900 단계로 세분화
- 배경색: #FFFFFF
- Semantic Colors: 상태(성공/경고/에러 등)에 따라 Green, Red, Orange 계열 사용
- Opacity 계열: greyOpacity50~900 등 다양한 투명도 지원
- 다크모드/고대비: 토큰 시스템으로 자동 대응 가능[7].

---

## D. 컴포넌트 실무 스펙

### 1. 버튼(Button)
- 크기: small, medium, large, xlarge 중 선택
- 높이/Width:
    - small: 약 32px
    - medium: 약 40px
    - large: 약 48px
    - xlarge: 약 56px
- 좌우 패딩: 16px(기본), 최소 12px
- 버튼 간 간격: 8px
- 터치 영역: 최소 44x44px(접근성 기준)
- 버튼 스타일: fill(주요 액션), weak(보조 액션)
- 버튼 형태: inline(나란히), block(줄바꿈), full(전체 너비)[8].

### 2. 네비게이션 바 / 탭바
- Navigation Bar 높이: 44px
- Tab Bar 높이: 49px(일반), 83px(홈 인디케이터 포함)[3].

### 3. 카드, 리스트, 모달
- 카드/모달 라운드: 16px(상단), 실무에서 12~16px 사용
- 카드/모달 내부 패딩: 16px~24px
- 리스트 셀 높이: 56px(가장 많이 사용), 최소 44px
- 모달/바텀시트: 상단 라운드 16px, 내부 패딩 24px, Safe Area 하단 여백 필수[3].

---

## E. 접근성 & 터치 인터랙션
- 터치 타겟 최소 크기: 44x44px(약 7~10mm, 국제 표준)
- 버튼 간 최소 간격: 8px 이상
- 접근성: 폰트 크기 확대, 컬러 대비(최소 4.5:1, 권장 7:1), 스크린리더 대응
- 비활성화/로딩/아이콘만 있는 버튼: aria-label 등 추가 접근성 속성 활용[8][9].

---

## F. 실무 적용 체크리스트
- 모든 UI 요소 Safe Area 내 배치
- 좌우 마진 16px, 간격 8px의 8pt 그리드 시스템
- Toss Product Sans, 계층별 폰트 토큰 사용, Line Height 130% 적용
- 터치 영역 44x44px, 버튼 간격 8px 이상
- Navigation Bar(44px), Tab Bar(49/83px), 버튼(40~56px), 카드/모달 라운드(16px)
- 브랜드 컬러 및 다크모드/고대비 대응
- 텍스트 대비(WCAG 4.5:1 이상) 확인

---

## G. 실무에서 자주 쓰는 패턴
- 카드형 UI: 16px 마진, 16px 패딩, 16px 라운드, 그림자 효과
- 리스트: 셀 높이 56px, 좌우 16px, 상하 8px 간격
- 버튼: 48px 높이, 좌우 16px 패딩, Typography 5(Bold)
- 탭바: 최대 5개 아이콘, 49px(홈 인디케이터 포함 83px)
- 모달/바텀시트: 상단 16px 라운드, 내부 24px 패딩

---

## H. 공식 기준 vs 실무 관행
- 공식 문서: 8pt 그리드, 44px 터치 영역, 브랜드 폰트, 시스템 컬러 사용 필수 권장
- 실무: 16px 마진, 8/16px 간격, 카드/모달 16px 라운드, 리스트 셀 56px, 버튼 40~56px 표준
- 커스텀 디자인 시에도 Safe Area, 터치 영역, 접근성 기준 반드시 준수

---

## I. TDS 시스템 정의 ("디자인 규칙"을 넘어 "언어/운영체계"로 이해하기)

### 1. TDS의 포지션
- TDS는 토스 제품을 만들 때 공통적으로 사용하는 디자인 시스템이며, 수백 개의 컴포넌트와 템플릿으로 구성됨.
- 디자인 툴 내부의 가이드로만 존재하는 것이 아니라, 개발과 연결되어 토스 제품을 구성하는 "언어"로 사용됨.[10]

### 2. TDS가 지향하는 목표 (실무적 의미)
- 최소 품질을 언제나 보장: 컴포넌트/토큰이 최소 규칙(간격/상태/대비 등)을 강제해 화면 간 품질 편차를 줄임.
- 생산성 향상: 토큰/컴포넌트의 재사용으로 값 계산과 커스텀 결정을 줄이고 문제 해결에 집중.
- 일관된 인터랙션/애니메이션/템플릿: 상태(pressed/loading/disabled) 피드백과 상호작용 패턴을 컴포넌트가 내장하여 제품 전체 상호작용을 통일.[10]

---

## J. 타이포그래피 시스템 (확장판: 토큰 계층 + 더 큰 텍스트 규칙)

### 1. 원칙: 하드코딩 금지, 토큰 사용
- Typography는 계층 구조를 가진 토큰으로 제공됨.
- 사용자는 폰트 크기와 라인하이트를 외우거나 직접 계산하지 않는 것을 전제로 설계됨.
- 아래 값들을 하드코딩하면 "더 큰 텍스트(접근성)" 환경에서 유연하게 대응하기 어려움.[11]

### 2. 토큰 계층 (기본 스케일)
- Typography 1: 30 / 40 — 매우 큰 제목
    - sub Typography 1: 29 / 38
    - sub Typography 2: 28 / 37
    - sub Typography 3: 27 / 36
- Typography 2: 26 / 35 — 큰 제목
    - sub Typography 4: 25 / 34
    - sub Typography 5: 24 / 33 — 조금 큰 제목
    - sub Typography 6: 23 / 32
- Typography 3: 22 / 31 — 일반 제목
    - sub Typography 7: 21 / 30
- Typography 4: 20 / 29 — 작은 제목
    - sub Typography 8: 19 / 28 — 조금 큰 본문
    - sub Typography 9: 18 / 27
- Typography 5: 17 / 25.5 — 일반 본문
    - sub Typography 10: 16 / 24
- Typography 6: 15 / 22.5 — 작은 본문
    - sub Typography 11: 14 / 21
- Typography 7: 13 / 19.5 — 안 읽어도 됨
    - sub Typography 12: 12 / 18
    - sub Typography 13: 11 / 16.5 — 아예 안읽어도 됨[11]

### 3. 더 큰 텍스트 (접근성) — iOS / Android / 웹의 비율 일관화

#### (1) iOS: 제한된 단계(xLarge~)를 "비율"로 추상화
- 100%: Large
- 110%: xLarge
- 120%: xxLarge
- 135%: xxxLarge
- 160%: A11y_Medium
- 190%: A11y_Large
- 235%: A11y_xLarge
- 275%: A11y_xxLarge
- 310%: A11y_xxxLarge
- 위 비율별로 Typography 토큰의 실제 폰트 사이즈가 표로 제공되며, 네이티브 설정 변화에도 웹/네이티브 간 텍스트 비율 차이를 줄이기 위해 근사 규칙을 사용함.[11]

#### (2) Android: 모든 비율을 지원하므로 공식 기반으로 계산 + Max 상한
- 각 토큰은 100% 값이 있고, NN%일 때 기본값 * NN * 0.01로 계산.
- 토큰별 Max 상한이 존재 (예: Typography 1 Max 42 등)하여 레이아웃 붕괴를 제한.[11]

### 4. 전체 토큰 네이밍(Weight 조합)
- Typography_Light/Regular/Medium/Semibold/Bold
- Typography1_Bold, subTypography10_Regular 등 계층 × weight 조합으로 제공.[11]

---

## K. 컬러 시스템 (확장판: 팔레트 토큰 + Opacity + 배경 토큰 + 운영 원칙)

### 1. 목적
- 디자이너와 개발자가 통일된 색상 이름을 사용하도록 돕고, 디자인 가이드에 맞춘 일관된 UI 구현을 쉽게 함.[12]

### 2. 기본 팔레트(계열 × 50~900)
- Grey: colors.grey50~grey900
- Blue: colors.blue50~blue900
- Red: colors.red50~red900
- Orange: colors.orange50~orange900
- Yellow: colors.yellow50~yellow900
- Green: colors.green50~green900
- Teal: colors.teal50~teal900
- Purple: colors.purple50~purple900[12]

### 3. Grey Opacity 토큰(투명도 수치 포함)
- colors.greyOpacity50 = 0.02
- colors.greyOpacity100 = 0.05
- colors.greyOpacity200 = 0.1
- colors.greyOpacity300 = 0.18
- colors.greyOpacity400 = 0.31
- colors.greyOpacity500 = 0.46
- colors.greyOpacity600 = 0.58
- colors.greyOpacity700 = 0.7
- colors.greyOpacity800 = 0.8
- colors.greyOpacity900 = 0.91[12]

### 4. 배경 토큰
- colors.background
- colors.greyBackground (lightThemeGrey100)
- colors.layeredBackground
- colors.floatedBackground[12]

### 5. 컬러 시스템 업데이트(운영 원칙과 구조)

#### (1) 문제: 같은 단계(예: 100)인데도 컬러별 명도가 달라 UI가 얼룩덜룩해지는 문제
- 동일한 "100"이라도 Grey/Blue/Red의 대비가 달라, 리스트에서 섞어 쓰면 시각적으로 불균일해 보이는 문제가 존재.
- 라이트/다크모드에서 같은 토큰이 다르게 튀는 문제, 접근성 문제, 그리고 토큰 소스가 여러 곳에 분산되어 관리되는 문제가 누적.[13]

#### (2) 해결: OKLCH 기반의 인지적 균일성 + 시각보정
- OKLCH 같은 인지적으로 균일한 색공간을 활용해 컬러 스케일의 명도 체계를 통일.
- 수치적으로 균일해도 노란색(The Dark Yellow Problem) 등은 시각보정이 필요하며, 다크모드는 시인성 저하를 고려해 별도 명도 기준을 세움.[13]

#### (3) 시맨틱 토큰 구조
- Target(대상: fill/text/border 등)
- Role(역할: brand/neutral/primary/secondary 등)
- Variant(변형: weak/alt 등)
- 시맨틱 토큰을 정비해 동일한 의도라면 동일한 색상을 쓰도록 일관성을 보장.[13]

#### (4) 토큰 운영: Token Studio → GitHub PR → 자동 코드 생성
- 디자이너가 Token Studio로 커밋/PR 생성.
- 전처리로 이름/구조/포맷을 정규화하고, Style Dictionary 등을 통해 CSS/TS/Deus/Server Driven 등 다양한 플랫폼 포맷으로 변환.
- 테마/모드/오버라이드까지 확장 가능한 구조를 구축.[13]

---

## L. 컴포넌트 스펙 (확장판: 인터페이스/상태/접근성/커스텀)

### 1. Button (상세)

#### (1) Size
- size: small | medium | large | xlarge[8]

#### (2) Variant
- variant: fill | weak
- fill: 주요 액션 강조에 적합
- weak: 보조 액션에 적합, 반투명하게 디자인되어 배경이 살짝 드러남[8]

#### (3) Display
- display: inline | block | full
- inline: 다른 요소와 나란히
- block: 줄바꿈되어 화면 너비에 맞게 확장
- full: 부모 요소의 전체 너비를 차지[8]

#### (4) Loading
- loading: 로딩 상태 표시
- 3개의 인디케이터가 순차적으로 움직임
- 로딩 중에도 버튼 너비는 변하지 않음[8]

#### (5) Disabled
- disabled: 클릭 불가 + 비활성 상태 표시[8]

#### (6) Loading + Disabled 동시 사용 가능
- loading과 disabled를 동시에 사용하면 "로딩 중이면서 비활성화" 상태로 표시[8]

#### (7) CSS 변수로 색상/상태 레이어 제어
- --button-color
- --button-background-color
- --button-disabled-opacity-color
- --button-disabled-text-opacity
- --button-gradient-color
- --button-loader-color
- --button-loading-background-color
- --button-loading-opacity
- --button-pressed-background-color
- --button-pressed-opacity[8]

#### (8) 접근성
- 기본 제공
    - button 역할: 스크린 리더에서 버튼으로 인식
    - disabled: 비활성 상태를 읽어줌
    - loading: aria-busy로 로딩 중임을 전달
- 개발자가 추가로 지원해야 하는 경우
    - as prop으로 button/a 태그 선택(링크는 href 포함)
    - 아이콘만 있거나 설명이 부족할 때 aria-label 추가
    - 로딩 중 텍스트가 없을 때 aria-label로 어떤 작업을 처리 중인지 전달[8]

#### (9) 인터페이스(ButtonProps)
- as (기본값 'button'): button | a
- color (기본값 'primary'): primary | danger | light | dark
- variant (기본값 'fill'): fill | weak
- display (기본값 'inline'): inline | block | full
- size (기본값 'xlarge'): small | medium | large | xlarge
- loading: false | true
- disabled: false | true
- type: button | submit | reset
- htmlStyle: React.CSSProperties[8]

### 2. GridList (상세)
- GridList는 GridList.Item들을 그리드 형태로 배치.
- GridList.Item은 이미지 + 텍스트로 구성.
- 모바일 환경에서 Item 터치 시 확대 효과로 사용자 피드백을 제공.[1]

#### (1) Column
- column 기본값: 3
- 선택 가능: 1 | 2 | 3
- 1열: 내용이 길거나 중요도가 높은 메뉴 강조
- 2열: 아이템을 더 크게 보여주거나 가독성 향상 목적
- 3열: 가장 일반적, 많은 옵션을 효율적으로 보여주기 적합[1]

#### (2) 인터페이스
- GridListProps
    - column (기본값 3): 1 | 2 | 3
    - children: React.ReactNode (일반적으로 GridList.Item)
- GridListItemProps
    - image (필수): React.ReactNode (img 태그 또는 기타 ReactNode)
    - children: React.ReactNode
        - 하단 텍스트이며, Paragraph 컴포넌트를 통해 렌더링됨[1]

---

## M. 브랜드 규정 (브랜드 리소스 기반)

### 1. 브랜드 컬러 (변형 금지)
- Toss Blue: R0 G100 B255 / PANTONE 2175 C
- Toss Gray: R32 G38 B50 / PANTONE 433 C
- 브랜드 컬러는 절대 변형할 수 없음.[6]

### 2. 로고 사용 유의사항(변형/효과/결합 금지)
- 로고를 회전하지 말 것
- 로고 컬러를 임의로 변경하지 말 것
- 로고 비율을 임의로 변경하지 말 것
- 로고에 효과/그라데이션을 임의로 적용하지 말 것
- 로고 안에 텍스트를 쓰지 말 것
- 로고 가시성을 떨어뜨리는 배경색/배경 이미지는 피할 것
- 심볼에 다른 서체를 결합하거나, 로고를 라인/프레임으로 사용하는 등 형태적 변형을 지양.[6]

---

## N. TDS React Native 시작하기 (설치/Provider/기본 사용)

### 1. 개요
- TDS React Native 패키지를 사용하면 모바일 환경에서 다양한 UI 컴포넌트를 쉽게 적용할 수 있음.
- 이 섹션은 프로젝트에 설치하고, Provider를 설정하고, 컴포넌트를 불러와 쓰는 “최소 실행 경로”를 그대로 기록함.[14]

### 2. 필수 패키지 설치
- 터미널에서 다음 명령으로 패키지를 설치.[14]

```javascript
npm install @toss/tds-react-native
```
- 호환성 주의: tds-react-native는 react 18버전까지 지원하며, 19버전은 아직 지원하지 않음.[14]

### 3. Provider 설정 (필수)
- 프로젝트 최상위를 TDSProvider로 감싸야 함.
- 이 Provider는 TDS RN 컴포넌트들이 올바르게 동작하도록 설정을 제공.[14]

```javascript
import { TDSProvider } from '@toss/tds-react-native';

function App({ Component, pageProps }) {
	return (
		<TDSProvider>
			<Component {...pageProps} />
		</TDSProvider>
	);
}
```

### 4. 사용하기 (컴포넌트 import)
- 설치/설정 이후에는 컴포넌트를 import해서 그대로 사용 가능.
- 예시: Button[14]

```javascript
import { Button } from '@toss/tds-react-native';

const App = () => <Button>버튼</Button>;
```

---

## O. List (TDS React Native) (상세: 구분선/설정목록/아이콘/정보목록/인터페이스)

### 1. 컴포넌트 정의
- List 컴포넌트는 여러 아이템을 세로로 나열할 때 사용.
- 아이템 사이에 구분선을 자동으로 추가할 수 있음.[15]

### 2. 기본 사용 (children으로 row 전달)
- List는 children으로 아이템(행)을 전달하는 방식.
- 예시(문서 예제 그대로):[15]

```javascript
<List>
	<ListRow contents={<ListRow.Texts texts={[{ text: '아이템 1' }]} />} />
	<ListRow contents={<ListRow.Texts texts={[{ text: '아이템 2' }]} />} />
	<ListRow contents={<ListRow.Texts texts={[{ text: '아이템 3' }]} />} />
</List>
```

### 3. 구분선 타입 (rowSeparator)
- rowSeparator 속성으로 아이템 사이 구분선 스타일을 변경.[15]
    - indented: 왼쪽 여백이 있는 구분선 (기본값)
    - full: 전체 너비 구분선
    - none: 구분선 없음
- 예시(문서 예제 그대로):[15]

```javascript
// 왼쪽 여백이 있는 구분선 (기본값)
<List rowSeparator="indented">
	...
</List>

// 전체 너비 구분선
<List rowSeparator="full">
	...
</List>

// 구분선 없음
<List rowSeparator="none">
	...
</List>
```

### 4. 설정 목록 패턴 (withArrow + onPress)
- 설정 화면에서 자주 쓰는 패턴으로, withArrow와 onPress를 함께 사용.[15]
- 예시(문서 예제 그대로):

```javascript
<List>
	<ListRow
		contents={<ListRow.Texts texts={[{ text: '알림 설정' }]} />}
		withArrow
		onPress={() => navigation.navigate('Notification')}
	/>
	<ListRow
		contents={<ListRow.Texts texts={[{ text: '계정 설정' }]} />}
		withArrow
		onPress={() => navigation.navigate('Account')}
	/>
	<ListRow
		contents={<ListRow.Texts texts={[{ text: '개인정보 처리방침' }]} />}
		withArrow
		onPress={() => navigation.navigate('Privacy')}
	/>
</List>
```

### 5. 아이콘과 함께 사용 (left/right 영역 활용)
- left에 ListRow.Icon을 넣고, right에 스위치 같은 컨트롤을 넣는 패턴이 예시로 제공됨.[15]

```javascript
<List>
	<ListRow
		left={<ListRow.Icon name="icon-notification" />}
		contents={<ListRow.Texts texts={[{ text: '알림' }]} />}
		right={<Switch value={true} />}
	/>
	<ListRow
		left={<ListRow.Icon name="icon-lock" />}
		contents={<ListRow.Texts texts={[{ text: '보안' }]} />}
		withArrow
		onPress={() => {}}
	/>
</List>
```

### 6. 정보 목록 패턴 (Texts 배열로 레이블/값 구성)
- ListRow.Texts의 texts 배열에 여러 줄을 넣어 “레이블 + 값” 형태의 정보 목록을 구성.
- 각 줄마다 typography/color를 지정하는 패턴이 예시로 제시됨.[15]

```javascript
<List rowSeparator="indented">
	<ListRow
		contents={
			<ListRow.Texts
				texts={[
					{ text: '계좌번호', typography: 't6', color: colors.grey600 },
					{ text: '1234-5678-9012', typography: 't5' },
				]}
			/>
		}
	/>
	<ListRow
		contents={
			<ListRow.Texts
				texts={[
					{ text: '예금주', typography: 't6', color: colors.grey600 },
					{ text: '김토스', typography: 't5' },
				]}
			/>
		}
	/>
</List>
```

### 7. 인터페이스 (ListProps)
- children (필수): React.ReactNode — 리스트 아이템들 지정
- rowSeparator (기본값 'indented'): full | indented | none
- style: StyleProp<ViewStyle> — 리스트 스타일 지정[15]

---

## P. 디자인 시스템 가이드 작성법 (TDS 가이드 제작 경험 기반)

### 1. 문제: 가이드가 "있어도" 소통이 어려웠던 이유
- 컴포넌트를 개선할 때 기존 가이드만으로는 플랫폼 디자이너/개발자와 소통이 어려웠음.
- 가이드 작성 규칙이 없어서 디자이너마다 작성 방식이 제각기였고, 그 결과 기존 가이드를 읽어도 컴포넌트를 온전히 파악하기 어려웠음.[16]

### 2. 해결책: 가이드를 읽는 방향성(위→아래 흐름) 만들기
- 기존에는 정사각형에 가까운 형태로 스펙을 한눈에 보이게 배치.
- 그러나 개발자 입장에서는 "어떤 순서로 읽어야 하는지" 파악하기 어려워 구조를 이해하기 힘들었음.
- 그래서 정보 그룹핑을 단순히 묶는 것을 넘어, 가이드 내용을 위에서 아래로 흐르게 배치하여 누구나 같은 순서로 읽을 수 있게 함.[16]

### 3. 큰 구조부터 → 자세한 요소로 (점층적 구성)
- 개발도 큰 구조부터 상세 요소로 진행된다는 관찰을 기반으로, 가이드를 다음 순서로 구성.
    1) 상위 옵션(예: 상단/하단 타입 등 큰 타입)
    2) 각 타입에 포함된 요소 정리
    3) 상태 변화(다크모드, 텍스트 2줄 등) 같은 상세 스펙 추가
- 목표: 원하는 스펙을 찾기 위해 방황하지 않도록 “큰 옵션 정의 → 내부 요소 → 변형/상태 상세”로 점층적으로 제공.[16]

### 4. 최악의 케이스 먼저 제시하기 (옵션 지도 만들기)
- 컴포넌트 안에 경우의 수가 많아, 모든 케이스를 나열하기 어렵다면
- 모든 요소를 최대한으로 썼을 때(최악의/최대 옵션) 모습을 가이드 최상단에 첨부.
- 최대 옵션 사례를 먼저 보면 “전체 옵션 지도”를 그린 뒤 하나씩 살펴볼 수 있음.[16]

### 5. 접근성 영역을 가이드 하단에 고정 배치하기
- 접근성 스펙이 컴포넌트 레이아웃 설명에 섞이거나 별도 페이지에 있으면, 새 컴포넌트를 설계할 때 참고하기 어려움.
- 그래서 선형(위→아래) 가이드 구조의 "가장 하단"에 접근성 섹션을 위치시키기로 약속.
- 이 구조 변경으로 더 큰 텍스트뿐 아니라 보이스오버 사용성, 동작 줄이기 같은 조건들을 점진적으로 쌓아나갈 수 있게 됨.[16]

### 6. 수십 개 컴포넌트에 확장 적용하기 위한 체크리스트 정의
- 토스트/CTA/리스트 등 조합형 컴포넌트는 동일한 구성을 적용할 수 있도록 체크리스트를 정의.
- 체크리스트는 큰 구조→타입→영역→상세 스펙→더 큰 텍스트→다크모드까지 포함.
- 타입이 나뉘지 않거나 상세 스펙이 불필요한 경우 생략.
- 아토믹(에셋/버튼/체크박스 등)은 구성요소가 단순하므로, 컴포넌트 특성에 맞게 “뒤따라올 옵션이 예측 가능한 구조”로 가이드 구성.[16]

### 7. 다이얼로그/바텀시트 같은 오버레이 컴포넌트: position 항목 추가
- 화면을 덮는 다이얼로그/바텀시트 같은 컴포넌트는 화면 내 위치 정의가 중요하므로, 체크리스트에 position 항목을 추가.[16]

### 8. 스펙 표기 방식(이미지 + 정확한 값) 고정
- 왼쪽에는 예시 이미지를, 오른쪽에는 정확한 값을 반드시 작성.
- 스펙 표기 형태를 복붙할 수 있게 템플릿화하여 효율화.[16]

### 9. 결과(생산성 변화)
- 규칙이 없을 때는 컴포넌트 가이드 1개 작성에 1주일이 걸리기도 했으나,
- 규칙이 생긴 이후에는 컴포넌트 3개를 하루 만에 작업할 수도 있었음.
- 새로 합류한 플랫폼 디자이너가 기존 시스템을 빠르게 이해하고 기여할 수 있게 됨.[16]

---

# 결론
이 가이드라인은 Toss 모바일 앱 디자인의 실무 표준이자, 실제 UI 설계·개발에서 반드시 따라야 할 헌법입니다.
모든 수치와 규칙은 공식 문서와 실무 사례를 기반으로 정리하였으며, 체크리스트와 컴포넌트별 기준을 통해 바로 적용할 수 있습니다.
Toss Design System(TDS) 공식 문서, 토스 브랜드 리소스, 실제 앱 UI에서 검증된 베스트 프랙티스를 기반으로 하였으니, 토스 모바일 앱 디자인의 기준서로 적극 활용하시기 바랍니다.

---
참고:
- Toss Design System 공식 문서
- Toss 브랜드 리소스 센터
- Toss Product Sans 공식 정보
- 실무 적용 사례 및 컴포넌트별 상세 문서[6][4][3][5][7][8][1][2][9][13]
