# Firebase 배포 가이드 (PowerShell)
# Korean History Digital Educational Materials
# 배포일: 2025-12-27

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Firebase 배포 스크립트 (PowerShell)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 현재 디렉토리 확인
$currentDir = Get-Location
Write-Host "현재 디렉토리: $currentDir" -ForegroundColor Yellow
Write-Host ""

# Firebase CLI 설치 확인
$firebaseCliExists = $null -ne (Get-Command firebase -ErrorAction SilentlyContinue)

if (-not $firebaseCliExists) {
    Write-Host "❌ Firebase CLI가 설치되지 않았습니다." -ForegroundColor Red
    Write-Host "설치: npm install -g firebase-tools" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Firebase CLI 설치됨" -ForegroundColor Green
Write-Host ""

# Firebase 로그인 상태 확인
Write-Host "Firebase 로그인 상태 확인..." -ForegroundColor Yellow
firebase auth:list
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "단계별 배포" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 1단계: Gemini API 키 확인
Write-Host "1️⃣  Gemini API 키 확인 중..." -ForegroundColor Yellow
$envContent = Get-Content .env.local
if ($envContent -match "your_gemini_api_key") {
    Write-Host "⚠️  경고: Gemini API 키가 설정되지 않았습니다." -ForegroundColor Yellow
    Write-Host "   .env.local 파일에서 'your_gemini_api_key'를 실제 키로 교체하세요." -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "계속하시겠습니까? (y/n)"
    if ($continue -ne 'y' -and $continue -ne 'Y') {
        exit 1
    }
}

Write-Host ""

# 2단계: 프로젝트 선택
Write-Host "2️⃣  Firebase 프로젝트 선택..." -ForegroundColor Yellow
$projectId = Read-Host "프로젝트 ID를 입력하세요 (기본값: korean-history-edu-app)"
if ([string]::IsNullOrWhiteSpace($projectId)) {
    $projectId = "korean-history-edu-app"
}

firebase use $projectId
Write-Host ""

# 3단계: 배포 전 검증
Write-Host "3️⃣  배포 전 검증..." -ForegroundColor Yellow
Write-Host "   - Firestore 규칙 검증 중..." -ForegroundColor Yellow

try {
    firebase firestore:rules:validate
    Write-Host "   - 규칙 검증 완료 ✅" -ForegroundColor Green
} catch {
    Write-Host "❌ Firestore 규칙 검증 실패" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 4단계: 배포 시작
Write-Host "4️⃣  배포 시작..." -ForegroundColor Yellow
Write-Host ""

$confirm = Read-Host "배포를 시작하시겠습니까? (y/n)"

if ($confirm -ne 'y' -and $confirm -ne 'Y') {
    Write-Host "배포가 취소되었습니다." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Phase 1: Firestore 배포 (약 5-10분)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "- firestore.rules 배포" -ForegroundColor Gray
Write-Host "- 9개 인덱스 생성" -ForegroundColor Gray
Write-Host ""

$startTime = Get-Date

firebase deploy --only firestore

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Firestore 배포 실패" -ForegroundColor Red
    exit 1
}

$endTime = Get-Date
$duration = ($endTime - $startTime).TotalSeconds
Write-Host "✅ Firestore 배포 완료 (소요 시간: $([Math]::Round($duration))초)" -ForegroundColor Green

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Phase 2: Firebase Storage 배포 (약 1-2분)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "- storage.rules 배포" -ForegroundColor Gray
Write-Host ""

$startTime = Get-Date

firebase deploy --only storage

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Storage 배포 실패" -ForegroundColor Red
    exit 1
}

$endTime = Get-Date
$duration = ($endTime - $startTime).TotalSeconds
Write-Host "✅ Storage 배포 완료 (소요 시간: $([Math]::Round($duration))초)" -ForegroundColor Green

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Phase 3: Hosting 배포 (약 2-5분)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "- 정적 파일 업로드" -ForegroundColor Gray
Write-Host "- CDN 배포" -ForegroundColor Gray
Write-Host ""

$startTime = Get-Date

firebase deploy --only hosting

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Hosting 배포 실패" -ForegroundColor Red
    exit 1
}

$endTime = Get-Date
$duration = ($endTime - $startTime).TotalSeconds
Write-Host "✅ Hosting 배포 완료 (소요 시간: $([Math]::Round($duration))초)" -ForegroundColor Green

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "✅ 배포 완료!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""

# 배포 후 정보
$firebaseUrl = "https://$projectId.web.app"
Write-Host "배포된 URL: $firebaseUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "다음 단계:" -ForegroundColor Yellow
Write-Host "1. 로그인 페이지: $firebaseUrl/login" -ForegroundColor Gray
Write-Host "2. 대시보드: $firebaseUrl/student/dashboard (학생)" -ForegroundColor Gray
Write-Host "3. 관리자: $firebaseUrl/admin/dashboard (관리자)" -ForegroundColor Gray
Write-Host ""

# 배포 후 검증
$openBrowser = Read-Host "배포된 사이트를 브라우저에서 열겠습니까? (y/n)"

if ($openBrowser -eq 'y' -or $openBrowser -eq 'Y') {
    Write-Host "브라우저에서 $firebaseUrl 을 열고 있습니다..." -ForegroundColor Yellow
    Start-Process $firebaseUrl
}

Write-Host ""
Write-Host "배포 완료! 🎉" -ForegroundColor Green
