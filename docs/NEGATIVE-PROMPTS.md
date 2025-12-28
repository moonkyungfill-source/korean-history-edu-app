# 한국사 디지털 교육자료 앱 - 네거티브 프롬프트 명세

이 문서는 AI 이미지 생성 시 적용되는 네거티브 프롬프트(금지 키워드)의 전체 목록과 사용 가이드라인을 설명합니다.

## 목차

1. [개요](#1-개요)
2. [전역 네거티브 프롬프트](#2-전역-네거티브-프롬프트)
3. [시대별 네거티브 프롬프트](#3-시대별-네거티브-프롬프트)
4. [프롬프트 작성 가이드라인](#4-프롬프트-작성-가이드라인)
5. [고증 오류 방지 원칙](#5-고증-오류-방지-원칙)
6. [관리자 설정](#6-관리자-설정)

---

## 1. 개요

### 1.1 네거티브 프롬프트란?

네거티브 프롬프트는 AI 이미지 생성 시 **피해야 할 요소**를 지정하는 키워드 목록입니다. 이를 통해:

- 역사적으로 부정확한 요소 배제
- 문화적 혼동 방지
- 시대착오적 표현 제거
- 교육적으로 부적절한 결과물 방지

### 1.2 적용 방식

```
최종 네거티브 프롬프트 = 전역 금지 키워드 + 시대별 금지 키워드 + 추가 키워드(선택)
```

모든 이미지 생성 요청 시 자동으로 적용됩니다.

### 1.3 소스 파일 위치

```
src/constants/negativePrompts.ts
```

---

## 2. 전역 네거티브 프롬프트

모든 시대의 이미지 생성에 공통으로 적용되는 금지 키워드입니다.

### 2.1 문화적 혼동 방지

한국 역사 교육자료에서 다른 동아시아 문화와의 혼동을 방지합니다.

| 키워드 | 설명 |
|--------|------|
| `chinese style` | 중국 양식 |
| `japanese style` | 일본 양식 |
| `kimono` | 일본 전통 의복 |
| `hanfu` | 중국 전통 의복 |
| `qipao` | 중국식 치파오 |
| `samurai` | 일본 무사 |
| `ninja` | 일본 닌자 |
| `geisha` | 일본 게이샤 |
| `chinese dragon` | 중국식 용 |
| `japanese castle` | 일본식 성 |
| `chinese palace` | 중국식 궁궐 |
| `pagoda tower` | 중국/일본식 탑 |

### 2.2 비현실적 표현 방지

역사 교육자료에 부적합한 비현실적 스타일을 배제합니다.

| 키워드 | 설명 |
|--------|------|
| `anime` | 애니메이션 스타일 |
| `cartoon` | 만화 스타일 |
| `manga style` | 일본 만화 스타일 |
| `comic book` | 코믹북 스타일 |
| `fantasy` | 판타지 요소 |
| `sci-fi` | SF 요소 |
| `futuristic` | 미래적 요소 |
| `cyberpunk` | 사이버펑크 |
| `steampunk` | 스팀펑크 |

### 2.3 현대적 요소 방지

역사적 시대에 존재하지 않았던 현대적 요소를 배제합니다.

| 키워드 | 설명 |
|--------|------|
| `modern clothing` | 현대 의복 |
| `western suit` | 양복 |
| `jeans` | 청바지 |
| `t-shirt` | 티셔츠 |
| `sneakers` | 운동화 |
| `glasses` | 안경 |
| `wristwatch` | 손목시계 |
| `smartphone` | 스마트폰 |
| `electric lights` | 전기 조명 |
| `cars` | 자동차 |
| `airplanes` | 비행기 |
| `concrete buildings` | 콘크리트 건물 |
| `skyscrapers` | 고층 빌딩 |

### 2.4 품질 관련

AI 이미지 생성 품질 저하를 방지합니다.

| 키워드 | 설명 |
|--------|------|
| `low quality` | 저품질 |
| `blurry` | 흐릿함 |
| `distorted` | 왜곡 |
| `deformed` | 변형 |
| `ugly` | 미적 저하 |
| `bad anatomy` | 부정확한 인체 |
| `extra limbs` | 불필요한 팔다리 |
| `mutated` | 변이 |

### 2.5 부적절한 색상

역사적 시대에 맞지 않는 색상/재질을 배제합니다.

| 키워드 | 설명 |
|--------|------|
| `neon colors` | 네온 색상 |
| `fluorescent` | 형광색 |
| `plastic` | 플라스틱 재질 |
| `synthetic materials` | 합성 재료 |

---

## 3. 시대별 네거티브 프롬프트

각 역사 시대의 특성에 맞는 추가 금지 키워드입니다.

### 3.1 고려시대 (918년 - 1392년)

조선시대 요소와 시대착오적 물건을 배제합니다.

| 키워드 | 설명 | 배제 이유 |
|--------|------|----------|
| `joseon style` | 조선 양식 | 시대착오 |
| `confucian hat` | 유건 | 조선시대 복식 |
| `gat hat` | 갓 | 조선시대 복식 |
| `topknot with gat` | 갓을 쓴 상투 | 조선시대 복식 |
| `white hanbok` | 흰색 한복 | 조선 후기 특징 |
| `confucian school` | 유학당 | 조선시대 교육기관 |
| `seowon academy` | 서원 | 조선시대 교육기관 |
| `christian cross` | 기독교 십자가 | 시대착오 |
| `church` | 교회 | 시대착오 |
| `hangul text` | 한글 | 조선 세종 때 창제 |
| `korean alphabet` | 한글 | 조선 세종 때 창제 |
| `movable metal type books` | 금속활자 인쇄본 | 고려 말기 발명 주의 |

**고려시대 특징:**
- 불교 문화 융성
- 청자 공예
- 귀족 문화
- 몽골의 영향 (고려 말기)

### 3.2 조선 초기 (1392년 - 1494년)

고려시대 및 후기 조선 요소를 배제합니다.

| 키워드 | 설명 | 배제 이유 |
|--------|------|----------|
| `goryeo celadon` | 고려청자 | 시대착오 |
| `buddhist monk majority` | 다수의 승려 | 숭유억불 정책 |
| `buddhist temple as main building` | 사찰 중심 건축 | 유교 국가 |
| `mongol influence` | 몽골 영향 | 고려 말기 특징 |
| `western influence` | 서양 영향 | 시대착오 |
| `catholic symbols` | 천주교 상징 | 시대착오 |
| `silhak books` | 실학 서적 | 조선 후기 |
| `japanese colonial style` | 일제 양식 | 시대착오 |
| `modern hanbok` | 현대 한복 | 시대착오 |

**조선 초기 특징:**
- 유교 국가 기틀 마련
- 한글 창제 (세종대왕)
- 경복궁 등 궁궐 건축
- 과학 기술 발전

### 3.3 조선 중기 (1494년 - 1724년)

초기/후기 조선 및 일제강점기 요소를 배제합니다.

| 키워드 | 설명 | 배제 이유 |
|--------|------|----------|
| `sejong era` | 세종 시대 | 조선 초기 |
| `early palace construction` | 초기 궁궐 건축 | 조선 초기 |
| `western architecture` | 서양 건축 | 조선 후기 이후 |
| `catholic church` | 천주교 성당 | 조선 후기 이후 |
| `european dress` | 유럽 의복 | 시대착오 |
| `photography` | 사진 | 시대착오 |
| `japanese colonial` | 일제 식민지 | 시대착오 |
| `modern buildings` | 현대 건물 | 시대착오 |

**조선 중기 특징:**
- 사림 정치 전개
- 임진왜란 (1592-1598)
- 병자호란 (1636-1637)
- 의병 활동
- 동의보감 편찬

### 3.4 조선 후기 (1724년 - 1897년)

초기/중기 조선 및 일제강점기 요소를 배제합니다.

| 키워드 | 설명 | 배제 이유 |
|--------|------|----------|
| `early joseon palace style` | 조선 초기 궁궐 양식 | 시대착오 |
| `goryeo elements` | 고려 요소 | 시대착오 |
| `japanese occupation` | 일제강점 | 시대착오 |
| `japanese military uniform` | 일본군 군복 | 시대착오 |
| `colonial architecture` | 식민지 건축 | 시대착오 |
| `japanese text` | 일본어 텍스트 | 시대착오 |
| `electricity` | 전기 | 대한제국 말기 이후 |
| `automobiles` | 자동차 | 시대착오 |
| `telegraph poles` | 전신주 | 대한제국 말기 이후 |

**조선 후기 특징:**
- 실학 발달
- 서민 문화 융성 (판소리, 탈춤)
- 풍속화 발달 (김홍도, 신윤복)
- 정약용 등 실학자 활동

### 3.5 일제강점기 (1910년 - 1945년)

전통 왕조시대 및 해방 이후 요소를 배제합니다.

| 키워드 | 설명 | 배제 이유 |
|--------|------|----------|
| `joseon king` | 조선 왕 | 시대착오 |
| `royal court` | 왕실 조정 | 시대착오 |
| `palace ceremonies` | 궁중 의례 | 시대착오 |
| `traditional palace life` | 전통 궁궐 생활 | 시대착오 |
| `ancient warfare` | 고대 전쟁 | 시대착오 |
| `korean war` | 한국전쟁 | 해방 이후 |
| `modern korea` | 현대 한국 | 해방 이후 |
| `contemporary buildings` | 현대 건축물 | 해방 이후 |
| `post-1945` | 1945년 이후 | 해방 이후 |
| `glorifying occupation` | 식민지 미화 | 교육적 부적절 |
| `pro-japanese content` | 친일 콘텐츠 | 교육적 부적절 |

**일제강점기 특징:**
- 3.1 운동 (1919)
- 대한민국 임시정부
- 독립운동
- 항일 무장투쟁
- 문화 탄압과 저항

---

## 4. 프롬프트 작성 가이드라인

### 4.1 권장 프롬프트 구조

```
[시대 프리픽스], [사용자 프롬프트], historically accurate Korean cultural heritage, detailed traditional Korean art style, museum quality
```

**예시:**
```
Goryeo Dynasty Korea (918-1392), Buddhist culture, celadon pottery style,
고려시대 궁중 연회 장면, historically accurate Korean cultural heritage,
detailed traditional Korean art style, museum quality
```

### 4.2 시대별 프리픽스

| 시대 | 프리픽스 |
|------|----------|
| 고려시대 | `Goryeo Dynasty Korea (918-1392), Buddhist culture, celadon pottery style, traditional Korean architecture` |
| 조선 초기 | `Early Joseon Dynasty Korea (1392-1494), Confucian culture, traditional hanbok, palace architecture, Hangeul creation era` |
| 조선 중기 | `Middle Joseon Dynasty Korea (1494-1724), Sarim scholars, Imjin War era, traditional Korean warriors, scholars in traditional attire` |
| 조선 후기 | `Late Joseon Dynasty Korea (1724-1897), Silhak practical learning era, folk culture, genre paintings style, traditional markets` |
| 일제강점기 | `Japanese occupation period Korea (1910-1945), Korean independence movement, early 20th century Korean attire, historical resistance` |

### 4.3 효과적인 프롬프트 작성 팁

1. **구체적인 시대 맥락 포함**
   - 나쁨: "한국 전통 의복"
   - 좋음: "조선 중기 양반 가문의 혼례 의복"

2. **역사적 사건/인물 명시**
   - 나쁨: "장군의 모습"
   - 좋음: "임진왜란 당시 거북선을 지휘하는 이순신 장군"

3. **시각적 세부 사항 추가**
   - 나쁨: "궁궐"
   - 좋음: "경복궁 근정전, 전통 단청 문양, 기와 지붕"

4. **교육적 목적 명시**
   - "교과서 삽화 스타일", "박물관 전시 품질"

---

## 5. 고증 오류 방지 원칙

### 5.1 복식 고증

| 시대 | 주의사항 |
|------|----------|
| 고려시대 | 중국풍 복식 영향, 귀족 복식 화려함, 불교 승려복 |
| 조선 초기 | 유건, 도포 등장, 백색 한복 시작 |
| 조선 중기 | 사대부 복식 정립, 갓 보편화 |
| 조선 후기 | 서민 복식 다양화, 여성 저고리 짧아짐 |
| 일제강점기 | 전통 한복과 양복 혼재, 단발령 영향 |

### 5.2 건축 고증

| 시대 | 특징 |
|------|------|
| 고려시대 | 불교 사찰 중심, 개성 만월대 양식 |
| 조선 초기 | 경복궁, 창덕궁 등 궁궐 건축 |
| 조선 중기 | 서원, 향교 건축 발달 |
| 조선 후기 | 민가 건축 발달, 기와집/초가집 |
| 일제강점기 | 일본식 건물, 근대 건축 등장 |

### 5.3 생활용품 고증

| 시대 | 주의사항 |
|------|----------|
| 고려시대 | 청자, 금속 그릇, 불구(佛具) |
| 조선 초기 | 분청사기, 백자 시작 |
| 조선 중기 | 백자 발달, 도자기 일상화 |
| 조선 후기 | 민화, 목공예품 발달 |
| 일제강점기 | 일본식 생활용품 등장 |

### 5.4 흔한 고증 오류 사례

| 오류 | 설명 | 해결 방법 |
|------|------|----------|
| 갓을 쓴 고려 무사 | 갓은 조선시대 복식 | 고려시대 투구/관모 사용 |
| 한글로 쓴 고려 문서 | 한글은 세종 때 창제 | 한문 문서로 표현 |
| 조선 초기 서원 | 서원은 중종 이후 | 향교나 성균관 사용 |
| 일제시대 전통 궁궐 생활 | 궁궐 기능 상실 | 일제 수탈/저항 장면으로 |

---

## 6. 관리자 설정

### 6.1 네거티브 프롬프트 관리 페이지

관리자는 `/admin/prompts` 페이지에서 네거티브 프롬프트를 관리할 수 있습니다.

**기능:**
- 시대별 금지 키워드 조회
- 키워드 추가/삭제
- 설명 수정
- 변경 이력 추적

### 6.2 Firestore 직접 수정

`negative-prompts` 컬렉션에서 직접 수정할 수 있습니다.

**문서 구조:**
```json
{
  "era": "global",
  "keywords": ["chinese style", "japanese style", ...],
  "description": "모든 시대에 적용되는 전역 네거티브 프롬프트",
  "updatedAt": "2024-01-20T10:00:00Z",
  "updatedBy": "admin-user-id"
}
```

### 6.3 초기화 스크립트

네거티브 프롬프트를 초기 상태로 리셋하려면:

```bash
npm run init-data
```

> **주의:** 기존 수정사항이 덮어쓰기됩니다.

---

## 참고 자료

### 소스 코드

- 네거티브 프롬프트 상수: `src/constants/negativePrompts.ts`
- 시대 정보: `src/constants/eras.ts`
- 초기화 스크립트: `scripts/init-negative-prompts.ts`

### 외부 참고 자료

- 국립중앙박물관 (https://www.museum.go.kr)
- 한국민족문화대백과사전 (https://encykorea.aks.ac.kr)
- 국사편찬위원회 (https://www.history.go.kr)
- 문화재청 (https://www.cha.go.kr)
