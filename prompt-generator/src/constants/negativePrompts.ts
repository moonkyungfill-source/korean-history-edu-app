/**
 * Negative Prompts for Korean Historical Image Generation
 *
 * Based on research paper definitions for preventing:
 * - Cultural confusion (Japanese/Chinese elements in Korean historical images)
 * - Anachronistic elements (modern items in historical contexts)
 * - Quality degradation
 */

/**
 * Global negative prompts applied to all historical image generations
 * These prevent common issues regardless of the specific era
 */
export const GLOBAL_NEGATIVE_PROMPTS = {
  // Cultural confusion prevention - Japanese elements
  culturalJapanese: [
    'japanese style',
    'kimono',
    'samurai',
    'ninja',
    'geisha',
    'japanese architecture',
    'shinto shrine',
    'tatami',
    'japanese temple',
    'japan',
  ],

  // Cultural confusion prevention - Chinese elements
  culturalChinese: [
    'chinese style',
    'hanfu',
    'qipao',
    'cheongsam',
    'chinese architecture',
    'chinese temple',
    'china',
    'mandarin collar',
    'dragon robe',
  ],

  // Modern/anachronistic elements prevention
  modernElements: [
    'modern clothing',
    'smartphone',
    'electricity',
    'cars',
    'plastic',
    'contemporary',
    'modern building',
    'glass window',
    'concrete',
    'asphalt',
    'street light',
    'power lines',
    'modern furniture',
    'digital',
    'electronic',
    'synthetic fabric',
    'zipper',
    'buttons',
    'wristwatch',
    'glasses',
    'sunglasses',
  ],

  // Quality-related negative prompts
  qualityIssues: [
    'low quality',
    'blurry',
    'deformed',
    'unrealistic',
    'cartoon style',
    'anime style',
    'manga',
    'pixelated',
    'distorted',
    'bad anatomy',
    'bad proportions',
    'disfigured',
    'poorly drawn',
    'mutation',
    'mutated',
    'extra limbs',
    'ugly',
    'watermark',
    'signature',
    'text',
    'logo',
  ],
} as const;

/**
 * Era-specific negative prompts
 * These prevent anachronisms and style mixing between different Korean historical periods
 */
export const ERA_NEGATIVE_PROMPTS: Record<string, string[]> = {
  // 고려시대 (Goryeo Dynasty, 918-1392)
  goryeo: [
    'joseon style',
    'topknot without hat',
    'confucian ceremony',
    'neo-confucian',
    'sungkyunkwan',
    'gwanbok of joseon',
    'gat hat',
    'dopo robe',
    'durumagi',
    'late joseon hanbok',
    'white clothing dominance',
  ],

  // 조선 전기 (Early Joseon, 1392-1592)
  'joseon-early': [
    'western influence',
    'late joseon style',
    'elaborate decorations',
    'western architecture',
    'catholic elements',
    'baroque style',
    'ornate embroidery',
    'multiple layers of accessories',
    'imported western goods',
    'pocket watch',
    'european furniture',
  ],

  // 조선 중기 (Mid Joseon, 1592-1724)
  'joseon-mid': [
    'early joseon simplicity',
    'foreign influence',
    'western elements',
    'goryeo buddhist style',
    'pre-imjin war style',
    'japanese occupation elements',
    'modern influence',
    'excessive ornamentation',
    'late joseon elaborate style',
  ],

  // 조선 후기 (Late Joseon, 1724-1897)
  'joseon-late': [
    'early joseon style',
    'simple hanbok',
    'western clothing',
    'goryeo style',
    'plain undecorated fabric',
    'buddhist dominance',
    'japanese colonial style',
    'modern buildings',
    'industrial elements',
  ],

  // 대한제국 (Korean Empire, 1897-1910)
  'korean-empire': [
    'colonial japanese influence',
    'full western abandonment',
    'joseon early style',
    'pre-modern only',
    'complete traditional only',
    'japanese military uniform',
    'colonial architecture',
  ],

  // 일제강점기 (Japanese Occupation, 1910-1945)
  'japanese-occupation': [
    'traditional only',
    'pre-modern only',
    'no modern elements',
    'pure joseon style',
    'complete hanbok only',
    'no western influence',
    'medieval setting',
    'ancient korea',
    'goryeo era',
    'pure traditional architecture',
  ],

  // 삼국시대 (Three Kingdoms Period, 57 BC - 668 AD)
  'three-kingdoms': [
    'joseon style',
    'goryeo style',
    'confucian elements',
    'neo-confucian',
    'gat hat',
    'dopo robe',
    'late period hanbok',
    'paper windows',
    'ondol heating visible',
  ],

  // 통일신라 (Unified Silla, 668-935)
  'unified-silla': [
    'joseon style',
    'goryeo style',
    'confucian ceremony',
    'neo-confucian elements',
    'gat hat',
    'late period clothing',
    'simple white clothing',
  ],
};

