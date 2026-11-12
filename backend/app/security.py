"""Cek X-Class-Key (penyaring kiriman iseng, bukan autentikasi kuat) dan token guru."""

import hmac

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .config import Settings, get_settings

_bearer = HTTPBearer(auto_error=False)


def _unauthorized(detail: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)


def _same(a: str, b: str) -> bool:
    return hmac.compare_digest(a.encode(), b.encode())


def require_class_key(
    x_class_key: str | None = Header(default=None),
    settings: Settings = Depends(get_settings),
) -> set[str]:
    """Mengembalikan kode kelas yang kuncinya cocok dengan header X-Class-Key."""
    if not x_class_key:
        raise _unauthorized("Kunci kelas tidak ada")
    classes = {code for code, key in settings.class_key_map.items() if _same(key, x_class_key)}
    if not classes:
        raise _unauthorized("Kunci kelas salah")
    return classes


def require_teacher(
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
    settings: Settings = Depends(get_settings),
) -> None:
    token = settings.teacher_token
    if not token or creds is None or not _same(creds.credentials, token):
        raise _unauthorized("Token guru salah")
