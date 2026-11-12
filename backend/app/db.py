"""Engine dan sesi SQLAlchemy. SQLite (dev) atau PostgreSQL (produksi) dipilih lewat DATABASE_URL."""

from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.pool import StaticPool


class Base(DeclarativeBase):
    pass


def make_engine(url: str) -> Engine:
    if url.startswith("sqlite"):
        kwargs: dict = {"connect_args": {"check_same_thread": False}}
        if url in ("sqlite://", "sqlite:///:memory:"):
            kwargs["poolclass"] = StaticPool  # satu koneksi bersama agar DB di memori tidak hilang (tes)
        return create_engine(url, **kwargs)
    return create_engine(url, pool_pre_ping=True)


class Database:
    def __init__(self, url: str) -> None:
        from . import models  # noqa: F401  (mendaftarkan tabel)

        self.engine = make_engine(url)
        Base.metadata.create_all(self.engine)
        self._sessions = sessionmaker(bind=self.engine, autoflush=False, expire_on_commit=False)

    def session(self) -> Iterator[Session]:
        with self._sessions() as session:
            yield session
