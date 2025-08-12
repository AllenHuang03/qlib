# Qlib Pro - Production Dockerfile
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy service files
COPY main.py ./main.py
COPY supabase_service.py ./supabase_service.py  
COPY australian_market_service.py ./australian_market_service.py
COPY auth_service.py ./auth_service.py

# Expose port (Railway will set PORT env var)
EXPOSE $PORT

# Run the main API
CMD ["python", "main.py"]
