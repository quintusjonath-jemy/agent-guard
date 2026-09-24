from contextlib import asynccontextmanager
from datetime import datetime
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logging import setup_logging, logger
from app.database.init_db import init_db
from app.schemas.common import HealthCheckResponse, ApiResponse
from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.api_keys import router as api_keys_router

# Initialize logging
setup_logging()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up AgentGuard Security Gateway...")
    try:
        init_db()
        logger.info("AgentGuard database verification & seed check complete.")
    except Exception as e:
        logger.error(f"Database startup sync warning: {e}")
    yield
    logger.info("Shutting down AgentGuard Security Gateway...")

app = FastAPI(
    title="AgentGuard API",
    description="The security firewall for AI agents — governance, least privilege, policy enforcement, and live monitoring.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_PREFIX}/openapi.json",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.method} {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred while processing the security request."
            }
        }
    )

# Include API Routers under API_PREFIX
app.include_router(auth_router, prefix=settings.API_PREFIX)
app.include_router(users_router, prefix=settings.API_PREFIX)
app.include_router(api_keys_router, prefix=settings.API_PREFIX)

# Base Health Check Route
@app.get("/health", response_model=ApiResponse[HealthCheckResponse], tags=["System"])
async def health_check():
    return ApiResponse(
        success=True,
        data=HealthCheckResponse(
            status="healthy",
            app_name=settings.APP_NAME,
            version="1.0.0",
            environment=settings.APP_ENV,
            database="connected",
            timestamp=datetime.utcnow().isoformat()
        )
    )

@app.get("/", tags=["System"])
async def root():
    return {
        "product": "AgentGuard",
        "tagline": "The security firewall for AI agents",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "online"
    }
