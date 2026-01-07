// Turso DB에 식재료 데이터 시딩 스크립트 (전체 버전)
// 사용법: node seed-ingredients-turso.js

const { createClient } = require('@libsql/client');

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error('❌ TURSO_DATABASE_URL과 TURSO_AUTH_TOKEN 환경변수가 필요합니다.');
  process.exit(1);
}

const client = createClient({ url, authToken });

// ID 생성 함수
function cuid() {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `c${timestamp}${randomStr}`;
}

// 날짜를 ISO 형식으로
function nowISO() {
  return new Date().toISOString();
}

// 전체 식재료 데이터
const INGREDIENTS_TSV = `
Oil	카놀라유	Canola oil	16000	ml	99	55.65
Raw chicken	홀치킨 16	Whole chicken 16pcs	20	pcs	95	89.40
Raw chicken	홀치킨 8	Whole chicken 8pcs	20	pcs	95	79.50
Raw chicken	치킨윙	Split wing	1000	g	90	9.50
Raw chicken	정육살	Fresh Boneless Chicken	1000	g	82	7.99
Sauce	어니언카라멜라이즈소스	4.4LB/5 (2KG) ONION SAUCE	10000	g	95	71.19
Sauce	빠리간장소스	4.4LB/5 (2KG) DERI SAUCE MIX(P_TYPE)	10000	g	95	66.65
Sauce	마라핫소스	4.4LB/5 (2KG) MALA HOT SAUCE	10000	g	95	119.56
Sauce	매운양념소스	4.4LB/5 (2KG) HOT SPICY SAUCE	10000	g	95	58.18
Sauce	치킨강정소스	4.4LB/5 (2KG) HONEY PEPPER SAUCE	10000	g	95	58.52
Sauce	소이갈릭용소스	4.4LB/5 (2KG) GARLIC FALVOURED SOY SAUCE	10000	g	95	71.00
Sauce	시크릿양념소스	4.4LB/5 (2KG) BBQ SECRET SPICY SAUCE	10000	g	95	40.43
Sauce	통다리바베큐소스	4.4LB/5 (2KG) JERK BARBEQUE SAUCE	10000	g	95	56.17
Sauce	허니갈릭용소스	4.4LB/5 (2KG) SWEET SOY SAUCE	10000	g	95	90.00
Sauce	신올떡볶이소스	4.4LB/5 (2KG) SHIN ALL TOKKBOKKI SAUCE	10000	g	95	105.79
Sauce	갈비치킨소스	4.4LB/6 (2KG) GALBI FLAVOURED SAUCE	12000	g	95	86.48
Powder	치즈맛시즈닝	CHEESE FLAVOUR SEASONING	7500	g	95	104.06
Powder	배터믹스(솔루션)	1.1LB/15 (500g) CHEESE FLAVOUR SEASONING	34000	g	95	69.91
Powder	배터믹스(올리브치킨용)	11LB/4 (5KG) BATTERING POWDER MIX	20000	g	95	78.50
Powder	배터믹스(허니갈릭용)	4.4LB/10 (2KG) BATTERING POWDER MIX	20000	g	95	78.57
Powder	마리네이드믹스(올리브치킨용)	11LB/4 (5KG) MARINATING POWDER MIX	20000	g	95	146.54
Powder	염장제	11LB/4 (5KG) PICKLE SOLUTION POWDER	20000	g	95	68.83
Powder	마리네이드믹스(비비윙용)	2.2LB/20 (1KG) BB WINGS MARINATING MIX	20000	g	95	206.72
Powder	LTV프리믹스	11LB/4 (5KG) PREMIX LTV	20000	g	100	151.62
Powder	저크시즈닝	4.4LB/10 (2KG) JERK BARBEQUE SEASONING	20000	g	100	312.82
Powder	골드더스트크런치	3.52oz(100g)/20 FRIED CEREAL MIX	2000	g	95	30.62
Dry goods	치킨트레이(중)	100EA TO-GO BOX TRAY(M)	100	ea	100	6.73
Dry goods	치킨트레이(소)	100EA TO-GO BOX TRAY(S)	100	ea	100	5.98
Dry goods	나무젓가락	500EA CHOPSTICK	500	ea	100	14.30
Dry goods	내프킨	5000EA NAPKIN	500	ea	100	21.26
Dry goods	물티슈	500EA WET TISSUE	500	ea	100	9.96
Dry goods	비닐쇼핑백(대)	100/20EA PLASTIC BAG (L)	2000	ea	100	127.23
Dry goods	비닐쇼핑백(중)	100/20EA PLASTIC BAG (M)	2000	ea	100	50.00
Dry goods	비닐쇼핑백(소)	100/20EA PLASTIC BAG (S)	2000	ea	100	53.76
Dry goods	패키지박스(대)	100 EA PACKAGE BOX (L)	100	ea	100	35.50
Dry goods	패키지박스(중)	100 EA PACKAGE BOX (M)	100	ea	100	25.98
Dry goods	패키지박스(소)	Package Box(S)/패키지박스(소) (100ea)	100	ea	100	26.09
Dry goods	T-Shirts XL (Kitchen)	T-Shirts XL (Kitchen) -- 비비큐 EA	50	ea	100	17.44
Dry goods	T-Shirts L (Kitchen)	T-Shirts L (Kitchen) -- 비비큐 EA	50	ea	100	17.44
Dry goods	T-Shirts M (Kitchen)	T-Shirts M (Kitchen) -- 비비큐 EA	50	ea	100	17.44
Dry goods	T-Shirts S (Kitchen)	T-Shirts S (Kitchen) -- 비비큐 EA	50	ea	100	17.44
Dry goods	Cap (Kitchen, Black)	Cap (Kitchen, Black) -- 비비큐 EA	50	ea	100	12.68
Dry goods	떡볶이 용기	[PET] KRAFT BOWL 1,300 -- 비비큐 50pcs/6 Bags	300	ea	100	63.19
Dry goods	떡볶이 뚜껑	[PET] KRAFT BOWL LID COVER 1,300 -- 비비큐 50pcs/6 Bags	300	ea	100	58.59
Dry goods	컵용기 (이너컵)	PP Half, Moon Tray -- 50pcs/12 Bags	600	ea	100	107.62
Dry goods	치킨간지	Wax paper	1000	ea	100	18.49
Dry goods	2oz 포션컵	2oz portion cup	2500	ea	100	40.03
Dry goods	2oz 포션컵 (뚜껑)	2oz portion cup (lid)	2500	ea	100	40.03
Dry goods	4oz 포션컵	4oz portion cup	2500	ea	100	59.95
Dry goods	4oz 포션컵 (뚜껑)	4oz portion cup (lid)	2500	ea	100	59.95
Dry goods	8oz 포션컵	8oz portion cup	2500	ea	100	59.50
Dry goods	8oz 포션컵 (뚜껑)	8oz portion cup (lid)	2500	ea	100	33.50
Dry goods	치즈볼 봉투	Cheese balls Paper	2000	ea	100	24.65
Dry goods	햄버거 Paper(White)	HAMBURGER PAPER (WHITE) (3,000PCS/BOX) - BOX	3000	ea	100	153.05
Dry goods	햄버거 Paper(Yellow)	HAMBURGER PAPER (YELLOW) (3,000PCS/BOX) - BOX	3000	ea	100	194.44
Dry goods	샐러드 용기	Salad Bowl (PET) -- 비비큐 50pcs/8 Bags	400	ea	100	100.85
Dry goods	샐러드 용기커버	Salad Cover (PET) -- 비비큐 100pcs/4 Bags	400	ea	100	71.50
Dry goods	치즈볼 용기(S)	Cheese Balls container(s)	600	ea	100	137.00
Dry goods	치즈볼 용기(M)	Cheese Balls container(m)	300	ea	100	47.02
Dry goods	치즈볼 용기 6p	Cheese Balls Togo container	600	ea	100	137.00
Dry goods	꼬치스틱	Skewer Stick	100	ea	99	12.00
Food	치즈볼	1.98LB(900g)/10 CHEESE BALL	300	ea	100	106.98
Food	멘보샤	Mianbaoxia	240	ea	100	129.90
Food	프랜치 프라이	French fries	100	g	99	0.39
Food	초코볼	Choco Cheese Ball/쵸코볼 (12/560g)	240	ea	95	95.00
Food	떡볶이 떡	Ddukboki rice cake	12000	g	95	47.22
Food	사각어묵	Fish Cake	10800	g	95	76.80
Food	쪽파	Green onion	400	g	95	4.49
Food	흰밥	White Rice	18000	g	99	39.99
Food	양파	Onion	2270	g	99	5.99
Food	마요네스	mayonnaise	16000	ml	95	97.98
Food	계란물	Egg Washer	1000	g	99	5.03
Food	계란	Egg	30	ea	100	10.49
Food	단무지	yellow Radish	1000	g	99	6.99
Food	김가루	Seaweed Flake	10	g	99	3.99
Food	뉴슈가	Newsugar	2000	g	95	21.00
Food	설탕	Sugar	2000	g	95	2.97
Food	강초	Pure vinegar	1800	g	99	7.60
Food	꽃소금	Salt	1000	g	99	6.00
Food	무	Radish	1000	g	99	3.00
Food	다진마늘	Minced Garlic	12000	g	99	140.00
Food	청양고추	jalapeno	255	g	99	4.97
Produced	치킨무	Chicken Radish	18000	g	99	39.14
Produced	아루굴라	Arugula	142	g	99	4.99
Food	풀드치킨	Pulled Chicken	2150	g	99	32.77
Food	출드치킨소스	Pulled Chicken Sauce	2100	g	99	5.10
Food	나초	Nacho Chips	455	g	99	4.78
Food	살사소스	Salsa Sauce	1560	g	99	13.93
Food	고수	Cilantro	28	g	99	1.90
Food	핫도그빵	Hotdog Bun	6	ea	99	5.20
Food	콘샐러드	Corn Salad	100	g	99	0.40
Food	불닭소스	Buldak Sauce	1000	g	99	10.00
Food	후추가루	Ground Black Pepper	540	g	99	18.56
Food	참기름	Sesame Oil	500	ml	99	19.99
Food	멸치액젓	Anchovy Fish Sauce	3000	g	99	37.99
Food	다시다	Dashida	1000	g	99	29.99
Food	바베큐소스	BBQ Sauce	3780	ml	99	19.09
Food	파프리카 파우더	Paprika Powder	130	g	99	1.97
Food	어니언 파우더	Onion Powder	130	g	99	1.97
Food	오레가노	Dried Oregano	80	g	99	1.97
Food	타임	Dried Thyme Leave	120	g	99	1.97
Food	코셔 소금	Kosher Salt	454	g	99	5.67
Food	카이옌 페퍼	Cayenne Pepper	125	g	99	1.97
Food	미원	Miwon	1000	g	99	28.99
Food	휘핑크림	Whipping Cream	1000	ml	99	5.09
Food	유자	Yuzu Marmalade	500	g	99	15.94
Food	당면	Glass Noodle	1000	g	99	17.98
Food	카라멜 소스	Caramel Sauce	190	ml	99	4.99
Food	오뎅볼	Assorted Fish Ball	500	g	99	6.99
Food	파프리카	Sliced Paprika	454	g	99	3.99
Food	토티아	Tortilla	10	ea	99	3.67
Food	우동면	Udon noodle	5	ea	99	7.99
Food	김치	kimchi	10000	g	99	34.00
Food	MSG	MSG	1000	g	99	29.99
Food	고추가루	Red chakchak	454	g	99	9.99
Food	베이컨	Bacon	2000	g	99	22.29
Food	토마토	Tomato	100	g	99	0.59
Food	소시지	Sausage	2000	g	99	21.99
Food	로제떡볶이소스	Rosé Sauce	1000	g	99	7.49
Food	간장베이스소스	Soy Base Sauce	1000	g	99	2.56
Food	Spicy Korean Grilled chicken	Spicy Korean Grilled chicken	1000	g	99	8.29
Food	Jamaican Grilled Chicken	Jamaican Grilled Chicken	1000	g	99	8.29
Food	Grilled Soy Garlic Chicken	Grilled Soy Garlic Chicken	1000	g	99	8.29
Food	Korean Soy Grilled Chicken	Korean Soy Grilled Chicken	1000	g	99	8.29
Food	Spicy korean grill sauce	Spicy korean grill sauce	1000	g	99	8.00
Food	Jamaican grill sauce	Jamaican grill sauce	1000	g	99	8.00
Food	korean soy grill sauce	korean soy grill sauce	1000	g	99	8.00
Food	오리엔탈소스	Oriental Sauce	1000	g	99	3.48
Food	Coleslaw	Coleslaw	100	g	99	0.40
Food	올리브	Black Olive	2840	g	99	6.81
Food	Corn(Canned)	Canned Corn	2840	g	99	7.62
Food	Feta Cheese	Feta Cheese	1000	g	99	14.12
Food	푸실리 파스타	Fusilli Pasta	2270	g	99	11.80
Food	크루통	Croutons	1020	g	99	9.08
Food	모짜렐라	Shredded Mozzarella	2500	g	99	33.57
Food	허니머스타드	Honey Mustard Dressing	4000	ml	99	15.88
Food	이탈리안 드레싱	Italian Dressing	4000	ml	99	17.65
Food	시져 드레싱	Caesar Dressing	3780	ml	99	22.50
Food	파마산 치즈	Parmesan Cheese	680	g	99	19.49
Food	케쳡	Ketchup	1500	ml	99	5.97
Food	설탕(대용량)	Sugar (Bulk)	20000	g	99	5.29
Food	소금	Salt	750	g	99	4.23
Food	식초	Vinegar	4000	ml	99	3.27
Food	레몬즙	Lemon Juice	425	g	99	2.17
Food	파슬리	Parsley Powder	265	g	99	15.09
Food	양배추	Cabbage	454	g	95	1.49
Food	채소잎	Baby leaves heritage blend	500	g	99	13.06
Food	로메인	Romaine	500	g	99	4.57
Food	치즈커드	Cheese Curd	80	g	99	0.89
Food	후추	Black pepper	2100	g	99	15.09
Food	방울 토마토	Grape Tomato	907	g	99	6.99
Food	참깨	Sesame	454	g	99	12.99
Food	당근	Carrot	1360	g	90	2.97
Food	피망	Bell Pepper	454	g	99	4.00
Food	무염버터	Unsalted Butter	453	g	99	6.99
Food	물엿	Corn syrup	1800	ml	99	9.99
Food	미림	Cook wine	1800	ml	99	10.99
Food	컬리플라워	Cauliflower	1000	g	80	5.00
Food	브로콜리	Broccoli	453	g	99	1.99
Food	깔라마리	Calamari	1813	g	99	72.80
Food	Spring Mix	spring mix	312	g	95	4.99
Food	베이컨 바이트	Bacon Bite	2200	g	99	33.77
Food	갈릭 파우더	Garlic Powder	150	g	99	1.97
Food	올리브 오일	Olive oil (extra virgin)	2000	ml	99	16.97
Food	새우스틱	새우스틱--비비큐 1.76LB(800G/6) FROZEN SHRIMP STICK	60	ea	100	61.00
Food	치킨무(피클)	Pickled Radish	18000	g	95	39.14
Food	후리카케	Nori Furikake	22	g	99	3.65
Food	캡사이신	Capsaicin	290	g	99	11.99
Food	칠리파우더	Chili powder	150	g	99	1.97
Food	핫크리스피 시즈닝	Hot And Spicy Crispy Seasoning	20000	g	99	265.00
Food	레드착착 시즈닝	Red CHAK CHAK seasonging	5000	g	99	172.02
Food	블랙페퍼 시즈닝	Black Pepper Chicken Seasoning	12000	g	99	156.23
Food	아보카도	avocado	1	ea	99	1.00
Food	딸기	strawberry	907	g	99	9.99
Food	블루베리	blueberry	510	g	99	7.99
Food	바나나	banana	5	ea	99	1.37
Food	케일	kale	260	g	99	3.49
Food	양상추	ice burg	500	g	99	3.49
Food	체리토마토	cherry tomato	907	g	99	6.99
Food	레몬시럽	Lemon syrup	600	g	99	1.86
Food	깐마늘	peeled garlic	374	g	99	3.29
Food	후레시 파슬리	fresh parsley	152	g	99	2.49
Food	크림치즈	cream cheese	1000	g	99	10.89
Food	사워크림	sour cream	453	g	99	2.49
Food	바닐라 아이스크림	vanilla icecream	4000	g	99	7.99
Food	그릴치킨	grilled chicken	1000	g	85	9.00
Food	양송이	button mushroom	100	g	99	1.21
Food	마늘꽁피	Garlic confit	850	g	99	4.70
Food	훈제연어	smoked salmon	550	g	99	24.09
Food	새우 31-40	prawn 31-40	907	g	99	17.99
Food	슈가파우더	sugar powder	1000	g	99	3.30
Food	나초치즈	nacho cheese	3000	g	99	15.89
Food	크랜베리	dried cranberry	1800	g	99	15.99
Food	아몬드칩	sliced almonds	295	g	99	8.09
Food	비스켓	biscuit	300	g	99	3.00
Food	오레오	oreo	260	g	99	3.99
Food	플랫브레드	flat bread	12	ea	99	8.49
Food	파스타 로티니	pasta rotini	1810	g	99	4.49
Food	토마토소스	tomato sauce	3600	g	99	13.99
Food	페스토	pesto	630	g	99	13.99
Food	치즈소스	cheesy sauce	300	g	99	2.60
Food	초코시럽	choco syrup	523	g	99	4.99
Food	딸기시럽	strawberry syrup	472	g	99	4.99
Food	카라멜시럽	caramel syrup	462	g	99	4.99
Food	크로와상	croissant	12	ea	99	5.99
Food	크로와상 생지	croissant dough	204	ea	99	70.99
Food	누텔라	nutella	2000	g	99	17.49
Food	레몬드레싱	Lemon dressing	505	g	99	5.13
Food	호두크럼블	Walnut crumble	305	g	99	8.37
Food	딜피클	Dill pickles	1000	g	99	4.77
Food	콘프로스트	corn frost	1060	g	99	8.97
Food	병아리콩	chick peas / can	400	g	99	1.99
Food	슬라이스 치즈	sliced cheese	825	g	99	10.99
Food	크리미소스	Creamy Sauce	6000	g	95	17.82
Food	머스타드	Mustard	550	g	95	3.77
Food	김치베이스	Kimchi base	1177	g	95	11.60
Food	다크소이소스	dark soy sauce	500	g	99	3.98
Food	불고기용 소고기	Sliced Beef	2500	g	95	39.47
Food	감자	potato	4535	g	90	8.97
Food	생크림	Whip Cream	946	ml	95	6.28
Food	우유	Milk	2000	ml	95	4.78
Food	베이컨(낱개)	bacon (single)	100	g	99	1.59
Food	믹스베지	Mixed Vegitable	1000	g	99	4.32
Food	쌀	Rice	40000	g	95	40.00
Food	할라피뇨	Jalapeno	255	g	95	4.97
Food	간장	Soy Sauce	1900	g	95	7.47
Food	순두부	Korean soft tofu	1	ea	99	2.99
Food	애호박	Zucchini	100	g	95	0.30
Food	스팸	Spam	340	g	95	4.47
Food	모듬 해산물	Mixed Seafood	800	g	99	8.97
Food	순두부 다대기	Sundubu-Dadaeki	340	g	95	10.70
Food	고추기름	Red pepper oil	150	ml	95	6.99
Food	돼지고기	pork belly	100	g	95	1.87
Food	김치찌개	Kimchi JJIGAE	4060	g	95	45.49
Food	두부	Tofu	700	g	95	2.99
Food	할라피뇨 피클	Pickled Jalapeno	375	g	50	1.97
Food	스모크 리퀴드	Smoke Liquid	103	g	95	2.97
Food	할라피뇨 크림 소스	Jalapeño Creamy Sauce	1125	g	95	13.81
Produced	콜팝 컵	Colpop cups	500	ea	100	116.86
Produced	콜팝 뚜껑 (리드)	Colpop containers	500	ea	100	79.65
Produced	빨대	straws	200	ea	100	8.95
Produced	이쑤시개	toothpick	500	ea	100	19.99
Produced	캔 음료	Pop (can)	1	ea	100	0.95
Food	디핑소스	Dipping Sauce	603	ml	95	4.42
Food	어니언링	Onion Rings	4000	g	95	45.72
Food	소시지(낱개)	Sausage (single)	12	g	100	2.97
Food	모짜스틱	mozzarella sticks	60	g	95	16.99
Food	모듬 야채	Mixed Vegitable (assorted)	1000	g	100	0.00
Food	버거 스틱	bamboo stick	2500	ea	100	27.95
Food	당면(낱개)	starch noodle (single)	5	ea	100	7.99
Food	비엣홍피시소스	viet houng fish sauce	100	ml	95	1.46
Food	오이	cucumber	300	g	90	0.96
Food	큐큐드레싱	cucu dressing	1560	g	95	22.54
Food	보리오슈번	Brioche Bun	72	ea	95	45.79
Food	갈릭마요	Garlic mayo	603	g	95	4.42
Food	마라마요	Mala mayo	200	g	95	1.90
Food	비비큐다시	bb.q dashi	6350	g	95	3.79
Food	김말이	SEAWEED ROLL	400	g	100	116.86
Food	만두	Dumpling	20	g	95	6.82
Food	레몬 윗지	lemon Wedge	8	g	95	0.99
Food	순두부 찌개 소스	Sundubu Sauce	1000	g	95	0.00
Food	말린 멸치	Dried anchovy	420	g	100	8.99
Food	다시마	Dried kelp	114	g	100	5.99
Food	된장	Soybean Paste	500	g	95	6.99
Food	조개다시	Clam Dasida	1000	g	95	23.39
`.trim();

