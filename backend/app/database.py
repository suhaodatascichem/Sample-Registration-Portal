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

from sqlalchemy import text

def init_db():
    import app.models  # Ensure all SQLModel tables (Customer, SubmissionBatch, Sample, AuditLog) are registered in metadata
    try:
        SQLModel.metadata.create_all(engine)
        # Auto-migrate any missing columns on existing PostgreSQL / SQLite tables
        with engine.begin() as conn:
            migrations = [
                "ALTER TABLE submission_batches ADD COLUMN IF NOT EXISTS batch_number INTEGER",
                "ALTER TABLE submission_batches ADD COLUMN IF NOT EXISTS customer_mac_no VARCHAR",
                "ALTER TABLE submission_batches ADD COLUMN IF NOT EXISTS submitter_name VARCHAR",
                "ALTER TABLE samples ADD COLUMN IF NOT EXISTS contact_person VARCHAR"
            ]
            for stmt in migrations:
                try:
                    conn.execute(text(stmt))
                except Exception as m_err:
                    logger.info(f"Migration note ({stmt}): {m_err}")
    except Exception as e:
        logger.error(f"Error in init_db: {e}")

def get_session():
    with Session(engine) as session:
        yield session
