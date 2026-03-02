FROM python:3.13-slim

WORKDIR /app

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# upgrade pip to specified version before installing dependencies
RUN pip install --upgrade pip==26.0.1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Expose the port that the FastAPI app will run on
# Inside the container, Uvicorn binds to port 8000.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
