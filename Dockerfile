# Node.js 18 LTS (Debian 기반) 사용 - rembg/onnxruntime 호환성 확보
FROM node:18-bullseye

# 작업 디렉토리 설정
WORKDIR /app

# 시스템 패키지 업데이트 및 Python 설치 (Debian)
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y \
    python3 \
    python3-pip \
    python3-dev \
    build-essential \
    libffi-dev \
    libgl1 \
    libglib2.0-0 \
    curl \
 && rm -rf /var/lib/apt/lists/*

# Python 의존성 설치
COPY requirements.txt ./requirements.txt
RUN python3 -m pip install --no-cache-dir -r requirements.txt && \
    python3 -c "import cv2; import numpy; import PIL; print('✅ Python dependencies OK')" || \
    echo "⚠️ Python dependencies check failed"

# package.json 및 package-lock.json 복사
COPY package*.json ./

# Node.js 의존성 설치
RUN npm ci --only=production

# 앱 소스 복사
COPY . .

# BG_image 디렉토리 명시적 복사 및 확인
COPY BG_image/ ./BG_image/
RUN echo "=== BG_image 디렉토리 확인 ===" && \
    ls -la BG_image/ && \
    echo "BG_image 파일 수: $(find BG_image/ -name '*.jpg' | wc -l)" && \
    mkdir -p uploads && chmod 755 uploads && \
    chmod -R 755 BG_image/

# 포트 노출 (Render 동적 포트 지원)
EXPOSE $PORT
EXPOSE 9000

# 헬스체크 추가 (Render 포트 우선)
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD sh -c 'curl -fsS http://localhost:${PORT:-9000}/health || exit 1'

# 앱 실행
CMD ["node", "server.js"]