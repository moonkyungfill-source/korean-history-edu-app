from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)  # 브라우저 표시
    page = browser.new_page()
    
    try:
        # 1. 로그인 페이지로 이동
        print("🌐 로그인 페이지로 이동 중...")
        page.goto('https://korean-history-edu-app.web.app/login')
        page.wait_for_load_state('networkidle')
        
        # 2. 이메일 탭 선택
        print("📧 이메일 탭 선택...")
        email_tab = page.locator('text=이메일')
        email_tab.click()
        time.sleep(1)
        
        # 3. 이메일 입력
        print("✉️ 학생 이메일 입력: student@example.com")
        email_input = page.locator('input[type="email"]')
        email_input.fill('student@example.com')
        
        # 4. 비밀번호 입력
        print("🔐 비밀번호 입력...")
        password_input = page.locator('input[type="password"]')
        password_input.fill('student123456')
        
        # 5. 로그인 버튼 클릭
        print("🔓 로그인...")
        login_button = page.locator('button:has-text("로그인")')
        login_button.click()
        
        # 로그인 완료 대기
        page.wait_for_url('**/student/dashboard', timeout=10000)
        print("✅ 로그인 성공!")
        
        # 6. 대시보드에서 스크린샷
        print("📸 대시보드 스크린샷...")
        page.screenshot(path='dashboard.png', full_page=True)
        
        # 7. 이미지 생성 페이지로 이동
        print("🎨 이미지 생성 페이지로 이동...")
        page.goto('https://korean-history-edu-app.web.app/student/generate?era=joseon-mid')
        page.wait_for_load_state('networkidle')
        
        # 페이지 상태 확인
        print("📄 페이지 확인...")
        page.screenshot(path='generate-page.png', full_page=True)
        
        # 콘솔 메시지 확인
        messages = page.evaluate('''() => {
            return window.__consoleLogs || [];
        }''')
        
        print("\n✅ 테스트 완료!")
        print("📁 스크린샷: dashboard.png, generate-page.png")
        
    except Exception as e:
        print(f"\n❌ 테스트 실패: {str(e)}")
        page.screenshot(path='error.png')
        print("에러 스크린샷: error.png")
    
    finally:
        browser.close()

