// Canada 가격 템플릿 데이터 시드
// 첨부된 스프레드시트 기반 재료 가격 데이터

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@libsql/client');

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// 스프레드시트에서 추출한 재료 데이터 (한국어명, 영문명, 가격)
const canadaIngredients = [
  // 오일류
  { koreanName: '비비큐 치킨오일', englishName: 'BBQ chicken OIL', price: 80.00, category: 'Oil' },
  { koreanName: '마라유', englishName: 'Ma-ra oil', price: 0, category: 'Oil' },
  { koreanName: '버터', englishName: 'Butter', price: 0, category: 'Oil' },
  
  // 소스류 (KAJU)
  { koreanName: '참숯 바베큐 소스', englishName: 'Fresh Charcoal BBQ sauce', price: 45.81, category: 'Sauce' },
  { koreanName: '카츄 어니언 소스', englishName: 'KAJU.T.ORG.ONION SAUCE', price: 37.00, category: 'Sauce' },
  { koreanName: '마라 핫 소스(마라양념)', englishName: 'KAJU.T.ORG.MALA HOT SAUCE', price: 0, category: 'Sauce' },
  { koreanName: '갈릭스파이스소스(마늘맛쏙)', englishName: 'KAJU.T.ORG.GARLIC SPICE SAUCE', price: 0, category: 'Sauce' },
  { koreanName: '교촌허니간장소스', englishName: 'KAJU.T.ORG.GARLIC FLAVORED SOY SAUCE', price: 56.00, category: 'Sauce' },
  { koreanName: '핫소스', englishName: 'Hot sauce', price: 41.00, category: 'Sauce' },
  { koreanName: '스윗칠리소스', englishName: 'KAJU.T.ORG.BBQ BARBEQUE SAUCE', price: 36.00, category: 'Sauce' },
  { koreanName: '바베큐소스', englishName: 'KAJU.T.ORG.BBQ BARBEQUE SAUCE', price: 36.00, category: 'Sauce' },
  { koreanName: '칠리릴렉소스', englishName: 'KAJU.T.ORG.BBQ BARBEQUE SAUCE', price: 36.00, category: 'Sauce' },
  { koreanName: '갈릭 디핑 소스', englishName: 'KAJU.T.ORG.GARLIC FLAVORED SAUCE', price: 0, category: 'Sauce' },
  
  // 파우더류
  { koreanName: '비비큐 치킨 플레이버 파우더', englishName: '1.5LB/676G.CHEESE FLAVOUR SEASONING', price: 52.00, category: 'Powder' },
  { koreanName: '치즈시즈닝(콥플)', englishName: '1.5LB.KAJU.ORG.CHEESE FLAVOUR SEASONING', price: 52.00, category: 'Powder' },
  { koreanName: '치킨 파우더(비비큐 튀김가루)', englishName: 'KAJU.T.ORG.BATTERING POWDER MIX', price: 30.58, category: 'Powder' },
  { koreanName: '닭강정 파우더', englishName: 'KAJU.T.ORG.BATTERING POWDER MIX', price: 30.58, category: 'Powder' },
  { koreanName: '마리네이드 믹스', englishName: '22LB(10.KG).BBQ.WHOLE MARINATING MIX', price: 75.20, category: 'Powder' },
  { koreanName: '마리네이드(뼈없는용)', englishName: '22LB(10.KG).BBQ.WHOLE MARINATING MIX', price: 75.20, category: 'Powder' },
  { koreanName: '비비큐 바베큐시즈닝(스파이시)', englishName: 'KAJU.T.ORG.BYK BARBECUE SEASONING', price: 0, category: 'Powder' },
  { koreanName: '고소한맛낸다 파우더', englishName: 'KAJU.T.ORG.SEASONING MIX', price: 0, category: 'Powder' },
  
  // 건자재류
  { koreanName: '아몬드', englishName: 'SOGA ALMONDS', price: 0, category: 'Dry goods' },
  { koreanName: '아몬드 분태', englishName: 'SOGA ALMONDS', price: 0, category: 'Dry goods' },
  { koreanName: '땅콩', englishName: 'SOGA NACHOS', price: 0, category: 'Dry goods' },
  { koreanName: '팝핑보바볼', englishName: 'SOGA NACHOS', price: 0, category: 'Dry goods' },
  { koreanName: '비닐백', englishName: 'PROGBA PLASTIC BAG 01', price: 17.32, category: 'Dry goods' },
  { koreanName: '상자박스류', englishName: 'BBQ BOX (5Type)', price: 0, category: 'Dry goods' },
  { koreanName: '위생장갑 (비닐)', englishName: 'BBQ LA PACKAGE BOX 01', price: 30.00, category: 'Dry goods' },
  { koreanName: '위생장갑 (고무)', englishName: 'BBQ LA PACKAGE BOX 02', price: 0, category: 'Dry goods' },
  { koreanName: '종이컵', englishName: 'Paper cup', price: 0, category: 'Dry goods' },
  { koreanName: 'Package Box(비비큐테이크아웃 L사이즈)', englishName: 'Package Box(비비큐테이크아웃 L사이즈)', price: 0, category: 'Dry goods' },
  { koreanName: '이쑤시개', englishName: 'T-sticks, stickers', price: 0, category: 'Dry goods' },
  { koreanName: '황금올리브팩', englishName: 'G.O yellow bag', price: 0, category: 'Dry goods' },
  { koreanName: '일반싸이비닐', englishName: 'thigh vinyl bag', price: 0, category: 'Dry goods' },
  { koreanName: '작은 비닐봉투', englishName: '[PET] KRAFT BOWL LID, COVER 1,000 - 캐나다 Staple5 Bags', price: 0, category: 'Dry goods' },
  { koreanName: '소스컵', englishName: 'Sauce cup', price: 0, category: 'Dry goods' },
  { koreanName: '타르트형 종이컵', englishName: '200 portion cup', price: 0, category: 'Dry goods' },
  { koreanName: '800포션컵', englishName: '800 portion cup', price: 0, category: 'Dry goods' },
  
  // 식재료
  { koreanName: '딸기', englishName: 'Red pepper', price: 0, category: 'Food' },
  { koreanName: '매운고추', englishName: 'Red pepper', price: 0, category: 'Food' },
  { koreanName: '고추 청양', englishName: 'Cheongyang pepper', price: 0, category: 'Food' },
  { koreanName: '고추(풋고추)', englishName: 'green pepper', price: 0, category: 'Food' },
  { koreanName: '햄버거 패티', englishName: 'HAMBURGER PORK (WHITE) JUMBO SPECIAL BOX', price: 0, category: 'Food' },
  { koreanName: '양상추', englishName: 'letuce', price: 0, category: 'Food' },
  { koreanName: '샐러드볼(생야채)', englishName: 'Salad Bowl (생야채) - 비비큐 Staple5 Bags', price: 0, category: 'Food' },
  { koreanName: '치즈볼(냉동)', englishName: 'Cheese Balls 냉동/해동/해동제 비비큐', price: 0, category: 'Food' },
  { koreanName: '치즈스틱/스트링', englishName: 'String Mozzarella Cheese Ball (30 ea*5/box)', price: 0, category: 'Food' },
  { koreanName: '버터밀크 비스켓', englishName: '1개용.비스킷(2개/SIZE SNALL)', price: 0, category: 'Food' },
  { koreanName: '치즈볼', englishName: 'Choco Cheese Ball/치즈볼+초코 (12/36g)', price: 0, category: 'Food' },
  { koreanName: '물', englishName: 'water', price: 0, category: 'Food' },
  { koreanName: '얼음', englishName: 'Ice', price: 0, category: 'Food' },
  { koreanName: '핫도그', englishName: 'Hot Dog', price: 0, category: 'Food' },
  { koreanName: '마늘', englishName: 'Garlic', price: 0, category: 'Food' },
  { koreanName: '생강', englishName: 'Ginger', price: 0, category: 'Food' },
  { koreanName: '파', englishName: 'gree onion', price: 0, category: 'Food' },
  { koreanName: '로즈마리', englishName: 'Rosemary', price: 0, category: 'Food' },
  { koreanName: '파마산치즈', englishName: 'Parmesan', price: 0, category: 'Food' },
  { koreanName: '고추가루', englishName: 'Red pepper flakes', price: 0, category: 'Food' },
  { koreanName: '설탕', englishName: 'sugar', price: 0, category: 'Food' },
  { koreanName: '소금', englishName: 'Salt', price: 0, category: 'Food' },
  { koreanName: '머스타드 소스(겨자)', englishName: 'Mustard Garlic', price: 0, category: 'Food' },
  { koreanName: '무', englishName: 'Moo(raddish)', price: 0, category: 'Food' },
  { koreanName: '깻잎', englishName: 'sesame leaves', price: 0, category: 'Food' },
  { koreanName: '양파', englishName: 'Onion', price: 0, category: 'Food' },
  { koreanName: '풀드 치킨', englishName: 'Pulled Chicken', price: 0, category: 'Food' },
  { koreanName: '풀드 치킨 소스', englishName: 'Pulled Chicken Sauce', price: 0, category: 'Food' },
  { koreanName: '갈릭 갈비 치킨', englishName: 'Grilled Soy Garlic Chicken', price: 0, category: 'Food' },
  { koreanName: '스테이크 소스', englishName: 'Steak Sauce', price: 0, category: 'Food' },
  { koreanName: '라면', englishName: 'Ramen', price: 0, category: 'Food' },
  { koreanName: '감자', englishName: 'Potato', price: 0, category: 'Food' },
  { koreanName: '레몬', englishName: 'Lemon', price: 0, category: 'Food' },
  { koreanName: '버팔로 소스', englishName: 'Buffalo Sauce', price: 0, category: 'Food' },
  { koreanName: '케첩', englishName: 'Ketchup Red Sauce', price: 0, category: 'Food' },
  { koreanName: '안초비 피쉬소스', englishName: 'Anchovy Fish Sauce', price: 0, category: 'Food' },
  { koreanName: '고추장', englishName: 'Gochujang', price: 0, category: 'Food' },
  { koreanName: 'BBQ소스', englishName: 'BBQ Sauce', price: 0, category: 'Food' },
  { koreanName: '파프리카 파우더', englishName: 'Paprika Powder', price: 0, category: 'Food' },
  { koreanName: '양파가루', englishName: 'Onion Powder', price: 0, category: 'Food' },
  { koreanName: '파슬리', englishName: 'Parsley', price: 0, category: 'Food' },
  { koreanName: '오레가노', englishName: 'Oregano', price: 0, category: 'Food' },
  { koreanName: '크래머 솔트', englishName: 'Cramer Salt', price: 0, category: 'Food' },
  { koreanName: '물엿', englishName: 'corn syrup', price: 0, category: 'Food' },
  { koreanName: '휘핑크림', englishName: 'Whipping Cream', price: 0, category: 'Food' },
  { koreanName: '유자청', englishName: 'Yuzu Marmalade', price: 0, category: 'Food' },
  { koreanName: '그린 시럽', englishName: 'Green Syrupp', price: 0, category: 'Food' },
  { koreanName: '토닉워터', englishName: 'Tonic water', price: 0, category: 'Food' },
  { koreanName: '패션프루츠 퓨레', englishName: 'Assorted fruit', price: 0, category: 'Food' },
  { koreanName: '바닐라아이스크림', englishName: 'Vanilla', price: 0, category: 'Food' },
  { koreanName: '감자튀김(냉동)', englishName: 'Frozen Fries', price: 0, category: 'Food' },
  { koreanName: '콜라', englishName: 'Cola', price: 0, category: 'Food' },
  { koreanName: '밥', englishName: 'Rice', price: 0, category: 'Food' },
  { koreanName: '계란', englishName: 'Egg', price: 0, category: 'Food' },
  { koreanName: '베이컨', englishName: 'Bacon', price: 0, category: 'Food' },
  { koreanName: '스팸', englishName: 'Spam', price: 0, category: 'Food' },
  { koreanName: '소시지', englishName: 'Sausage', price: 0, category: 'Food' },
  
  // 닭 원재료
  { koreanName: '매운 한국식 그릴드 치킨', englishName: 'Spicy Korean Grilled chicken', price: 0, category: 'Raw chicken' },
  { koreanName: '갈비 양념 치킨', englishName: 'Galbi Korean Grilled chicken', price: 0, category: 'Raw chicken' },
  { koreanName: '갈릭 간장 치킨', englishName: 'Grilled Soy Garlic Chicken', price: 0, category: 'Raw chicken' },
  { koreanName: '비비큐 코리안 그릴드 치킨', englishName: 'Korean Grill Chicken(Bulgogi Sauce)', price: 0, category: 'Raw chicken' },
  { koreanName: '자메이칸 갈릭 소스', englishName: 'jamaican grill sauce', price: 0, category: 'Raw chicken' },
  { koreanName: '치킨', englishName: 'Chicken', price: 0, category: 'Raw chicken' },
  { koreanName: '치킨 브레스트', englishName: 'Chiken Breast', price: 0, category: 'Raw chicken' },
  { koreanName: '치킨 레그', englishName: 'Chiken Leg', price: 0, category: 'Raw chicken' },
  { koreanName: '치킨 윙', englishName: 'Blank Wing', price: 0, category: 'Raw chicken' },
  { koreanName: '치킨 드럼스틱', englishName: 'Drumstick', price: 0, category: 'Raw chicken' },
  { koreanName: '치킨 싸이', englishName: 'Chicken Thigh', price: 0, category: 'Raw chicken' },
  { koreanName: '닭발', englishName: 'Kurin Pata', price: 0, category: 'Raw chicken' },
  { koreanName: '뼈없는 순살', englishName: 'Boneless', price: 0, category: 'Raw chicken' },
  { koreanName: '다진(슬라이스) 치킨', englishName: 'Shredded Mozzarella', price: 0, category: 'Raw chicken' },
  { koreanName: '슈레드 모짜렐라', englishName: 'Shredded Mozzarella', price: 0, category: 'Raw chicken' },
  { koreanName: '시저드레싱(냉장)', englishName: 'Caesar Dressing', price: 0, category: 'Food' },
  { koreanName: '케찹', englishName: 'Ketchup', price: 0, category: 'Food' },
  { koreanName: '랜치드레싱', englishName: 'Ranch', price: 0, category: 'Food' },
  { koreanName: '허니머스타드', englishName: 'Honey', price: 0, category: 'Food' },
  { koreanName: '파슬리 파우더', englishName: 'Parsley Powder', price: 0, category: 'Powder' },
  { koreanName: '마요네즈', englishName: 'Mayonnaise', price: 0, category: 'Food' },
  { koreanName: '발사믹 허니 글레이즈', englishName: 'Balsamic Glaze Dressing', price: 0, category: 'Food' },
  { koreanName: '발사믹 허니글레이즈', englishName: 'Bally leaves Heritage Blend', price: 0, category: 'Food' },
  { koreanName: '치폴레 아이올리', englishName: 'Aioli', price: 0, category: 'Food' },
  { koreanName: '후추', englishName: 'Black pepper', price: 0, category: 'Food' },
  { koreanName: '청양고추', englishName: 'cheongyang', price: 0, category: 'Food' },
  { koreanName: '참깨', englishName: 'Sesame', price: 0, category: 'Food' },
  { koreanName: '당근', englishName: 'Carrot', price: 0, category: 'Food' },
  { koreanName: '피망', englishName: 'Bell Pepper', price: 0, category: 'Food' },
  { koreanName: '옥수수', englishName: 'Corn', price: 0, category: 'Food' },
  { koreanName: '옥수수 전분', englishName: 'Corn seed', price: 0, category: 'Food' },
  { koreanName: '콜리플라워', englishName: 'Cauliflower', price: 0, category: 'Food' },
  { koreanName: '자색양배추', englishName: 'Cabbage', price: 0, category: 'Food' },
  { koreanName: '양배추', englishName: 'Cabbage', price: 0, category: 'Food' },
  { koreanName: '오이', englishName: 'Cucumber', price: 0, category: 'Food' },
  { koreanName: '할라피뇨', englishName: 'Jalapeno', price: 0, category: 'Food' },
  { koreanName: '올리브오일', englishName: 'Olive oil (Extra virgin)', price: 0, category: 'Oil' },
  { koreanName: '깻잎 캐나다, 새우 냉동', englishName: '새우조각,새우 LARGE용,비비큐,FROZEN SHRIMP STOCK', price: 0, category: 'Food' },
  { koreanName: '카프레시', englishName: 'Capelletti', price: 0, category: 'Food' },
  { koreanName: '핫 앤 스파이시 크리스피', englishName: 'Hot And Spicy Crispy Seasoning', price: 0, category: 'Powder' },
  { koreanName: '레드 핫 크리스피', englishName: 'Red Hot Crispy Seasoning', price: 0, category: 'Powder' },
  { koreanName: '흑후추 치킨 시즈닝', englishName: 'Black Pepper Chicken Seasoning', price: 0, category: 'Powder' },
  { koreanName: '게맛살', englishName: 'Lobster', price: 0, category: 'Food' },
  { koreanName: '케일', englishName: 'Kale', price: 0, category: 'Food' },
  { koreanName: '유제품', englishName: 'dairy', price: 0, category: 'Food' },
  { koreanName: '식초', englishName: 'vinegar', price: 0, category: 'Food' },
  { koreanName: '파슬리(말린것)', englishName: 'dried parsley', price: 0, category: 'Food' },
  { koreanName: '토마토 소스', englishName: 'tomato sauce', price: 0, category: 'Food' },
  { koreanName: '사워크림', englishName: 'sour cream', price: 0, category: 'Food' },
  { koreanName: '그래놀라', englishName: 'Granola', price: 0, category: 'Food' },
  { koreanName: '훈제연어', englishName: 'smoked salmon', price: 0, category: 'Food' },
  { koreanName: '비프 저키', englishName: 'dried beef', price: 0, category: 'Food' },
  { koreanName: '바질 페스토', englishName: 'basil pesto', price: 0, category: 'Food' },
  { koreanName: '크래프트 치즈', englishName: 'Kraft cheese', price: 0, category: 'Food' },
  { koreanName: '슬라이스 아몬드', englishName: 'sliced almonds', price: 0, category: 'Dry goods' },
  { koreanName: '빵', englishName: 'flat bread', price: 0, category: 'Food' },
  { koreanName: '치아바타', englishName: 'Ciabatta', price: 0, category: 'Food' },
  { koreanName: '햄버거번', englishName: 'Bun Bread', price: 0, category: 'Food' },
  { koreanName: '새우(냉동)', englishName: 'Frying shrimp', price: 0, category: 'Food' },
  { koreanName: '피클', englishName: 'Pickle', price: 0, category: 'Food' },
  { koreanName: '토마토', englishName: 'Tomato', price: 0, category: 'Food' },
  { koreanName: '참기름', englishName: 'Sesame oil', price: 0, category: 'Oil' },
  { koreanName: '간장', englishName: 'soy sauce', price: 0, category: 'Food' },
  { koreanName: '우스터 소스', englishName: 'Worcester sauce', price: 0, category: 'Food' },
  { koreanName: '레몬 드레싱', englishName: 'lemon dressing', price: 0, category: 'Food' },
  { koreanName: '스리라차', englishName: 'Sriracha', price: 0, category: 'Food' },
  { koreanName: '레몬즙', englishName: 'Lem fruit', price: 0, category: 'Food' },
  { koreanName: '드라이드 크랜베리', englishName: 'dried cranberry', price: 0, category: 'Dry goods' },
  { koreanName: '체다치즈', englishName: 'sharp cheese', price: 0, category: 'Food' },
  { koreanName: '자색감자칩', englishName: 'Cheese', price: 0, category: 'Food' },
  { koreanName: '토르티야 칩', englishName: 'Tortilla chip', price: 0, category: 'Food' },
  { koreanName: '새우깡(한국)', englishName: 'Korean Chips', price: 0, category: 'Food' },
  { koreanName: '크래프트 맥주', englishName: 'Kraft beer', price: 0, category: 'Food' },
  { koreanName: '달걀 노른자', englishName: 'egg yolk', price: 0, category: 'Food' },
  { koreanName: '플레인 요거트', englishName: 'Greek yogurt', price: 0, category: 'Food' },
  { koreanName: '헤비 크림', englishName: 'heavy Cream', price: 0, category: 'Food' },
  { koreanName: '혼합 채소', englishName: 'Mixed vegetables', price: 0, category: 'Food' },
  { koreanName: '식용유', englishName: 'Canola oil', price: 0, category: 'Oil' },
  { koreanName: '모짜렐라', englishName: 'mozzarella', price: 0, category: 'Food' },
  { koreanName: '한국식 만두피', englishName: 'korean dumplings', price: 0, category: 'Food' },
  { koreanName: '그릴 시럽', englishName: 'grill syrup', price: 0, category: 'Food' },
  { koreanName: '해산물 믹스', englishName: 'Mixed Seafood', price: 0, category: 'Food' },
  { koreanName: '소고기', englishName: 'Ground beef', price: 0, category: 'Food' },
  { koreanName: '빨간 피망', englishName: 'Red pepper oil', price: 0, category: 'Food' },
  { koreanName: '고춧기름', englishName: 'Chili oil', price: 0, category: 'Oil' },
  { koreanName: '프라이드 할라피뇨', englishName: 'Fried Jalapeno', price: 0, category: 'Food' },
  { koreanName: '액체 스모크', englishName: 'Smoke Liquid', price: 0, category: 'Food' },
  { koreanName: '갈비 치킨 소스', englishName: 'Galbi Chicken Sauce', price: 0, category: 'Sauce' },
  { koreanName: '코코넛 오일', englishName: 'COCO OIL', price: 0, category: 'Oil' },
  { koreanName: '레드페퍼', englishName: 'Red pepper', price: 0, category: 'Food' },
  { koreanName: '베이킹 소다', englishName: 'Baking Soda', price: 0, category: 'Food' },
  { koreanName: '뱅쇼용 레드 와인', englishName: 'Dessert Sauce', price: 0, category: 'Food' },
  { koreanName: '시나몬', englishName: 'Cylon Wings', price: 0, category: 'Food' },
  { koreanName: '라즈베리 시럽', englishName: 'raspberry syrup', price: 0, category: 'Food' },
  { koreanName: '모짜렐라 치즈', englishName: 'mozzarella cheese', price: 0, category: 'Food' },
  { koreanName: '피자 도우', englishName: 'Garllic pizza', price: 0, category: 'Food' },
  { koreanName: '불고기 소스', englishName: 'Bulgogi Sauce', price: 0, category: 'Sauce' },
  { koreanName: '브리오슈 번', englishName: 'Brioche Bun', price: 0, category: 'Food' },
  { koreanName: '글루텐 프리 파우더', englishName: 'Gluten free', price: 0, category: 'Powder' },
  { koreanName: '블루치즈', englishName: 'Blue', price: 0, category: 'Food' },
  { koreanName: '고르곤졸라', englishName: 'Gorgonzola', price: 0, category: 'Food' },
  { koreanName: '만두', englishName: 'Dumplings', price: 0, category: 'Food' },
  { koreanName: '선드라이 토마토', englishName: 'Sundried Tomatoes (2/240g)', price: 0, category: 'Food' },
  { koreanName: '가쓰오부시', englishName: 'Bonito flakes', price: 0, category: 'Food' },
  { koreanName: '뎀뿌라 가루', englishName: 'tempura', price: 0, category: 'Powder' },
  { koreanName: '단무지', englishName: 'Sweet pickled radish', price: 0, category: 'Food' },
  { koreanName: '간장치킨', englishName: 'Soybean Paste', price: 0, category: 'Raw chicken' },
  { koreanName: '된장', englishName: 'Soybean paste', price: 0, category: 'Food' },
  { koreanName: '해장국', englishName: 'Haeljangguk', price: 0, category: 'Food' },
  { koreanName: '당면', englishName: 'Korean Glass Noodles', price: 0, category: 'Food' },
  { koreanName: '노른자', englishName: 'Egg yolk', price: 0, category: 'Food' },
  { koreanName: '노란 단무지', englishName: 'yellow Radish', price: 0, category: 'Food' },
  { koreanName: '라디시', englishName: 'radish', price: 0, category: 'Food' },
  { koreanName: '파마산 치즈', englishName: 'Parmesan', price: 0, category: 'Food' },
  { koreanName: '브로콜리', englishName: 'Broccoli', price: 0, category: 'Food' },
  { koreanName: '고수', englishName: 'Coriander', price: 0, category: 'Food' },
  { koreanName: '두부', englishName: 'Tofu', price: 0, category: 'Food' },
  { koreanName: '콩', englishName: 'Soy', price: 0, category: 'Food' },
  { koreanName: '겨자', englishName: 'Mustard Garlic', price: 0, category: 'Food' },
  { koreanName: '깨', englishName: 'Sesame', price: 0, category: 'Food' },
  { koreanName: '치킨스톡', englishName: 'Chicken Stock', price: 0, category: 'Food' },
  { koreanName: '풀드치킨', englishName: 'Pulled Chicken', price: 0, category: 'Raw chicken' },
  { koreanName: '조선무', englishName: 'Joseon Radish(무)', price: 0, category: 'Food' },
  { koreanName: '숯불 바베큐 시즈닝', englishName: 'Charcoal Barbecue Seasoning', price: 0, category: 'Powder' },
  { koreanName: '미나리', englishName: 'water parsley', price: 0, category: 'Food' },
  { koreanName: '부추', englishName: 'chives', price: 0, category: 'Food' },
  { koreanName: '호박', englishName: 'Zucchini', price: 0, category: 'Food' },
  { koreanName: '표고버섯', englishName: 'shiitake mushroom', price: 0, category: 'Food' },
  { koreanName: '버섯', englishName: 'mushroom', price: 0, category: 'Food' },
  { koreanName: '양송이버섯', englishName: 'Button mushroom', price: 0, category: 'Food' },
  { koreanName: '새송이버섯', englishName: 'King oyster mushroom', price: 0, category: 'Food' },
  { koreanName: '느타리버섯', englishName: 'oyster mushroom', price: 0, category: 'Food' },
  { koreanName: '팽이버섯', englishName: 'enoki mushroom', price: 0, category: 'Food' },
  { koreanName: '쌀국수', englishName: 'Rice noodle', price: 0, category: 'Food' },
  { koreanName: '숙주', englishName: 'Mung bean sprouts', price: 0, category: 'Food' },
  { koreanName: '고구마 말랭이', englishName: 'dried sweet potato', price: 0, category: 'Food' },
  { koreanName: '타피오카 전분', englishName: 'tapioca starch', price: 0, category: 'Food' },
  { koreanName: '김', englishName: 'Seaweed', price: 0, category: 'Food' },
  { koreanName: '장조림', englishName: 'jangjorim', price: 0, category: 'Food' },
  { koreanName: '다시마', englishName: 'kelp', price: 0, category: 'Food' },
  { koreanName: '후리가게', englishName: 'Furikake', price: 0, category: 'Food' },
  { koreanName: '시금치', englishName: 'Spinach', price: 0, category: 'Food' },
  { koreanName: '참치 마요', englishName: 'Tuna Mayo', price: 0, category: 'Food' },
  { koreanName: '잡채밥', englishName: 'Japchae Rice', price: 0, category: 'Food' },
  { koreanName: '김치 볶음밥', englishName: 'Kimchi Fried Rice', price: 0, category: 'Food' },
];

