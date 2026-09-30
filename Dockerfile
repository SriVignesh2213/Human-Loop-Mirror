FROM python:3.12-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PORT=7860

# Install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application
COPY backend/ /app/backend/

EXPOSE 7860

# Automatically uses $PORT if provided by cloud host (Render/Koyeb/Railway), or defaults to 7860 (Hugging Face Spaces)
CMD ["sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-7860}"]
