# Human Attention Engine (HAE)

> *A Terminal for Human Attention*

HAE is an analytics platform and computational social science engine that measures, analyzes, and visualizes **collective human attention** by fusing Google Trends search curiosity with Wikipedia information-seeking activity into a unified **Attention Score**.

---

## Architecture

- **Backend**: FastAPI (Python) — metrics calculation, derivatives/velocity, correlation networks.
- **Frontend**: Vite + React (Terminal aesthetic with Recharts & D3).
- **Data Sources**: Google Trends (`pytrends`) & Wikimedia Pageviews REST API.

---

## Getting Started

### 1. Backend
```bash
.venv\Scripts\uvicorn src.api:app --reload --port 8000
```

### 2. Frontend
```bash
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.
