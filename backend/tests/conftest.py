import os

# Sebelum app.main di-import: `app` tingkat modul tidak boleh membuat file DB saat tes.
os.environ["DATABASE_URL"] = "sqlite://"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.config import Settings
from app.main import create_app

CLASS_KEY = "kunci-uji-8a"
TEACHER = "token-guru-uji-1234567890"


@pytest.fixture
def client() -> TestClient:
    settings = Settings(
        _env_file=None,
        database_url="sqlite://",
        class_keys=f"8A:{CLASS_KEY},8B:kunci-uji-8b",
        teacher_token=TEACHER,
        frontend_origin="http://localhost:5173",
    )
    with TestClient(create_app(settings)) as c:
        yield c


def make_log(**overrides) -> dict:
    log = {
        "id": "0b6f2a3e-1111-4c1a-9a00-000000000001",
        "classCode": "8A",
        "studentCode": "S01",
        "problemId": "D-01",
        "step": "P",
        "startedAt": "2026-11-12T08:00:00+07:00",
        "endedAt": "2026-11-12T08:01:30+07:00",
        "tries": 1,
        "maxHintLevel": 0,
        "openedDiscussion": False,
        "correct": True,
    }
    log.update(overrides)
    return log


@pytest.fixture
def class_headers() -> dict:
    return {"X-Class-Key": CLASS_KEY}


@pytest.fixture
def teacher_headers() -> dict:
    return {"Authorization": f"Bearer {TEACHER}"}
