#!/bin/bash

# Firebase 배포 가이드
# Korean History Digital Educational Materials
# 배포일: 2025-12-27

echo "=========================================="
echo "Firebase 배포 스크립트"
echo "=========================================="
echo ""

# 현재 디렉토리 확인
echo "현재 디렉토리: $(pwd)"
echo ""

# Firebase CLI 설치 확인
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI가 설치되지 않았습니다."
    echo "설치: npm install -g firebase-tools"
    exit 1
fi

echo "✅ Firebase CLI 설치됨"
echo ""

# Firebase 로그인 상태 확인
echo "Firebase 로그인 상태 확인..."
firebase auth:list

echo ""
echo "=========================================="
echo "단계별 배포"
echo "=========================================="
echo ""

# 1단계: Gemini API 키 확인
echo "1️⃣  Gemini API 키 확인 중..."
if grep -q "your_gemini_api_key" .env.local; then
    echo "⚠️  경고: Gemini API 키가 설정되지 않았습니다."
    echo "   .env.local 파일에서 'your_gemini_api_key'를 실제 키로 교체하세요."
    echo ""
    read -p "계속하시겠습니까? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""

# 2단계: 프로젝트 선택
echo "2️⃣  Firebase 프로젝트 선택..."
read -p "프로젝트 ID를 입력하세요 (기본값: korean-history-edu-app): " project_id
project_id=${project_id:-korean-history-edu-app}

firebase use $project_id

echo ""

# 3단계: 배포 전 검증
echo "3️⃣  배포 전 검증..."
echo "   - Firestore 규칙 검증 중..."
firebase firestore:rules:validate || {
    echo "❌ Firestore 규칙 검증 실패"
    exit 1
}

echo "   - 규칙 검증 완료 ✅"
echo ""

# 4단계: 배포 시작
echo "4️⃣  배포 시작..."
echo ""

read -p "배포를 시작하시겠습니까? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "배포가 취소되었습니다."
    exit 0
fi

echo ""
echo "=========================================="
echo "Phase 1: Firestore 배포 (약 5-10분)"
echo "=========================================="
echo "- firestore.rules 배포"
echo "- 9개 인덱스 생성"
echo ""

start_time=$(date +%s)

firebase deploy --only firestore

if [ $? -ne 0 ]; then
    echo "❌ Firestore 배포 실패"
    exit 1
fi

end_time=$(date +%s)
duration=$((end_time - start_time))
echo "✅ Firestore 배포 완료 (소요 시간: ${duration}초)"

echo ""
echo "=========================================="
echo "Phase 2: Firebase Storage 배포 (약 1-2분)"
echo "=========================================="
echo "- storage.rules 배포"
echo ""

start_time=$(date +%s)

firebase deploy --only storage

if [ $? -ne 0 ]; then
    echo "❌ Storage 배포 실패"
    exit 1
fi

end_time=$(date +%s)
duration=$((end_time - start_time))
echo "✅ Storage 배포 완료 (소요 시간: ${duration}초)"

echo ""
echo "=========================================="
echo "Phase 3: Hosting 배포 (약 2-5분)"
echo "=========================================="
echo "- 정적 파일 업로드"
echo "- CDN 배포"
echo ""

start_time=$(date +%s)

firebase deploy --only hosting

if [ $? -ne 0 ]; then
    echo "❌ Hosting 배포 실패"
    exit 1
fi

end_time=$(date +%s)
duration=$((end_time - start_time))
echo "✅ Hosting 배포 완료 (소요 시간: ${duration}초)"

echo ""
echo "=========================================="
echo "✅ 배포 완료!"
echo "=========================================="
echo ""

# 배포 후 정보
firebase_url="https://${project_id}.web.app"
echo "배포된 URL: $firebase_url"
echo ""
echo "다음 단계:"
echo "1. 로그인 페이지: ${firebase_url}/login"
echo "2. 대시보드: ${firebase_url}/student/dashboard (학생)"
echo "3. 관리자: ${firebase_url}/admin/dashboard (관리자)"
echo ""

# 배포 후 검증
echo "배포된 사이트를 확인하시겠습니까? (y/n)"
read -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "브라우저에서 $firebase_url 을 열고 있습니다..."
    # macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open "$firebase_url"
    # Linux
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        xdg-open "$firebase_url"
    # Windows (Git Bash)
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
        start "$firebase_url"
    fi
fi

echo ""
echo "배포 완료! 🎉"
