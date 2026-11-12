"""POST /api/logs: menerima log dari HP siswa secara idempoten."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..deps import get_session
from ..models import AttemptLogRow
from ..schemas import LogBatch, LogBatchResult
from ..security import require_class_key

router = APIRouter(prefix="/api", tags=["logs"])


@router.post("/logs", response_model=LogBatchResult)
def post_logs(
    batch: LogBatch,
    classes: set[str] = Depends(require_class_key),
    session: Session = Depends(get_session),
) -> LogBatchResult:
    wrong = sorted({log.class_code for log in batch.logs} - classes)
    if wrong:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, f"Kunci kelas tidak cocok untuk kelas: {', '.join(wrong)}")

    ids = [log.id for log in batch.logs]
    existing = set(session.scalars(select(AttemptLogRow.id).where(AttemptLogRow.id.in_(ids)))) if ids else set()

    accepted: list[str] = []
    duplicates: list[str] = []
    for log in batch.logs:
        if log.id in existing:
            duplicates.append(log.id)
            continue
        existing.add(log.id)  # id kembar dalam satu kiriman juga dihitung duplikat
        session.add(AttemptLogRow(**log.model_dump()))
        accepted.append(log.id)
    session.commit()
    return LogBatchResult(accepted=accepted, duplicates=duplicates)
