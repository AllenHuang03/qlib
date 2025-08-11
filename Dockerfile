# Simple Railway Dockerfile for API
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Copy our files
COPY requirements.txt .
COPY minimal_api.py .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose port
EXPOSE 8000

# Set environment variable
ENV PORT=8000

# Run the API
CMD ["python", "minimal_api.py"]
