from fastapi import FastAPI
from app.database import Base, engine
from app.routers import analyzer_router, auth_router, dashboard_router



Base.metadata.create_all(bind=engine)

app = FastAPI(title="RecruitPro API")


app.include_router(auth_router)
app.include_router(analyzer_router)
app.include_router(dashboard_router)


@app.get("/")
def root():
    return {"message": "RecruitPro API is running"}