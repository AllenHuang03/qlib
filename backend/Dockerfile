FROM python:3.9-slim

WORKDIR /app

# Copy minimal requirements first for better caching
COPY requirements_minimal.txt .

# Install Python dependencies (minimal set)
RUN pip install --no-cache-dir -r requirements_minimal.txt

# Copy application code
COPY hybrid_api.py .

# Create non-root user
RUN useradd --create-home --shell /bin/bash qlib
USER qlib

# Expose port
EXPOSE 8000

# Run the application
CMD ["python", "hybrid_api.py"]