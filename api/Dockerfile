FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_DEBUG=0 \
    DJANGO_DATA_DIR=/app/data

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN useradd --create-home --uid 1000 app && mkdir -p /app/data && chown -R app:app /app/data
USER app

EXPOSE 9010
VOLUME ["/app/data"]

HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=5 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:9010/api/health/', timeout=4)"

# Apply migrations on every start, then serve with gunicorn.
CMD ["sh", "-c", "python manage.py migrate --noinput && exec gunicorn api.wsgi:application --bind 0.0.0.0:9010 --workers ${GUNICORN_WORKERS:-3} --access-logfile -"]
