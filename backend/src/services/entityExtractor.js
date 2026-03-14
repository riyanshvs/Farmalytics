const CROP_ALIASES = {
  wheat: ["wheat", "gehun", "gehun", "गेहूं", "गेहुं"],
  rice: ["rice", "paddy", "dhan", "धान"],
  mustard: ["mustard", "sarso", "सरसों"],
  chana: ["chana", "चना", "gram", "chickpea"],
  masoor: ["masoor", "मसूर", "lentil"],
  moong: ["moong", "मूंग", "green gram"],
  urad: ["urad", "उड़द", "black gram"],
  arhar: ["arhar", "toor", "tur", "अरहर", "pigeon pea"],
  maize: ["maize", "corn", "makka", "मक्का"],
  bajra: ["bajra", "बाजरा", "pearl millet"],
  jowar: ["jowar", "sorghum", "ज्वार"],
  barley: ["barley", "jau", "जौ"],
  oats: ["oats", "jai", "जई"],
  soybean: ["soybean", "soyabean", "सोयाबीन"],
  groundnut: ["groundnut", "peanut", "moongfali", "मूंगफली"],
  sesame: ["sesame", "til", "तिल"],
  sunflower: ["sunflower", "सूरजमुखी"],
  cotton: ["cotton", "kapas", "कपास"],
  sugarcane: ["sugarcane", "ganna", "गन्ना"],
  potato: ["potato", "aloo", "आलू"],
  onion: ["onion", "pyaj", "pyaaz", "प्याज", "प्याज़"],
  tomato: ["tomato", "tamatar", "टमाटर"],
  cucumber: ["cucumber", "kheera", "खीरा"],
  brinjal: ["brinjal", "eggplant", "baingan", "बैंगन"],
  chilli: ["chilli", "chili", "mirch", "मिर्च"],
  garlic: ["garlic", "lahsun", "लहसुन"],
  turmeric: ["turmeric", "haldi", "हल्दी"],
  coriander: ["coriander", "dhania", "धनिया"],
  fenugreek: ["fenugreek", "methi", "मेथी"],
  spinach: ["spinach", "palak", "पालक"],
  cauliflower: ["cauliflower", "phool gobhi", "फूलगोभी"],
  cabbage: ["cabbage", "patta gobhi", "पत्ता गोभी"],
  okra: ["okra", "bhindi", "भिंडी"],
  carrot: ["carrot", "gajar", "गाजर"],
  radish: ["radish", "mooli", "मूली"],
  beetroot: ["beetroot", "चकुंदर", "chukandar"],
  bottle_gourd: ["bottle gourd", "lauki", "लौकी"],
  ridge_gourd: ["ridge gourd", "tori", "तोरी"],
  bitter_gourd: ["bitter gourd", "karela", "करेला"],
  pumpkin: ["pumpkin", "kaddu", "कद्दू"],
  peas: ["pea", "peas", "matar", "मटर"],
  french_bean: ["french bean", "rajma", "राजमा"],
  black_pepper: ["black pepper", "kali mirch", "काली मिर्च"],
  cardamom: ["cardamom", "elaichi", "इलायची"],
  cumin: ["cumin", "jeera", "जीरा"],
  fennel: ["fennel", "saunf", "सौंफ"],
  ajwain: ["ajwain", "अजवाइन"],
  tea: ["tea", "chai", "चाय"],
  coffee: ["coffee", "कॉफी"],
  papaya: ["papaya", "papita", "पपीता"],
  banana: ["banana", "kela", "केला"],
  mango: ["mango", "aam", "आम"],
  grapes: ["grapes", "angoor", "अंगूर"],
  apple: ["apple", "seb", "सेब"],
  guava: ["guava", "amrood", "अमरूद"],
  orange: ["orange", "santra", "संतरा"],
  pomegranate: ["pomegranate", "anar", "अनार"],
  litchi: ["litchi", "लीची"],
  coconut: ["coconut", "nariyal", "नारियल"],
  pineapple: ["pineapple", "ananas", "अनानास"],
  safflower: ["safflower", "kusum", "कुसुम"],
  castor: ["castor", "arandi", "अरंडी"],
  flaxseed: ["flaxseed", "alsi", "अलसी"],
  horsegram: ["horsegram", "kulthi", "कुल्थी"],
  mothbean: ["moth bean", "moth", "मोठ"],
  cowpea: ["cowpea", "lobia", "लोबिया"],
  ragi: ["ragi", "nachni", "रागी"],
  kodo: ["kodo", "कोदो"],
  little_millet: ["little millet", "kutki", "कुटकी"],
  foxtail_millet: ["foxtail millet", "kangni", "कंगनी"],
  watermelon: ["watermelon", "tarbooj", "तरबूज"],
};

