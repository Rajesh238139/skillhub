from fastapi import APIRouter, Depends, HTTPException, Response, Request, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.schemas.user import UserRegister, UserLogin, TokenPair, UserOut
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

REFRESH_COOKIE_NAME = "skillhub_refresh_token"


def _set_refresh_cookie(response: Response, token: str):
    # httpOnly => JS on the frontend can never read this, which blocks XSS token theft.
    # In production set secure=True (requires HTTPS) and samesite="none" if cross-site.
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=False,  # set True in production behind HTTPS
        samesite="lax",
        max_age=7 * 24 * 60 * 60,
        path="/auth",
    )


@router.post("/register", response_model=TokenPair, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, response: Response, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        name=payload.name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(user.id, user.role)
    refresh_token = create_refresh_token(user.id, user.role)
    _set_refresh_cookie(response, refresh_token)

    return TokenPair(access_token=access_token, user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenPair)
def login(payload: UserLogin, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access_token = create_access_token(user.id, user.role)
    refresh_token = create_refresh_token(user.id, user.role)
    _set_refresh_cookie(response, refresh_token)

    return TokenPair(access_token=access_token, user=UserOut.model_validate(user))


@router.post("/refresh", response_model=TokenPair)
def refresh(request: Request, response: Response, db: Session = Depends(get_db)):
    token = request.cookies.get(REFRESH_COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = decode_token(token)
        if payload.get("type") != "refresh":
            raise ValueError()
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    user = db.query(User).filter(User.id == payload["sub"]).first()
    if not user:
        raise HTTPException(status_code=401, detail="User no longer exists")

    # Rotate both tokens (refresh token rotation limits replay-attack window)
    new_access = create_access_token(user.id, user.role)
    new_refresh = create_refresh_token(user.id, user.role)
    _set_refresh_cookie(response, new_refresh)

    return TokenPair(access_token=new_access, user=UserOut.model_validate(user))


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(REFRESH_COOKIE_NAME, path="/auth")
    return {"detail": "Logged out"}


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user
