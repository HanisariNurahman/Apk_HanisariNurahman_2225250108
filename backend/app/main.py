"""PeluangKu API: hanya mengumpulkan log penelitian. Aplikasi belajar tetap berjalan tanpa server."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import Settings, get_settings
from .db import Database
from .deps import get_session
from .routers import logs, teacher


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    db = Database(settings.database_url)

    app = FastAPI(title="PeluangKu API", version="0.1.0")
    app.state.db = db
    app.dependency_overrides[get_settings] = lambda: settings
    app.dependency_overrides[get_session] = db.session
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.origins,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type", "X-Class-Key", "Authorization"],
    )

    @app.get("/api/health", tags=["health"])
    def health() -> dict[str, str]:
        return {"status": "ok"}

    app.include_router(logs.router)
    app.include_router(teacher.router)
    return app


app = create_app()
