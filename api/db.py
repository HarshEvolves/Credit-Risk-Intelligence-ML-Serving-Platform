"""Postgres prediction logging via SQLAlchemy.

Table creation happens once at API startup (see init_db() call in main.py) —
one small table, not worth an Alembic migration setup at this scale.
"""

import os
from datetime import datetime, timezone

from dotenv import load_dotenv
from sqlalchemy import JSON, Boolean, DateTime, Float, Integer, String, create_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg2://postgres:postgres@localhost:5432/credit_risk")

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


class PredictionLog(Base):
    __tablename__ = "predictions"

    id: Mapped[int] = mapped_column(primary_key=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    model_version: Mapped[str] = mapped_column(String)
    default_probability: Mapped[float] = mapped_column(Float)
    risk_category: Mapped[str] = mapped_column(String)
    default_flag: Mapped[bool] = mapped_column(Boolean)
    latency_ms: Mapped[float] = mapped_column(Float)  # model inference only, never includes narrative generation
    narrative_latency_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    input_payload: Mapped[dict] = mapped_column(JSON)  # raw request, for later drift analysis


class ErrorLog(Base):
    __tablename__ = "errors"

    id: Mapped[int] = mapped_column(primary_key=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    endpoint: Mapped[str] = mapped_column(String)
    status_code: Mapped[int] = mapped_column(Integer)
    detail: Mapped[str] = mapped_column(String)


def init_db() -> None:
    Base.metadata.create_all(bind=engine)


def log_prediction(**fields) -> None:
    with SessionLocal() as session:
        session.add(PredictionLog(**fields))
        session.commit()


def get_recent_predictions(limit: int = 20) -> list[PredictionLog]:
    with SessionLocal() as session:
        return session.query(PredictionLog).order_by(PredictionLog.timestamp.desc()).limit(limit).all()


def log_error(endpoint: str, status_code: int, detail: str) -> None:
    with SessionLocal() as session:
        session.add(ErrorLog(endpoint=endpoint, status_code=status_code, detail=detail[:2000]))
        session.commit()
