RecruitPro - A smart hiring platform

# Project Setup Guide
Clone Repository
```
  git clone https://github.com/AnasShafiq07/proj-recruitpro.git
  cd proj-recruitpro
```

## Backend Setup (FastAPI)
1. Go to folder:
```
  cd Backend
```
2. Create and activate a virtual environment:
```
  python -m venv venv

  venv\Scripts\activate
```
3. Install dependencies:
```
  pip install -r requirements.txt
```
4. Add alembic migrations:
```
  alembic revision --autogenerate -m "Initial migration"
  alembic upgrade head
```
5. Run the FastAPI development server:
```
   uvicorn app.main:app --reload
```

## Frontend Setup (React)
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
