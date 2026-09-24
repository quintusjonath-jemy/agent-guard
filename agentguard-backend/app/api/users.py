from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.core.security import get_password_hash
from app.core.permissions import UserRole, UserStatus
from app.models.user import User
from app.models.audit_log import AuditLog
from app.schemas.auth import UserResponse
from app.schemas.user import UserCreateRequest, UserUpdateRequest
from app.schemas.common import ApiResponse
from app.api.deps import get_current_user, require_admin_or_above, require_super_admin

router = APIRouter(prefix="/users", tags=["User Management"])

@router.get("", response_model=ApiResponse[List[UserResponse]])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_above)
):
    users = db.query(User).order_by(User.created_at.desc()).all()
    return ApiResponse(
        success=True,
        data=[UserResponse.model_validate(u) for u in users]
    )

@router.get("/{user_id}", response_model=ApiResponse[UserResponse])
def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_above)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    return ApiResponse(
        success=True,
        data=UserResponse.model_validate(user)
    )

@router.post("", response_model=ApiResponse[UserResponse], status_code=status.HTTP_201_CREATED)
def create_user(
    request: Request,
    payload: UserCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_above)
):
    existing = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    # Only SUPER_ADMIN can create another SUPER_ADMIN
    if payload.role == UserRole.SUPER_ADMIN and current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only a SUPER_ADMIN can create accounts with the SUPER_ADMIN role."
        )

    new_user = User(
        name=payload.name.strip(),
        email=payload.email.lower().strip(),
        password_hash=get_password_hash(payload.password),
        role=payload.role,
        status=payload.status
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        event_type="USER_CREATE",
        action="create_user",
        decision="ALLOWED",
        risk_level="LOW",
        description=f"Admin {current_user.email} created user {new_user.email} ({new_user.role.value})",
        ip_address=request.client.host if request.client else "127.0.0.1",
        metadata_json={"target_user_id": new_user.id, "created_role": new_user.role.value}
    )
    db.add(audit)
    db.commit()

    return ApiResponse(
        success=True,
        message="User created successfully.",
        data=UserResponse.model_validate(new_user)
    )

@router.put("/{user_id}", response_model=ApiResponse[UserResponse])
def update_user(
    user_id: int,
    request: Request,
    payload: UserUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_above)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    if payload.name is not None:
        user.name = payload.name.strip()

    if payload.role is not None:
        # Prevent non-superadmins from assigning or revoking SUPER_ADMIN
        if (payload.role == UserRole.SUPER_ADMIN or user.role == UserRole.SUPER_ADMIN) and current_user.role != UserRole.SUPER_ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Modifying SUPER_ADMIN roles requires SUPER_ADMIN authority."
            )
        user.role = payload.role

    if payload.status is not None:
        user.status = payload.status

    if payload.password:
        user.password_hash = get_password_hash(payload.password)

    db.commit()
    db.refresh(user)

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        event_type="USER_UPDATE",
        action="update_user",
        decision="ALLOWED",
        risk_level="LOW",
        description=f"Admin {current_user.email} updated user profile {user.email}",
        ip_address=request.client.host if request.client else "127.0.0.1",
        metadata_json={"target_user_id": user.id, "updated_fields": list(payload.model_dump(exclude_unset=True).keys())}
    )
    db.add(audit)
    db.commit()

    return ApiResponse(
        success=True,
        message="User updated successfully.",
        data=UserResponse.model_validate(user)
    )

@router.delete("/{user_id}", response_model=ApiResponse[dict])
def delete_user(
    user_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own active administrator account."
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    deleted_email = user.email
    db.delete(user)
    db.commit()

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        event_type="USER_DELETE",
        action="delete_user",
        decision="ALLOWED",
        risk_level="MEDIUM",
        description=f"Super admin {current_user.email} permanently deleted user {deleted_email}",
        ip_address=request.client.host if request.client else "127.0.0.1",
        metadata_json={"deleted_user_id": user_id, "deleted_email": deleted_email}
    )
    db.add(audit)
    db.commit()

    return ApiResponse(
        success=True,
        message=f"User {deleted_email} deleted successfully."
    )
