# Autonomous ERP prototype

The active application is `new-ui-project/`, backed by the FastAPI service in `backend/`. The `finance-showcase/` directory is a separate visual prototype and is not required to run the integrated app.

## Run locally

1. Copy `backend/.env.example` to `backend/.env` and fill in the required Google OAuth and JWT values.
2. In `backend/`, create/activate a virtual environment and run `pip install -r requirements.txt`.
3. Start the API from `backend/`: `uvicorn main:app --reload --port 8000`.
4. Copy `new-ui-project/.env.example` to `new-ui-project/.env.local` and configure the Google client ID.
5. In `new-ui-project/`, run `npm install` then `npm run dev`.

Uploaded Excel workbooks are processed temporarily and removed after indexing. The generated FAISS index is stored under `backend/data/faiss_index/`.
