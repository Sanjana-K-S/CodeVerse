from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import DATABASE_URL

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Test database connection
try:
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    print("✅ Connected to MySQL successfully!")
except Exception as e:
    print("❌ Database connection failed:")
    print(e)