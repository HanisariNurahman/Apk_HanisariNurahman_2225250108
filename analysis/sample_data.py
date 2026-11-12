"""Membuat DATA CONTOH BUATAN (bukan data siswa) untuk menguji alur analisis.

    python sample_data.py --out contoh.csv --students 12 --seed 7

Polanya sengaja dibuat: petunjuk cenderung berkurang di soal-soal akhir, dengan variasi acak.
Jangan pernah melaporkan hasil dari data ini sebagai temuan penelitian.
"""

from __future__ import annotations

import argparse
import csv
import random
import uuid
from datetime import datetime, timedelta, timezone

from load import COLUMNS, STEP_ORDER

PROBLEMS = ["D-01", "D-02", "D-03", "C-01", "C-02", "C-03", "C-04", "P-01"]


def generate(students: int = 12, seed: int = 7, class_code: str = "8A") -> list[dict]:
    rng = random.Random(seed)
    start = datetime(2026, 11, 20, 1, 0, tzinfo=timezone.utc)  # 08.00 WIB
    rows = []
    for s in range(1, students + 1):
        student = f"S{s:02d}"
        ability = rng.uniform(0, 1)
        t = start + timedelta(minutes=rng.randint(0, 5))
        n_problems = rng.randint(5, len(PROBLEMS))
        for p_idx, problem in enumerate(PROBLEMS[:n_problems]):
            progress = p_idx / max(1, len(PROBLEMS) - 1)
            for step in STEP_ORDER:
                need = 3 * (1 - ability) * (1 - 0.7 * progress) + rng.gauss(0, 0.6)
                hint = max(0, min(3, round(need)))
                tries = 1 + max(0, round(rng.gauss(hint * 0.6, 0.5)))
                correct = rng.random() < 0.65 + 0.3 * ability
                duration = timedelta(seconds=rng.randint(20, 90) + 25 * hint)
                rows.append(
                    {
                        "id": str(uuid.UUID(int=rng.getrandbits(128), version=4)),
                        "class_code": class_code,
                        "student_code": student,
                        "problem_id": problem,
                        "step": step,
                        "started_at": t.isoformat(),
                        "ended_at": (t + duration).isoformat(),
                        "tries": tries,
                        "max_hint_level": hint,
                        "opened_discussion": hint == 3 and rng.random() < 0.4,
                        "correct": correct,
                    }
                )
                t += duration + timedelta(seconds=5)
            t += timedelta(minutes=1)
    return rows


def write_csv(rows: list[dict], path: str) -> None:
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=COLUMNS)
        w.writeheader()
        w.writerows(rows)


def main() -> None:
    ap = argparse.ArgumentParser(description="Buat data log contoh buatan (bukan data siswa).")
    ap.add_argument("--out", default="contoh.csv")
    ap.add_argument("--students", type=int, default=12)
    ap.add_argument("--seed", type=int, default=7)
    args = ap.parse_args()
    write_csv(generate(args.students, args.seed), args.out)
    print(f"Data contoh buatan ditulis ke {args.out}")


if __name__ == "__main__":
    main()
