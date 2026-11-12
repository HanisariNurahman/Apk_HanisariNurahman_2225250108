"""Dependensi sesi database. Diganti (override) di create_app agar tiap aplikasi punya DB sendiri."""

from collections.abc import Iterator

from sqlalchemy.orm import Session


def get_session() -> Iterator[Session]:  # pragma: no cover - selalu di-override
    raise RuntimeError("Database belum diinisialisasi")
    yield
