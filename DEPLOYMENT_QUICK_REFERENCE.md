# Firebase 배포 빠른 참조 (Quick Reference)

## 배포 준비 상태
✅ **배포 준비 완료 (99%)**

## 배포 전 필수 확인

```bash
# 1. 현재 디렉토리 확인 (필수)
cd C:\Users\moonk\edutech-vibecoding\korean-history-app

# 2. .env.local 파일에서 Gemini API 키 설정 (필수)
# 현재 값: your_gemini_api_key → 실제 키로 교체

# 3. Firebase 프로젝트 설정
firebase use korean-history-edu-app
```

## 배포 명령어 (3가지 방법)

### 방법 1: 한 번에 배포하기 (권장)
```bash
firebase deploy
```
**소요 시간: 8-17분**

### 방법 2: 단계별 배포하기

#### Step 1: Firestore 배포 (약 5-10분)
```bash
firebase deploy --only firestore
```
- firestore.rules 배포
- 9개 인덱스 생성

#### Step 2: Storage 배포 (약 1-2분)
```bash
firebase deploy --only storage
```
- storage.rules 배포

#### Step 3: Hosting 배포 (약 2-5분)
```bash
firebase deploy --only hosting
```
- 정적 파일 업로드
- CDN 배포

### 방법 3: 스크립트 사용

#### Windows (PowerShell)
```powershell
.\DEPLOYMENT_GUIDE.ps1
```

#### macOS/Linux (Bash)
```bash
bash ./DEPLOYMENT_GUIDE.sh
```

## 배포 후 확인

### 라이브 URL 접근
```
https://korean-history-edu-app.web.app
```

### 로그인 페이지
```
https://korean-history-edu-app.web.app/login
```

### 학생 대시보드
```
https://korean-history-edu-app.web.app/student/dashboard
```

### 관리자 대시보드
```
https://korean-history-edu-app.web.app/admin/dashboard
```

## 배포 상태 확인

```bash
# Firestore 규칙 확인
firebase firestore:rules:validate

# Hosting 배포 확인
firebase hosting:channel:list

# 프로젝트 설정 확인
firebase projects:list
```

## 문제 해결

### 배포 실패 시
```bash
# 로그 확인
firebase deploy --debug

# Firestore 규칙 검증
firebase firestore:rules:validate

# Storage 규칙 검증
firebase deploy --only storage --verbose
```

### 롤백 (이전 버전으로 복원)
```bash
# 이전 버전 확인
firebase hosting:channel:list

# 특정 버전으로 돌아가기
firebase hosting:channels:delete <channel-id>
```

## 배포 체크리스트

### 배포 전
- [ ] .env.local Gemini API 키 설정 완료
- [ ] firebase use korean-history-edu-app 실행
- [ ] npm run build 성공 확인
- [ ] 모든 규칙 파일 검증

### 배포 중
- [ ] Firestore 배포 대기 (가장 오래 소요)
- [ ] Storage 배포 확인
- [ ] Hosting 배포 확인

### 배포 후
- [ ] 로그인 페이지 (https://korean-history-edu-app.web.app/login) 접근 확인
- [ ] Google 로그인 버튼 표시 확인
- [ ] 학생 대시보드 접근 확인
- [ ] 프로필 페이지 접근 확인

## 주요 파일 목록

| 파일 | 경로 | 설명 |
|------|------|------|
| Firestore 규칙 | `firestore.rules` | 역할 기반 접근 제어 |
| Firestore 인덱스 | `firestore.indexes.json` | 9개 인덱스 |
| Storage 규칙 | `storage.rules` | 이미지 저장소 접근 제어 |
| 환경 변수 | `.env.local` | Firebase 및 Gemini API 설정 |
| 빌드 설정 | `firebase.json` | Hosting 설정 |

## 배포 소요 시간 예상

| 단계 | 시간 |
|------|------|
| Firestore | 5-10분 |
| Storage | 1-2분 |
| Hosting | 2-5분 |
| **총합** | **8-17분** |

**참고:** 첫 배포 또는 대규모 인덱스 변경 시 최대 30분 소요 가능

## 배포 후 URL

```
로그인: https://korean-history-edu-app.web.app/login
학생: https://korean-history-edu-app.web.app/student/dashboard
관리자: https://korean-history-edu-app.web.app/admin/dashboard
프로필: https://korean-history-edu-app.web.app/student/profile
검색: https://korean-history-edu-app.web.app/student/search
생성: https://korean-history-edu-app.web.app/student/generate
```

## 긴급 연락처

문제 발생 시:
1. Firebase 콘솔: https://console.firebase.google.com/
2. Firebase 설정: korean-history-edu-app
3. 로그 확인: Firebase Console → Hosting 탭

---

**마지막 업데이트:** 2025-12-27 14:30 KST
**빌드 상태:** ✅ SUCCESS
**배포 준비:** ✅ READY
