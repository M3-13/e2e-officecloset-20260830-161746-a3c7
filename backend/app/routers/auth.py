import time
from collections import defaultdict, deque

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])

RATE_LIMIT_MAX = 10
RATE_LIMIT_WINDOW_SECONDS = 60

_request_log: dict[str, deque[float]] = defaultdict(deque)


def _check_rate_limit(ip: str) -> None:
    now = time.monotonic()
    window = _request_log[ip]
    while window and now - window[0] > RATE_LIMIT_WINDOW_SECONDS:
        window.popleft()
    if len(window) >= RATE_LIMIT_MAX:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests",
        )
    window.append(now)


def _client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


@router.post(
    "/register",
    response_model=schemas.Token,
    status_code=status.HTTP_201_CREATED,
)
def register(
    payload: schemas.UserCreate,
    request: Request,
    db: Session = Depends(get_db),
) -> schemas.Token:
    _check_rate_limit(_client_ip(request))

    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user = models.User(
        email=payload.email,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return schemas.Token(
        access_token=create_access_token(user.id),
        token_type="bearer",
    )


@router.post("/login", response_model=schemas.Token)
def login(
    payload: schemas.UserLogin,
    request: Request,
    db: Session = Depends(get_db),
) -> schemas.Token:
    _check_rate_limit(_client_ip(request))

    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    return schemas.Token(
        access_token=create_access_token(user.id),
        token_type="bearer",
    )