const TOPIC_ALIASES = {
  soil: ["soil", "मिट्टी", "ph", "soil type"],
  fertilizer: ["fertilizer", "fertiliser", "खाद", "khaad", "urea", "dap", "npk"],
  pest: ["pest", "कीट", "insect", "aphid", "whitefly", "thrips"],
  disease: ["disease", "रोग", "blight", "rust", "wilt", "mildew"],
  irrigation: ["irrigation", "सिंचाई", "pani", "पानी", "drip", "sprinkler"],
  weather: ["weather", "मौसम", "rain", "बारिश", "temperature", "forecast"],
  market: ["market", "mandi", "मंडी", "price", "भाव", "bhav", "rate", "msp"],
  stage: ["sowing", "बुवाई", "flowering", "कटाई", "harvest", "vegetative"],
};

const LOCATION_PATTERNS = [
  /(?:in|near|from|around)\s+([a-zA-Z\s]{2,40})(?:\?|,|\.|$)/gi,
  /(?:district|state|village|tehsil)\s*[:\-]?\s*([a-zA-Z\s]{2,40})/gi,
  /(?:में|से|के पास)\s*([\u0900-\u097F\s]{2,40})(?:\?|,|\.|$)/gi,
  /(?:जिला|राज्य|गांव|तहसील)\s*[:\-]?\s*([\u0900-\u097F\s]{2,40})/gi,
];

const DATE_PATTERNS = [
  /today|tomorrow|next week|this week|next month|this month|rabi|kharif|zaid/gi,
  /आज|कल|अगले हफ्ते|इस हफ्ते|अगले महीने|रबी|खरीफ|जायद/gi,
  /\b\d{1,2}[\/-]\d{1,2}([\/-]\d{2,4})?\b/g,
];

const NON_LOCATION_TERMS = new Set([
  "january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december",
  "jan", "feb", "mar", "apr", "jun", "jul", "aug", "sep", "sept", "oct", "nov", "dec",
  "today", "tomorrow", "week", "month", "season", "crop", "farm",
  "जनवरी", "फ़रवरी", "फरवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर",
]);

const escapeForRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const containsAlias = (input, alias) => {
  const normalizedAlias = String(alias || "").toLowerCase().trim();
  if (!normalizedAlias) return false;

  const hasLatin = /[a-z]/i.test(normalizedAlias);
  if (!hasLatin) {
    return input.includes(normalizedAlias);
  }

  const pattern = escapeForRegex(normalizedAlias).replace(/\s+/g, "\\s+");
  const boundaryRegex = new RegExp(`(^|[^a-z0-9])${pattern}([^a-z0-9]|$)`, "i");
  return boundaryRegex.test(input);
};

const detectAlias = (input, aliases) => aliases.some((alias) => containsAlias(input, alias));

export const extractEntities = (message = "") => {
  const input = String(message).toLowerCase();

  const crops = Object.entries(CROP_ALIASES)
    .filter(([, aliases]) => detectAlias(input, aliases))
    .map(([crop]) => crop);

  const topics = Object.entries(TOPIC_ALIASES)
    .filter(([, aliases]) => detectAlias(input, aliases))
    .map(([topic]) => topic);

  const locations = [];
  for (const pattern of LOCATION_PATTERNS) {
    const matches = input.matchAll(pattern);
    for (const match of matches) {
      if (match?.[1]) {
        const candidate = match[1].trim().replace(/\s+/g, " ");
        if (candidate && !NON_LOCATION_TERMS.has(candidate)) {
          locations.push(candidate);
        }
      }
    }
  }

  const dates = [];
  for (const pattern of DATE_PATTERNS) {
    const matches = input.matchAll(pattern);
    for (const match of matches) {
      if (match?.[0]) {
        dates.push(match[0].trim());
      }
    }
  }

  return {
    crops: Array.from(new Set(crops)),
    topics: Array.from(new Set(topics)),
    locations: Array.from(new Set(locations)),
    dates: Array.from(new Set(dates)),
  };
};

export default extractEntities;
