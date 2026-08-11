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
        migrations = [
            "ALTER TABLE submission_batches ADD COLUMN IF NOT EXISTS batch_number INTEGER",
            "ALTER TABLE submission_batches ADD COLUMN IF NOT EXISTS customer_mac_no VARCHAR",
            "ALTER TABLE submission_batches ADD COLUMN IF NOT EXISTS submitter_name VARCHAR",
            "ALTER TABLE samples ADD COLUMN IF NOT EXISTS contact_person VARCHAR",
            "ALTER TABLE samples ADD COLUMN IF NOT EXISTS test_tdf BOOLEAN DEFAULT FALSE",
            "ALTER TABLE samples ADD COLUMN IF NOT EXISTS lab_sample_id VARCHAR",
            "ALTER TABLE samples ADD COLUMN IF NOT EXISTS ag_sample_id VARCHAR",
            "ALTER TABLE samples ADD COLUMN IF NOT EXISTS variety VARCHAR",
            "ALTER TABLE samples ADD COLUMN IF NOT EXISTS assortment_code VARCHAR",
            "ALTER TABLE samples ADD COLUMN IF NOT EXISTS series VARCHAR",
            "ALTER TABLE samples ADD COLUMN IF NOT EXISTS country VARCHAR DEFAULT 'Deutschland'",
            "ALTER TABLE samples ADD COLUMN IF NOT EXISTS state_region VARCHAR",
            "ALTER TABLE samples ADD COLUMN IF NOT EXISTS location_city VARCHAR",
            "ALTER TABLE samples ADD COLUMN IF NOT EXISTS sowing_year INTEGER",
            "ALTER TABLE samples ADD COLUMN IF NOT EXISTS harvest_year INTEGER",
            "ALTER TABLE samples ADD COLUMN IF NOT EXISTS harvest_year_code VARCHAR",
            "ALTER TABLE samples ADD COLUMN IF NOT EXISTS location_remark TEXT",
            "ALTER TABLE samples ADD COLUMN IF NOT EXISTS customer_notes TEXT",
            "ALTER TABLE samples ADD COLUMN IF NOT EXISTS sedimentation_value_ml FLOAT",
            "ALTER TABLE samples ADD COLUMN IF NOT EXISTS grain_hardness FLOAT",
            "ALTER TABLE samples ADD COLUMN IF NOT EXISTS falling_number_sec FLOAT",
            "ALTER TABLE samples ADD COLUMN IF NOT EXISTS test_plan VARCHAR DEFAULT 'Raw Materials NIR R Cereals'",
            "ALTER TABLE samples ADD COLUMN IF NOT EXISTS mac_code VARCHAR DEFAULT '11550'",
            "ALTER TABLE samples ADD COLUMN IF NOT EXISTS lab_customer_id VARCHAR DEFAULT '61063'"
        ]
        for stmt in migrations:
            try:
                with engine.begin() as conn:
                    conn.execute(text(stmt))
            except Exception as m_err:
                logger.info(f"Migration note ({stmt}): {m_err}")
    except Exception as e:
        logger.error(f"Error in init_db: {e}")

def get_session():
    with Session(engine) as session:
        yield session
