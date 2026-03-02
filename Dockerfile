# Use Python 3.11 slim base
FROM python:3.11-slim

# Avoid Python buffering and bytecode files
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Set working directory inside the container
WORKDIR /app

# Install system dependencies (for compiling packages if needed)
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy Python dependencies first for caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the project
COPY . .

# Expose default FastAPI port
EXPOSE 8000