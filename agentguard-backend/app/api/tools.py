from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.tool import Tool
from app.models.audit_log import AuditLog
from app.models.user import User
from app.schemas.tool import ToolCreateRequest, ToolUpdateRequest, ToolResponse
from app.schemas.common import ApiResponse
from app.api.deps import get_current_user, require_admin_or_above

router = APIRouter(prefix="/tools", tags=["Tools"])

@router.get("", response_model=ApiResponse[List[ToolResponse]])
def list_tools(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tools = db.query(Tool).order_by(Tool.name.asc()).all()
    return ApiResponse(
        success=True,
        data=[ToolResponse.model_validate(t) for t in tools]
    )

@router.get("/{tool_id}", response_model=ApiResponse[ToolResponse])
def get_tool(
    tool_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tool = db.query(Tool).filter(Tool.id == tool_id).first()
    if not tool:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tool not found.")
    return ApiResponse(success=True, data=ToolResponse.model_validate(tool))

@router.post("", response_model=ApiResponse[ToolResponse], status_code=status.HTTP_201_CREATED)
def create_tool(
    request: Request,
    payload: ToolCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_above)
):
    existing = db.query(Tool).filter(Tool.name == payload.name.strip()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A tool with this name already exists.")

    tool = Tool(
        name=payload.name.strip(),
        description=payload.description,
        tool_type=payload.tool_type,
        endpoint=payload.endpoint,
        risk_level=payload.risk_level,
        required_permission=payload.required_permission,
        requires_approval=payload.requires_approval,
        enabled=payload.enabled
    )
    db.add(tool)
    db.commit()
    db.refresh(tool)

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        event_type="TOOL_REGISTERED",
        action="create_tool",
        decision="ALLOWED",
        risk_level="LOW",
        description=f"Admin {current_user.email} registered new tool '{tool.name}' ({tool.risk_level.value})",
        ip_address=request.client.host if request.client else "127.0.0.1",
        metadata_json={"tool_id": tool.id, "name": tool.name}
    )
    db.add(audit)
    db.commit()

    return ApiResponse(
        success=True,
        message="Tool registered successfully.",
        data=ToolResponse.model_validate(tool)
    )

@router.put("/{tool_id}", response_model=ApiResponse[ToolResponse])
def update_tool(
    tool_id: int,
    request: Request,
    payload: ToolUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_above)
):
    tool = db.query(Tool).filter(Tool.id == tool_id).first()
    if not tool:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tool not found.")

    if payload.description is not None:
        tool.description = payload.description
    if payload.tool_type is not None:
        tool.tool_type = payload.tool_type
    if payload.endpoint is not None:
        tool.endpoint = payload.endpoint
    if payload.risk_level is not None:
        tool.risk_level = payload.risk_level
    if payload.required_permission is not None:
        tool.required_permission = payload.required_permission
    if payload.requires_approval is not None:
        tool.requires_approval = payload.requires_approval
    if payload.enabled is not None:
        tool.enabled = payload.enabled

    db.commit()
    db.refresh(tool)

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        event_type="TOOL_UPDATED",
        action="update_tool",
        decision="ALLOWED",
        risk_level="LOW",
        description=f"Admin {current_user.email} updated tool configuration '{tool.name}'",
        ip_address=request.client.host if request.client else "127.0.0.1",
        metadata_json={"tool_id": tool.id}
    )
    db.add(audit)
    db.commit()

    return ApiResponse(
        success=True,
        message="Tool updated successfully.",
        data=ToolResponse.model_validate(tool)
    )

@router.delete("/{tool_id}", response_model=ApiResponse[dict])
def delete_tool(
    tool_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_above)
):
    tool = db.query(Tool).filter(Tool.id == tool_id).first()
    if not tool:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tool not found.")

    tool_name = tool.name
    db.delete(tool)
    db.commit()

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        event_type="TOOL_DELETED",
        action="delete_tool",
        decision="ALLOWED",
        risk_level="MEDIUM",
        description=f"Admin {current_user.email} deleted tool '{tool_name}'",
        ip_address=request.client.host if request.client else "127.0.0.1",
        metadata_json={"tool_name": tool_name}
    )
    db.add(audit)
    db.commit()

    return ApiResponse(success=True, message=f"Tool '{tool_name}' deleted successfully.")
