"""Uji analisis dengan data buatan kecil yang hasilnya bisa dihitung tangan."""

import csv
import math

import pytest

from load import load_csv, normalize
from metrics import class_overview, hint_trend, per_problem, per_step
from report import main
from sample_data import generate, write_csv


def row(i, student, problem, minute, hint, step="P", correct=True, tries=1, discussion=False):
    return {
        "id": f"id-{i:04d}",
        "classCode": "8A",
        "studentCode": student,
        "problemId": problem,
        "step": step,
        "startedAt": f"2026-11-20T01:{minute:02d}:00Z",
        "endedAt": f"2026-11-20T01:{minute:02d}:30Z",
        "tries": tries,
        "maxHintLevel": hint,
        "openedDiscussion": discussion,
        "correct": correct,
    }


@pytest.fixture
def logs():
    return normalize(
        [
            # S01: 4 soal; D-01 dua langkah (petunjuk maks 3), lalu 1, 0, 0
            row(1, "S01", "D-01", 0, 3, step="S", correct=False, tries=3, discussion=True),
            row(2, "S01", "D-01", 1, 1, step="P"),
            row(3, "S01", "D-02", 5, 1),
            row(4, "S01", "C-01", 10, 0),
            row(5, "S01", "C-02", 15, 0),
            # S02: 3 soal (ganjil) → awal = [2], akhir = [2, 3]
            row(6, "S02", "D-01", 0, 2),
            row(7, "S02", "D-02", 5, 2),
            row(8, "S02", "C-01", 10, 3, correct=False),
            # S03: 1 soal → tidak ada perbandingan
            row(9, "S03", "D-01", 0, 1),
            row(9, "S03", "D-01", 0, 1),  # id ganda (terkirim dua kali) → dihitung sekali
        ]
    )


def by_student(rows):
    return {r["student_code"]: r for r in rows}


def test_normalize_camel_case_utc_dan_id_ganda(logs):
    assert len(logs) == 9
    assert logs[0].student_code == "S01"
    assert logs[0].started_at.utcoffset().total_seconds() == 0


def test_normalize_waktu_wib_jadi_utc():
    (log,) = normalize([{**row(1, "S01", "D-01", 0, 0), "startedAt": "2026-11-20T08:00:00+07:00"}])
    assert log.started_at.isoformat() == "2026-11-20T01:00:00+00:00"


@pytest.mark.parametrize(
    "override, msg",
    [({"step": "Z"}, "Langkah"), ({"correct": "mungkin"}, "true/false"), ({"tries": "dua"}, "Baris 1")],
)
def test_normalize_menolak_data_rusak(override, msg):
    with pytest.raises(ValueError, match=msg):
        normalize([{**row(1, "S01", "D-01", 0, 0), **override}])


def test_normalize_kolom_hilang():
    bad = row(1, "S01", "D-01", 0, 0)
    del bad["tries"]
    with pytest.raises(ValueError, match="tries"):
        normalize([bad])


def test_per_problem(logs):
    s01 = [p for p in per_problem(logs) if p["student_code"] == "S01"]
    assert [p["problem_id"] for p in s01] == ["D-01", "D-02", "C-01", "C-02"]
    assert [p["problem_order"] for p in s01] == [1, 2, 3, 4]
    d01 = s01[0]
    assert (d01["max_hint_level"], d01["steps"], d01["total_tries"]) == (3, 2, 4)
    assert d01["opened_discussion"] and not d01["all_correct"]
    assert d01["minutes"] == 1.5  # 01:00:00 → 01:01:30


def test_hint_trend_sama_dengan_backend(logs):
    t = by_student(hint_trend(per_problem(logs)))
    assert (t["S01"]["hint_first_half"], t["S01"]["hint_second_half"], t["S01"]["change"]) == (2.0, 0.0, -2.0)
    assert (t["S02"]["hint_first_half"], t["S02"]["hint_second_half"]) == (2.0, 2.5)
    assert math.isnan(t["S03"]["change"])


def test_per_step_dan_ringkasan(logs):
    s = {r["step"]: r for r in per_step(logs)}
    assert list(s) == ["mark", "S", "A", "P", "check"]
    assert s["S"]["logs"] == 1 and s["S"]["percent_correct"] == 0.0
    assert s["P"]["logs"] == 8 and s["P"]["percent_correct"] == 87.5
    assert s["mark"]["logs"] == 0 and math.isnan(s["mark"]["percent_correct"])

    p = per_problem(logs)
    o = class_overview(logs, p, hint_trend(p))
    assert o["students"] == 3 and o["problem_attempts"] == 8
    assert (o["students_hint_decreased"], o["students_hint_same"], o["students_hint_increased"]) == (1, 0, 1)
    assert o["median_hint_change"] == -0.75  # median(-2, +0,5)


def test_data_contoh_dapat_diulang():
    a, b = generate(5, seed=1), generate(5, seed=1)
    assert a == b
    assert {r["student_code"] for r in a} == {"S01", "S02", "S03", "S04", "S05"}


def test_laporan_ujung_ke_ujung(tmp_path):
    path = tmp_path / "contoh.csv"
    rows = generate(6, seed=3)
    write_csv(rows, str(path))
    out = tmp_path / "laporan"
    assert main(["--csv", str(path), "--out", str(out)]) == 0
    for name in ["laporan.md", "per_soal.csv", "tren_petunjuk.csv", "per_langkah.csv",
                 "petunjuk_per_soal.png", "petunjuk_awal_akhir.png", "per_langkah.png"]:  # fmt: skip
        assert (out / name).stat().st_size > 0, name
    text = (out / "laporan.md").read_text(encoding="utf-8")
    assert "deskriptif" in text and "terbukti" not in text and "nan" not in text
    assert len(load_csv(path)) == len(rows)
    with open(out / "per_soal.csv", encoding="utf-8") as f:
        assert next(csv.reader(f))[:3] == ["class_code", "student_code", "problem_id"]


def test_csv_ekspor_backend_dapat_dibaca(tmp_path):
    # Format persis keluaran GET /api/teacher/logs?format=csv (snake_case, True/False, ada received_at)
    path = tmp_path / "backend.csv"
    path.write_text(
        "id,class_code,student_code,problem_id,step,started_at,ended_at,tries,max_hint_level,"
        "opened_discussion,correct,received_at\n"
        "aaaaaaaa-0001,8A,S01,D-01,P,2026-11-12T01:00:00+00:00,2026-11-12T01:01:00+00:00,2,1,False,True,"
        "2026-11-12T07:53:37.616920+00:00\n",
        encoding="utf-8",
    )
    (log,) = load_csv(path)
    assert (log.student_code, log.tries, log.correct, log.opened_discussion) == ("S01", 2, True, False)
