"""Memuat log penelitian (AttemptLog) dari CSV ekspor atau dari API guru backend.

Hanya memakai pustaka bawaan Python (csv, json, urllib). pandas tidak dipakai karena DLL-nya
diblokir Smart App Control di laptop peneliti.

Hasilnya selalu daftar `Log` yang sudah divalidasi, apa pun sumbernya. Nama kolom boleh
camelCase (JSON API / ekspor frontend) atau snake_case (CSV backend).
"""

from __future__ import annotations

import csv
import json
import re
import urllib.parse
import urllib.request
from collections.abc import Iterable, Mapping
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

COLUMNS = [
    "id", "class_code", "student_code", "problem_id", "step", "started_at", "ended_at",
    "tries", "max_hint_level", "opened_discussion", "correct",
]  # fmt: skip

STEP_ORDER = ["mark", "S", "A", "P", "check"]
STEP_LABELS = {"mark": "① Tandai", "S": "② Ruang sampel", "A": "③ Kejadian", "P": "④ Peluang", "check": "⑤ Cek"}


@dataclass(frozen=True)
class Log:
    id: str
    class_code: str
    student_code: str
    problem_id: str
    step: str
    started_at: datetime  # selalu UTC
    ended_at: datetime
    tries: int
    max_hint_level: int
    opened_discussion: bool
    correct: bool


def _snake(name: str) -> str:
    return re.sub(r"(?<!^)(?=[A-Z])", "_", name.strip()).lower()


def _to_utc(value: object) -> datetime:
    dt = value if isinstance(value, datetime) else datetime.fromisoformat(str(value).strip())
    return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt.astimezone(timezone.utc)


def _to_bool(value: object, field: str) -> bool:
    if isinstance(value, bool):
        return value
    text = str(value).strip().lower()
    if text in ("true", "1"):
        return True
    if text in ("false", "0"):
        return False
    raise ValueError(f"Nilai {field} harus true/false, bukan {value!r}")


def _to_log(raw: Mapping[str, object], line: int) -> Log:
    rec = {_snake(k): v for k, v in raw.items()}
    missing = [c for c in COLUMNS if c not in rec]
    if missing:
        raise ValueError(f"Kolom tidak ada di data log: {', '.join(missing)}")
    try:
        step = str(rec["step"])
        if step not in STEP_ORDER:
            raise ValueError(f"Langkah tidak dikenal: {step}")
        return Log(
            id=str(rec["id"]),
            class_code=str(rec["class_code"]),
            student_code=str(rec["student_code"]),
            problem_id=str(rec["problem_id"]),
            step=step,
            started_at=_to_utc(rec["started_at"]),
            ended_at=_to_utc(rec["ended_at"]),
            tries=int(rec["tries"]),  # type: ignore[arg-type]
            max_hint_level=int(rec["max_hint_level"]),  # type: ignore[arg-type]
            opened_discussion=_to_bool(rec["opened_discussion"], "opened_discussion"),
            correct=_to_bool(rec["correct"], "correct"),
        )
    except (TypeError, ValueError) as e:
        raise ValueError(f"Baris {line}: {e}") from e


def normalize(records: Iterable[Mapping[str, object]]) -> list[Log]:
    """Validasi + ubah ke `Log`, buang id ganda (log terkirim/diekspor dua kali), urutkan."""
    seen: set[str] = set()
    logs: list[Log] = []
    for i, raw in enumerate(records, start=1):
        log = _to_log(raw, i)
        if log.id in seen:
            continue
        seen.add(log.id)
        logs.append(log)
    return sorted(logs, key=lambda x: (x.class_code, x.student_code, x.started_at))


def load_csv(path: str | Path) -> list[Log]:
    with open(path, newline="", encoding="utf-8-sig") as f:
        return normalize(csv.DictReader(f))


def load_api(base_url: str, token: str, class_code: str | None = None, timeout: float = 30) -> list[Log]:
    """Mengambil log dari GET {base_url}/teacher/logs. `base_url` mis. https://host/api."""
    query = urllib.parse.urlencode({"class_code": class_code} if class_code else {})
    url = f"{base_url.rstrip('/')}/teacher/logs" + (f"?{query}" if query else "")
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}", "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as res:  # noqa: S310 (URL dari peneliti sendiri)
        return normalize(json.load(res))
