"""Kasus uji wajib backend (ARCHITECTURE.md §7)."""

import pytest

from .conftest import make_log


def test_health(client):
    assert client.get("/api/health").json() == {"status": "ok"}


def test_log_valid_diterima(client, class_headers):
    r = client.post("/api/logs", json={"logs": [make_log()]}, headers=class_headers)
    assert r.status_code == 200
    assert r.json() == {"accepted": [make_log()["id"]], "duplicates": []}


def test_kirim_ulang_tidak_membuat_duplikat(client, class_headers, teacher_headers):
    body = {"logs": [make_log()]}
    client.post("/api/logs", json=body, headers=class_headers)
    r = client.post("/api/logs", json=body, headers=class_headers)
    assert r.json() == {"accepted": [], "duplicates": [make_log()["id"]]}
    assert len(client.get("/api/teacher/logs", headers=teacher_headers).json()) == 1


def test_id_kembar_dalam_satu_kiriman(client, class_headers):
    r = client.post("/api/logs", json={"logs": [make_log(), make_log()]}, headers=class_headers)
    assert r.json() == {"accepted": [make_log()["id"]], "duplicates": [make_log()["id"]]}


@pytest.mark.parametrize("headers", [{}, {"X-Class-Key": "salah"}])
def test_kunci_kelas_salah_401(client, headers):
    r = client.post("/api/logs", json={"logs": [make_log()]}, headers=headers)
    assert r.status_code == 401


def test_kunci_kelas_lain_401(client):
    # Kunci 8B tidak boleh dipakai mengirim log kelas 8A
    r = client.post("/api/logs", json={"logs": [make_log()]}, headers={"X-Class-Key": "kunci-uji-8b"})
    assert r.status_code == 401


@pytest.mark.parametrize("headers", [{}, {"Authorization": "Bearer salah"}])
@pytest.mark.parametrize("path", ["/api/teacher/logs", "/api/teacher/summary"])
def test_token_guru_salah_401(client, headers, path):
    assert client.get(path, headers=headers).status_code == 401


@pytest.mark.parametrize(
    "override",
    [
        {"studentCode": "siswa01"},  # bukan pola S01
        {"studentCode": "Budi"},  # nama tidak boleh
        {"step": "Z"},
        {"maxHintLevel": 4},
        {"endedAt": "2026-11-12T07:59:00+07:00"},  # sebelum startedAt
        {"nama": "Budi"},  # field tambahan (data pribadi) ditolak
    ],
)
def test_data_tidak_valid_422(client, class_headers, override):
    r = client.post("/api/logs", json={"logs": [make_log(**override)]}, headers=class_headers)
    assert r.status_code == 422


def test_batch_lebih_dari_500_ditolak(client, class_headers):
    logs = [make_log(id=f"id-{i:08d}") for i in range(501)]
    assert client.post("/api/logs", json={"logs": logs}, headers=class_headers).status_code == 422


def test_guru_lihat_log_json_dan_csv(client, class_headers, teacher_headers):
    client.post("/api/logs", json={"logs": [make_log()]}, headers=class_headers)
    data = client.get("/api/teacher/logs?class_code=8A", headers=teacher_headers).json()
    assert data[0]["studentCode"] == "S01" and data[0]["maxHintLevel"] == 0

    r = client.get("/api/teacher/logs?format=csv", headers=teacher_headers)
    assert r.headers["content-type"].startswith("text/csv")
    header, row = r.text.strip().split("\n")
    assert header.startswith("id,class_code,student_code")
    assert ",S01,D-01," in row
    # 08:00 WIB disimpan dan diekspor sebagai 01:00 UTC, lengkap dengan zona
    assert ",2026-11-12T01:00:00+00:00," in row
    assert data[0]["startedAt"].startswith("2026-11-12T01:00:00")


def test_ringkasan_per_siswa(client, class_headers, teacher_headers):
    logs = [
        make_log(id="log-0000001", problemId="D-01", maxHintLevel=3, correct=False, openedDiscussion=True),
        make_log(id="log-0000002", problemId="D-01", maxHintLevel=1, startedAt="2026-11-12T08:01:00+07:00",
                 endedAt="2026-11-12T08:02:00+07:00"),
        make_log(id="log-0000003", problemId="D-02", maxHintLevel=1, startedAt="2026-11-12T08:05:00+07:00",
                 endedAt="2026-11-12T08:06:00+07:00"),
        make_log(id="log-0000004", problemId="C-01", maxHintLevel=0, startedAt="2026-11-12T08:10:00+07:00",
                 endedAt="2026-11-12T08:11:00+07:00"),
        make_log(id="log-0000005", problemId="C-02", maxHintLevel=0, startedAt="2026-11-12T08:15:00+07:00",
                 endedAt="2026-11-12T08:16:00+07:00"),
        make_log(id="log-0000006", studentCode="S02"),
    ]  # fmt: skip
    client.post("/api/logs", json={"logs": logs}, headers=class_headers)
    s01, s02 = client.get("/api/teacher/summary?class_code=8A", headers=teacher_headers).json()
    assert s01["studentCode"] == "S01"
    assert s01["problemsAttempted"] == 4
    assert s01["percentCorrect"] == 80.0
    assert s01["avgHintFirstHalf"] == 2.0  # D-01 (maks 3), D-02 (1)
    assert s01["avgHintSecondHalf"] == 0.0  # C-01, C-02
    assert s01["discussionsOpened"] == 1
    assert s02["problemsAttempted"] == 1 and s02["avgHintFirstHalf"] is None
