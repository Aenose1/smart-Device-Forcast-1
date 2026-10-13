import jwt
from fastapi import Depends, Request
from sqlalchemy.orm import Session

from .db import get_db
from .errors import AppError
from .models import User
from .security import COOKIE_NAME, decode_token


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    token = request.cookies.get(COOKIE_NAME)
    auth = request.headers.get("authorization", "")
    if not token and auth.lower().startswith("bearer "):
        token = auth[7:].strip()
    if not token:
        raise AppError(401, "not_authenticated", "Please sign in to continue.")
    try:
        payload = decode_token(token)
        user = db.get(User, int(payload["sub"]))
    except (jwt.PyJWTError, KeyError, ValueError):
        raise AppError(401, "invalid_token", "Your session has expired. Please sign in again.") from None
    if not user or not user.is_active or user.token_version != payload.get("tv"):
        raise AppError(401, "invalid_token", "Your session has expired. Please sign in again.")
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise AppError(403, "forbidden", "Administrator access is required.")
    return user
