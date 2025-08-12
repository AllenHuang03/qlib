# Qlib Pro - Production Dockerfile
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy all Python service files
COPY *.py .

# Verify files are copied (for debugging)
RUN ls -la *.py

# Expose port (Railway will set PORT env var)
EXPOSE $PORT

# Run the main API
CMD ["python", "main.py"]
