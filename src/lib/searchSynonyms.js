/**
 * Multilingual Grocery Synonym Engine (Telugu, Hindi, English)
 * 
 * Maps regional grocery names, phonetic transliterations, and colloquial terms
 * across Telugu, Hindi, and English so customers find products instantly regardless
 * of the term used.
 */

export const SYNONYM_CLUSTERS = [
  // ── Dals & Pulses ──
  ['toor', 'toordal', 'toor dal', 'tuvar', 'tuver', 'arhar', 'kandi', 'kandipappu', 'kandi pappu', 'pigeon pea', 'red gram', 'yellow dal'],
  ['moong', 'moongdal', 'moong dal', 'mung', 'mungdal', 'pesara', 'pesarapappu', 'pesara pappu', 'pesarlu', 'green gram', 'yellow moong'],
  ['urad', 'uraddal', 'urad dal', 'udhad', 'minapa', 'minapappu', 'minapa pappu', 'minumulu', 'gundu minapa', 'black gram', 'white urad'],
  ['chana', 'chanadal', 'chana dal', 'senaga', 'senagapappu', 'senaga pappu', 'senagalu', 'bengal gram', 'chhole', 'chana dalia', 'putnalu', 'roasted gram'],
  ['masoor', 'masoordal', 'masoor dal', 'erra pappu', 'red lentil', 'malka'],
  ['rajma', 'rajmah', 'kidney beans'],
  ['chole', 'kabuli', 'kabuli chana', 'white chana', 'kabuli senagalu', 'chickpeas'],
  ['batani', 'peas', 'green peas', 'white peas', 'matar', 'pattani'],
  ['palli', 'pallilu', 'groundnut', 'groundnuts', 'peanut', 'peanuts', 'mungfali', 'shenga', 'verusenaga'],
  ['alisenthalu', 'bobbarlu', 'cowpeas', 'black eyed peas', 'lobia', 'chawli'],
  ['anumulu', 'hyacinth beans', 'field beans', 'val dal', 'avare'],
  ['soya', 'soya chunks', 'milmaker', 'mealmaker', 'nutri', 'soya badi'],

  // ── Rice, Flours & Grains ──
  ['rice', 'biyyam', 'chawal', 'basmati', 'hmt', 'jsr', 'sona', 'masoori', 'raw rice', 'steam rice', 'brown rice', 'boiled rice', 'doddu biyyam'],
  ['poha', 'atkulu', 'atkul', 'aval', 'flattened rice', 'beaten rice', 'chivda', 'darshan'],
  ['atta', 'wheat flour', 'godhuma pindi', 'godhumalu', 'chakki atta', 'aashirvad', 'wheat'],
  ['maida', 'all purpose flour', 'refined flour'],
  ['besan', 'gram flour', 'senaga pindi', 'chana flour'],
  ['sooji', 'suji', 'ravva', 'rawa', 'semolina', 'bombay ravva', 'upma ravva', 'godhuma ravva', 'doddu ravva', 'makka ravva'],
  ['ragi', 'ragi pindi', 'finger millet'],
  ['jowar', 'jonna', 'jonna pindi', 'sorghum'],
  ['bajra', 'sajja', 'sajja pindi', 'pearl millet'],
  ['korralu', 'foxtail millet', 'millets', 'millet'],
  ['arikelu', 'kodo millet'],
  ['corn', 'makka', 'makkalu', 'maize', 'popcorn'],
  ['semiya', 'vermicelli', 'sevai', 'bambino', 'peni'],
  ['noodles', 'noodle', 'maggi', 'yipee', 'pasta', 'macaroni'],

  // ── Spices & Seasonings ──
  ['turmeric', 'haldi', 'pasupu', 'pasupu kommul', 'turmeric powder'],
  ['chilli', 'mirchi', 'karam', 'mirch', 'lal mirch', 'chilli powder', 'red chilli'],
  ['pepper', 'black pepper', 'miriyalu', 'kali mirch', 'mari'],
  ['coriander', 'coriander seeds', 'daniyalu', 'dhaniyalu', 'dhaniya', 'coriander powder'],
  ['cumin', 'cumin seeds', 'jeera', 'zeera', 'jeelakarra', 'jeera powder'],
  ['mustard', 'mustard seeds', 'avalu', 'rai', 'sarson'],
  ['cardamom', 'elaichi', 'elachi', 'yalakalu', 'elakulu', 'green cardamom'],
  ['clove', 'cloves', 'lavang', 'lavangalu', 'laung'],
  ['cinnamon', 'dalchini', 'dalchinachekka'],
  ['fennel', 'fennel seeds', 'saunf', 'sompu', 'sombu'],
  ['carom', 'carom seeds', 'ajwain', 'vaamu'],
  ['fenugreek', 'fenugreek seeds', 'methi', 'menthulu', 'kasuri methi'],
  ['asafoetida', 'hing', 'inguva'],
  ['poppy', 'poppy seeds', 'khus khus', 'gasa gasalu', 'gasalu'],
  ['bay leaf', 'biryani aaku', 'tej patta', 'bayleaf'],
  ['ginger', 'adrak', 'allam', 'ginger garlic', 'alam paste'],
  ['garlic', 'lahsun', 'vellulli', 'garlic paste'],
  ['tamarind', 'imli', 'chintapandu'],
  ['garam masala', 'chicken masala', 'mutton masala', 'biryani masala', 'masala', 'curry powder'],
  ['dry fruits', 'badam', 'almond', 'kaju', 'cashew', 'kismis', 'raisin', 'kishmish', 'anjeer', 'fig', 'pista', 'pistachio', 'dates', 'kharjura'],

  // ── Cooking Oils & Ghee ──
  ['oil', 'cooking oil', 'nune', 'noone', 'tel'],
  ['sunflower oil', 'sunflower', 'freedom', 'gold drop', 'fortune'],
  ['groundnut oil', 'palli nune', 'verusenaga nune', 'peanut oil', 'mungfali tel'],
  ['mustard oil', 'aava nune', 'sarson tel'],
  ['sesame oil', 'gingelly oil', 'til oil', 'nuvvula nune'],
  ['deepam oil', 'deepam nune', 'pooja oil', 'lamp oil'],
  ['castor oil', 'aamudam', 'amudham'],
  ['ghee', 'pure ghee', 'neyyi', 'cow ghee', 'grb', 'durga'],
  ['vanaspati', 'dalda'],

  // ── Sweeteners & Salts ──
  ['sugar', 'cheeni', 'panchadara', 'sakkar', 'crystal sugar', 'mishri'],
  ['jaggery', 'bellam', 'gud', 'chorsa', 'palli patti', 'laddu'],
  ['honey', 'thene', 'shehed', 'apis', 'dabur honey'],
  ['salt', 'uppu', 'namak', 'tata salt'],
  ['rock salt', 'ralla uppu', 'sendha namak', 'black salt', 'doddu uppu', 'kallu uppu'],
  ['citric acid', 'lemon salt', 'nimmu uppu'],

  // ── Household, Pooja & Personal Care ──
  ['broom', 'cheepiri', 'cheepuru', 'chipiri', 'jhadu', 'phool jhadu', '555 cheepiri', 'pullala chipiri'],
  ['mop', 'mop555', 'wiper', 'viper'],
  ['camphor', 'karpuram', 'karpooram', 'kapoor', 'swastik karpuram', 'pacha karpuram'],
  ['wicks', 'cotton wicks', 'vathulu', 'vattulu', 'diya bati', 'pooja vattulu'],
  ['agarbatti', 'agarbathi', 'incense', 'dhoop', 'ambika', 'cycle', 'zed black'],
  ['kumkum', 'kumkuma', 'sindoor', 'gopuram kumkuma', 'pasupu'],
  ['gandham', 'chandan', 'sandalwood', 'asta gandham'],
  ['soap', 'bathing soap', 'sabbu', 'santoor', 'lux', 'lifebuoy', 'dettol', 'cinthol', 'mysore sandal'],
  ['detergent', 'surf', 'washing powder', 'surf excel', 'ariel', 'rin', 'wheel', 'tide', 'comfort'],
  ['dishwash', 'vim', 'exo', 'bartan'],
  ['toothpaste', 'paste', 'colgate', 'close up', 'babool', 'sensodyne', 'brush', 'toothbrush', 'ajay'],
  ['shampoo', 'clinic plus', 'dove', 'chik', 'head & shoulders', 'sunsilk'],
  ['hair oil', 'aswini', 'bajaj almond', 'coconut oil', 'parachute', 'amla oil'],
  ['mosquito', 'all out', 'good knight', 'hit', 'repellent', 'coil'],
  ['plates', 'paper plates', 'buff plates', 'pates', 'doppalu', 'disposable'],
  ['beedi', 'bidi', 'cigarette', 'tobacco', 'amber', '502', 'bristol'],
  ['matches', 'matchbox', 'dalf matches'],
  ['battery', 'eveready', 'nippo'],
];

