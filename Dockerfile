# Qlib Pro - Production Dockerfile
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Debug: Show what files are available in build context
RUN echo "=== BUILD CONTEXT DEBUG ===" && ls -la .

# Debug: Show current directory contents
RUN echo "=== AFTER REQUIREMENTS COPY ===" && ls -la

# Copy specific service files (explicit paths)
COPY main.py ./main.py
COPY supabase_service.py ./supabase_service.py  
COPY australian_market_service.py ./australian_market_service.py
COPY auth_service.py ./auth_service.py

# Verify files are copied
RUN echo "=== FINAL FILE CHECK ===" && ls -la *.py

# Expose port (Railway will set PORT env var)
EXPOSE $PORT

# Run the main API
CMD ["python", "main.py"]
