import type { Metadata } from "next";
import Image from "next/image";

import { VrinkFooter } from "@/components/layout/vrink-footer";
import { VrinkHeader } from "@/components/layout/vrink-header";
import { buildMetadata } from "@/lib/seo";
import { withBasePath } from "@/lib/static-export";

import styles from "./page.module.css";

export const metadata: Metadata = buildMetadata({
  title: "원료소개",
  description:
    "브링크 기능샷과 원료 라인업에 활용되는 비타민, 아미노산, 카페인, 녹차추출물 등 주요 성분의 역할과 연구 근거를 소개합니다.",
  path: "/ingredients",
});

type Source = {
  title: string;
  journal: string;
  href: string;
};

type Ingredient = {
  id: string;
  number: string;
  name: string;
  englishName: string;
  category: string;
  accent: string;
  headline: string;
  body: string;
  notes: string[];
  shot: string;
  sources: Source[];
};

const ingredients: Ingredient[] = [
  {
    id: "vitamin-c",
    number: "01",
    name: "비타민C",
    englishName: "Vitamin C",
    category: "항산화 비타민",
    accent: "#f2b705",
    headline: "수용성 항산화 비타민으로 데일리 컨디션 루틴의 기본이 되는 원료입니다.",
    body:
      "비타민C는 체내에서 합성되지 않아 식이로 섭취해야 하는 영양소입니다. 콜라겐 합성, 항산화 방어, 철 흡수와 관련되어 있으며, 뇌와 신경 조직에서도 비타민C 운반체와 산화 스트레스 조절 연구가 이어져 왔습니다.",
    notes: ["수용성 비타민", "항산화 방어", "비타민샷 계열"],
    shot: "비타민샷의 산뜻한 기초 영양 이미지와 잘 맞는 원료입니다.",
    sources: [
      {
        title: "Vitamin C function in the brain: vital role of the ascorbate transporter SVCT2",
        journal: "Free Radical Biology and Medicine, 2009",
        href: "https://www.sciencedirect.com/science/article/pii/S0891584909000021",
      },
      {
        title: "Vitamin C transport and its role in the central nervous system",
        journal: "Sub-cellular Biochemistry, 2012",
        href: "https://pubmed.ncbi.nlm.nih.gov/22116696/",
      },
    ],
  },
  {
    id: "vitamin-d",
    number: "02",
    name: "비타민D",
    englishName: "Vitamin D",
    category: "지용성 비타민",
    accent: "#f59f00",
    headline: "칼슘과 인 대사, 근골격 건강을 중심으로 연구되는 지용성 비타민입니다.",
    body:
      "비타민D는 햇빛 노출, 식사, 보충 섭취에 따라 혈중 상태가 달라지는 영양소입니다. 특히 실내 생활이 많은 사용자에게는 혈중 25(OH)D 상태 확인과 함께 관리하는 접근이 권장됩니다.",
    notes: ["지용성 비타민", "근골격 건강", "실내 생활 루틴"],
    shot: "기초 영양 라인의 설명에서 비타민C와 함께 묶어 이해하기 좋습니다.",
    sources: [
      {
        title: "Vitamin D: Musculoskeletal health",
        journal: "Reviews in Endocrine and Metabolic Disorders, 2017",
        href: "https://pubmed.ncbi.nlm.nih.gov/28032296/",
      },
      {
        title: "Effect of vitamin D supplementation on muscle strength: a systematic review and meta-analysis",
        journal: "Osteoporosis International, 2011",
        href: "https://pubmed.ncbi.nlm.nih.gov/20924748/",
      },
    ],
  },
  {
    id: "l-arginine",
    number: "03",
    name: "L-아르기닌",
    englishName: "L-Arginine",
    category: "아미노산",
    accent: "#d7263d",
    headline: "산화질소 합성 경로와 연결되어 운동 전 활력 루틴에서 자주 쓰이는 아미노산입니다.",
    body:
      "L-아르기닌은 단백질 구성 성분이면서 산화질소(NO) 합성의 기질로 알려져 있습니다. 혈관 내피 기능과 운동 수행 관련 연구가 있으며, 브링크에서는 과장된 퍼포먼스 표현보다 운동 전 루틴의 원료 맥락으로 소개합니다.",
    notes: ["NO 전구체", "운동 전 루틴", "부스터샷 계열"],
    shot: "부스터샷에서 카페인, 타우린과 함께 활력 있는 선택 경험을 만듭니다.",
    sources: [
      {
        title: "The pharmacodynamics of L-arginine",
        journal: "Alternative Therapies in Health and Medicine, 2014",
        href: "https://pubmed.ncbi.nlm.nih.gov/24755570/",
      },
      {
        title: "Effects of Arginine Supplementation on Athletic Performance Based on Energy Metabolism",
        journal: "Nutrients, 2020",
        href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7282262/",
      },
    ],
  },
  {
    id: "taurine",
    number: "04",
    name: "타우린",
    englishName: "Taurine",
    category: "아미노산 유사물질",
    accent: "#00a676",
    headline: "신경 흥분성, 삼투 조절, 세포 내 균형과 관련해 폭넓게 연구된 원료입니다.",
    body:
      "타우린은 단백질을 만드는 표준 아미노산은 아니지만 뇌, 근육, 심장 등 여러 조직에 존재합니다. 에너지 드링크에서 익숙한 원료이지만, 브링크에서는 카페인의 강한 각성감과 다른 결의 리프레시 원료로 다룹니다.",
    notes: ["리프레시", "신경 균형 연구", "여러 샷에 연결"],
    shot: "부스터샷, 릴렉스샷, 아미노샷처럼 서로 다른 목적의 샷에서 보조 축을 맡습니다.",
    sources: [
      {
        title: "Effects of Taurine Supplementation on Neuronal Excitability and Glucose Homeostasis",
        journal: "Advances in Experimental Medicine and Biology, 2017",
        href: "https://pubmed.ncbi.nlm.nih.gov/28849462/",
      },
      {
        title: "Taurine as a Modulator of Excitatory and Inhibitory Neurotransmission",
        journal: "Neurochemical Research, 2004",
        href: "https://doi.org/10.1023/B:NERE.0000010448.17740.6E",
      },
    ],
  },
  {
    id: "essential-amino-acids",
    number: "05",
    name: "아미노산 9종",
    englishName: "Essential Amino Acids",
    category: "필수아미노산",
    accent: "#ef6c00",
    headline: "체내 합성이 충분하지 않아 식이 섭취가 필요한 9가지 필수아미노산을 뜻합니다.",
    body:
      "필수아미노산은 히스티딘, 이소류신, 류신, 라이신, 메티오닌, 페닐알라닌, 트레오닌, 트립토판, 발린을 말합니다. 운동 전후 루틴에서는 단백질 섭취와 함께 근육 단백질 합성 반응을 이해하는 핵심 원료군입니다.",
    notes: ["9 EAA", "운동 전후", "아미노샷 계열"],
    shot: "아미노샷에서 활동 후 루틴과 회복 이미지를 만드는 중심 원료군입니다.",
    sources: [
      {
        title: "Essential Amino Acids and Protein Synthesis",
        journal: "Advances in Nutrition, 2020",
        href: "https://pubmed.ncbi.nlm.nih.gov/33276485/",
      },
      {
        title: "Isolated branched-chain amino acid intake and muscle protein synthesis in humans",
        journal: "Frontiers in Physiology, 2017",
        href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6718193/",
      },
    ],
  },
  {
    id: "green-tea-extract",
    number: "06",
    name: "녹차추출물",
    englishName: "Green Tea Extract",
    category: "식물성 추출물",
    accent: "#2f9e44",
    headline: "카테킨과 EGCG로 알려진 녹차 유래 식물성 추출물입니다.",
    body:
      "녹차추출물은 카테킨류와 EGCG를 중심으로 항산화, 에너지 대사, 지방 산화 관련 연구가 이어져 왔습니다. 다만 체중 관리 효과는 개인과 연구 조건에 따라 차이가 있어, 브링크에서는 일상 속 가벼운 밸런스 원료로 소개합니다.",
    notes: ["카테킨", "EGCG", "커팅샷 계열"],
    shot: "커팅샷에서 L-카르니틴과 함께 산뜻한 밸런스 이미지를 만듭니다.",
    sources: [
      {
        title: "Physiological effects of EGCG on energy expenditure for prospective fat oxidation in humans",
        journal: "Journal of Nutritional Biochemistry, 2017",
        href: "https://pubmed.ncbi.nlm.nih.gov/27883924/",
      },
      {
        title: "Green tea for weight loss and weight maintenance in overweight or obese adults",
        journal: "Cochrane Database of Systematic Reviews, 2012",
        href: "https://pubmed.ncbi.nlm.nih.gov/23235664/",
      },
    ],
  },
  {
    id: "caffeine",
    number: "07",
    name: "카페인",
    englishName: "Caffeine",
    category: "각성 원료",
    accent: "#7c3aed",
    headline: "아데노신 수용체 차단을 통해 각성감과 주의력 영역에서 가장 많이 연구된 원료 중 하나입니다.",
    body:
      "카페인은 커피, 차, 과라나 등에 존재하는 대표적인 각성 성분입니다. 낮은 용량부터 중등도 용량까지 주의, 반응시간, 경계 유지와 관련한 연구가 많지만 개인 민감도, 수면, 섭취 시간에 따라 체감이 크게 달라집니다.",
    notes: ["주의력", "반응시간", "섭취 시간 확인"],
    shot: "부스터샷의 즉각적인 활력 이미지를 담당하되, 민감한 사용자는 섭취량을 확인해야 합니다.",
    sources: [
      {
        title: "A review of caffeine's effects on cognitive, physical and occupational performance",
        journal: "Neuroscience and Biobehavioral Reviews, 2016",
        href: "https://pubmed.ncbi.nlm.nih.gov/27612937/",
      },
    ],
  },
  {
    id: "l-theanine",
    number: "08",
    name: "L-테아닌",
    englishName: "L-Theanine",
    category: "차 유래 아미노산",
    accent: "#0ca678",
    headline: "녹차에 존재하는 아미노산으로, 차분한 집중감과 스트레스 반응 연구가 많은 원료입니다.",
    body:
      "L-테아닌은 카페인과 함께 쓰일 때 각성감의 날카로움을 부드럽게 만드는 조합으로 자주 연구됩니다. 단독 섭취 연구에서도 스트레스 관련 지표와 일부 인지 과제에 대한 결과가 보고되어, 브링크에서는 릴렉스한 리프레시 원료로 소개합니다.",
    notes: ["차분한 집중", "녹차 유래", "릴렉스샷 계열"],
    shot: "릴렉스샷에서 타우린과 함께 오후의 균형 잡힌 리프레시 이미지를 만듭니다.",
    sources: [
      {
        title: "Effects of L-Theanine Administration on Stress-Related Symptoms and Cognitive Functions in Healthy Adults",
        journal: "Nutrients, 2019",
        href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6836118/",
      },
      {
        title: "Effects of l-theanine on attention and reaction time response",
        journal: "Journal of Functional Foods, 2011",
        href: "https://www.sciencedirect.com/science/article/abs/pii/S1756464611000375",
      },
    ],
  },
  {
    id: "l-carnitine",
    number: "09",
    name: "L-카르니틴",
    englishName: "L-Carnitine",
    category: "운동 루틴 원료",
    accent: "#008ed6",
    headline: "지방산을 미토콘드리아로 운반하는 대사 경로와 연결된 원료입니다.",
    body:
      "L-카르니틴은 긴사슬 지방산 운반 과정에 관여하는 물질로 알려져 있으며, 운동 후 근육 손상 지표와 회복감에 대한 임상 연구도 있습니다. 브링크에서는 단독 감량 원료가 아니라 운동과 함께하는 밸런스 루틴의 일부로 소개합니다.",
    notes: ["지방산 운반", "운동 후 루틴", "커팅샷 계열"],
    shot: "커팅샷에서 녹차추출물과 함께 운동 전후의 가벼운 관리 이미지를 만듭니다.",
    sources: [
      {
        title: "The Effect of L-Carnitine Supplementation on Exercise-Induced Muscle Damage",
        journal: "Journal of the American College of Nutrition, 2020",
        href: "https://pubmed.ncbi.nlm.nih.gov/32154768/",
      },
      {
        title: "Effect of Acute and Chronic Oral L-Carnitine Supplementation on Exercise Performance",
        journal: "Nutrients, 2021",
        href: "https://pubmed.ncbi.nlm.nih.gov/34959912/",
      },
    ],
  },
];