async function generateId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 25; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return 'c' + result;
}

async function seedCanadaPrices() {
  console.log('🍗 Canada 가격 템플릿 데이터 시드 시작...\n');

  try {
    // 1. 기존 Canada 템플릿 찾기 또는 생성
    let templateResult = await client.execute(
      "SELECT id, name FROM IngredientTemplate WHERE name LIKE '%Canada%' OR country = 'CA' LIMIT 1"
    );
    
    let templateId;
    if (templateResult.rows.length === 0) {
      templateId = await generateId();
      await client.execute({
        sql: `INSERT INTO IngredientTemplate (id, name, country, description, isActive, createdAt, updatedAt) 
              VALUES (?, 'Canada', 'CA', 'Canada 가격 템플릿', 1, datetime('now'), datetime('now'))`,
        args: [templateId]
      });
      console.log('✅ Canada 템플릿 생성됨:', templateId);
    } else {
      templateId = templateResult.rows[0].id;
      console.log('✅ 기존 Canada 템플릿 사용:', templateId);
    }

    // 2. 기존 IngredientMaster 목록 조회
    const masterResult = await client.execute('SELECT id, koreanName, englishName, category FROM IngredientMaster');
    const existingMasters = new Map();
    for (const row of masterResult.rows) {
      existingMasters.set(row.koreanName, row);
      existingMasters.set(row.englishName?.toLowerCase(), row);
    }

    // 3. 기존 템플릿 아이템 조회
    const existingItemsResult = await client.execute({
      sql: 'SELECT id, ingredientId FROM IngredientTemplateItem WHERE templateId = ?',
      args: [templateId]
    });
    const existingItemIds = new Set();
    for (const row of existingItemsResult.rows) {
      existingItemIds.add(row.ingredientId);
    }

    let addedMasters = 0;
    let addedItems = 0;
    let updatedItems = 0;

    for (const ingredient of canadaIngredients) {
      let masterId;
      
      // IngredientMaster에서 찾기 (한국어명 또는 영문명으로)
      let master = existingMasters.get(ingredient.koreanName) || 
                   existingMasters.get(ingredient.englishName?.toLowerCase());
      
      if (master) {
        masterId = master.id;
      } else {
        // 새로운 IngredientMaster 생성
        masterId = await generateId();
        await client.execute({
          sql: `INSERT INTO IngredientMaster (id, category, koreanName, englishName, quantity, unit, yieldRate, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, 0, 'g', 100, datetime('now'), datetime('now'))`,
          args: [masterId, ingredient.category, ingredient.koreanName, ingredient.englishName]
        });
        existingMasters.set(ingredient.koreanName, { id: masterId, ...ingredient });
        addedMasters++;
      }

      // IngredientTemplateItem에 추가 또는 업데이트
      if (existingItemIds.has(masterId)) {
        // 이미 있으면 가격 업데이트
        if (ingredient.price > 0) {
          await client.execute({
            sql: `UPDATE IngredientTemplateItem SET price = ?, updatedAt = datetime('now') WHERE templateId = ? AND ingredientId = ?`,
            args: [ingredient.price, templateId, masterId]
          });
          updatedItems++;
        }
      } else {
        // 새로 추가
        const itemId = await generateId();
        await client.execute({
          sql: `INSERT INTO IngredientTemplateItem (id, templateId, ingredientId, category, koreanName, englishName, price, currency, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'CAD', datetime('now'), datetime('now'))`,
          args: [itemId, templateId, masterId, ingredient.category, ingredient.koreanName, ingredient.englishName, ingredient.price]
        });
        existingItemIds.add(masterId);
        addedItems++;
      }
    }

    console.log('\n📊 시드 결과:');
    console.log(`   - 새로운 IngredientMaster 추가: ${addedMasters}개`);
    console.log(`   - 새로운 템플릿 아이템 추가: ${addedItems}개`);
    console.log(`   - 가격 업데이트: ${updatedItems}개`);

    // 최종 확인
    const finalCount = await client.execute({
      sql: 'SELECT COUNT(*) as count FROM IngredientTemplateItem WHERE templateId = ?',
      args: [templateId]
    });
    console.log(`\n✅ Canada 템플릿 총 아이템 수: ${finalCount.rows[0].count}개`);

  } catch (error) {
    console.error('❌ 에러:', error);
    throw error;
  }
}

seedCanadaPrices()
  .then(() => {
    console.log('\n🎉 Canada 가격 템플릿 시드 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('시드 실패:', error);
    process.exit(1);
  });
