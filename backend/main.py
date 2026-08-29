import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from app.core import (
    Config,
    engine,
    get_config,
)
from app.core.domains import load_domains
from app.core.logging_config import setup_logging
from app.routes import router
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from granian import Granian
from granian.constants import Interfaces

logger: logging.Logger = logging.getLogger(__name__)
config: Config = get_config()

setup_logging(debug=config.DEBUG)


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncGenerator[None, None]:
    logger.info("starting up Research Management Platform")
    try:
        await load_domains()
        logger.info("startup complete")
    except Exception as e:
        logger.error("startup failed: %s", e)
        raise
    yield
    logger.info("shutting down")
    await engine.dispose()
    logger.info("shutdown complete")


app = FastAPI(
    title="Scientific Collaboration Network Analyzer",
    version="1.0.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router, prefix="/api")


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, e: Exception) -> JSONResponse:
    logger.error(f"Unhandled exception: {e}")
    return JSONResponse(status_code=500, content={"detail": "internal server error"})


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


if __name__ == "__main__":
    Granian(
        target="main:app",
        address="0.0.0.0",
        port=8000,
        interface=Interfaces.ASGI,
        reload=True,
        reload_ignore_dirs=["logs"],
    ).serve()
