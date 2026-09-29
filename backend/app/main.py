import time
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from backend.app.config import settings
from backend.app.db.session import engine, Base, SessionLocal
from backend.app.api.v1.api import api_router
from backend.app.utils.logger import logger
from backend.app.services.activity_seed import seed_activities_if_empty
from backend.app.services.demo_seed import seed_demo_usage_if_empty
# Ensure all models are imported so Base.metadata knows about them
import backend.app.models


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables exist and seed initial activity library
    logger.info("Initializing database schema...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        seed_activities_if_empty(db)
        seed_demo_usage_if_empty(db)
    finally:
        db.close()
    logger.info("Habit Loop Mirror backend ready.")
    yield
    logger.info("Habit Loop Mirror backend shutting down.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Habit Loop Mirror — Understand the patterns behind your digital habits.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def structured_logging_middleware(request: Request, call_next):
    """Logs every incoming request with correlation ID, latency, and status code"""
    req_id = str(uuid.uuid4())[:8]
    request.state.request_id = req_id
    start_time = time.time()

    # Process request
    response = await call_next(request)

    duration_ms = round((time.time() - start_time) * 1000, 2)
    # Structured log
    logger.info(
        f"{request.method} {request.url.path} returned {response.status_code} in {duration_ms}ms",
        extra={
            "request_id": req_id,
            "route": request.url.path,
            "status": response.status_code,
            "duration_ms": duration_ms
        }
    )
    response.headers["X-Request-ID"] = req_id
    return response


# Global error handling conforming strictly to API contract
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    detail = exc.detail
    if isinstance(detail, dict) and "message" in detail and "error_code" in detail:
        return JSONResponse(status_code=exc.status_code, content=detail)

    error_code = "HTTP_ERROR"
    if exc.status_code == 401:
        error_code = "SESSION_EXPIRED"
    elif exc.status_code == 403:
        error_code = "PERMISSION_DENIED"
    elif exc.status_code == 404:
        error_code = "NOT_FOUND"

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "data": None,
            "message": str(detail),
            "error_code": error_code
        }
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    first_msg = errors[0]["msg"] if errors else "Invalid input"
    first_loc = " -> ".join(str(l) for l in errors[0].get("loc", [])) if errors else ""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "data": None,
            "message": f"Validation error at {first_loc}: {first_msg}",
            "error_code": "INVALID_INPUT"
        }
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    req_id = getattr(request.state, "request_id", "unknown")
    logger.error(
        f"Unhandled error processing {request.method} {request.url.path}: {str(exc)}",
        exc_info=True,
        extra={"request_id": req_id, "route": request.url.path}
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "data": None,
            "message": "An internal server error occurred. Please try again.",
            "error_code": "INTERNAL_SERVER_ERROR"
        }
    )


# Mount API V1 routes
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def root_endpoint():
    return {
        "product": "Habit Loop Mirror",
        "tagline": "Screen Time tells you how much. We tell you why.",
        "version": "1.0.0",
        "docs_url": "/docs",
        "health_url": f"{settings.API_V1_STR}/health"
    }
