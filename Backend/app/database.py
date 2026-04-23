from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# 1. Add connect_args for SSL (Supabase requires this for security)
# 2. Add pool_pre_ping to keep the connection alive
engine = create_engine(
    settings.DATABASE_URL, 
    connect_args={"sslmode": "require"},
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency for your FastAPI rout