// Inverted lookup map: word -> Set of related synonym words
const LOOKUP_MAP = new Map();

for (const cluster of SYNONYM_CLUSTERS) {
  const normalizedCluster = cluster.map((w) => w.toLowerCase().trim()).filter(Boolean);
  for (const term of normalizedCluster) {
    if (!LOOKUP_MAP.has(term)) {
      LOOKUP_MAP.set(term, new Set());
    }
    const set = LOOKUP_MAP.get(term);
    for (const syn of normalizedCluster) {
      set.add(syn);
    }
  }
}

/**
 * Expand a user search query into an array of search tokens and regional synonyms.
 * 
 * E.g. "kandipappu" -> ["kandipappu", "kandi", "toor", "toor dal", "tuvar", "arhar", "pigeon pea"]
 * E.g. "moong dal"  -> ["moong dal", "moong", "pesara", "pesarapappu", "mung", "green gram"]
 * 
 * @param {string} query 
 * @returns {string[]} expandedTokens
 */
export function expandSearchTerms(query) {
  if (!query || typeof query !== 'string') return [];
  const clean = query.toLowerCase().trim();
  if (!clean) return [];

  const results = new Set();
  results.add(clean);

  // Check full multi-word query directly in lookup map
  if (LOOKUP_MAP.has(clean)) {
    for (const syn of LOOKUP_MAP.get(clean)) {
      results.add(syn);
    }
  }

  // Split into individual words
  const words = clean.split(/\s+/).filter(Boolean);
  for (const word of words) {
    results.add(word);
    if (LOOKUP_MAP.has(word)) {
      for (const syn of LOOKUP_MAP.get(word)) {
        results.add(syn);
      }
    }
  }

  return Array.from(results);
}

