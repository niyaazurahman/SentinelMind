"""
SentinelMind FastAPI Application Entry Point.
Initializes ASGI application, registers CORS middleware, database lifespans, and API routes.
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.routes.api import api_router
from app.core.config import settings
from app.core.database import engine


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifecycle manager.
    Verifies database connectivity on startup and cleanly tears down pools on shutdown.
    """
    # Startup: Verify PostgreSQL connection pool
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        print("[SentinelMind] Database connection established successfully.")
    except Exception as e:
        print(f"[SentinelMind WARNING] Database connection verification failed: {e}")

    yield

    # Shutdown: Dispose engine connection pool
    print("[SentinelMind] Closing database connection pool...")
    await engine.dispose()
    print("[SentinelMind] Database pool disposed.")


def create_application() -> FastAPI:
    """FastAPI Application Factory."""
    application = FastAPI(
        title=settings.PROJECT_NAME,
        description="AI-Based Predictive Personnel Stress & Welfare Monitoring System for Uniformed Forces",
        version="1.0.0",
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        docs_url=f"{settings.API_V1_STR}/docs",
        redoc_url=f"{settings.API_V1_STR}/redoc",
        lifespan=lifespan,
    )

    # Configure CORS
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

    # Mount versioned API routes
    application.include_router(api_router, prefix=settings.API_V1_STR)

    # Root and Health Probes
    @application.get("/health", status_code=status.HTTP_200_OK, tags=["Health"])
    async def health_check():
        """Health check probe for container orchestrators (Kubernetes / Docker)."""
        return {
            "status": "HEALTHY",
            "service": settings.PROJECT_NAME,
            "environment": settings.ENVIRONMENT,
        }

    @application.get("/", status_code=status.HTTP_200_OK, tags=["Root"])
    async def root_info():
        """Root API information."""
        return {
            "system": settings.PROJECT_NAME,
            "version": "1.0.0",
            "docs": f"{settings.API_V1_STR}/docs",
            "status": "OPERATIONAL",
        }

    return application


app = create_application()
