import logging
from sqlmodel import SQLModel, create_engine, Session
from app.config import settings

logger = logging.getLogger(__name__)

db_url = settings.database_url
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

try:
    engine = create_engine(db_url, echo=False, pool_pre_ping=True)
    with engine.connect() as conn:
        pass
except Exception as e:
    logger.warning(f"Failed to connect to primary DB ({db_url}): {e}. Falling back to SQLite.")
    engine = create_engine("sqlite:///./fallback.db", echo=False, pool_pre_ping=True)

def init_db():
    try:
        SQLModel.metadata.create_all(engine)
    except Exception as e:
        logger.error(f"Error in init_db: {e}")

def get_session():
    with Session(engine) as session:
        yield session
