import { Era, EraInfo } from '@/types';

export const ERAS: Record<Era, EraInfo> = {
  'goryeo': {
    id: 'goryeo',
    name: '고려시대',
    nameEn: 'Goryeo Dynasty',
    period: '918년 - 1392년',
    description: '불교 문화가 융성하고 청자와 금속활자가 발달한 시대입니다.',
    keywords: ['청자', '불교', '팔만대장경', '금속활자', '고려가요'],
    imagePromptPrefix: 'Goryeo Dynasty Korea (918-1392), Buddhist culture, celadon pottery style, traditional Korean architecture',
  },
  'joseon-early': {
    id: 'joseon-early',
    name: '조선 초기',
    nameEn: 'Early Joseon',
    period: '1392년 - 1494년',
    description: '유교 국가의 기틀이 마련되고 한글이 창제된 시대입니다.',
    keywords: ['한글 창제', '유교', '세종대왕', '집현전', '경복궁'],
    imagePromptPrefix: 'Early Joseon Dynasty Korea (1392-1494), Confucian culture, traditional hanbok, palace architecture, Hangeul creation era',
  },
  'joseon-mid': {
    id: 'joseon-mid',
    name: '조선 중기',
    nameEn: 'Middle Joseon',
    period: '1494년 - 1724년',
    description: '사림 정치가 전개되고 임진왜란, 병자호란을 겪은 시대입니다.',
    keywords: ['사림', '임진왜란', '이순신', '의병', '동의보감'],
    imagePromptPrefix: 'Middle Joseon Dynasty Korea (1494-1724), Sarim scholars, Imjin War era, traditional Korean warriors, scholars in traditional attire',
  },
  'joseon-late': {
    id: 'joseon-late',
    name: '조선 후기',
    nameEn: 'Late Joseon',
    period: '1724년 - 1897년',
    description: '실학이 발달하고 서민 문화가 꽃핀 시대입니다.',
    keywords: ['실학', '판소리', '김홍도', '정약용', '서민문화'],
    imagePromptPrefix: 'Late Joseon Dynasty Korea (1724-1897), Silhak practical learning era, folk culture, genre paintings style, traditional markets',
  },
  'japanese-occupation': {
    id: 'japanese-occupation',
    name: '일제강점기',
    nameEn: 'Japanese Occupation',
    period: '1910년 - 1945년',
    description: '일본 제국주의에 항거한 독립운동의 시대입니다.',
    keywords: ['3.1운동', '독립운동', '임시정부', '독립군', '광복'],
    imagePromptPrefix: 'Japanese occupation period Korea (1910-1945), Korean independence movement, early 20th century Korean attire, historical resistance',
  },
};

export const ERA_ORDER: Era[] = [
  'goryeo',
  'joseon-early',
  'joseon-mid',
  'joseon-late',
  'japanese-occupation',
];

export function getEraInfo(era: Era): EraInfo {
  return ERAS[era];
}

export function getEraName(era: Era): string {
  return ERAS[era].name;
}
