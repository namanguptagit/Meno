FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    python3.11 \
    python3-pip \
    python3.11-venv \
    libnss3 \
    libdbus-1-3 \
    libxkbcommon-x11-0 \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -ms /bin/bash appuser

WORKDIR /app

COPY requirements.txt .
RUN pip3 install -r requirements.txt

ENV PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers
RUN playwright install --with-deps chromium

COPY bot.py .

RUN chown -R appuser:appuser /app

USER appuser

CMD ["python3", "bot.py"]