function parseIngredients(tsv) {
  const lines = tsv.split('\n').filter(l => l.trim());
  const results = [];
  let lastCategory = 'Food';
  
  for (const line of lines) {
    const parts = line.split('\t').map(p => p.trim());
    if (parts.length < 4) continue;
    
    let [category, koreanName, englishName, quantity, unit, yieldRate, price] = parts;
    
    // 카테고리 정규화
    category = category || lastCategory;
    if (category.toLowerCase() === 'food') category = 'Food';
    else if (category.toLowerCase() === 'produced') category = 'Produced';
    else if (category.toLowerCase() === 'dry goods') category = 'Dry goods';
    else if (category.toLowerCase() === 'oil') category = 'Oil';
    else if (category.toLowerCase() === 'raw chicken') category = 'Raw chicken';
    else if (category.toLowerCase() === 'sauce') category = 'Sauce';
    else if (category.toLowerCase() === 'powder') category = 'Powder';
    
    if (category) lastCategory = category;
    
    // 이름 처리
    koreanName = koreanName || englishName || '';
    englishName = englishName || koreanName || '';
    
    if (!koreanName && !englishName) continue;
    
    // % 기호 제거 및 숫자 파싱
    const yieldNum = parseFloat(String(yieldRate).replace('%', '')) || 100;
    const priceNum = parseFloat(String(price).replace('$', '').replace(',', '')) || 0;
    
    results.push({
      category: category || 'Food',
      koreanName: koreanName,
      englishName: englishName,
      quantity: parseFloat(quantity) || 0,
      unit: unit || 'g',
      yieldRate: yieldNum,
      price: priceNum
    });
  }
  
  return results;
}