const shotPairings = [
  {
    name: "부스터샷",
    body: "카페인, L-아르기닌, 타우린을 중심으로 업무와 운동 전 활력 루틴을 제안합니다.",
    image: "/images/vrink/shots/booster-shot.png",
    accent: "#b80f28",
  },
  {
    name: "릴렉스샷",
    body: "L-테아닌과 타우린을 중심으로 차분한 리프레시 경험을 만듭니다.",
    image: "/images/vrink/shots/relax-shot.png",
    accent: "#009f7d",
  },
  {
    name: "커팅샷",
    body: "녹차추출물과 L-카르니틴을 산뜻한 밸런스 루틴으로 연결합니다.",
    image: "/images/vrink/shots/cutting-shot.png",
    accent: "#008ed6",
  },
  {
    name: "아미노샷",
    body: "필수아미노산 9종과 타우린으로 운동 전후 루틴을 이해하기 쉽게 제안합니다.",
    image: "/images/vrink/shots/amino-shot.png",
    accent: "#ed6c1b",
  },
  {
    name: "비타민샷",
    body: "비타민C와 비타민D처럼 데일리 컨디션 관리에 익숙한 영양소를 소개합니다.",
    image: "/images/vrink/shots/vitamin-shot.png",
    accent: "#e2bd00",
  },
];

