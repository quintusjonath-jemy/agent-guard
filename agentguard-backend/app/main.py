from contextlib import asynccontextmanager
from datetime import datetime
from fastapi import FastAPI, Request, Depends, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.logging import setup_logging, logger
from app.database.connection import get_db
from app.database.init_db import init_db
from app.schemas.common import HealthCheckResponse, ApiResponse
from app.schemas.execution import ActionExecuteRequest, ExecutionResponse
from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.api_keys import router as api_keys_router
from app.api.agents import router as agents_router
from app.api.tools import router as tools_router
from app.api.policies import router as policies_router
from app.api.executions import router as executions_router
from app.api.approvals import router as approvals_router
from app.api.incidents import router as incidents_router
from app.api.audit_logs import router as audit_logs_router
from app.api.dashboard import router as dashboard_router
from app.api.simulator import router as simulator_router
from app.api.ws import router as ws_router
from app.api.deps import authenticate_caller
from app.services.execution_service import execution_service

# Initialize logging
setup_logging()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up AgentGuard Security Gateway...")
    import time
    for attempt in range(1, 31):
        try:
            init_db()
            logger.info("AgentGuard database verification & seed check complete.")
            break
        except Exception as e:
            if attempt == 30:
                logger.error(f"Failed to connect to database after 30 attempts: {e}")
            else:
                logger.warning(f"Waiting for database to be ready (attempt {attempt}/30)...")
                time.sleep(2)
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

# Direct Action Gateway Endpoint: POST /api/v1/execute
@app.post(f"{settings.API_PREFIX}/execute", response_model=ApiResponse[ExecutionResponse], tags=["Action Gateway"])
def direct_execute_agent_action(
    request: Request,
    payload: ActionExecuteRequest,
    db: Session = Depends(get_db),
    auth_context: dict = Depends(authenticate_caller)
):
    client_ip = request.client.host if request.client else "127.0.0.1"
    response = execution_service.process_action(
        db=db,
        request=payload,
        auth_context=auth_context,
        client_ip=client_ip
    )
    return ApiResponse(
        success=True,
        message=f"Action decision: {response.decision.value}",
        data=response
    )

# Include API Routers under API_PREFIX
app.include_router(auth_router, prefix=settings.API_PREFIX)
app.include_router(users_router, prefix=settings.API_PREFIX)
app.include_router(api_keys_router, prefix=settings.API_PREFIX)
app.include_router(agents_router, prefix=settings.API_PREFIX)
app.include_router(tools_router, prefix=settings.API_PREFIX)
app.include_router(policies_router, prefix=settings.API_PREFIX)
app.include_router(executions_router, prefix=settings.API_PREFIX)
app.include_router(approvals_router, prefix=settings.API_PREFIX)
app.include_router(incidents_router, prefix=settings.API_PREFIX)
app.include_router(audit_logs_router, prefix=settings.API_PREFIX)
app.include_router(dashboard_router, prefix=settings.API_PREFIX)
app.include_router(simulator_router, prefix=settings.API_PREFIX)
app.include_router(ws_router)

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
