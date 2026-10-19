import type {
  Allergen,
  Amount,
  IngredientTag,
  LabelExtraction,
  Tone,
} from "@/lib/analysis/schema";
import type { Locale } from "@/lib/i18n/config";

export const EXAMPLE_IDS = ["cereal", "chocolate", "juice", "biscuits"] as const;
export type ExampleId = (typeof EXAMPLE_IDS)[number];

const a = (per100: number | null, perServing: number | null = null): Amount => ({
  per100,
  perServing,
});

interface ExampleIngredient {
  name: string;
  eNumber?: string;
  tags: IngredientTag[];
  tone: Tone;
  explanation: Record<Locale, string>;
}

interface ExampleCopy {
  serving: string;
  summary: string;
  benefits: string[];
  risks: string[];
  whoShouldSkip: string[];
  healthierSwaps: string[];
}

interface Example {
  productName: string;
  isDrink: boolean;
  servingGrams: number;
  nutrition: LabelExtraction["nutrition"];
  ingredients: ExampleIngredient[];
  allergens: Allergen[];
  mayContain: Allergen[];
  copy: Record<Locale, ExampleCopy>;
}

/** Demo labels so the app can be explored without an API key. Fictional products. */
const EXAMPLES: Record<ExampleId, Example> = {
  cereal: {
    productName: "Choco Crunch Cereal",
    isDrink: false,
    servingGrams: 30,
    nutrition: {
      energyKcal: a(500, 150),
      sugarG: a(40, 12),
      fatG: a(13.3, 4),
      saturatedFatG: a(5, 1.5),
      transFatG: a(0, 0),
      saltG: a(1.3, 0.4),
      sodiumMg: a(null),
      fibreG: a(10, 3),
      proteinG: a(8, 2.4),
    },
    ingredients: [
      {
        name: "Whole grain oats",
        tags: ["whole_food"],
        tone: "good",
        explanation: {
          en: "Gives you slow, steady energy.",
          hi: "धीरे-धीरे और लंबे समय तक ऊर्जा देता है।",
        },
      },
      {
        name: "Sugar",
        tags: ["sugar"],
        tone: "avoid",
        explanation: {
          en: "Too much can hurt your teeth and tummy.",
          hi: "ज़्यादा चीनी दाँतों और पेट के लिए नुकसानदेह है।",
        },
      },
      {
        name: "Palm oil",
        tags: ["fat"],
        tone: "moderate",
        explanation: { en: "A kind of fat. OK in small amounts.", hi: "एक तरह का फ़ैट। थोड़ी मात्रा में ठीक है।" },
      },
      {
        name: "Cocoa powder",
        tags: [],
        tone: "moderate",
        explanation: { en: "Gives the chocolate taste.", hi: "चॉकलेट का स्वाद देता है।" },
      },
      {
        name: "Colour E102",
        eNumber: "E102",
        tags: ["additive"],
        tone: "avoid",
        explanation: {
          en: "Added to make food look bright. Some kids react to it.",
          hi: "खाने को चमकीला दिखाने के लिए डाला जाता है। कुछ बच्चों पर इसका असर होता है।",
        },
      },
      {
        name: "Milk powder",
        tags: ["allergen"],
        tone: "moderate",
        explanation: {
          en: "Contains milk. Not safe if you are allergic to milk.",
          hi: "इसमें दूध है। दूध से एलर्जी हो तो सुरक्षित नहीं।",
        },
      },
      {
        name: "Salt",
        tags: ["salt"],
        tone: "moderate",
        explanation: { en: "A little is fine; too much is bad for your heart.", hi: "थोड़ा ठीक है; ज़्यादा नमक दिल के लिए बुरा है।" },
      },
    ],
    allergens: ["milk"],
    mayContain: ["gluten"],
    copy: {
      en: {
        serving: "1 small bowl (30 g)",
        summary: "A tasty cereal with good fibre from oats, but it has a lot of sugar and an added colour.",
        benefits: ["Whole grain oats give fibre and steady energy."],
        risks: ["High in sugar.", "Contains the colour E102."],
        whoShouldSkip: [
          "People with a milk allergy",
          "Anyone told to eat less sugar",
          "Very young children (under 3)",
        ],
        healthierSwaps: ["Plain oats with fruit", "Banana and yoghurt", "Whole-grain flakes"],
      },
      hi: {
        serving: "1 छोटा कटोरा (30 ग्राम)",
        summary: "ओट्स से अच्छा फ़ाइबर मिलता है, लेकिन इसमें बहुत चीनी और एक रंग मिलाया गया है।",
        benefits: ["साबुत ओट्स से फ़ाइबर और लगातार ऊर्जा मिलती है।"],
        risks: ["चीनी बहुत ज़्यादा है।", "इसमें E102 रंग है।"],
        whoShouldSkip: [
          "जिन्हें दूध से एलर्जी है",
          "जिन्हें कम चीनी खाने को कहा गया है",
          "बहुत छोटे बच्चे (3 साल से कम)",
        ],
        healthierSwaps: ["फल के साथ सादे ओट्स", "केला और दही", "साबुत अनाज के फ़्लेक्स"],
      },
    },
  },

  chocolate: {
    productName: "Choco Bar",
    isDrink: false,
    servingGrams: 25,
    nutrition: {
      energyKcal: a(540, 135),
      sugarG: a(56, 14),
      fatG: a(31, 7.8),
      saturatedFatG: a(18, 4.5),
      transFatG: a(null),
      saltG: a(0.25, 0.06),
      sodiumMg: a(null),
      fibreG: a(2, 0.5),
      proteinG: a(7, 1.8),
    },
    ingredients: [
      {
        name: "Sugar",
        tags: ["sugar"],
        tone: "avoid",
        explanation: {
          en: "The biggest ingredient. Lots of sugar in every bite.",
          hi: "सबसे ज़्यादा यही है। हर टुकड़े में बहुत चीनी।",
        },
      },
      {
        name: "Cocoa butter",
        tags: ["fat"],
        tone: "moderate",
        explanation: { en: "The fat from cocoa beans that makes it melt.", hi: "कोको बीन्स का फ़ैट, जिससे चॉकलेट पिघलती है।" },
      },
      {
        name: "Whole milk powder",
        tags: ["allergen"],
        tone: "moderate",
        explanation: { en: "Contains milk.", hi: "इसमें दूध है।" },
      },
      {
        name: "Cocoa mass",
        tags: [],
        tone: "moderate",
        explanation: { en: "Ground cocoa beans for the chocolate taste.", hi: "चॉकलेट के स्वाद के लिए पिसे कोको बीन्स।" },
      },
      {
        name: "Soy lecithin",
        eNumber: "E322",
        tags: ["additive", "allergen"],
        tone: "moderate",
        explanation: { en: "Helps mix fat and cocoa. Comes from soy.", hi: "फ़ैट और कोको को मिलाता है। सोया से बनता है।" },
      },
      {
        name: "Flavouring",
        tags: ["additive"],
        tone: "moderate",
        explanation: { en: "Added for taste.", hi: "स्वाद के लिए डाला जाता है।" },
      },
    ],
    allergens: ["milk", "soy"],
    mayContain: ["peanuts", "tree_nuts"],
    copy: {
      en: {
        serving: "4 pieces (25 g)",
        summary: "A sweet treat that is mostly sugar and fat. Best kept for special days.",
        benefits: ["Small pieces make it easy to have just a little."],
        risks: ["Very high in sugar.", "High in saturated fat."],
        whoShouldSkip: [
          "People with a milk or soy allergy",
          "People with a nut allergy (may contain nuts)",
          "Anyone told to eat less sugar",
        ],
        healthierSwaps: ["A few squares of dark chocolate", "Dates or dried figs", "Fresh fruit"],
      },
      hi: {
        serving: "4 टुकड़े (25 ग्राम)",
        summary: "एक मीठा ट्रीट जिसमें ज़्यादातर चीनी और फ़ैट है। ख़ास दिनों के लिए रखें।",
        benefits: ["छोटे टुकड़ों से थोड़ा-सा खाना आसान है।"],
        risks: ["चीनी बहुत ज़्यादा है।", "सैचुरेटेड फ़ैट ज़्यादा है।"],
        whoShouldSkip: [
          "जिन्हें दूध या सोया से एलर्जी है",
          "जिन्हें मेवों से एलर्जी है (मेवे हो सकते हैं)",
          "जिन्हें कम चीनी खाने को कहा गया है",
        ],
        healthierSwaps: ["डार्क चॉकलेट के कुछ टुकड़े", "खजूर या सूखे अंजीर", "ताज़े फल"],
      },
    },
  },

  juice: {
    productName: "Orange Juice Drink",
    isDrink: true,
    servingGrams: 200,
    nutrition: {
      energyKcal: a(48, 96),
      sugarG: a(11.5, 23),
      fatG: a(0, 0),
      saturatedFatG: a(0, 0),
      transFatG: a(null),
      saltG: a(0.01, 0.02),
      sodiumMg: a(null),
      fibreG: a(0.2, 0.4),
      proteinG: a(0.5, 1),
    },
    ingredients: [
      {
        name: "Water",
        tags: [],
        tone: "good",
        explanation: { en: "Just water.", hi: "सिर्फ़ पानी।" },
      },
      {
        name: "Orange juice from concentrate (12%)",
        tags: [],
        tone: "moderate",
        explanation: {
          en: "Only a small part of this drink is real juice.",
          hi: "इस ड्रिंक का बहुत छोटा हिस्सा ही असली जूस है।",
        },
      },
      {
        name: "Sugar",
        tags: ["sugar"],
        tone: "avoid",
        explanation: { en: "Added sugar on top of the fruit sugar.", hi: "फल की चीनी के ऊपर से डाली गई चीनी।" },
      },
      {
        name: "Acid (citric acid)",
        eNumber: "E330",
        tags: ["additive"],
        tone: "moderate",
        explanation: { en: "Makes it taste sour and fresh. Generally safe.", hi: "खट्टा और ताज़ा स्वाद देता है। आम तौर पर सुरक्षित।" },
      },
      {
        name: "Colour (sunset yellow)",
        eNumber: "E110",
        tags: ["additive"],
        tone: "avoid",
        explanation: {
          en: "Makes the drink look more orange. Some kids react to it.",
          hi: "ड्रिंक को ज़्यादा नारंगी दिखाता है। कुछ बच्चों पर इसका असर होता है।",
        },
      },
    ],
    allergens: [],
    mayContain: [],
    copy: {
      en: {
        serving: "1 glass (200 ml)",
        summary: "Mostly water and sugar with a little juice. One glass has about 6 teaspoons of sugar.",
        benefits: ["No fat and no allergens listed."],
        risks: ["High in sugar for a drink.", "Contains the colour E110."],
        whoShouldSkip: ["Anyone told to eat less sugar", "Children sensitive to food colours"],
        healthierSwaps: ["A whole orange", "Water with orange slices", "100% juice, a small glass"],
      },
      hi: {
        serving: "1 गिलास (200 मिली)",
        summary: "ज़्यादातर पानी और चीनी, थोड़ा-सा जूस। एक गिलास में लगभग 6 छोटे चम्मच चीनी है।",
        benefits: ["इसमें फ़ैट और कोई एलर्जेन नहीं लिखा है।"],
        risks: ["ड्रिंक के हिसाब से चीनी ज़्यादा है।", "इसमें E110 रंग है।"],
        whoShouldSkip: ["जिन्हें कम चीनी खाने को कहा गया है", "जिन बच्चों पर खाने के रंगों का असर होता है"],
        healthierSwaps: ["एक पूरा संतरा", "संतरे के टुकड़ों वाला पानी", "100% जूस, एक छोटा गिलास"],
      },
    },
  },

  biscuits: {
    productName: "Oat Biscuits",
    isDrink: false,
    servingGrams: 25,
    nutrition: {
      energyKcal: a(470, 118),
      sugarG: a(18, 4.5),
      fatG: a(20, 5),
      saturatedFatG: a(9, 2.3),
      transFatG: a(0, 0),
      saltG: a(0.8, 0.2),
      sodiumMg: a(null),
      fibreG: a(6.5, 1.6),
      proteinG: a(7, 1.8),
    },
    ingredients: [
      {
        name: "Whole grain oat flour",
        tags: ["whole_food"],
        tone: "good",
        explanation: { en: "Whole grains with fibre that keeps you full.", hi: "साबुत अनाज, जिसका फ़ाइबर पेट भरा रखता है।" },
      },
      {
        name: "Wheat flour",
        tags: ["allergen"],
        tone: "moderate",
        explanation: { en: "Contains gluten.", hi: "इसमें ग्लूटेन है।" },
      },
      {
        name: "Palm oil",
        tags: ["fat"],
        tone: "moderate",
        explanation: { en: "A kind of fat. OK in small amounts.", hi: "एक तरह का फ़ैट। थोड़ी मात्रा में ठीक है।" },
      },
      {
        name: "Sugar",
        tags: ["sugar"],
        tone: "avoid",
        explanation: { en: "Makes it sweet. Keep it small.", hi: "मीठा बनाती है। कम ही रखें।" },
      },
      {
        name: "Golden syrup",
        tags: ["sugar"],
        tone: "moderate",
        explanation: { en: "Another kind of sugar.", hi: "चीनी का ही एक और रूप।" },
      },
      {
        name: "Raising agent (sodium bicarbonate)",
        eNumber: "E500",
        tags: ["additive"],
        tone: "moderate",
        explanation: { en: "Baking soda that makes biscuits light. Safe.", hi: "बेकिंग सोडा जो बिस्किट को हल्का बनाता है। सुरक्षित।" },
      },
      {
        name: "Salt",
        tags: ["salt"],
        tone: "moderate",
        explanation: { en: "A little is fine; too much is bad for your heart.", hi: "थोड़ा ठीक है; ज़्यादा नमक दिल के लिए बुरा है।" },
      },
    ],
    allergens: ["gluten"],
    mayContain: ["milk"],
    copy: {
      en: {
        serving: "2 biscuits (25 g)",
        summary: "Oat biscuits with plenty of fibre, but also quite a lot of fat and some sugar.",
        benefits: ["High in fibre from whole grain oats."],
        risks: ["High in saturated fat.", "Medium sugar and salt."],
        whoShouldSkip: ["People with coeliac disease or a gluten allergy", "People with a milk allergy (may contain milk)"],
        healthierSwaps: ["Plain oatcakes", "Roasted chana", "An apple with peanut butter"],
      },
      hi: {
        serving: "2 बिस्किट (25 ग्राम)",
        summary: "ओट्स के बिस्किट जिनमें भरपूर फ़ाइबर है, पर फ़ैट काफ़ी और थोड़ी चीनी भी है।",
        benefits: ["साबुत ओट्स से फ़ाइबर ज़्यादा है।"],
        risks: ["सैचुरेटेड फ़ैट ज़्यादा है।", "चीनी और नमक मध्यम हैं।"],
        whoShouldSkip: ["जिन्हें सीलिएक रोग या ग्लूटेन से एलर्जी है", "जिन्हें दूध से एलर्जी है (दूध हो सकता है)"],
        healthierSwaps: ["सादे ओटकेक", "भुना चना", "पीनट बटर के साथ सेब"],
      },
    },
  },
};

export function buildExample(id: ExampleId, locale: Locale): LabelExtraction {
  const example = EXAMPLES[id];
  const copy = example.copy[locale];
  return {
    isFoodLabel: true,
    productName: example.productName,
    isDrink: example.isDrink,
    servingSize: { description: copy.serving, grams: example.servingGrams },
    nutrition: example.nutrition,
    ingredients: example.ingredients.map((ingredient) => ({
      name: ingredient.name,
      eNumber: ingredient.eNumber ?? null,
      tags: ingredient.tags,
      tone: ingredient.tone,
      explanation: ingredient.explanation[locale],
    })),
    allergens: example.allergens,
    mayContain: example.mayContain,
    summary: copy.summary,
    benefits: copy.benefits,
    risks: copy.risks,
    whoShouldSkip: copy.whoShouldSkip,
    healthierSwaps: copy.healthierSwaps,
  };
}