/**
 * Get all global negative prompts as a flattened array
 */
export function getAllGlobalNegativePrompts(): string[] {
  return [
    ...GLOBAL_NEGATIVE_PROMPTS.culturalJapanese,
    ...GLOBAL_NEGATIVE_PROMPTS.culturalChinese,
    ...GLOBAL_NEGATIVE_PROMPTS.modernElements,
    ...GLOBAL_NEGATIVE_PROMPTS.qualityIssues,
  ];
}

/**
 * Get era-specific negative prompts
 * @param era - The historical era key
 * @returns Array of negative prompts for the specified era, or empty array if era not found
 */
export function getEraNegativePrompts(era: string): string[] {
  return ERA_NEGATIVE_PROMPTS[era] || [];
}

/**
 * Build a complete negative prompt string for image generation
 * Combines global negative prompts with era-specific ones and any additional keywords
 *
 * @param era - The historical era key (e.g., 'goryeo', 'joseon-early', 'japanese-occupation')
 * @param additionalKeywords - Optional array of additional negative keywords to include
 * @returns Formatted negative prompt string ready for use with image generation APIs
 *
 * @example
 * // Basic usage with era only
 * const prompt = buildNegativePrompt('joseon-early');
 *
 * @example
 * // With additional custom keywords
 * const prompt = buildNegativePrompt('goryeo', ['specific_element', 'unwanted_style']);
 */
export function buildNegativePrompt(
  era: string,
  additionalKeywords: string[] = []
): string {
  const globalPrompts = getAllGlobalNegativePrompts();
  const eraPrompts = getEraNegativePrompts(era);

  // Combine all prompts and remove duplicates
  const allPrompts = [...new Set([
    ...globalPrompts,
    ...eraPrompts,
    ...additionalKeywords,
  ])];

  // Filter out empty strings and join with commas
  return allPrompts
    .filter((prompt) => prompt && prompt.trim().length > 0)
    .join(', ');
}

/**
 * Build negative prompt with selective global categories
 * Allows fine-grained control over which global negative prompt categories to include
 *
 * @param era - The historical era key
 * @param options - Configuration options for which categories to include
 * @returns Formatted negative prompt string
 */
export function buildNegativePromptSelective(
  era: string,
  options: {
    includeCulturalJapanese?: boolean;
    includeCulturalChinese?: boolean;
    includeModernElements?: boolean;
    includeQualityIssues?: boolean;
    additionalKeywords?: string[];
  } = {}
): string {
  const {
    includeCulturalJapanese = true,
    includeCulturalChinese = true,
    includeModernElements = true,
    includeQualityIssues = true,
    additionalKeywords = [],
  } = options;

  const prompts: string[] = [];

  if (includeCulturalJapanese) {
    prompts.push(...GLOBAL_NEGATIVE_PROMPTS.culturalJapanese);
  }

  if (includeCulturalChinese) {
    prompts.push(...GLOBAL_NEGATIVE_PROMPTS.culturalChinese);
  }

  if (includeModernElements) {
    prompts.push(...GLOBAL_NEGATIVE_PROMPTS.modernElements);
  }

  if (includeQualityIssues) {
    prompts.push(...GLOBAL_NEGATIVE_PROMPTS.qualityIssues);
  }

  // Add era-specific prompts
  prompts.push(...getEraNegativePrompts(era));

  // Add additional keywords
  prompts.push(...additionalKeywords);

  // Remove duplicates and filter empty strings
  const uniquePrompts = [...new Set(prompts)]
    .filter((prompt) => prompt && prompt.trim().length > 0);

  return uniquePrompts.join(', ');
}

/**
 * Type definitions for era keys
 */
export type EraKey = keyof typeof ERA_NEGATIVE_PROMPTS;

/**
 * Type definitions for global negative prompt categories
 */
export type GlobalNegativeCategory = keyof typeof GLOBAL_NEGATIVE_PROMPTS;
