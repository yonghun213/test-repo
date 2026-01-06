import { NextRequest, NextResponse } from 'next/server';

// ============================================
// 1단계: 용어집 기반 치환 (한글 → 영어)
// ============================================

// 동사 매핑 (verb_lexicon 시트에서 추출)
const VERB_MAPPINGS: Record<string, string> = {
  // 추가/넣다
  '추가하다': 'add', '추가한다': 'add', '추가해준다': 'add', '추가해 준다': 'add',
  '넣다': 'put', '넣는다': 'put', '넣어준다': 'put', '넣어 준다': 'put',
  '담다': 'put', '담는다': 'put', '담아준다': 'put', '담아 준다': 'put',
  
  // 섞다/혼합
  '섞다': 'mix', '섞는다': 'mix', '섞어준다': 'mix', '섞어 준다': 'mix',
  '잘 섞는다': 'mix well', '잘섞는다': 'mix well', '잘 섞어준다': 'mix well',
  '골고루 섞는다': 'mix evenly', '골고루섞는다': 'mix evenly', '골고루 섞어준다': 'mix evenly',
  '혼합하다': 'mix', '혼합한다': 'mix', '혼합해준다': 'mix', '혼합해 준다': 'mix',
  '버무리다': 'toss', '버무린다': 'toss', '버무려준다': 'toss',
  '저어주다': 'stir', '저어준다': 'stir', '저어 준다': 'stir',
  '풀다': 'dissolve', '푼다': 'dissolve', '풀어준다': 'dissolve',
  
  // 조리
  '튀기다': 'fry', '튀긴다': 'fry', '튀겨준다': 'fry', '튀겨 준다': 'fry',
  '바삭하게 튀긴다': 'fry until crispy', '바삭하게튀긴다': 'fry until crispy',
  '굽다': 'bake', '굽는다': 'bake', '구워준다': 'bake', '구워 준다': 'bake',
  '볶다': 'saute', '볶는다': 'saute', '볶아준다': 'saute', '볶아 준다': 'saute',
  '끓이다': 'boil', '끓인다': 'boil', '끓여준다': 'boil', '끓여 준다': 'boil',
  '가열하다': 'heat', '가열한다': 'heat', '가열해준다': 'heat', '가열해 준다': 'heat',
  '데우다': 'heat', '데운다': 'heat', '데워준다': 'heat', '데워 준다': 'heat',
  '조리하다': 'cook', '조리한다': 'cook', '조리해준다': 'cook', '조리해 준다': 'cook',
  
  // 자르기/썰기
  '자르다': 'cut', '자른다': 'cut', '잘라준다': 'cut', '잘라 준다': 'cut',
  '썰다': 'slice', '썬다': 'slice', '썰어준다': 'slice', '썰어 준다': 'slice',
  '잘게 썰다': 'finely chop', '잘게 썬다': 'finely chop', '잘게 썰어준다': 'finely chop',
  '다지다': 'mince', '다진다': 'mince', '다져준다': 'mince',
  '채썰다': 'julienne', '채썬다': 'julienne',
  
  // 붓다/뿌리다
  '붓다': 'pour', '붓는다': 'pour', '부어준다': 'pour', '부어 준다': 'pour',
  '뿌리다': 'sprinkle', '뿌린다': 'sprinkle', '뿌려준다': 'sprinkle', '뿌려 준다': 'sprinkle',
  
  // 서빙/제공
  '서빙하다': 'serve', '서빙한다': 'serve', '서빙해준다': 'serve', '서빙해 준다': 'serve',
  '제공하다': 'serve', '제공한다': 'serve', '제공해준다': 'serve', '제공해 준다': 'serve',
  '플레이팅': 'plate',
  
  // 보관
  '보관하다': 'store', '보관한다': 'store', '보관해준다': 'store', '보관해 준다': 'store',
  '냉장 보관하다': 'refrigerate', '냉장 보관한다': 'refrigerate', '냉장보관하다': 'refrigerate',
  '냉동 보관하다': 'freeze', '냉동 보관한다': 'freeze', '냉동보관하다': 'freeze',
  
  // 기타
  '재우다': 'marinate', '재운다': 'marinate', '재워준다': 'marinate',
  '마리네이트하다': 'marinate', '염지하다': 'brine', '염지한다': 'brine',
  '올리다': 'garnish', '올린다': 'garnish', '올려준다': 'garnish', '올려 준다': 'garnish',
  '배치하다': 'place', '배치한다': 'place', '올려놓다': 'place', '올려놓는다': 'place',
  '준비하다': 'prepare', '준비한다': 'prepare',
  '해동하다': 'thaw', '해동한다': 'thaw', '녹이다': 'thaw',
};

