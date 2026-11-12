"""Tabel attempt_logs (ARCHITECTURE.md §4). Hanya kode kelas dan kode siswa, tanpa data pribadi."""

from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class AttemptLogRow(Base):
    __tablename__ = "attempt_logs"
    __table_args__ = (Index("ix_attempt_logs_class_student", "class_code", "student_code"),)

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    class_code: Mapped[str] = mapped_column(String(16))
    student_code: Mapped[str] = mapped_column(String(8))
    problem_id: Mapped[str] = mapped_column(String(32))
    step: Mapped[str] = mapped_column(String(8))
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    ended_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    tries: Mapped[int] = mapped_column(Integer)
    max_hint_level: Mapped[int] = mapped_column(Integer)
    opened_discussion: Mapped[bool] = mapped_column(Boolean)
    correct: Mapped[bool] = mapped_column(Boolean)
    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