async function seed() {
  console.log('🌱 Turso DB 식재료 시딩 시작...');
  
  // 1. 기존 데이터 삭제
  console.log('\n🧹 기존 데이터 삭제 중...');
  try {
    await client.execute('DELETE FROM IngredientTemplateItem');
    await client.execute('DELETE FROM IngredientMaster');
    await client.execute('DELETE FROM IngredientTemplate');
    console.log('   ✅ 기존 데이터 삭제 완료');
  } catch (e) {
    console.log('   ⚠️ 삭제 중 오류 (무시):', e.message?.substring(0, 50));
  }
  
  const ingredients = parseIngredients(INGREDIENTS_TSV);
  console.log(`\n📦 ${ingredients.length}개 식재료 파싱 완료`);
  
  // 2. 템플릿 생성
  console.log('\n📋 템플릿 생성 중...');
  const now = nowISO();
  const templates = {
    CA: { id: cuid(), name: 'Canada (Default)', currency: 'CAD' },
    MX: { id: cuid(), name: 'Mexico', currency: 'MXN' },
    CO: { id: cuid(), name: 'Colombia', currency: 'COP' }
  };
  
  for (const [country, t] of Object.entries(templates)) {
    await client.execute({
      sql: `INSERT INTO IngredientTemplate (id, name, country, description, isActive, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, 1, ?, ?)`,
      args: [t.id, t.name, country, `Ingredient template for ${country} stores`, now, now]
    });
    console.log(`   ✅ ${t.name} 템플릿 생성됨`);
  }
  
  // 3. 식재료 마스터 + 템플릿 아이템 생성
  console.log('\n🥘 식재료 마스터 데이터 생성 중...');
  let created = 0;
  let errors = 0;
  
  for (const ing of ingredients) {
    const masterId = cuid();
    
    try {
      // IngredientMaster 생성
      await client.execute({
        sql: `INSERT INTO IngredientMaster (id, category, koreanName, englishName, quantity, unit, yieldRate, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [masterId, ing.category, ing.koreanName, ing.englishName, ing.quantity, ing.unit, ing.yieldRate, now, now]
      });
      
      // 각 템플릿에 IngredientTemplateItem 생성
      for (const [country, template] of Object.entries(templates)) {
        const itemId = cuid();
        const price = country === 'CA' ? ing.price : 0;
        
        await client.execute({
          sql: `INSERT INTO IngredientTemplateItem (id, templateId, ingredientId, price, currency, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
          args: [itemId, template.id, masterId, price, template.currency, now, now]
        });
      }
      
      created++;
      if (created % 30 === 0) {
        console.log(`   ...${created}/${ingredients.length} 처리됨`);
      }
    } catch (e) {
      errors++;
      console.log(`   ⚠️ ${ing.koreanName} 오류: ${e.message?.substring(0, 60)}`);
    }
  }
  
  console.log(`\n✅ ${created}개 식재료 생성 완료! (${errors}개 오류)`);
  
  // 결과 확인
  const masterCount = await client.execute('SELECT COUNT(*) as count FROM IngredientMaster');
  const templateCount = await client.execute('SELECT COUNT(*) as count FROM IngredientTemplate');
  const itemCount = await client.execute('SELECT COUNT(*) as count FROM IngredientTemplateItem');
  
  console.log('\n📊 최종 결과:');
  console.log(`   IngredientMaster: ${masterCount.rows[0].count}개`);
  console.log(`   IngredientTemplate: ${templateCount.rows[0].count}개`);
  console.log(`   IngredientTemplateItem: ${itemCount.rows[0].count}개`);
  
  // 샘플 확인
  console.log('\n🔍 샘플 데이터:');
  const samples = await client.execute('SELECT category, koreanName, englishName FROM IngredientMaster LIMIT 5');
  samples.rows.forEach(r => console.log(`   - [${r.category}] ${r.koreanName} / ${r.englishName}`));
}

seed().catch(console.error);