// 식재료 매핑 (Pricing 템플릿에서 추출)
const INGREDIENT_MAPPINGS: Record<string, string> = {
  // 닭고기
  '닭다리살': 'boneless chicken thigh', '닭가슴살': 'chicken breast',
  '닭윙': 'chicken wing', '닭날개': 'chicken wing', '치킨': 'chicken',
  '닭': 'chicken', '닭고기': 'chicken',
  
  // 채소
  '파': 'green onion', '대파': 'green onion', '쪽파': 'green onion',
  '양파': 'onion', '다진 양파': 'chopped onion', '양파 다진것': 'chopped onion',
  '마늘': 'garlic', '다진 마늘': 'minced garlic',
  '생강': 'ginger', '고추': 'chili pepper', '할라피뇨': 'jalapeño',
  '파프리카': 'bell pepper', '피망': 'bell pepper',
  '당근': 'carrot', '옥수수': 'corn', '양배추': 'cabbage',
  
  // 조미료/소스
  '소금': 'salt', '설탕': 'sugar', '후추': 'pepper', '간장': 'soy sauce',
  '식초': 'vinegar', '겨자': 'mustard', '마요네즈': 'mayonnaise',
  '사워크림': 'sour cream', '꿀': 'honey',
  
  // 파우더/믹스
  '마리네이드 파우더': 'marinade powder', '마리네이드 믹스': 'marinade mix',
  '시즈닝 파우더': 'seasoning powder', '튀김가루': 'battering powder mix',
  '배터링 파우더': 'battering powder', '배터믹스': 'batter mix',
  
  // 유제품
  '버터': 'butter', '치즈': 'cheese', '우유': 'milk', '크림': 'cream',
  
  // 기타
  '물': 'water', '얼음물': 'ice water', '기름': 'oil', '식용유': 'cooking oil',
  '올리브유': 'olive oil', '참기름': 'sesame oil',
  '깨': 'sesame seeds', '참깨': 'sesame seeds',
};

// 단위 매핑
const UNIT_MAPPINGS: Record<string, string> = {
  '그램': 'g', '킬로그램': 'kg', '밀리리터': 'ml', '리터': 'L',
  '분': 'minutes', '시간': 'hours', '초': 'seconds',
  '개': 'pcs', '조각': 'pieces', '인분': 'servings',
};

// 기타 표현 매핑
const PHRASE_MAPPINGS: Record<string, string> = {
  '골고루': 'evenly', '잘': 'well', '충분히': 'thoroughly',
  '완전히': 'completely', '바삭하게': 'until crispy',
  '중불': 'medium heat', '강불': 'high heat', '약불': 'low heat',
  '냉장고': 'refrigerator', '냉동고': 'freezer',
  '상온': 'room temperature', '지정 용기': 'designated container',
  '고객에게': 'to customer', '손님에게': 'to customer',
};

// 1단계: 용어집 기반 치환 함수
function applyTerminologyMapping(text: string): string {
  let result = text;
  
  // 긴 표현부터 먼저 치환 (더 구체적인 표현 우선)
  const allMappings = {
    ...PHRASE_MAPPINGS,
    ...VERB_MAPPINGS,
    ...INGREDIENT_MAPPINGS,
    ...UNIT_MAPPINGS,
  };
  
  // 긴 키부터 정렬하여 치환
  const sortedKeys = Object.keys(allMappings).sort((a, b) => b.length - a.length);
  
  for (const korean of sortedKeys) {
    const english = allMappings[korean];
    // 정규식 이스케이프
    const escaped = korean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(escaped, 'g'), english);
  }
  
  return result;
}

// ============================================
// 2단계: MyMemory API로 다듬기
// ============================================

// POST - 한글 조리법을 영문으로 번역 (2단계 로직)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // 한글이 없으면 그대로 반환
    const hasKorean = /[\uAC00-\uD7AF]/.test(text);
    if (!hasKorean) {
      return NextResponse.json({
        original: text,
        finalTranslation: text,
        usedAI: false
      });
    }

    // 1단계: 용어집 기반 치환
    const step1Result = applyTerminologyMapping(text);
    console.log('Step 1 (Terminology mapping):', step1Result);
    
    // 1단계 후에도 한글이 남아있는지 확인
    const stillHasKorean = /[\uAC00-\uD7AF]/.test(step1Result);
    
    if (!stillHasKorean) {
      // 한글이 모두 치환됨 - 바로 반환
      return NextResponse.json({
        original: text,
        step1: step1Result,
        finalTranslation: step1Result,
        usedAI: false,
        provider: 'Terminology only'
      });
    }

    // 2단계: MyMemory API로 나머지 번역
    try {
      console.log('Step 2: MyMemory translation for remaining Korean...');
      
      const encodedText = encodeURIComponent(step1Result);
      const url = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=ko|en`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.responseStatus === 200 && data.responseData?.translatedText) {
          const translation = data.responseData.translatedText;
          
          if (translation && !translation.includes('MYMEMORY WARNING')) {
            console.log('Step 2 (MyMemory):', translation);
            return NextResponse.json({
              original: text,
              step1: step1Result,
              finalTranslation: translation,
              usedAI: true,
              provider: 'Terminology + MyMemory'
            });
          }
        }
      }
      
      // MyMemory 실패시 1단계 결과 반환
      console.warn('MyMemory failed, returning step 1 result');
      return NextResponse.json({
        original: text,
        step1: step1Result,
        finalTranslation: step1Result,
        usedAI: false,
        aiError: 'MyMemory translation failed'
      });
    } catch (apiError: any) {
      console.error('MyMemory error:', apiError?.message);
      return NextResponse.json({
        original: text,
        step1: step1Result,
        finalTranslation: step1Result,
        usedAI: false,
        aiError: `Translation failed: ${apiError?.message}`
      });
    }
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
  }
}
