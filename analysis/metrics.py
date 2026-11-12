"""Ukuran deskriptif dari log untuk tahap Evaluation (PRD §6, TRACEABILITY GL03).

Semua fungsi murni (daftar masuk → daftar baris/dict keluar) sehingga dapat diuji dengan pytest.
Hasilnya deskriptif: TIDAK membuktikan penurunan beban kognitif (itu diukur dengan angket).
"""

from __future__ import annotations

import math
import statistics
from collections import defaultdict
from itertools import groupby

from load import STEP_ORDER, Log

NAN = float("nan")

PROBLEM_COLUMNS = ["class_code", "student_code", "problem_id", "problem_order", "started_at", "steps",
                   "total_tries", "max_hint_level", "opened_discussion", "all_correct", "minutes"]  # fmt: skip
TREND_COLUMNS = ["class_code", "student_code", "problems", "hint_first_half", "hint_second_half", "change"]
STEP_COLUMNS = ["step", "logs", "percent_correct", "mean_tries", "percent_used_hint"]


def _mean(values: list[float]) -> float:
    return sum(values) / len(values) if values else NAN


def _r(x: float, nd: int = 2) -> float:
    return x if math.isnan(x) else round(x, nd)


def per_problem(logs: list[Log]) -> list[dict]:
    """Satu baris per (siswa, soal), diurutkan menurut waktu mulai pertama.

    - problem_order: urutan soal ke-1, 2, ... untuk siswa itu
    - max_hint_level: level petunjuk tertinggi pada soal itu (indikator GL03)
    - all_correct: semua langkah yang tercatat berakhir benar
    """
    groups: dict[tuple[str, str, str], list[Log]] = defaultdict(list)
    for log in logs:
        groups[(log.class_code, log.student_code, log.problem_id)].append(log)

    rows = []
    for (cls, student, problem), g in groups.items():
        start = min(x.started_at for x in g)
        end = max(x.ended_at for x in g)
        rows.append(
            {
                "class_code": cls,
                "student_code": student,
                "problem_id": problem,
                "started_at": start,
                "steps": len({x.step for x in g}),
                "total_tries": sum(x.tries for x in g),
                "max_hint_level": max(x.max_hint_level for x in g),
                "opened_discussion": any(x.opened_discussion for x in g),
                "all_correct": all(x.correct for x in g),
                "minutes": round((end - start).total_seconds() / 60, 2),
            }
        )
    rows.sort(key=lambda r: (r["class_code"], r["student_code"], r["started_at"]))
    for _, g in groupby(rows, key=lambda r: (r["class_code"], r["student_code"])):
        for order, r in enumerate(g, start=1):
            r["problem_order"] = order
    return [{c: r[c] for c in PROBLEM_COLUMNS} for r in rows]


def hint_trend(problems: list[dict]) -> list[dict]:
    """Rata-rata level petunjuk separuh awal vs separuh akhir soal, per siswa.

    Sama dengan /api/teacher/summary: separuh awal = floor(n/2) soal pertama; soal tengah (n ganjil)
    masuk separuh akhir. Siswa dengan < 2 soal tidak punya perbandingan (NaN).
    change < 0 berarti petunjuk yang dipakai berkurang.
    """
    out = []
    ordered = sorted(problems, key=lambda r: (r["class_code"], r["student_code"], r["problem_order"]))
    for (cls, student), g in groupby(ordered, key=lambda r: (r["class_code"], r["student_code"])):
        hints = [r["max_hint_level"] for r in g]
        half = len(hints) // 2
        first = _mean(hints[:half]) if half else NAN
        second = _mean(hints[half:]) if half else NAN
        out.append(
            {
                "class_code": cls,
                "student_code": student,
                "problems": len(hints),
                "hint_first_half": _r(first),
                "hint_second_half": _r(second),
                "change": _r(second - first),
            }
        )
    return out


def per_step(logs: list[Log]) -> list[dict]:
    """Per langkah ①–⑤: banyak log, % benar, rata-rata percobaan, % memakai petunjuk.

    Langkah tanpa log tetap muncul (logs = 0, nilai lain NaN).
    """
    out = []
    for step in STEP_ORDER:
        g = [x for x in logs if x.step == step]
        n = len(g)
        out.append(
            {
                "step": step,
                "logs": n,
                "percent_correct": _r(100 * sum(x.correct for x in g) / n, 1) if n else NAN,
                "mean_tries": _r(_mean([x.tries for x in g])),
                "percent_used_hint": _r(100 * sum(x.max_hint_level > 0 for x in g) / n, 1) if n else NAN,
            }
        )
    return out


def class_overview(logs: list[Log], problems: list[dict], trend: list[dict]) -> dict[str, float | int]:
    pairs = [t["change"] for t in trend if not math.isnan(t["change"])]
    n_prob = len(problems)
    return {
        "students": len({(x.class_code, x.student_code) for x in logs}),
        "logs": len(logs),
        "problem_attempts": n_prob,
        "percent_problems_all_correct": round(100 * sum(p["all_correct"] for p in problems) / n_prob, 1)
        if n_prob
        else 0.0,
        "percent_problems_opened_discussion": round(100 * sum(p["opened_discussion"] for p in problems) / n_prob, 1)
        if n_prob
        else 0.0,
        "students_with_comparison": len(pairs),
        "students_hint_decreased": sum(c < 0 for c in pairs),
        "students_hint_same": sum(c == 0 for c in pairs),
        "students_hint_increased": sum(c > 0 for c in pairs),
        "median_hint_change": round(statistics.median(pairs), 2) if pairs else NAN,
    }