/**
 * Check if a product item matches a search query using multilingual synonyms.
 * 
 * @param {Object} item - Product item { name, displayName, originalName, categoryName, subcategoryName, group }
 * @param {string} query - Raw search query string
 * @returns {boolean} matches
 */
export function matchesGroceryQuery(item, query) {
  if (!query || !query.trim()) return true;
  if (!item) return false;

  const cleanQuery = query.toLowerCase().trim();
  const expanded = expandSearchTerms(cleanQuery);

  // Combine product text fields into searchable string
  const itemTexts = [
    item.name || '',
    item.displayName || '',
    item.originalName || '',
    item.categoryName || '',
    item.subcategoryName || '',
    (item.group && typeof item.group === 'object' ? item.group.name : item.group) || '',
  ]
    .join(' ')
    .toLowerCase();

  // 1. Direct substring match (highest priority)
  if (itemTexts.includes(cleanQuery)) {
    return true;
  }

  // 2. Check if all query words appear in itemTexts
  const queryWords = cleanQuery.split(/\s+/).filter(Boolean);
  if (queryWords.length > 1 && queryWords.every((w) => itemTexts.includes(w))) {
    return true;
  }

  // 3. Multilingual synonym token match
  for (const syn of expanded) {
    if (syn.length >= 2 && itemTexts.includes(syn)) {
      return true;
    }
  }

  return false;
}
