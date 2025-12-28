import { Era } from '@/types';

// 전역 네거티브 프롬프트 (모든 시대에 적용)
export const GLOBAL_NEGATIVE_PROMPTS: string[] = [
  // 문화적 혼동 방지
  'chinese style',
  'japanese style',
  'kimono',
  'hanfu',
  'qipao',
  'samurai',
  'ninja',
  'geisha',
  'chinese dragon',
  'japanese castle',
  'chinese palace',
  'pagoda tower',

  // 비현실적 표현 방지
  'anime',
  'cartoon',
  'manga style',
  'comic book',
  'fantasy',
  'sci-fi',
  'futuristic',
  'cyberpunk',
  'steampunk',

  // 현대적 요소 방지
  'modern clothing',
  'western suit',
  'jeans',
  't-shirt',
  'sneakers',
  'glasses',
  'wristwatch',
  'smartphone',
  'electric lights',
  'cars',
  'airplanes',
  'concrete buildings',
  'skyscrapers',

  // 품질 관련
  'low quality',
  'blurry',
  'distorted',
  'deformed',
  'ugly',
  'bad anatomy',
  'extra limbs',
  'mutated',

  // 부적절한 색상
  'neon colors',
  'fluorescent',
  'plastic',
  'synthetic materials',
];

// 시대별 네거티브 프롬프트
export const ERA_NEGATIVE_PROMPTS: Record<Era, string[]> = {
  'goryeo': [
    // 조선시대 요소 방지
    'joseon style',
    'confucian hat',
    'gat hat',
    'topknot with gat',
    'white hanbok',
    'confucian school',
    'seowon academy',

    // 부적절한 종교 요소
    'christian cross',
    'church',

    // 시대착오적 물건
    'hangul text',
    'korean alphabet',
    'movable metal type books',
  ],

  'joseon-early': [
    // 고려시대 요소 방지
    'goryeo celadon',
    'buddhist monk majority',
    'buddhist temple as main building',
    'mongol influence',

    // 후기 조선 요소 방지
    'western influence',
    'catholic symbols',
    'silhak books',

    // 시대착오
    'japanese colonial style',
    'modern hanbok',
  ],

  'joseon-mid': [
    // 초기 조선 요소
    'sejong era',
    'early palace construction',

    // 후기 조선 요소
    'western architecture',
    'catholic church',
    'european dress',
    'photography',

    // 일제강점기 요소
    'japanese colonial',
    'modern buildings',
  ],

  'joseon-late': [
    // 초기/중기 조선 요소
    'early joseon palace style',
    'goryeo elements',

    // 일제강점기 요소
    'japanese occupation',
    'japanese military uniform',
    'colonial architecture',
    'japanese text',

    // 현대적 요소
    'electricity',
    'automobiles',
    'telegraph poles',
  ],

  'japanese-occupation': [
    // 전통 왕조 시대 요소
    'joseon king',
    'royal court',
    'palace ceremonies',
    'traditional palace life',
    'ancient warfare',

    // 현대/해방 이후 요소
    'korean war',
    'modern korea',
    'contemporary buildings',
    'post-1945',

    // 부적절한 표현
    'glorifying occupation',
    'pro-japanese content',
  ],
};

// 기본 네거티브 프롬프트 구성
export const DEFAULT_NEGATIVE_PROMPTS: Record<Era | 'global', string[]> = {
  global: GLOBAL_NEGATIVE_PROMPTS,
  ...ERA_NEGATIVE_PROMPTS,
};

/**
 * 시대에 맞는 전체 네거티브 프롬프트 문자열 생성
 */
export function buildNegativePrompt(era: Era, additionalNegatives: string[] = []): string {
  const allNegatives = [
    ...GLOBAL_NEGATIVE_PROMPTS,
    ...ERA_NEGATIVE_PROMPTS[era],
    ...additionalNegatives,
  ];

  // 중복 제거
  const uniqueNegatives = [...new Set(allNegatives)];

  return uniqueNegatives.join(', ');
}

/**
 * 사용자 프롬프트와 시대 정보를 결합하여 최종 프롬프트 생성
 */
export function buildFullPrompt(
  userPrompt: string,
  era: Era,
  eraPrefix: string
): { prompt: string; negativePrompt: string } {
  const prompt = `${eraPrefix}, ${userPrompt}, historically accurate Korean cultural heritage, detailed traditional Korean art style, museum quality`;
  const negativePrompt = buildNegativePrompt(era);

  return { prompt, negativePrompt };
}
