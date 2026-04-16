FROM python:3.11-slim

# Set work directory
WORKDIR /app

# Environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Install dependencies
COPY requirements.txt /app/
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy project files
COPY . .

# Collect static files (if production)
RUN python manage.py collectstatic --noinput

EXPOSE 8000

# Run with Gunicorn for production
CMD ["gunicorn", "moveprojects.wsgi:application", "--bind", "0.0.0.0:8000"]
