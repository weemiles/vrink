import type { Metadata } from "next";
import Image from "next/image";

import { VrinkFooter } from "@/components/layout/vrink-footer";
import { VrinkHeader } from "@/components/layout/vrink-header";
import { buildMetadata } from "@/lib/seo";
import { withBasePath } from "@/lib/static-export";

import styles from "../../ingredients/page.module.css";

export const metadata: Metadata = buildMetadata({
  title: "Ingredients",
  description:
    "Review VRINK's 5 functional shots, 9 key ingredients, ingredient roles, and representative research context.",
  locale: "en",
  path: "/en/ingredients",
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
    name: "Vitamin C",
    category: "Antioxidant vitamin",
    accent: "#f2b705",
    headline: "A water-soluble antioxidant vitamin that anchors everyday condition routines.",
    body:
      "Vitamin C is an essential nutrient that the body cannot synthesize on its own. It is linked to collagen synthesis, antioxidant defense, and iron absorption, and research continues around vitamin C transporters and oxidative stress in the brain and nervous system.",
    notes: ["Water-soluble vitamin", "Antioxidant defense", "Vitamin Shot line"],
    shot: "A natural fit for the bright, foundational nutrition image of the Vitamin Shot.",
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
    id: "vitamin-b",
    number: "02",
    name: "Vitamin B",
    category: "Water-soluble vitamin",
    accent: "#3182f6",
    headline: "A water-soluble vitamin group involved in energy metabolism, nervous-system function, and daily nutrition routines.",
    body:
      "Vitamin B refers to a group of related nutrients, including B1, B2, B3, B5, B6, B7, folate (B9), and B12. These vitamins act as coenzymes in carbohydrate, fat, and protein metabolism and are also discussed in relation to nervous-system function and cell maintenance, so VRINK frames them as foundational daily nutrition rather than a quick stimulant.",
    notes: ["Water-soluble vitamin", "Energy metabolism", "Daily nutrition routine"],
    shot: "Easy to understand alongside Vitamin C as part of the Vitamin Shot's foundational nutrition context.",
    sources: [
      {
        title: "B Vitamins and the Brain: Mechanisms, Dose and Efficacy--A Review",
        journal: "Nutrients, 2016",
        href: "https://pubmed.ncbi.nlm.nih.gov/26828517/",
      },
      {
        title: "Vitamins and Minerals for Energy, Fatigue and Cognition: A Narrative Review",
        journal: "Nutrients, 2020",
        href: "https://pubmed.ncbi.nlm.nih.gov/31963141/",
      },
    ],
  },
  {
    id: "l-arginine",
    number: "03",
    name: "L-Arginine",
    category: "Amino acid",
    accent: "#d7263d",
    headline: "An amino acid connected to nitric oxide synthesis and pre-workout energy routines.",
    body:
      "L-arginine is a building block of protein and a known substrate for nitric oxide synthesis. It has been studied in relation to endothelial function and exercise performance. VRINK presents it as part of a pre-workout ingredient context rather than as an exaggerated performance claim.",
    notes: ["NO precursor", "Pre-workout routine", "Booster Shot line"],
    shot: "Works with caffeine and taurine to shape the energetic choice experience of the Booster Shot.",
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
    name: "Taurine",
    category: "Amino-acid-like compound",
    accent: "#00a676",
    headline: "A broadly studied ingredient connected to neuronal excitability, osmoregulation, and cellular balance.",
    body:
      "Taurine is not a standard protein-building amino acid, but it is found across tissues such as the brain, muscles, and heart. While familiar from energy drinks, VRINK treats it as a refresh ingredient with a different profile from the sharper stimulation of caffeine.",
    notes: ["Refresh", "Neural balance research", "Used across several shots"],
    shot: "A supporting axis in different shot concepts such as Booster, Relax, and Amino.",
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
    name: "Essential Amino Acids",
    category: "Essential amino acids",
    accent: "#ef6c00",
    headline: "The nine amino acids the body cannot make sufficiently and needs from diet.",
    body:
      "Essential amino acids include histidine, isoleucine, leucine, lysine, methionine, phenylalanine, threonine, tryptophan, and valine. In exercise routines, they are a key ingredient group for understanding muscle protein synthesis alongside overall protein intake.",
    notes: ["9 EAA", "Before and after workouts", "Amino Shot line"],
    shot: "The core ingredient group that gives the Amino Shot its activity and recovery image.",
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
    name: "Green Tea Extract",
    category: "Botanical extract",
    accent: "#2f9e44",
    headline: "A plant-derived extract known for catechins and EGCG.",
    body:
      "Green tea extract has been studied around catechins, EGCG, antioxidant activity, energy metabolism, and fat oxidation. Weight-management outcomes can vary by person and study condition, so VRINK presents it as a light balance ingredient for everyday routines.",
    notes: ["Catechins", "EGCG", "Cutting Shot line"],
    shot: "Pairs with L-carnitine in the Cutting Shot to create a fresh balance image.",
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
    name: "Caffeine",
    category: "Stimulant ingredient",
    accent: "#7c3aed",
    headline: "One of the most studied ingredients for alertness and attention through adenosine receptor blockade.",
    body:
      "Caffeine is a representative stimulant found in coffee, tea, guarana, and similar sources. It has been widely studied for attention, reaction time, and vigilance from low to moderate doses, but individual sensitivity, sleep, and timing can strongly affect how it feels.",
    notes: ["Attention", "Reaction time", "Check intake timing"],
    shot: "Gives the Booster Shot its immediate energy image, while sensitive users should check total intake.",
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
    name: "L-Theanine",
    category: "Tea-derived amino acid",
    accent: "#0ca678",
    headline: "An amino acid found in green tea, often studied around calm focus and stress response.",
    body:
      "L-theanine is often studied with caffeine because it may soften the sharpness of stimulation. Standalone studies have also reported results around stress-related measures and some cognitive tasks, so VRINK presents it as a relaxed refresh ingredient.",
    notes: ["Calm focus", "Green tea derived", "Relax Shot line"],
    shot: "Works with taurine in the Relax Shot to create a balanced afternoon refresh image.",
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
    name: "L-Carnitine",
    category: "Exercise routine ingredient",
    accent: "#3182f6",
    headline: "An ingredient connected to the metabolic pathway that transports fatty acids into mitochondria.",
    body:
      "L-carnitine is known for its role in long-chain fatty acid transport, and clinical studies also discuss exercise-induced muscle damage markers and recovery perception. VRINK presents it as one part of a balanced routine with exercise, not as a standalone weight-loss ingredient.",
    notes: ["Fatty acid transport", "Post-workout routine", "Cutting Shot line"],
    shot: "Works with green tea extract in the Cutting Shot for a light management routine before and after exercise.",
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
    name: "Booster Shot",
    body: "Built with 55mg caffeine, L-arginine, and taurine for work and pre-workout routines.",
    image: "/images/vrink/shots/booster-shot.png",
  },
  {
    name: "Relax Shot",
    body: "Built with L-theanine and taurine for an easy afternoon refresh routine.",
    image: "/images/vrink/shots/relax-shot.png",
  },
  {
    name: "Cutting Shot",
    body: "Connects green tea extract and L-carnitine to a light care routine with exercise.",
    image: "/images/vrink/shots/cutting-shot.png",
  },
  {
    name: "Amino Shot",
    body: "Uses 9 essential amino acids and taurine for an easy before-and-after workout choice.",
    image: "/images/vrink/shots/amino-shot.png",
  },
  {
    name: "Vitamin Shot",
    body: "Uses familiar nutrients like vitamin C and vitamin B for an everyday base routine.",
    image: "/images/vrink/shots/vitamin-shot.png",
  },
];

