import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const crops = [
  ["wheat", "गेहूं"],
  ["rice", "धान"],
  ["paddy", "धान"],
  ["mustard", "सरसों"],
  ["chana", "चना"],
  ["lentil", "मसूर"],
  ["pea", "मटर"],
  ["maize", "मक्का"],
  ["bajra", "बाजरा"],
  ["jowar", "ज्वार"],
  ["cotton", "कपास"],
  ["soybean", "सोयाबीन"],
  ["groundnut", "मूंगफली"],
  ["sugarcane", "गन्ना"],
  ["potato", "आलू"],
  ["onion", "प्याज"],
  ["tomato", "टमाटर"],
  ["cucumber", "खीरा"],
  ["brinjal", "बैंगन"],
  ["chilli", "मिर्च"],
  ["turmeric", "हल्दी"],
  ["garlic", "लहसुन"],
  ["coriander", "धनिया"],
  ["cauliflower", "फूलगोभी"],
  ["cabbage", "पत्ता गोभी"],
  ["okra", "भिंडी"],
  ["banana", "केला"],
  ["mango", "आम"],
  ["grapes", "अंगूर"],
  ["apple", "सेब"],
  ["moong", "मूंग"],
  ["urad", "उड़द"],
  ["arhar", "अरहर"],
  ["sesame", "तिल"],
  ["sunflower", "सूरजमुखी"],
  ["barley", "जौ"],
  ["oats", "जई"],
  ["fenugreek", "मेथी"],
  ["spinach", "पालक"],
  ["watermelon", "तरबूज"],
];

const stages = [
  ["sowing", "बुवाई"],
  ["vegetative", "वृद्धि"],
  ["flowering", "फूल अवस्था"],
  ["harvest", "कटाई"],
];

const regions = [
  ["north-india", "उत्तर भारत"],
  ["central-india", "मध्य भारत"],
  ["west-india", "पश्चिम भारत"],
  ["east-india", "पूर्व भारत"],
  ["south-india", "दक्षिण भारत"],
];

const templates = {
  sowing: {
    en: (crop, region) => `For ${crop} sowing in ${region}, use certified seed, proper spacing, and moisture-balanced seedbed. Apply basal fertilizer as per soil test before or during sowing.`,
    hi: (cropHi, regionHi) => `${regionHi} में ${cropHi} की बुवाई के लिए प्रमाणित बीज, सही दूरी और नमी संतुलित खेत तैयार करें। मृदा जांच के अनुसार बेसल खाद दें।`,
    category: "crop-stage",
  },
  vegetative: {
    en: (crop, region) => `During vegetative stage of ${crop} in ${region}, prioritize weed control, split nitrogen application, and irrigation based on soil moisture. Monitor early pest incidence weekly.`,
    hi: (cropHi, regionHi) => `${regionHi} में ${cropHi} की वृद्धि अवस्था में खरपतवार नियंत्रण, नाइट्रोजन की विभाजित मात्रा और नमी के आधार पर सिंचाई करें। साप्ताहिक कीट निगरानी करें।`,
    category: "crop-stage",
  },
  flowering: {
    en: (crop, region) => `At flowering stage of ${crop} in ${region}, avoid moisture stress, spray only in calm weather, and protect pollination by reducing unnecessary pesticide use.`,
    hi: (cropHi, regionHi) => `${regionHi} में ${cropHi} की फूल अवस्था में नमी तनाव न होने दें, शांत मौसम में ही स्प्रे करें और अनावश्यक कीटनाशक से परागण को नुकसान न पहुंचाएं।`,
    category: "crop-stage",
  },
  harvest: {
    en: (crop, region) => `For ${crop} harvest in ${region}, harvest at proper maturity, keep produce dry, and compare mandi trend with MSP before selling.`,
    hi: (cropHi, regionHi) => `${regionHi} में ${cropHi} की कटाई सही परिपक्वता पर करें, उपज को सूखा रखें और बेचने से पहले मंडी रुझान व MSP की तुलना करें।`,
    category: "crop-stage",
  },
};

const pestIssues = [
  ["aphid", "माहू"],
  ["whitefly", "सफेद मक्खी"],
  ["stem borer", "तना छेदक"],
  ["leaf blight", "पत्ती झुलसा"],
  ["powdery mildew", "चूर्णिल फफूंद"],
  ["rust", "रतुआ"],
  ["thrips", "थ्रिप्स"],
  ["fruit borer", "फल छेदक"],
  ["cutworm", "कटवर्म"],
  ["wilt", "मुरझान"],
];

const mspCrops = [
  ["wheat", "गेहूं"],
  ["paddy", "धान"],
  ["chana", "चना"],
  ["mustard", "सरसों"],
  ["masoor", "मसूर"],
  ["cotton", "कपास"],
  ["maize", "मक्का"],
  ["bajra", "बाजरा"],
  ["jowar", "ज्वार"],
  ["arhar", "अरहर"],
];

const rows = [];
let id = 1;

for (const [crop, cropHi] of crops) {
  for (const [stage, stageHi] of stages) {
    const [region, regionHi] = regions[id % regions.length];
    const tpl = templates[stage];
    rows.push({
      id: `kb-${String(id).padStart(4, "0")}`,
      title: `${crop} ${stage} guide`,
      titleHi: `${cropHi} ${stageHi} मार्गदर्शिका`,
      category: tpl.category,
      crop,
      stage,
      region,
      content: tpl.en(crop, region),
      contentHi: tpl.hi(cropHi, regionHi),
      tags: [crop, cropHi, stage, stageHi, region, regionHi],
    });
    id += 1;
  }
}

for (const [issue, issueHi] of pestIssues) {
  rows.push({
    id: `kb-${String(id).padStart(4, "0")}`,
    title: `${issue} management checklist`,
    titleHi: `${issueHi} प्रबंधन चेकलिस्ट`,
    category: "pest-disease",
    crop: "multi-crop",
    stage: "monitoring",
    region: "india",
    content: `For ${issue} management, scout fields twice weekly, remove heavily infested plants, use biological control where possible, and spray as per threshold and local advisory.`,
    contentHi: `${issueHi} प्रबंधन के लिए सप्ताह में दो बार निगरानी करें, अधिक प्रभावित पौधे हटाएं, जैविक नियंत्रण अपनाएं और आवश्यकता अनुसार स्थानीय सलाह के अनुसार स्प्रे करें।`,
    tags: [issue, issueHi, "pest", "disease", "ipm"],
  });
  id += 1;
}

for (const [crop, cropHi] of mspCrops) {
  rows.push({
    id: `kb-${String(id).padStart(4, "0")}`,
    title: `${crop} MSP & mandi planning`,
    titleHi: `${cropHi} MSP और मंडी योजना`,
    category: "market",
    crop,
    stage: "harvest",
    region: "india",
    content: `Track ${crop} mandi rates over 3-5 days, compare with MSP where applicable, and include transport, quality grade, and storage costs before deciding to sell.`,
    contentHi: `${cropHi} के मंडी भाव 3-5 दिन ट्रैक करें, लागू होने पर MSP से तुलना करें, और बिक्री से पहले परिवहन, गुणवत्ता ग्रेड और भंडारण लागत जोड़ें।`,
    tags: [crop, cropHi, "msp", "mandi", "market"],
  });
  id += 1;
}

const outputPath = path.join(__dirname, "..", "src", "data", "agriKnowledge.json");
fs.writeFileSync(outputPath, JSON.stringify(rows, null, 2), "utf-8");
console.log(`Generated ${rows.length} knowledge entries at ${outputPath}`);
