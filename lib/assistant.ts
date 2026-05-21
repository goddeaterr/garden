// Free AI Garden Assistant — no API keys, no external services
// Keyword-based intent recognition + catalog search + template responses

interface ScrapedProduct {
  title: string; latinName?: string; category: string;
  price: number; height?: string; description?: string;
  sourceUrl: string; sellerName: string; imageUrls: string[];
  stockStatus: string;
}

interface MarketplaceGroup {
  slug: string; canonicalName: string; latinName?: string; category: string;
  bestPrice: number; offers: { sellerName: string; price: number; sourceUrl: string }[];
}

type Locale = 'lt' | 'ru' | 'en';

function slugify(text_value1: string): string {
  return text_value1
    .toLowerCase()
    .replace(/ą/g, 'a')
    .replace(/č/g, 'c')
    .replace(/ę/g, 'e')
    .replace(/ė/g, 'e')
    .replace(/į/g, 'i')
    .replace(/š/g, 's')
    .replace(/ų/g, 'u')
    .replace(/ū/g, 'u')
    .replace(/ž/g, 'z')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function detectLocale(text: string): Locale {
  const lt = /[ąčęėįšųūž]/i.test(text) || /\b(reikia|noriu|turiu|sodą|medis|kaina|kiek|labas|sveikas|ačiū)\b/i.test(text);
  const ru = /[а-яёА-ЯЁ]/.test(text);
  if (lt) return 'lt';
  if (ru) return 'ru';
  return 'en';
}

interface Intent {
  type: 'recommend' | 'price' | 'care' | 'search' | 'greeting' | 'unknown';
  category?: string; purpose?: string; conditions?: string[]; query?: string;
}

function parseIntent(text: string): Intent {
  const t = text.toLowerCase();

  // Greeting
  if (/^(labas|sveiki|hello|hi|hey|привет|здравствуй|добрый)\b/.test(t)) {
    return { type: 'greeting' };
  }

  // Price query
  if (/kaina|kiek kainuoja|kiek kainuoja|price|cost|сколько|цена/.test(t)) {
    return { type: 'price', query: text };
  }

  // Care query
  if (/prižiūrėti|priežiūra|laistyti|tręšti|sodinti|care|water|prune|уход|поливать/.test(t)) {
    return { type: 'care', query: text };
  }

  // Recommendation
  const isRec = /rekomenduoti|patarėt|patark|pasirinkti|reikia|noriu|suggest|recommend|хочу|нужно|посоветуй/.test(t);

  // Detect category/purpose
  let category: string | undefined;
  let conditions: string[] = [];
  let purpose: string | undefined;

  if (/spygliuot|tuja|thuja|eglė|pušis|kadagys|conifer|хвойн/.test(t)) category = 'conifer';
  else if (/gyvatvor|hedge|живая изгородь|tvora/.test(t)) category = 'hedge';
  else if (/vijokl|climbing|вьющ/.test(t)) category = 'climbing';
  else if (/vazoni|terasin|potted|горшечн/.test(t)) category = 'potted';
  else if (/daugiameti|perennial|многолетн/.test(t)) category = 'perennial';
  else if (/vienmeti|annual|однолетн/.test(t)) category = 'annual';
  else if (/žolė|grass|злак/.test(t)) category = 'grass';
  else if (/krūm|shrubs?|rožė|hortenzija|кустарник/.test(t)) category = 'shrubs';
  else if (/medis|trees?|klevas|beržas|дерево/.test(t)) category = 'trees';

  if (/privatum|privacy|уединен/.test(t)) purpose = 'privacy';
  else if (/šešėl|shadow|shade|тень/.test(t)) purpose = 'shade';
  else if (/mažas sodas|small garden|небольш/.test(t)) purpose = 'small';
  else if (/greita|fast.grow|быстро/.test(t)) purpose = 'fast';
  else if (/uogos|vaisiai|fruit|плоды/.test(t)) purpose = 'fruit_bearing';

  if (/pavasarį|spring|весна|žydi|flower/.test(t)) conditions.push('spring');
  if (/šaltis|frost|холод|atsparus|winter/.test(t)) conditions.push('hardy');
  if (/sausra|drought|засух/.test(t)) conditions.push('drought');
  if (/šešėl|shade|тень/.test(t)) conditions.push('shade');
  if (/jūrinė|coastal|vėjas|wind|ветер|klaipėda/.test(t)) conditions.push('coastal');
  if (/rūgšt|acid|кислый/.test(t)) conditions.push('acidic');

  if (isRec || category || purpose || conditions.length > 0) {
    return { type: 'recommend', category, purpose, conditions };
  }

  // Default: search by keywords
  return { type: 'search', query: text };
}

function scoreProduct(product: ScrapedProduct | MarketplaceGroup, intent: Intent): number {
  const title = ('canonicalName' in product ? product.canonicalName : product.title).toLowerCase();
  const desc = ('description' in product && product.description ? product.description.toLowerCase() : '');
  const cat = product.category;
  let score = 0;

  if (intent.category && cat === intent.category) score += 10;

  if (intent.purpose === 'hedge' && /tuja|thuja|pušis|kadagys|buksmedis|ligustrum|gyvatvor/.test(title + desc)) score += 15;
  if (intent.purpose === 'privacy' && /tuja|eglė|pušis|thuja|picea/.test(title + desc)) score += 12;
  if (intent.purpose === 'shade' && /ąžuolas|liepa|klevas|beržas|gluosnis/.test(title)) score += 10;
  if (intent.purpose === 'small' && /kompaktiš|žemaug|nana|pumil|globosa|minima/.test(title + desc)) score += 10;
  if (intent.purpose === 'fast' && /brabant|leyland|topolis|gluosnis|beržas/.test(title)) score += 8;
  if (intent.purpose === 'fruit_bearing' && cat === 'fruit') score += 12;

  if (intent.conditions?.includes('hardy') && /atspari|šalčiui|(-\d+°C|-25|-20|-15)/i.test(desc)) score += 8;
  if (intent.conditions?.includes('coastal') && /vėjui|jūriniam|atspari vėjui/i.test(desc)) score += 10;
  if (intent.conditions?.includes('shade') && /pavėsyje|šešėlyje|dalini/i.test(desc)) score += 8;
  if (intent.conditions?.includes('drought') && /sausra|sausros|nereikalin/i.test(desc)) score += 6;

  // Prefer in-stock
  if ('stockStatus' in product && product.stockStatus === 'in_stock') score += 3;

  return score;
}

function formatProduct(p: ScrapedProduct | MarketplaceGroup, locale: Locale): string {
  const name = 'canonicalName' in p ? p.canonicalName : p.title;
  const price = 'bestPrice' in p ? `nuo €${p.bestPrice.toFixed(2)}` : `€${p.price.toFixed(2)}`;
  const latin = p.latinName ? ` *(${p.latinName})*` : '';
  const url = 'offers' in p ? p.offers[0]?.sourceUrl : p.sourceUrl;
  const sellers = 'offers' in p && p.offers.length > 1 ? ` — ${p.offers.length} pardavėjų` : '';
  return `• **${name}**${latin} — ${price}${sellers}\n  ${url}`;
}

const GREETINGS: Record<Locale, string> = {
  lt: `Sveiki! 🌿 Esu jūsų sodo patarėjas. Papasakokite apie savo sodą — dydį, vietą, tikslą — ir rekomenduosiu tinkamiausius augalus.\n\nPavyzdžiui:\n• "Reikia gyvatvorės prie jūros"\n• "Noriu vaismedžių mažam sodui"\n• "Greičiausiai augančios tuja"`,
  ru: `Здравствуйте! 🌿 Я ваш садовый советник. Расскажите о своём саде — размер, место, цель — и я порекомендую лучшие растения.\n\nНапример:\n• "Нужна живая изгородь"\n• "Хвойные для небольшого сада"\n• "Быстрорастущие деревья для тени"`,
  en: `Hello! 🌿 I'm your garden advisor. Tell me about your garden — size, location, purpose — and I'll recommend the right plants.\n\nFor example:\n• "Need a hedge near the sea"\n• "Fruit trees for a small garden"\n• "Fast-growing conifers"`,
};

const CARE_TIPS: Record<string, Record<Locale, string>> = {
  evergreen: {
    lt: `**Spygliuočių priežiūra:**\n• Laistymas: reguliarus pirmais metais, vėliau atsparesni sausrai\n• Trąšimas: pavasarį spygliuočių trąšomis\n• Genėjimas: tuja ir kadagys — vėlyvą pavasarį arba rudenį\n• Apsauga: jauni augalai žiemą riša spygliuočių tinklu`,
    ru: `**Уход за хвойными:**\n• Полив: регулярный в первые годы, затем засухоустойчивы\n• Удобрение: весной удобрениями для хвойных\n• Обрезка: туя и можжевельник — поздняя весна или осень\n• Защита: молодые растения зимой обвязывают`,
    en: `**Conifer care:**\n• Watering: regular in first years, then drought-tolerant\n• Feeding: spring with conifer fertiliser\n• Pruning: thuja and juniper — late spring or autumn\n• Protection: young plants wrapped in winter`,
  },
  fruit: {
    lt: `**Vaismedžių priežiūra:**\n• Laistymas: reguliarus vasarą, ypač kaitros metu\n• Trąšimas: pavasarį ir po žydėjimo\n• Genėjimas: kiekvieną pavasarį prieš pumpurams sprogstant\n• Apsauga: nuo vabzdėlius — per žydėjimą`,
    ru: `**Уход за плодовыми деревьями:**\n• Полив: регулярный летом, особенно в засуху\n• Удобрение: весной и после цветения\n• Обрезка: каждую весну до распускания почек\n• Защита: от вредителей во время цветения`,
    en: `**Fruit tree care:**\n• Watering: regular in summer, especially during drought\n• Feeding: spring and after flowering\n• Pruning: each spring before bud break\n• Protection: from pests during flowering`,
  },
  decorative: {
    lt: `**Dekoratyvinių medžių priežiūra:**\n• Laistymas: pirmais metais gausus, vėliau — pagal orus\n• Trąšimas: pavasarį universaliomis trąšomis\n• Genėjimas: sanitarinis genėjimas pavasarį\n• Mulčiavimas: kamieno pagrindas mulčiuojamas`,
    ru: `**Уход за декоративными деревьями:**\n• Полив: обильный в первые годы\n• Удобрение: весной универсальными удобрениями\n• Обрезка: санитарная обрезка весной\n• Мульчирование: мульчируют приствольный круг`,
    en: `**Decorative tree care:**\n• Watering: generous in first years\n• Feeding: spring with universal fertiliser\n• Pruning: sanitary pruning in spring\n• Mulching: mulch the base`,
  },
  shrub: {
    lt: `**Krūmų priežiūra:**\n• Laistymas: reguliarus ypač pirmaisiais metais\n• Trąšimas: pavasarį ir po žydėjimo\n• Genėjimas: atjauninantis genėjimas kas 2-3 metus\n• Žydėjimas: dauguma žydi pavasarį arba vasarą`,
    ru: `**Уход за кустарниками:**\n• Полив: регулярный особенно в первые годы\n• Удобрение: весной и после цветения\n• Обрезка: омолаживающая каждые 2-3 года\n• Цветение: большинство цветут весной или летом`,
    en: `**Shrub care:**\n• Watering: regular especially in first years\n• Feeding: spring and after flowering\n• Pruning: rejuvenating pruning every 2-3 years\n• Flowering: most bloom in spring or summer`,
  },
};

const UNKNOWN_REPLIES: Record<Locale, string> = {
  lt: `Atsiprašau, tiksliau nesupratau klausimo. Galite klausti:\n• Rekomenduokite medžius gyvatvorėms\n• Kaip prižiūrėti tują?\n• Kiek kainuoja obelis?\n• Kokie medžiai tinka Klaipėdos klimatui?`,
  ru: `Извините, не совсем понял вопрос. Вы можете спросить:\n• Порекомендуйте деревья для живой изгороди\n• Как ухаживать за туей?\n• Сколько стоит яблоня?\n• Какие деревья подходят для климата Клайпеды?`,
  en: `Sorry, I didn't quite understand. You can ask:\n• Recommend trees for a hedge\n• How to care for thuja?\n• How much does an apple tree cost?\n• Which trees suit the Klaipėda climate?`,
};

const COASTAL_NOTE: Record<Locale, string> = {
  lt: `\n\n💡 *Patarimas Klaipėdos regionui:* Rinkitės vėjui atsparius augalus — tuja 'Brabant', kadagiai, pušys. Vengi kalkingų dirvų augalų (rododendrai reikalauja rūgštaus).`,
  ru: `\n\n💡 *Совет для района Клайпеды:* Выбирайте ветроустойчивые растения — туя 'Brabant', можжевельники, сосны. Избегайте растений для известковых почв.`,
  en: `\n\n💡 *Klaipėda region tip:* Choose wind-resistant plants — thuja 'Brabant', junipers, pines. Avoid plants requiring alkaline soil.`,
};

const NO_RESULTS: Record<Locale, string> = {
  lt: `Deja, pagal jūsų kriterijus augalų nerandu kataloge. Bandykite klausti kitaip arba aplankykite geliuukis.lt katalogą tiesiogiai.`,
  ru: `К сожалению, по вашим критериям растений в каталоге не найдено. Попробуйте сформулировать иначе или посетите каталог geliuukis.lt напрямую.`,
  en: `Sorry, no plants found matching your criteria in the current catalog. Try rephrasing or visit geliuukis.lt directly.`,
};

export interface AssistantMessage { role: 'user' | 'assistant'; content: string; }

export function generateResponse(
  messages: AssistantMessage[],
  catalog: (ScrapedProduct | MarketplaceGroup)[],
): string {
  const lastUser = [...messages].reverse().find(m => m.role === 'user');
  if (!lastUser) return GREETINGS.en;

  const text = lastUser.content;
  const locale = detectLocale(text);

  // Greeting
  if (messages.filter(m => m.role === 'user').length === 1 && /^(labas|sveiki|hello|hi|hey|привет|здравствуй|добрый)/i.test(text.trim())) {
    return GREETINGS[locale];
  }

  const intent = parseIntent(text);

  if (intent.type === 'greeting') return GREETINGS[locale];

  if (intent.type === 'care') {
    const cat = intent.category ||
      (/spygliuot|tuja|thuja|kadagys|eglė|pušis/i.test(text) ? 'evergreen' :
       /vaismed|obelis|slyva|vyšnia/i.test(text) ? 'fruit' :
       /krūm|rožė|hortenzija/i.test(text) ? 'shrub' :
       /medis|klevas|beržas/i.test(text) ? 'decorative' : null);
    if (cat && CARE_TIPS[cat]) {
      return CARE_TIPS[cat][locale];
    }
  }

  if (intent.type === 'price' || intent.type === 'search' || intent.type === 'recommend') {
    // Score all catalog items
    const scored = catalog
      .map(p => ({ p, score: scoreProduct(p, intent) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    // If pure text search, also do keyword match
    if (intent.type === 'search' && scored.length === 0 && intent.query) {
      const words = slugify(intent.query).split('-').filter(w => w.length > 2);
      const textMatches = catalog
        .filter(p => {
          const name = ('canonicalName' in p ? p.canonicalName : p.title).toLowerCase();
          return words.some(w => name.includes(w));
        })
        .slice(0, 4);
      if (textMatches.length > 0) {
        const header = locale === 'lt' ? 'Rasti augalai' : locale === 'ru' ? 'Найденные растения' : 'Found plants';
        const coastal = intent.conditions?.includes('coastal') ? COASTAL_NOTE[locale] : '';
        return `**${header}:**\n${textMatches.map(p => formatProduct(p, locale)).join('\n')}${coastal}`;
      }
      return NO_RESULTS[locale];
    }

    if (scored.length === 0) return NO_RESULTS[locale];

    const headers: Record<string, Record<Locale, string>> = {
      hedge: { lt: 'Rekomenduojami gyvatvorių augalai', ru: 'Рекомендуемые растения для живой изгороди', en: 'Recommended hedge plants' },
      privacy: { lt: 'Augalai privatumui', ru: 'Растения для уединения', en: 'Privacy plants' },
      shade: { lt: 'Medžiai šešėliui', ru: 'Деревья для тени', en: 'Shade trees' },
      small: { lt: 'Augalai mažiems sodams', ru: 'Растения для небольших садов', en: 'Plants for small gardens' },
      fast: { lt: 'Greičiausiai augantys', ru: 'Самые быстрорастущие', en: 'Fastest growing' },
      fruit_bearing: { lt: 'Vaismedžiai', ru: 'Плодовые деревья', en: 'Fruit trees' },
    };

    const header = intent.purpose && headers[intent.purpose]
      ? headers[intent.purpose][locale]
      : locale === 'lt' ? 'Rekomenduojami augalai'
      : locale === 'ru' ? 'Рекомендуемые растения' : 'Recommended plants';

    const list = scored.map(({ p }) => formatProduct(p, locale)).join('\n');
    const coastal = intent.conditions?.includes('coastal') ? COASTAL_NOTE[locale] : '';
    const careHint = intent.category ? (locale === 'lt' ? `\n\n_Klauskite "kaip prižiūrėti ${intent.category}"_` : locale === 'ru' ? `\n\n_Спросите "как ухаживать за ${intent.category}"_` : `\n\n_Ask "how to care for ${intent.category}"_`) : '';

    return `**${header}:**\n${list}${coastal}${careHint}`;
  }

  return UNKNOWN_REPLIES[locale];
}
