from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.core.config import settings
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.permissions import UserRole, UserStatus
from app.models.user import User
from app.models.audit_log import AuditLog
from app.schemas.auth import UserRegisterRequest, UserLoginRequest, TokenResponse, UserResponse
from app.schemas.common import ApiResponse
from app.services.rate_limiter import rate_limiter
from app.api.deps import get_current_user
from app.core.logging import logger

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=ApiResponse[TokenResponse], status_code=status.HTTP_201_CREATED)
def register(request: Request, payload: UserRegisterRequest, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    # Determine role (First user can be SUPER_ADMIN, otherwise requested role or SECURITY_ANALYST)
    user_count = db.query(User).count()
    assigned_role = UserRole.SUPER_ADMIN if user_count == 0 else (payload.role or UserRole.SECURITY_ANALYST)

    new_user = User(
        name=payload.name.strip(),
        email=payload.email.lower().strip(),
        password_hash=get_password_hash(payload.password),
        role=assigned_role,
        status=UserStatus.ACTIVE
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Log Registration Audit Event
    audit = AuditLog(
        user_id=new_user.id,
        event_type="USER_REGISTER",
        action="register",
        decision="ALLOWED",
        risk_level="LOW",
        description=f"New user registered: {new_user.email} with role {new_user.role.value}",
        ip_address=request.client.host if request.client else "127.0.0.1",
        metadata_json={"user_id": new_user.id, "email": new_user.email, "role": new_user.role.value}
    )
    db.add(audit)
    db.commit()

    # Generate JWT Token
    access_token = create_access_token(
        subject=new_user.id,
        extra_claims={"email": new_user.email, "role": new_user.role.value}
    )

    token_data = TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(new_user)
    )

    return ApiResponse(
        success=True,
        message="Account registered successfully.",
        data=token_data
    )

@router.post("/login", response_model=ApiResponse[TokenResponse])
def login(request: Request, payload: UserLoginRequest, db: Session = Depends(get_db)):
    ip = request.client.host if request.client else "127.0.0.1"
    rate_limit_key = f"login:{ip}:{payload.email.lower()}"

    # Rate limiting: 5 attempts per minute
    is_limited, retry_after = rate_limiter.is_rate_limited(rate_limit_key, max_requests=5, window_seconds=60)
    if is_limited:
        logger.warning(f"Rate limit exceeded for login attempt: {payload.email} from {ip}")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many failed login attempts. Please try again in {retry_after} seconds."
        )

    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        # Audit Failed Login
        audit = AuditLog(
            user_id=user.id if user else None,
            event_type="AUTH_FAILED",
            action="login",
            decision="BLOCKED",
            risk_level="MEDIUM",
            description=f"Failed login attempt for email: {payload.email}",
            ip_address=ip,
            metadata_json={"attempted_email": payload.email}
        )
        db.add(audit)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    if user.status != UserStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account is {user.status.value}. Please contact security administrator."
        )

    # Reset rate limit on successful authentication
    rate_limiter.reset(rate_limit_key)

    # Create token
    access_token = create_access_token(
        subject=user.id,
        extra_claims={"email": user.email, "role": user.role.value}
    )

    # Audit Successful Login
    audit = AuditLog(
        user_id=user.id,
        event_type="AUTH_SUCCESS",
        action="login",
        decision="ALLOWED",
        risk_level="LOW",
        description=f"Successful login for user {user.email}",
        ip_address=ip,
        metadata_json={"user_id": user.id, "role": user.role.value}
    )
    db.add(audit)
    db.commit()

    token_data = TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(user)
    )

    return ApiResponse(
        success=True,
        message="Login successful.",
        data=token_data
    )

@router.get("/me", response_model=ApiResponse[UserResponse])
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return ApiResponse(
        success=True,
        data=UserResponse.model_validate(current_user)
    )

@router.post("/logout", response_model=ApiResponse[dict])
def logout(request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Record logout audit event
    audit = AuditLog(
        user_id=current_user.id,
        event_type="AUTH_LOGOUT",
        action="logout",
        decision="ALLOWED",
        risk_level="LOW",
        description=f"User {current_user.email} logged out",
        ip_address=request.client.host if request.client else "127.0.0.1",
        metadata_json={"user_id": current_user.id}
    )
    db.add(audit)
    db.commit()

    return ApiResponse(
        success=True,
        message="Logged out successfully."
    )
