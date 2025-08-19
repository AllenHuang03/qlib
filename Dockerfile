# Qlib Pro - Production Dockerfile
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Copy backend requirements first for better caching
COPY backend/requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy entire backend directory
COPY backend/ ./

# Expose port (Railway will set PORT env var)
EXPOSE $PORT

# Run the production API
CMD ["python", "production_api.py"]