const allSources = ingredients.flatMap((ingredient) =>
  ingredient.sources.map((source) => ({
    ...source,
    ingredient: ingredient.name,
  })),
);

export default function IngredientsPage() {
  return (
    <main className={styles.page}>
      <VrinkHeader />

      <section className={styles.hero}>
        <video className={styles.heroVideo} autoPlay muted loop playsInline preload="metadata" aria-hidden="true">
          <source src={withBasePath("/videos/vrink/ingredients-hero.mp4")} type="video/mp4" />
        </video>
        <div className={styles.heroOverlay} aria-hidden="true" />
        <div className={styles.heroInner}>
          <h1>기능샷을 이루는 원료를 한눈에 이해할 수 있도록 정리했습니다.</h1>
          <p>
            먼저 샷의 목적을 보고, 그 다음 각 원료의 역할과 연구 맥락을 확인할 수 있게 구성했습니다.
          </p>
          <div className={styles.heroActions}>
            <a href="#shot-pairing" className={styles.primaryButton}>
              기능샷 구성 보기
            </a>
            <a href="#ingredient-list" className={styles.secondaryButton}>
              원료 목록 보기
            </a>
          </div>
        </div>
      </section>

      <section id="shot-pairing" className={styles.shotSection} aria-labelledby="shot-title">
        <div className={styles.sectionHeader}>
          <p>기능샷 구성</p>
          <h2 id="shot-title">원료보다 먼저, 어떤 샷인지 보이게 정리했습니다.</h2>
          <span>사용자가 고르는 상황에 맞춰 원료군을 묶어 보여주는 방식입니다.</span>
        </div>

        <div className={styles.shotGrid}>
          {shotPairings.map((shot) => (
            <article className={styles.shotCard} key={shot.name}>
              <div className={styles.shotImage}>
                <Image src={withBasePath(shot.image)} alt={`${shot.name} 이미지`} width={96} height={116} />
              </div>
              <h3>{shot.name}</h3>
              <p>{shot.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="ingredient-list" className={styles.ingredientsSection} aria-labelledby="ingredients-title">
        <div className={styles.sectionHeader}>
          <p>원료 라인업</p>
          <h2 id="ingredients-title">브링크 원료 라인업</h2>
          <span>실제 제품별 배합과 함량은 표시사항 및 도입 안내 자료 기준으로 확인할 수 있습니다.</span>
        </div>

        <div className={styles.ingredientGrid}>
          {ingredients.map((ingredient) => (
              <article
                className={styles.ingredientCard}
                id={ingredient.id}
                key={ingredient.id}
              >
                <div className={styles.ingredientMeta}>
                  <span>{ingredient.number}</span>
                  <span>{ingredient.category}</span>
                </div>
                <h3>{ingredient.name}</h3>
                <strong>{ingredient.englishName}</strong>
                <p className={styles.ingredientHeadline}>{ingredient.headline}</p>
                <p className={styles.ingredientBody}>{ingredient.body}</p>

                <ul className={styles.noteList} aria-label={`${ingredient.name} 핵심 노트`}>
                  {ingredient.notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>

                <div className={styles.shotNote}>
                  <span>브링크 맥락</span>
                  <p>{ingredient.shot}</p>
                </div>

                <details className={styles.sourceDetails}>
                  <summary>대표 연구 자료</summary>
                  <div className={styles.sourceList}>
                    {ingredient.sources.map((source) => (
                      <a href={source.href} key={source.href} rel="noreferrer" target="_blank">
                        <span>{source.title}</span>
                        <small>{source.journal}</small>
                      </a>
                    ))}
                  </div>
                </details>
              </article>
          ))}
        </div>
      </section>

      <section className={styles.referencesSection} aria-labelledby="references-title">
        <div className={styles.referencesHeader}>
          <p>References</p>
          <h2 id="references-title">페이지 작성에 참고한 주요 논문</h2>
          <span>
            논문 링크는 원료의 일반적 연구 맥락을 안내하기 위한 자료이며, 제품의 질병 예방 또는 치료 효과를
            의미하지 않습니다.
          </span>
        </div>
        <ol className={styles.referenceList}>
          {allSources.map((source) => (
            <li key={`${source.ingredient}-${source.href}`}>
              <span>{source.ingredient}</span>
              <a href={source.href} rel="noreferrer" target="_blank">
                {source.title}
              </a>
              <small>{source.journal}</small>
            </li>
          ))}
        </ol>
      </section>

      <VrinkFooter ctaHref="/#contact" />
    </main>
  );
}
