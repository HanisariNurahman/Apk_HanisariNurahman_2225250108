"""GET /api/teacher/...: data mentah dan ringkasan untuk peneliti/guru (butuh token)."""

import csv
import io
from collections import defaultdict
from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..deps import get_session
from ..models import AttemptLogRow
from ..schemas import AttemptLog, StudentSummary, as_utc
from ..security import require_teacher

router = APIRouter(prefix="/api/teacher", tags=["teacher"], dependencies=[Depends(require_teacher)])

CSV_FIELDS = [
    "id", "class_code", "student_code", "problem_id", "step", "started_at", "ended_at",
    "tries", "max_hint_level", "opened_discussion", "correct", "received_at",
]  # fmt: skip


def _query(session: Session, class_code: str | None, student_code: str | None) -> list[AttemptLogRow]:
    stmt = select(AttemptLogRow).order_by(AttemptLogRow.student_code, AttemptLogRow.started_at)
    if class_code:
        stmt = stmt.where(AttemptLogRow.class_code == class_code)
    if student_code:
        stmt = stmt.where(AttemptLogRow.student_code == student_code)
    return list(session.scalars(stmt))


def _cell(value: object) -> object:
    return as_utc(value).isoformat() if isinstance(value, datetime) else value


def to_csv(rows: list[AttemptLogRow]) -> str:
    buf = io.StringIO()
    writer = csv.writer(buf, lineterminator="\n")
    writer.writerow(CSV_FIELDS)
    for r in rows:
        writer.writerow([_cell(getattr(r, f)) for f in CSV_FIELDS])
    return buf.getvalue()


@router.get("/logs", response_model=list[AttemptLog])
def get_logs(
    class_code: str | None = None,
    student_code: str | None = None,
    format: Literal["json", "csv"] = "json",
    session: Session = Depends(get_session),
) -> Response:
    rows = _query(session, class_code, student_code)
    if format == "csv":
        return Response(
            content=to_csv(rows),
            media_type="text/csv; charset=utf-8",
            headers={"Content-Disposition": 'attachment; filename="peluangku-logs.csv"'},
        )
    data = [AttemptLog.model_validate(r, from_attributes=True).model_dump(mode="json", by_alias=True) for r in rows]
    return JSONResponse(data)


def _mean(values: list[int]) -> float | None:
    return round(sum(values) / len(values), 2) if values else None


def summarize(rows: list[AttemptLogRow]) -> list[StudentSummary]:
    """Ringkasan per siswa.

    Satu soal = semua log dengan problem_id sama; soal diurutkan menurut waktu mulai pertamanya.
    Level petunjuk per soal = level tertinggi yang dipakai pada soal itu.
    """
    by_student: dict[tuple[str, str], list[AttemptLogRow]] = defaultdict(list)
    for r in rows:
        by_student[(r.class_code, r.student_code)].append(r)

    result: list[StudentSummary] = []
    for (cls, student), logs in sorted(by_student.items()):
        problems: dict[str, list[AttemptLogRow]] = defaultdict(list)
        for r in sorted(logs, key=lambda x: x.started_at):
            problems[r.problem_id].append(r)
        hint_per_problem = [max(r.max_hint_level for r in group) for group in problems.values()]
        half = len(hint_per_problem) // 2
        result.append(
            StudentSummary(
                class_code=cls,
                student_code=student,
                problems_attempted=len(problems),
                percent_correct=round(100 * sum(r.correct for r in logs) / len(logs), 1),
                avg_hint_first_half=_mean(hint_per_problem[:half]),
                avg_hint_second_half=_mean(hint_per_problem[half:]) if half else None,
                discussions_opened=sum(r.opened_discussion for r in logs),
            )
        )
    return result


@router.get("/summary", response_model=list[StudentSummary], response_model_by_alias=True)
def get_summary(class_code: str | None = None, session: Session = Depends(get_session)) -> list[StudentSummary]:
    return summarize(_query(session, class_code, None))
