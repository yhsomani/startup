FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Set environment variables
ENV FLASK_APP=app.py
ENV FLASK_ENV=production
# ENV DATABASE_URL ... will be passed by docker-compose

EXPOSE 5000

CMD ["python", "app.py"]
