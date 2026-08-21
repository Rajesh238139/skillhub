from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import Base, engine
from app.core.config import settings
from app.routers import auth, courses, payments

# For a resume project, creating tables at startup is fine.
# In a real production system you'd rely solely on Alembic migrations.
Base.metadata.create_all(bind=engine)

app = FastAPI(title="SkillHub API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_credentials=True,  # required so the httpOnly refresh cookie is sent
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(courses.router)
app.include_router(payments.router)


@app.get("/health")
def health():
    return {"status": "ok"}
