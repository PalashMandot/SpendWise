from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.models import user, category, transaction, budget, recurring
from app.services.seed_service import seed_default_categories

from app.api.auth import router as auth_router
from app.api.transactions import router as transactions_router
from app.api.categories import router as categories_router
from app.api.budgets import router as budgets_router
from app.api.recurring import router as recurring_router
from app.api.analytics import router as analytics_router
from app.api.csv_io import router as csv_router
from app.api.seed import router as seed_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables are created and default categories seeded
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_default_categories(db)
    finally:
        db.close()
    yield
    # Shutdown logic if any


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="SpendWise Full-Stack Smart Expense Tracker API with Budgets, Analytics, Recurring Rules, and AI Summaries.",
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/api/openapi.json"
)

# CORS configuration
origins = [str(origin) for origin in settings.BACKEND_CORS_ORIGINS]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(transactions_router, prefix=settings.API_V1_STR)
app.include_router(categories_router, prefix=settings.API_V1_STR)
app.include_router(budgets_router, prefix=settings.API_V1_STR)
app.include_router(recurring_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(csv_router, prefix=settings.API_V1_STR)
app.include_router(seed_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Health"])
def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "healthy",
        "documentation": "/docs"
    }


@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "database": "connected"
    }
