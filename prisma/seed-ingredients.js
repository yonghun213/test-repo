/* eslint-disable no-console */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/**
 * CONFIG
 * - 스키마에서 price는 NOT NULL (Float @default(0))이므로 빈 값은 0으로 처리됨
 */

/**
 * Canada 가격을 적용할 "기준 템플릿" 식별 규칙
 * - 기본: country=CA 이면서 name="Canada (Default)" 우선, 없으면 country=CA 첫 번째
 * - country=CA 템플릿도 없으면 Canada (Default) 생성
 */
const CANADA_TEMPLATE_NAME = "Canada (Default)";
const CANADA_COUNTRY = "CA";
const CANADA_CURRENCY = "CAD";

// 템플릿별 기본 통화 (템플릿 생성/백필 시 기본으로 넣을 값)
const DEFAULT_CURRENCY_BY_COUNTRY = {
  CA: "CAD",
  MX: "MXN",
  CO: "COP",
};

// ====== 입력 데이터 (TSV) ======
const INGREDIENTS_TSV = `
Oil	카놀라유	Canola oil	16000	ml	99%	$55.65
Raw chicken	홀치킨 16	Whole chicken 16pcs	20	pcs	95%	$89.40
Raw chicken	홀치킨 8	Whole chicken 8pcs	20	pcs	95%	$79.50
Raw chicken	치킨윙	Split wing	1000	g	90%	$9.50
Raw chicken	정육살	Fresh Boneless Chicken	1000	g	82%	$7.99
Sauce	어니언카라멜라이즈소스	4.4LB/5 (2KG) ONION SAUCE	10000	g	95%	$71.19
Sauce	빠리간장소스	4.4LB/5 (2KG) DERI SAUCE MIX(P_TYPE)	10000	g	95%	$66.65
Sauce	마라핫소스	4.4LB/5 (2KG) MALA HOT SAUCE	10000	g	95%	$119.56
Sauce	매운양념소스	4.4LB/5 (2KG) HOT SPICY SAUCE	10000	g	95%	$58.18
Sauce	치킨강정소스	4.4LB/5 (2KG) HONEY PEPPER SAUCE	10000	g	95%	$58.52
Sauce	소이갈릭용소스	4.4LB/5 (2KG) GARLIC FALVOURED SOY SAUCE	10000	g	95%	$71.00
Sauce	시크릿양념소스	4.4LB/5 (2KG) BBQ SECRET SPICY SAUCE	10000	g	95%	$40.43
Sauce	통다리바베큐소스	4.4LB/5 (2KG) JERK BARBEQUE SAUCE	10000	g	95%	$56.17
Sauce	허니갈릭용소스	4.4LB/5 (2KG) SWEET SOY SAUCE	10000	g	95%	$90.00
Sauce	신올떡볶이소스	4.4LB/5 (2KG) SHIN ALL TOKKBOKKI SAUCE	10000	g	95%	$105.79
Sauce	갈비치킨소스	4.4LB/6 (2KG) GALBI FLAVOURED SAUCE	12000	g	95%	$86.48
Powder	치즈맛시즈닝		7500	g	95%	$104.06
Powder	배터믹스(솔루션)	1.1LB/15 (500g) CHEESE FLAVOUR SEASONING	34000	g	95%	$69.91
Powder	배터믹스(올리브치킨용)	11LB/4 (5KG) BATTERING POWDER MIX	20000	g	95%	$78.50
Powder	배터믹스(허니갈릭용)	4.4LB/10 (2KG) BATTERING POWDER MIX	20000	g	95%	$78.57
Powder	마리네이드믹스(올리브치킨용)	11LB/4 (5KG) MARINATING POWDER MIX	20000	g	95%	$146.54
Powder	염장제	11LB/4 (5KG) PICKLE SOLUTION POWDER	20000	g	95%	$68.83
Powder	마리네이드믹스(비비윙용)	2.2LB/20 (1KG) BB WINGS MARINATING MIX	20000	g	95%	$206.72
Powder	LTV프리믹스	11LB/4 (5KG) PREMIX LTV	20000	g	100%	$151.62
Powder	저크시즈닝	4.4LB/10 (2KG) JERK BARBEQUE SEASONING	20000	g	100%	$312.82
Powder	골드더스트크런치	3.52oz(100g)/20 FRIED CEREAL MIX	2000	g	95%	$30.62
Dry goods	치킨트레이(중)	100EA TO-GO BOX TRAY(M)	100	ea	100%	$6.73
Dry goods	치킨트레이(소)	100EA TO-GO BOX TRAY(S)	100	ea	100%	$5.98
Dry goods	나무젓가락	500EA CHOPSTICK	500	ea	100%	$14.30
Dry goods	내프킨	5000EA NAPKIN	500	ea	100%	$21.26
Dry goods	물티슈	500EA WET TISSUE	500	ea	100%	$9.96
Dry goods	비닐쇼핑백(대)	100/20EA PLASTIC BAG (L)	2000	ea	100%	$127.23
Dry goods	비닐쇼핑백(중)	100/20EA PLASTIC BAG (M)	2000	ea	100%	$50.00
Dry goods	비닐쇼핑백(소)	100/20EA PLASTIC BAG (S)	2000	ea	100%	$53.76
Dry goods	패키지박스(대)	100 EA PACKAGE BOX (L)	100	ea	100%	$35.50
Dry goods	패키지박스(중)	100 EA PACKAGE BOX (M)	100	ea	100%	$25.98
Dry goods	패키지박스(소)	Package Box(S)/패키지박스(소) (100ea)	100	ea	100%	$26.09
Dry goods	T-Shirts XL (Kitchen)	T-Shirts XL (Kitchen) -- 비비큐 EA	50	ea	100%	$17.44
Dry goods	T-Shirts L (Kitchen)	T-Shirts L (Kitchen) -- 비비큐 EA	50	ea	100%	$17.44
Dry goods	T-Shirts M (Kitchen)	T-Shirts M (Kitchen) -- 비비큐 EA	50	ea	100%	$17.44
Dry goods	T-Shirts S (Kitchen)	T-Shirts S (Kitchen) -- 비비큐 EA	50	ea	100%	$17.44
Dry goods	Cap (Kitchen, Black)	Cap (Kitchen, Black) -- 비비큐 EA	50	ea	100%	$12.68
Dry goods	떡볶이 용기	[PET] KRAFT BOWL 1,300 -- 비비큐 50pcs/6 Bags	300	ea	100%	$63.19
Dry goods	떡볶이 뚜껑	[PET] KRAFT BOWL LID COVER 1,300 -- 비비큐 50pcs/6 Bags	300	ea	100%	$58.59
Dry goods	컵용기 (이너컵)	PP Half, Moon Tray -- 50pcs/12 Bags	600	ea	100%	$107.62
Dry goods	치킨간지	Wax paper	1000	ea	100%	$18.49
Dry goods	2oz 포션컵	2oz portion cup	2500	ea	100%	$40.03
Dry goods	2oz 포션컵 (뚜껑)	2oz portion cup (lid)	2500	ea	100%	$40.03
Dry goods	4oz 포션컵	4oz portion cup	2500	ea	100%	$59.95
Dry goods	4oz 포션컵 (뚜껑)	4oz portion cup (lid)	2500	ea	100%	$59.95
Dry goods	8oz 포션컵	8oz portion cup	2500	ea	100%	$59.50
Dry goods	8oz 포션컵 (뚜껑)	8oz portion cup (lid)	2500	ea	100%	$33.50
Dry goods	치즈볼 봉투	Cheese balls Paper	2000	ea	100%	$24.65
Dry goods	햄버거 Paper(White)	HAMBURGER PAPER (WHITE) (3,000PCS/BOX) - BOX	3000	ea	100%	$153.05
Dry goods	햄버거 Paper(Yellow)	HAMBURGER PAPER (YELLOW) (3,000PCS/BOX) - BOX	3000	ea	100%	$194.44
Dry goods	샐러드 용기	Salad Bowl (PET) -- 비비큐 50pcs/8 Bags	400	ea	100%	$100.85
Dry goods	샐러드 용기커버	Salad Cover (PET) -- 비비큐 100pcs/4 Bags	400	ea	100%	$71.50
Dry goods	치즈볼 용기(S)	Cheese Balls container(s)	600	ea	100%	$137.00
Dry goods	치즈볼 용기(M)	Cheese Balls container(m)	300	ea	100%	$47.02
Dry goods	치즈볼 용기 6p	Cheese Balls Togo container	600	ea	100%	$137.00
Food	치즈볼	1.98LB(900g)/10 CHEESE BALL	300	ea	100%	$106.98
Food	멘보샤	Mianbaoxia	240	ea	100%	$129.90
Food	프랜치 프라이	French fries	100	g	99%	$0.39
Food	초코볼	Choco Cheese Ball/쵸코볼 (12/560g)	240	ea	95%	$95.00
Food	떡볶이 떡	Ddukboki rice cake	12000	g	95%	$47.22
Food	사각어묵	Fish Cake	10800	g	95%	$76.80
Food	쪽파	Green onion	400	g	95%	$4.49
Food	흰밥	White Rice	18000	g	99%	$39.99
Food	양파	Onion	2270	g	99%	$5.99
Food	마요네스	mayonnaise	16000	ml	95%	$97.98
Food	계란물	Egg Washer	1000	g	99%	$5.03
Food	계란	Egg	30	ea	100%	$10.49
Food	단무지	yellow Radish	1000	g	99%	$6.99
Food	김가루	Seaweed Flake	10	g	99%	$3.99
Food	뉴슈가	Newsugar	2000	g	95%	$21.00
Food	설탕	Sugar	2000	g	95%	$2.97
Food	강초	Pure vinegar	1800	g	99%	$7.60
Food	꽃소금	Salt	1000	g	99%	$6.00
Food	무	Radish	1000	g	99%	$3.00
Food	다진마늘	Minced Garlic	12000	g	99%	$140.00
Food	청양고추	jalapeno	255	g	99%	$4.97
Produced	치킨무	Chicken Radish	18000	g	99%	$39.14
Produced	아루굴라	Arugula	142	g	99%	$4.99
Food	풀드치킨	Pulled Chicken	2150	g	99%	$32.77
Food	출드치킨소스	Pulled Chicken Sauce	2100	g	99%	$5.10
Food	나초	Nacho Chips	455	g	99%	$4.78
Food	살사소스	Salsa Sauce	1560	g	99%	$13.93
Food	고수	Cilantro	28	g	99%	$1.90
Food	핫도그빵	Hotdog Bun	6	ea	99%	$5.20
Dry goods	꼬치스틱	Skewer Stick	100	ea	99%	$12.00
Food	콘샐러드	Corn Salad	100	g	99%	$0.40
Food	불닭소스	Buldak Sauce	1000	g	99%	$10.00
Food	후추가루	Ground Black Pepper	540	g	99%	$18.56
Food	참기름	Sesame Oil	500	ml	99%	$19.99
Food	멸치액젓	Anchovy Fish Sauce	3000	g	99%	$37.99
Food	다시다	Dashida	1000	g	99%	$29.99
Food	바베큐소스	BBQ Sauce	3780	ml	99%	$19.09
Food	파프리카 파우더	Paprika Powder	130	g	99%	$1.97
Food	어니언 파우더	Onion Powder	130	g	99%	$1.97
Food	오레가노	Dried Oregano	80	g	99%	$1.97
Food	타임	Dried Thyme Leave	120	g	99%	$1.97
Food	코셔 소금	Kosher Salt	454	g	99%	$5.67
Food	카이옌 페퍼	Cayenne Pepper	125	g	99%	$1.97
Food	미원	Miwon	1000	g	99%	$28.99
Food	휘핑크림	Whipping Cream	1000	ml	99%	$5.09
Food	유자	Yuzu Marmalade	500	g	99%	$15.94
Food	당면	Glass Noodle	1000	g	99%	$17.98
Food	카라멜 소스	Caramel Sauce	190	ml	99%	$4.99
Food	오뎅볼	Assorted Fish Ball	500	g	99%	$6.99
Food	파프리카	Sliced Paprika	454	g	99%	$3.99
Food	토티아	Tortilla	10	ea	99%	$3.67
Food	우동면	Udon noodle	5	ea	99%	$7.99
Food	김치	kimchi	10000	g	99%	$34.00
Food	MSG	MSG	1000	g	99%	$29.99
Food	고추가루	Red chakchak	454	g	99%	$9.99
Food	베이컨	Bacon	2000	g	99%	$22.29
Food	토마토	Tomato	100	g	99%	$0.59
Food	소시지	Sausage	2000	g	99%	$21.99
Food	로제떡볶이소스	Rosé Sauce	1000	g	99%	$7.49
Food	간장베이스소스	Soy Base Sauce	1000	g	99%	$2.56
Food	Spicy Korean Grilled chicken	Spicy Korean Grilled chicken	1000	g	99%	$8.29
Food	Jamaican Grilled Chicken	Jamaican Grilled Chicken	1000	g	99%	$8.29
Food	Grilled Soy Garlic Chicken	Grilled Soy Garlic Chicken	1000	g	99%	$8.29
Food	Korean Soy Grilled Chicken	Korean Soy Grilled Chicken	1000	g	99%	$8.29
Food	Spicy korean grill sauce	Spicy korean grill sauce	1000	g	99%	$8.00
Food	Jamaican grill sauce	Jamaican grill sauce	1000	g	99%	$8.00
Food	korean soy grill sauce	korean soy grill sauce	1000	g	99%	$8.00
Food	오리엔탈소스	Oriental Sauce	1000	g	99%	$3.48
Food	Coleslaw	Coleslaw	100	g	99%	$0.40
Food	올리브	Black Olive	2840	g	99%	$6.81
Food	Corn(Canned)	Canned Corn	2840	g	99%	$7.62
Food	Feta Cheese	Feta Cheese	1000	g	99%	$14.12
Food	푸실리 파스타	Fusilli Pasta	2270	g	99%	$11.80
Food	크루통	Croutons	1020	g	99%	$9.08
Food	모짜렐라	Shredded Mozzarella	2500	g	99%	$33.57
Food	허니머스타드	Honey Mustard Dressing	4000	ml	99%	$15.88
Food	이탈리안 드레싱	Italian Dressing	4000	ml	99%	$17.65
Food	시져 드레싱	Caesar Dressing	3780	ml	99%	$22.50
Food	파마산 치즈	Parmesan Cheese	680	g	99%	$19.49
Food	케쳡	Ketchup	1500	ml	99%	$5.97
Food	설탕(대용량)	Sugar (Bulk)	20000	g	99%	$5.29
Food	소금	Salt	750	g	99%	$4.23
Food	식초	Vinegar	4000	ml	99%	$3.27
Food	레몬즙	Lemon Juice	425	g	99%	$2.17
Food	파슬리	Parsley Powder	265	g	99%	$15.09
Food	양배추	Cabbage	454	g	95%	$1.49
Food	채소잎	Baby leaves heritage blend	500	g	99%	$13.06
Food	로메인	Romaine	500	g	99%	$4.57
Food	치즈커드	Cheese Curd	80	g	99%	$0.89
Food	후추	Black pepper	2100	g	99%	$15.09
Food	방울 토마토	Grape Tomato	907	g	99%	$6.99
Food	참깨	Sesame	454	g	99%	$12.99
Food	당근	Carrot	1360	g	90%	$2.97
Food	피망	Bell Pepper	454	g	99%	$4.00
Food	무염버터	Unsalted Butter	453	g	99%	$6.99
Food	물엿	Corn syrup	1800	ml	99%	$9.99
Food	미림	Cook wine	1800	ml	99%	$10.99
Food	컬리플라워	Cauliflower	1000	g	80%	$5.00
Food	브로콜리	Broccoli	453	g	99%	$1.99
Food	깔라마리	Calamari	1813	g	99%	$72.80
Food	Spring Mix	spring mix	312	g	95%	$4.99
Food	베이컨 바이트	Bacon Bite	2200	g	99%	$33.77
Food	갈릭 파우더	Garlic Powder	150	g	99%	$1.97
Food	올리브 오일	Olive oil (extra virgin)	2000	ml	99%	$16.97
Food	새우스틱	새우스틱--비비큐 1.76LB(800G/6) FROZEN SHRIMP STICK	60	ea	100%	$61.00
Produced	콜팝 컵	Colpop cups	500	ea	100%	$116.86
Produced	콜팝 뚜껑 (리드)	Colpop containers	500	ea	100%	$79.65
Produced	빨대	straws	200	ea	100%	$8.95
Produced	이쑤시개	toothpick	500	ea	100%	$19.99
Produced	캔 음료	Pop (can)	1	ea	100%	$0.95
Food	디핑소스	Dipping Sauce	603	ml	95%	$4.42
Food	어니언링	Onion Rings	4000	g	95%	$45.72
Food	소시지(낱개)	Sausage (single)	12	g	100%	$2.97
Food	모짜렐라스틱	mozzarella sticks	60	g	95%	$16.99
Food	믹스야채	Mixed Vegitable	1000	g	100%	$0.00
Food	대나무 스틱	bamboo stick	2500	ea	100%	$27.95
Food	당면(낱개)	starch noodle	5	ea	100%	$7.99
Food	베트남 피쉬소스	viet houng fish sauce	100	ml	95%	$1.46
Food	오이	cucumber	300	g	90%	$0.96
Food	오이 드레싱	cucu dressing	1560	g	95%	$22.54
Food	브리오슈번	Brioche Bun	72	ea	95%	$45.79
Food	갈릭마요	Garlic mayo	603	g	95%	$4.42
Food	마라마요	Mala mayo	200	g	95%	$1.90
Food	비비큐다시	bb.q dashi	6350	g	95%	$3.79
Food	김말이	SEAWEED ROLL	400	g	100%	$116.86
Food	만두	Dumpling	20	g	95%	$6.82
Food	레몬웨지	lemon Wedge	8	g	95%	$0.99
Food	순두부소스	Sundubu Sauce	1000	g	95%	$0.00
Food	마른멸치	Dried anchovy	420	g	100%	$8.99
Food	마른다시마	Dried kelp	114	g	100%	$5.99
Food	된장	Soybean Paste	500	g	95%	$6.99
Food	조개다시다	Clam Dasida	1000	g	95%	$23.39
`.trim();

