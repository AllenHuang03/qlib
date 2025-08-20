# Qlib Pro - Production Dockerfile
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Copy root requirements first for better caching (Railway-optimized)
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy entire backend directory
COPY backend/ ./

# Expose port 8080 for Railway
EXPOSE 8080

# Run the minimal production API (for Railway deployment testing)
CMD ["python", "minimal_production_api.py"]
