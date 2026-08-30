import time
from collections import defaultdict, deque
from threading import Lock

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from .. import models, schemas, security
from ..database import get_db

router = APIRouter(prefix="/api/auth", tags=["auth"])

RATE_LIMIT_MAX = 10
RATE_LIMIT_WINDOW_SECONDS = 60.0

_rate_lock = Lock()
_rate_attempts: dict[str, deque[float]] = defaultdict(deque)


def _client_ip(request: Request) -> str:
    if request.client is not None:
        return request.client.host
    return "unknown"


def _check_rate_limit(client_ip: str) -> bool:
    now = time.monotonic()
    with _rate_lock:
        attempts = _rate_attempts[client_ip]
        while attempts and now - attempts[0] > RATE_LIMIT_WINDOW_SECONDS:
            attempts.popleft()
        if len(attempts) >= RATE_LIMIT_MAX:
            return False
        attempts.append(now)
        return True


def _validate_email(email: str) -> None:
    email = email.strip()
    if "@" not in email or email.startswith("@") or email.endswith("@"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid email address",
        )


def _validate_password(password: str) -> None:
    if not password:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Password must not be empty",
        )


@router.post("/register", response_model=schemas.Token, status_code=status.HTTP_201_CREATED)
def register(
    payload: schemas.UserCreate,
    request: Request,
    db: Session = Depends(get_db),
) -> schemas.Token:
    client_ip = _client_ip(request)
    if not _check_rate_limit(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please try again later.",
        )

    _validate_email(payload.email)
    _validate_password(payload.password)

    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user = models.User(
        email=payload.email,
        password_hash=security.hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = security.create_access_token(user.id)
    return schemas.Token(access_token=token, token_type="bearer")


@router.post("/login", response_model=schemas.Token)
def login(
    payload: schemas.UserLogin,
    request: Request,
    db: Session = Depends(get_db),
) -> schemas.Token:
    client_ip = _client_ip(request)
    if not _check_rate_limit(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please try again later.",
        )

    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if user is None or not security.verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = security.create_access_token(user.id)
    return schemas.Token(access_token=token, token_type="bearer")
