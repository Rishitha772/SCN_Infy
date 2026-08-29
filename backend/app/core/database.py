import logging
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.ext.asyncio.engine import AsyncEngine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import Config, get_config

logger: logging.Logger = logging.getLogger(__name__)

configure: Config = get_config()

engine: AsyncEngine = create_async_engine(
    url=configure.DATABASE_URL,
    echo=configure.DEBUG,
    connect_args={"check_same_thread": False}
    if "sqlite" in configure.DATABASE_URL
    else {},
)
session: async_sessionmaker[AsyncSession] = async_sessionmaker(
    bind=engine, autoflush=False, expire_on_commit=False
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    logger.debug("opening database session")
    async with session() as db:
        try:
            yield db
        finally:
            logger.debug("closing database session")
            await db.close()
