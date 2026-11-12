"""Skema Pydantic.

AttemptLog HARUS selalu sama dengan `AttemptLog` di src/types.ts. Ubah keduanya bersamaan.
JSON memakai camelCase (seperti di frontend); Python memakai snake_case.
"""

from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from pydantic.alias_generators import to_camel

StepId = Literal["mark", "S", "A", "P", "check"]

MAX_BATCH = 500


def as_utc(v: datetime) -> datetime:
    """Semua waktu disimpan dalam UTC. Waktu tanpa zona (mis. dibaca dari SQLite) dianggap sudah UTC."""
    return v.replace(tzinfo=timezone.utc) if v.tzinfo is None else v.astimezone(timezone.utc)


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class AttemptLog(CamelModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, extra="forbid")

    id: str = Field(min_length=8, max_length=64)
    class_code: str = Field(min_length=1, max_length=16, pattern=r"^[A-Za-z0-9-]+$")
    student_code: str = Field(pattern=r"^[A-Z]\d{1,3}$")
    problem_id: str = Field(min_length=1, max_length=32)
    step: StepId
    started_at: datetime
    ended_at: datetime
    tries: int = Field(ge=0, le=1000)
    max_hint_level: int = Field(ge=0, le=3)
    opened_discussion: bool
    correct: bool

    @field_validator("started_at", "ended_at")
    @classmethod
    def _to_utc(cls, v: datetime) -> datetime:
        return as_utc(v)

    @model_validator(mode="after")
    def _ended_after_started(self) -> "AttemptLog":
        if self.ended_at < self.started_at:
            raise ValueError("endedAt tidak boleh sebelum startedAt")
        return self


class LogBatch(CamelModel):
    logs: list[AttemptLog] = Field(max_length=MAX_BATCH)


class LogBatchResult(CamelModel):
    accepted: list[str]
    duplicates: list[str]


class StudentSummary(CamelModel):
    class_code: str
    student_code: str
    problems_attempted: int
    percent_correct: float
    # Rata-rata level petunjuk tertinggi per soal: separuh awal vs separuh akhir (indikator kemandirian, GL03)
    avg_hint_first_half: float | None
    avg_hint_second_half: float | None
    discussions_opened: int