// ====== parsing helpers ======
function parseMoney(input) {
  if (input === null || input === undefined) return 0;
  const s = String(input).trim();
  if (!s) return 0;
  const n = Number(s.replace(/[$,\s]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function parsePercent(input) {
  if (input === null || input === undefined) return 100;
  const s = String(input).trim();
  if (!s) return 100;
  const n = Number(s.replace("%", "").trim());
  return Number.isFinite(n) ? n : 100;
}

function parseNumber(input) {
  if (input === null || input === undefined) return 0;
  const s = String(input).trim();
  if (!s || s === "-") return 0;
  const n = Number(s.replace(/[, ]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function normalizeCategory(raw) {
  const s = (raw || "").trim();
  if (!s) return "";
  const key = s.toLowerCase();
  const map = new Map([
    ["oil", "Oil"],
    ["raw chicken", "Raw chicken"],
    ["sauce", "Sauce"],
    ["powder", "Powder"],
    ["dry goods", "Dry goods"],
    ["food", "Food"],
    ["produced", "Produced"],
  ]);
  return map.get(key) || s;
}

function parseIngredientsFromTsv(tsv) {
  const lines = String(tsv)
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.trim().length > 0);

  const results = [];
  let lastCategory = "";

  for (const line of lines) {
    const parts = line.split("\t").map((p) => (p ?? "").trim());

    if (parts.length < 4) {
      console.warn(`⚠️ Skipped (invalid): ${line}`);
      continue;
    }

    let [category, koreanName, englishName, quantity, unit, yieldRate, price] = parts;

    category = normalizeCategory(category);
    if (!category) category = lastCategory;
    if (category) lastCategory = category;

    koreanName = (koreanName || "").trim();
    englishName = (englishName || "").trim();
    if (!koreanName && englishName) koreanName = englishName;
    if (!englishName && koreanName) englishName = koreanName;

    if (!koreanName && !englishName) {
      console.warn(`⚠️ Skipped (missing names): ${line}`);
      continue;
    }

    results.push({
      category: category || "Uncategorized",
      koreanName,
      englishName,
      quantity: parseNumber(quantity),
      unit: unit ? unit.trim() : "",
      yieldRate: parsePercent(yieldRate),
      canadaPrice: parseMoney(price),
    });
  }

  // 중복 제거(동일 키면 1개만)
  const dedup = new Map();
  for (const r of results) {
    const key = [
      r.category,
      r.koreanName,
      r.englishName,
      r.quantity ?? "",
      r.unit ?? "",
      r.yieldRate ?? "",
    ].join("|");

    if (!dedup.has(key)) dedup.set(key, r);
  }

  return Array.from(dedup.values());
}

// ====== core behavior helpers ======

function defaultCurrencyForCountry(country) {
  return DEFAULT_CURRENCY_BY_COUNTRY[country] || "USD";
}

/**
 * "새 템플릿 생성" 이후, 기존 모든 IngredientMaster를 해당 템플릿에 붙여 넣는 백필 함수.
 * - price는 0으로 생성
 * - currency는 국가 기준 기본값으로 생성 (추후 사용자가 수정 가능)
 */
async function backfillTemplateItems(templateId, tx = prisma) {
  const template = await tx.ingredientTemplate.findUnique({
    where: { id: templateId },
    select: { id: true, country: true },
  });
  if (!template) throw new Error(`Template not found: ${templateId}`);

  const masters = await tx.ingredientMaster.findMany({
    select: { id: true },
  });

  if (masters.length === 0) return { created: 0 };

  const data = masters.map((m) => ({
    templateId: template.id,
    ingredientId: m.id,
    price: 0,
    currency: defaultCurrencyForCountry(template.country),
  }));

  const result = await tx.ingredientTemplateItem.createMany({
    data,
    skipDuplicates: true,
  });

  return { created: result.count };
}

/**
 * 템플릿 A에서 새로운 아이템을 추가할 때:
 *  - IngredientMaster 생성
 *  - 모든 템플릿에 IngredientTemplateItem 생성(존재만)
 *  - 단, A 템플릿만 price/currency 세팅, 나머지는 빈 값(0)
 */
async function createMasterAndPropagate({
  sourceTemplateId,
  ingredientData,
  sourcePrice,
  sourceCurrency,
}) {
  return prisma.$transaction(async (tx) => {
    const templates = await tx.ingredientTemplate.findMany({
      select: { id: true, country: true },
    });

    const sourceTemplate = templates.find((t) => t.id === sourceTemplateId);
    if (!sourceTemplate) throw new Error(`Source template not found: ${sourceTemplateId}`);

    const master = await tx.ingredientMaster.create({ data: ingredientData });

    const items = templates.map((t) => ({
      templateId: t.id,
      ingredientId: master.id,
      price: t.id === sourceTemplateId ? (sourcePrice ?? 0) : 0,
      currency:
        t.id === sourceTemplateId
          ? (sourceCurrency || defaultCurrencyForCountry(t.country))
          : defaultCurrencyForCountry(t.country),
    }));

    await tx.ingredientTemplateItem.createMany({
      data: items,
      skipDuplicates: true,
    });

    return master;
  });
}

/**
 * 시드 메인:
 * - IngredientMaster 업서트(동일 category+koreanName+englishName 기준)
 * - 모든 템플릿에 IngredientTemplateItem "존재" 보장(가격은 0)
 * - Canada 기준 템플릿에만 가격 업데이트
 *
 * 옵션:
 *  - SEED_RESET=1 이면 ingredientTemplateItem, ingredientMaster만 삭제 후 재생성(템플릿은 유지)
 */
async function seed() {
  console.log("🌱 Seeding IngredientMaster + propagating items to ALL templates...");

  const rows = parseIngredientsFromTsv(INGREDIENTS_TSV);
  console.log(`📦 Parsed rows: ${rows.length}`);

  const reset = ["1", "true", "yes"].includes(String(process.env.SEED_RESET || "").toLowerCase());
  if (reset) {
    console.log("🧹 SEED_RESET enabled: clearing ingredientTemplateItem + ingredientMaster (templates are kept)");
    await prisma.ingredientTemplateItem.deleteMany({});
    await prisma.ingredientMaster.deleteMany({});
  }

  // 템플릿 전체 조회(운영 기준: 이미 여러 템플릿이 존재)
  let templates = await prisma.ingredientTemplate.findMany({
    select: { id: true, name: true, country: true, isActive: true },
  });

  // 템플릿이 하나도 없으면 최소 템플릿(예: CA/MX/CO) 생성해두는 안전장치
  if (templates.length === 0) {
    console.log("⚠️ No templates found. Creating minimal templates (CA/MX/CO)...");
    await prisma.ingredientTemplate.createMany({
      data: [
        { name: CANADA_TEMPLATE_NAME, country: "CA", description: "Default ingredient template for Canada stores", isActive: true },
        { name: "Mexico", country: "MX", description: "Ingredient template for Mexico stores", isActive: true },
        { name: "Colombia", country: "CO", description: "Ingredient template for Colombia stores", isActive: true },
      ],
    });

    templates = await prisma.ingredientTemplate.findMany({
      select: { id: true, name: true, country: true, isActive: true },
    });
  }

  // Canada 가격 적용 대상 템플릿 선택
  let canadaPricingTemplate =
    templates.find((t) => t.country === CANADA_COUNTRY && t.name === CANADA_TEMPLATE_NAME) ||
    templates.find((t) => t.country === CANADA_COUNTRY && t.isActive) ||
    templates.find((t) => t.country === CANADA_COUNTRY);

  if (!canadaPricingTemplate) {
    console.log("⚠️ No CA template found. Creating Canada (Default)...");
    canadaPricingTemplate = await prisma.ingredientTemplate.create({
      data: {
        name: CANADA_TEMPLATE_NAME,
        country: CANADA_COUNTRY,
        description: "Default ingredient template for Canada stores",
        isActive: true,
      },
      select: { id: true, name: true, country: true, isActive: true },
    });
    templates.push(canadaPricingTemplate);
  }

  console.log(`✅ Pricing template: ${canadaPricingTemplate.name} (${canadaPricingTemplate.country})`);

  // 업서트 & 전파 생성
  const BATCH = 25;
  let processed = 0;

  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);

    await prisma.$transaction(async (tx) => {
      for (const r of chunk) {
        // 1) master upsert (unique 키가 없다 가정 -> findFirst 기준)
        const existing = await tx.ingredientMaster.findFirst({
          where: {
            category: r.category,
            koreanName: r.koreanName,
            englishName: r.englishName,
          },
          select: { id: true },
        });

        const master = existing
          ? await tx.ingredientMaster.update({
              where: { id: existing.id },
              data: {
                category: r.category,
                koreanName: r.koreanName,
                englishName: r.englishName,
                quantity: r.quantity,
                unit: r.unit,
                yieldRate: r.yieldRate,
              },
            })
          : await tx.ingredientMaster.create({
              data: {
                category: r.category,
                koreanName: r.koreanName,
                englishName: r.englishName,
                quantity: r.quantity,
                unit: r.unit,
                yieldRate: r.yieldRate,
              },
            });

        // 2) 모든 템플릿에 item "존재" 보장 + Canada에 가격 적용
        for (const t of templates) {
          const isCanada = t.id === canadaPricingTemplate.id;
          await tx.ingredientTemplateItem.upsert({
            where: {
              templateId_ingredientId: {
                templateId: t.id,
                ingredientId: master.id,
              },
            },
            create: {
              templateId: t.id,
              ingredientId: master.id,
              price: isCanada ? r.canadaPrice : 0,
              currency: isCanada ? CANADA_CURRENCY : defaultCurrencyForCountry(t.country),
            },
            update: isCanada
              ? { price: r.canadaPrice, currency: CANADA_CURRENCY }
              : {}, // 다른 템플릿은 이미 존재하면 skip
          });
        }
      }
    });

    processed += chunk.length;
    console.log(`...processed ${processed}/${rows.length}`);
  }

  console.log("🎉 Seed completed.");

  // 참고: 새 템플릿이 DB에 추가되면 backfillTemplateItems(newTemplateId) 호출하면 됨
  console.log(
    `ℹ️ New template backfill: call backfillTemplateItems(templateId)`
  );
}

// ====== run ======
seed()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

module.exports = {
  backfillTemplateItems,
  createMasterAndPropagate,
};
