/**
 * 시대별 정보 설정
 * 이미지 및 텍스트 프롬프트 생성에 사용되는 시대 정보를 정의합니다.
 */

/**
 * 시대 정보 인터페이스
 */
export interface EraInfo {
  /** 시대 고유 식별자 */
  id: string;
  /** 시대 한글 명칭 */
  name: string;
  /** 시대 영문 명칭 */
  nameEn: string;
  /** 시대 기간 */
  period: string;
  /** 시대 설명 */
  description: string;
  /** 이미지 생성용 영문 프리픽스 */
  imagePromptPrefix: string;
}

/**
 * 시대 타입 정의
 */
export type Era =
  | 'goryeo'
  | 'joseon-early'
  | 'joseon-mid'
  | 'joseon-late'
  | 'japanese-occupation';

/**
 * 시대별 상세 정보
 */
export const ERA_INFO: Record<Era, EraInfo> = {
  'goryeo': {
    id: 'goryeo',
    name: '고려시대',
    nameEn: 'Goryeo Dynasty',
    period: '918-1392',
    description: '불교 문화가 융성하고 청자와 금속활자가 발달한 시대입니다.',
    imagePromptPrefix: 'Goryeo Dynasty Korea (918-1392), Buddhist culture, celadon pottery style, traditional Korean temple architecture, Buddhist monks, aristocratic robes, ornate Buddhist artifacts',
  },
  'joseon-early': {
    id: 'joseon-early',
    name: '조선 전기',
    nameEn: 'Early Joseon',
    period: '1392-1494',
    description: '유교 국가의 기틀이 마련되고 한글이 창제된 시대입니다.',
    imagePromptPrefix: 'Early Joseon Dynasty Korea (1392-1494), Confucian culture, traditional hanbok, grand palace architecture like Gyeongbokgung, scholars with gat hats, King Sejong era, Hangeul creation period',
  },
  'joseon-mid': {
    id: 'joseon-mid',
    name: '조선 중기',
    nameEn: 'Middle Joseon',
    period: '1494-1724',
    description: '사림 정치가 전개되고 임진왜란, 병자호란을 겪은 시대입니다.',
    imagePromptPrefix: 'Middle Joseon Dynasty Korea (1494-1724), Sarim scholars era, Imjin War period, Admiral Yi Sun-sin, traditional Korean warriors and soldiers, righteous armies, scholarly debates, traditional Korean battle scenes',
  },
  'joseon-late': {
    id: 'joseon-late',
    name: '조선 후기',
    nameEn: 'Late Joseon',
    period: '1724-1897',
    description: '실학이 발달하고 서민 문화가 꽃핀 시대입니다.',
    imagePromptPrefix: 'Late Joseon Dynasty Korea (1724-1897), Silhak practical learning movement, folk culture flourishing, Kim Hong-do genre painting style, traditional markets and common people, pansori performances, minhwa folk paintings',
  },
  'japanese-occupation': {
    id: 'japanese-occupation',
    name: '일제강점기',
    nameEn: 'Japanese Occupation Period',
    period: '1910-1945',
    description: '일본 제국주의에 항거한 독립운동의 시대입니다.',
    imagePromptPrefix: 'Japanese occupation period Korea (1910-1945), Korean independence movement, March 1st Movement, provisional government, independence fighters, early 20th century Korean attire, historical resistance, liberation struggle',
  },
};

/**
 * 시대 순서 배열
 */
export const ERA_ORDER: Era[] = [
  'goryeo',
  'joseon-early',
  'joseon-mid',
  'joseon-late',
  'japanese-occupation',
];

/**
 * 시대 ID로 시대 정보 조회
 * @param era 시대 ID
 * @returns 시대 정보 객체
 */
export function getEraInfo(era: Era): EraInfo {
  return ERA_INFO[era];
}

/**
 * 시대 ID로 시대 한글 이름 조회
 * @param era 시대 ID
 * @returns 시대 한글 이름
 */
export function getEraName(era: Era): string {
  return ERA_INFO[era].name;
}

/**
 * 시대 ID로 이미지 프롬프트 프리픽스 조회
 * @param era 시대 ID
 * @returns 이미지 생성용 영문 프리픽스
 */
export function getImagePromptPrefix(era: Era): string {
  return ERA_INFO[era].imagePromptPrefix;
}

/**
 * 모든 시대 정보 배열로 조회
 * @returns 시대 정보 배열 (순서대로)
 */
export function getAllEras(): EraInfo[] {
  return ERA_ORDER.map(era => ERA_INFO[era]);
}
