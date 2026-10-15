from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..config import get_settings
from ..db import get_db
from ..deps import get_current_user
from ..errors import AppError
from ..models import User
from ..ratelimit import limiter
from ..schemas import LoginIn, RegisterIn, UserOut
from ..security import (COOKIE_NAME, burn_password_check, create_access_token, decode_token, hash_password,
                        verify_password)

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


def _set_cookie(resp: Response, user: User) -> None:
    resp.set_cookie(COOKIE_NAME, create_access_token(user), httponly=True, samesite="lax", secure=settings.cookie_secure,
                    max_age=settings.access_token_minutes * 60, path="/")


@router.post("/register", response_model=UserOut, status_code=201, dependencies=[Depends(limiter("register", settings.register_rate_limit, 3600))])
def register(body: RegisterIn, response: Response, db: Session = Depends(get_db)):
    if db.execute(select(User.id).where(User.email == body.email)).first():
        raise AppError(409, "email_taken", "An account with this e-mail already exists.")
    user = User(email=body.email, full_name=body.full_name, password_hash=hash_password(body.password), role="user")
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise AppError(409, "email_taken", "An account with this e-mail already exists.") from None
    _set_cookie(response, user)
    return user


@router.post("/login", response_model=UserOut, dependencies=[Depends(limiter("login", settings.login_rate_limit, 60))])
def login(body: LoginIn, response: Response, db: Session = Depends(get_db)):
    user = db.execute(select(User).where(User.email == body.email)).scalar_one_or_none()
    if user is None:
        burn_password_check(body.password)
    if user is None or not user.is_active or not verify_password(body.password, user.password_hash):
        raise AppError(401, "invalid_credentials", "E-mail or password is incorrect.")
    _set_cookie(response, user)
    return user


@router.post("/logout", status_code=204)
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    """Revokes the session server-side (token_version bump) and clears the cookie."""
    token = request.cookies.get(COOKIE_NAME)
    if token:
        try:
            user = db.get(User, int(decode_token(token)["sub"]))
            if user:
                user.token_version += 1
                db.commit()
        except Exception:
            db.rollback()
    response.delete_cookie(COOKIE_NAME, path="/")
    response.status_code = 204
    return response


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user
