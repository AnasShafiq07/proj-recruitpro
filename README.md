RecruitPro - A Smart Hiring Platform An AI-powered recruitment system featuring AI-generated job posts, LinkedIn integration, semantic resume parsing, and automated interview scheduling. Built with FastAPI, React, and PostgreSQL.

Website Link: https://recruitpro-ai-hub.vercel.app/


# Project Setup Guide:
Clone Repository
```
  git clone https://github.com/AnasShafiq07/proj-recruitpro.git
  cd proj-recruitpro
```

## Backend Setup (FastAPI):
1. Go to folder:
```
  cd Backend
```
2. Create .env file in Backend folder and map it according to app/core/config.py
3. Create and activate a virtual environment:
```
  python -m venv venv

  venv\Scripts\activate
```
4. Install dependencies:
```
  pip install -r requirements.txt
```
5. Add alembic migrations:
```
  alembic revision --autogenerate -m "Initial migration"
  alembic upgrade head
```
6. Run the FastAPI development server:
```
   uvicorn app.main:app --reload
```

## Frontend Setup (React):
1. Go to project's root folder:
```
  cd Frontend/app
```
2. Install dependencies:
```
  npm install
```
3. Run the React development server:
```
  npm run dev
```
