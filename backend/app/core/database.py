from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

from app.core.config import settings
import sys
from sqlalchemy.pool import NullPool, QueuePool

pool_class = NullPool if 'pytest' in sys.modules else QueuePool
engine = create_async_engine(settings.DATABASE_URL, echo=False, poolclass=pool_class)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
