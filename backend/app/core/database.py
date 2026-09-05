import sys
import os

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.pool import NullPool

from app.core.config import settings

kwargs = {}
is_serverless = os.getenv("VERCEL") == "1"

if 'pytest' in sys.modules or is_serverless:
    kwargs['poolclass'] = NullPool

if is_serverless:
    kwargs['connect_args'] = {
        "statement_cache_size": 0,
        "prepared_statement_cache_size": 0,
    }

engine = create_async_engine(settings.get_async_db_url, echo=False, **kwargs)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
