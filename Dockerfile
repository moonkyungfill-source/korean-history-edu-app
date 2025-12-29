FROM python:3.11-slim

WORKDIR /app

# 시스템 패키지 설치
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# 의존성 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 앱 코드 복사
COPY . .

# 환경 변수
ENV PORT=8080
ENV PYTHONUNBUFFERED=1

# gunicorn으로 실행
CMD exec gunicorn --bind :$PORT --workers 2 --threads 4 --timeout 60 app:app