const allSources = ingredients.flatMap((ingredient) =>
  ingredient.sources.map((source) => ({
    ...source,
    ingredient: ingredient.name,
  })),
);

export default function EnglishIngredientsPage() {
  return (
    <main className={styles.page}>
      <VrinkHeader locale="en" />

      <section className={styles.hero}>
        <video className={styles.heroVideo} autoPlay muted loop playsInline preload="metadata" aria-hidden="true">
          <source src={withBasePath("/videos/vrink/expert-review-background-0428.mp4")} type="video/mp4" />
        </video>
        <div className={styles.heroOverlay} aria-hidden="true" />
        <div className={styles.heroInner}>
          <h1>See the key ingredients behind 5 functional shots.</h1>
          <p>
            Start with each shot&apos;s purpose, then review 9 ingredient roles and representative research.
          </p>
          <div className={styles.heroActions}>
            <a href="#shot-pairing" className={styles.primaryButton}>
              View 5 shots
            </a>
            <a href="#ingredient-list" className={styles.secondaryButton}>
              View 9 ingredients
            </a>
          </div>
        </div>
      </section>

      <section id="shot-pairing" className={styles.shotSection} aria-labelledby="shot-title">
        <div className={styles.sectionHeader}>
          <p>Functional shot structure</p>
          <h2 id="shot-title">Start with the 5 shots people choose from.</h2>
          <span>Ingredients are grouped around the situations users see on the station.</span>
        </div>

        <div className={styles.shotGrid}>
          {shotPairings.map((shot) => (
            <article className={styles.shotCard} key={shot.name}>
              <div className={styles.shotImage}>
                <Image src={withBasePath(shot.image)} alt={`${shot.name} image`} width={96} height={116} />
              </div>
              <h3>{shot.name}</h3>
              <p>{shot.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="ingredient-list" className={styles.ingredientsSection} aria-labelledby="ingredients-title">
        <div className={styles.sectionHeader}>
          <p>Ingredient lineup</p>
          <h2 id="ingredients-title">Review 9 key ingredients in plain language.</h2>
          <span>Exact formulas and amounts should be checked against product labels and installation materials.</span>
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
              <strong>{ingredient.category}</strong>
              <p className={styles.ingredientHeadline}>{ingredient.headline}</p>
              <p className={styles.ingredientBody}>{ingredient.body}</p>

              <ul className={styles.noteList} aria-label={`${ingredient.name} key notes`}>
                {ingredient.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>

              <div className={styles.shotNote}>
                <span>VRINK context</span>
                <p>{ingredient.shot}</p>
              </div>

              <details className={styles.sourceDetails}>
                <summary>Representative research</summary>
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
          <h2 id="references-title">Key papers referenced for this page</h2>
          <span>
            These links are provided to explain the general research context of each ingredient. They do not imply
            that the product prevents or treats disease.
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

      <VrinkFooter ctaHref="/en#contact" locale="en" />
    </main>
  );
}
